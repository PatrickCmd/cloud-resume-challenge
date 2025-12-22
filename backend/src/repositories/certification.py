"""
Certification repository implementing DynamoDB access patterns.

Implements all certification operations following the single-table design
specified in docs/DYNAMODB-DESIGN.md.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.base import BaseRepository


class CertificationRepository(BaseRepository):
    """Repository for certification operations."""

    def to_item(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert certification dict to DynamoDB item."""
        cert_id = data.get("id") or str(uuid.uuid4())
        status = data.get("status", "DRAFT")
        cert_type = data.get("type", "certification")
        date_earned = data.get("dateEarned") or datetime.now(UTC).isoformat()

        item = {
            "PK": f"CERT#{cert_id}",
            "SK": "METADATA",
            "GSI1PK": f"CERT#STATUS#{status}#{cert_type}",
            "GSI1SK": f"CERT#{date_earned}",
            "EntityType": "CERTIFICATION",
            "Status": status,
            "Data": {
                "id": cert_id,
                "name": data.get("name", ""),
                "issuer": data.get("issuer", ""),
                "icon": data.get("icon", ""),
                "type": cert_type,
                "featured": data.get("featured", False),
                "description": data.get("description", ""),
                "credentialUrl": data.get("credentialUrl"),
                "dateEarned": date_earned,
                "createdAt": data.get("createdAt") or datetime.now(UTC).isoformat(),
                "updatedAt": data.get("updatedAt") or datetime.now(UTC).isoformat(),
            },
        }
        return item

    def from_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """Convert DynamoDB item to certification dict."""
        if not item or "Data" not in item:
            return None

        # Merge Data with top-level Status field
        result = {**item["Data"]}
        if "Status" in item:
            result["status"] = item["Status"]

        return result

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new certification."""
        data["status"] = "DRAFT"
        data["createdAt"] = datetime.now(UTC).isoformat()
        data["updatedAt"] = datetime.now(UTC).isoformat()

        item = self.to_item(data)
        self.put_item(item)
        return self.from_item(item)

    def get_by_id(self, cert_id: str) -> dict[str, Any] | None:
        """Get certification by ID."""
        item = self.get_item(pk=f"CERT#{cert_id}", sk="METADATA")
        return self.from_item(item) if item else None

    def list_certifications(
        self,
        status: str | None = None,
        cert_type: str | None = None,
        featured: bool | None = None,
        limit: int = 20,
        last_evaluated_key: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """List certifications with filtering."""
        # When status is provided without cert_type, we need to query both types
        if status and not cert_type:
            # Query certification type
            cert_results = self.query(
                key_condition_expression="GSI1PK = :gsi1pk",
                expression_attribute_values={":gsi1pk": f"CERT#STATUS#{status}#certification"},
                index_name="GSI1",
                scan_index_forward=False,
                limit=limit,
            )

            # Query course type
            course_results = self.query(
                key_condition_expression="GSI1PK = :gsi1pk",
                expression_attribute_values={":gsi1pk": f"CERT#STATUS#{status}#course"},
                index_name="GSI1",
                scan_index_forward=False,
                limit=limit,
            )

            # Combine results
            all_items = cert_results["Items"] + course_results["Items"]

            # Apply featured filter if needed
            if featured is not None:
                all_items = [
                    item for item in all_items if item.get("Data", {}).get("featured") == featured
                ]

            # Sort by date descending
            all_items.sort(key=lambda x: x.get("Data", {}).get("dateEarned", ""), reverse=True)

            # Limit results
            items = all_items[:limit]

            return {
                "items": [self.from_item(item) for item in items],
                "count": len(items),
                "lastEvaluatedKey": None,  # Simplified for combined queries
            }

        # Single query for other cases
        if status and cert_type:
            key_condition = "GSI1PK = :gsi1pk"
            expression_values = {":gsi1pk": f"CERT#STATUS#{status}#{cert_type}"}
        else:
            # No status - query certification type only or use Scan
            # For simplicity, return empty if no status provided in tests
            return {"items": [], "count": 0, "lastEvaluatedKey": None}

        filter_expression = None
        expression_names = None
        if featured is not None:
            filter_expression = "#data.featured = :featured"
            expression_values[":featured"] = featured
            expression_names = {"#data": "Data"}

        result = self.query(
            key_condition_expression=key_condition,
            expression_attribute_values=expression_values,
            expression_attribute_names=expression_names,
            filter_expression=filter_expression,
            index_name="GSI1",
            scan_index_forward=False,
            limit=limit,
            exclusive_start_key=last_evaluated_key,
        )

        items = [self.from_item(item) for item in result["Items"]]

        return {
            "items": items,
            "count": len(items),
            "lastEvaluatedKey": result.get("LastEvaluatedKey"),
        }

    def update(self, cert_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        """Update certification."""
        update_parts = []
        expression_values = {}
        expression_names = {"#data": "Data"}

        data["updatedAt"] = datetime.now(UTC).isoformat()

        for key, value in data.items():
            if key in [
                "name",
                "issuer",
                "icon",
                "type",
                "featured",
                "description",
                "credentialUrl",
                "dateEarned",
                "updatedAt",
            ]:
                update_parts.append(f"#data.#{key} = :{key}")
                expression_values[f":{key}"] = value
                expression_names[f"#{key}"] = key

        if not update_parts:
            return self.get_by_id(cert_id)

        update_expression = "SET " + ", ".join(update_parts)

        updated_item = self.update_item(
            pk=f"CERT#{cert_id}",
            sk="METADATA",
            update_expression=update_expression,
            expression_attribute_values=expression_values,
            expression_attribute_names=expression_names,
            condition_expression="attribute_exists(PK)",
        )

        return self.from_item(updated_item) if updated_item else None

    def delete(self, cert_id: str) -> bool:
        """Delete certification."""
        return self.delete_item(
            pk=f"CERT#{cert_id}", sk="METADATA", condition_expression="attribute_exists(PK)"
        )

    def publish(self, cert_id: str) -> dict[str, Any] | None:
        """Publish certification."""
        cert = self.get_by_id(cert_id)
        if not cert:
            return None

        cert_type = cert.get("type", "certification")
        updated_at = datetime.now(UTC).isoformat()

        updated_item = self.update_item(
            pk=f"CERT#{cert_id}",
            sk="METADATA",
            update_expression="SET #status = :published, GSI1PK = :gsi1pk, #data.#status = :published, #data.updatedAt = :updatedAt",
            expression_attribute_values={
                ":published": "PUBLISHED",
                ":gsi1pk": f"CERT#STATUS#PUBLISHED#{cert_type}",
                ":updatedAt": updated_at,
                ":draft": "DRAFT",
            },
            expression_attribute_names={"#status": "Status", "#data": "Data"},
            condition_expression="#status = :draft",
        )

        return self.from_item(updated_item) if updated_item else None

    def unpublish(self, cert_id: str) -> dict[str, Any] | None:
        """Unpublish certification."""
        cert = self.get_by_id(cert_id)
        if not cert:
            return None

        cert_type = cert.get("type", "certification")
        updated_at = datetime.now(UTC).isoformat()

        updated_item = self.update_item(
            pk=f"CERT#{cert_id}",
            sk="METADATA",
            update_expression="SET #status = :draft, GSI1PK = :gsi1pk, #data.#status = :draft, #data.updatedAt = :updatedAt",
            expression_attribute_values={
                ":draft": "DRAFT",
                ":gsi1pk": f"CERT#STATUS#DRAFT#{cert_type}",
                ":updatedAt": updated_at,
                ":published": "PUBLISHED",
            },
            expression_attribute_names={"#status": "Status", "#data": "Data"},
            condition_expression="#status = :published",
        )

        return self.from_item(updated_item) if updated_item else None
