"""
Project repository implementing DynamoDB access patterns.

Implements all project operations following the single-table design
specified in docs/DYNAMODB-DESIGN.md.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.base import BaseRepository


class ProjectRepository(BaseRepository):
    """
    Repository for project operations.

    Access Patterns:
    1. List all projects (filtered by status, featured)
    2. Get single project by ID
    3. Create project
    4. Update project
    5. Delete project
    6. Publish project
    7. Unpublish project
    """

    def to_item(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert project dict to DynamoDB item."""
        project_id = data.get("id") or str(uuid.uuid4())
        status = data.get("status", "DRAFT")
        created_at = data.get("createdAt") or datetime.now(UTC).isoformat()

        item = {
            "PK": f"PROJECT#{project_id}",
            "SK": "METADATA",
            "GSI1PK": f"PROJECT#STATUS#{status}",
            "GSI1SK": f"PROJECT#{created_at}",
            "EntityType": "PROJECT",
            "Status": status,
            "Data": {
                "id": project_id,
                "name": data.get("name", ""),
                "description": data.get("description", ""),
                "longDescription": data.get("longDescription", ""),
                "tech": data.get("tech", []),
                "company": data.get("company", ""),
                "featured": data.get("featured", False),
                "githubUrl": data.get("githubUrl"),
                "liveUrl": data.get("liveUrl"),
                "imageUrl": data.get("imageUrl"),
                "createdAt": created_at,
                "updatedAt": data.get("updatedAt") or datetime.now(UTC).isoformat(),
            },
        }
        return item

    def from_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """Convert DynamoDB item to project dict."""
        if not item or "Data" not in item:
            return None

        # Merge Data with top-level Status field
        result = {**item["Data"]}
        if "Status" in item:
            result["status"] = item["Status"]

        return result

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new project."""
        data["status"] = "DRAFT"
        data["createdAt"] = datetime.now(UTC).isoformat()
        data["updatedAt"] = datetime.now(UTC).isoformat()

        item = self.to_item(data)
        self.put_item(item)
        return self.from_item(item)

    def get_by_id(self, project_id: str) -> dict[str, Any] | None:
        """Get project by ID."""
        item = self.get_item(pk=f"PROJECT#{project_id}", sk="METADATA")
        return self.from_item(item) if item else None

    def list_projects(
        self,
        status: str | None = None,
        featured: bool | None = None,
        limit: int = 20,
        last_evaluated_key: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """List projects with filtering."""
        if status:
            key_condition = "GSI1PK = :gsi1pk"
            expression_values = {":gsi1pk": f"PROJECT#STATUS#{status}"}
        else:
            key_condition = "begins_with(GSI1PK, :gsi1pk)"
            expression_values = {":gsi1pk": "PROJECT#STATUS#"}

        filter_expression = None
        if featured is not None:
            filter_expression = "#data.featured = :featured"
            expression_values[":featured"] = featured

        result = self.query(
            key_condition_expression=key_condition,
            expression_attribute_values=expression_values,
            expression_attribute_names={"#data": "Data"} if featured is not None else None,
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

    def update(self, project_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        """Update project."""
        update_parts = []
        expression_values = {}
        expression_names = {"#data": "Data"}

        data["updatedAt"] = datetime.now(UTC).isoformat()

        for key, value in data.items():
            if key in [
                "name",
                "description",
                "longDescription",
                "tech",
                "company",
                "featured",
                "githubUrl",
                "liveUrl",
                "imageUrl",
                "updatedAt",
            ]:
                update_parts.append(f"#data.#{key} = :{key}")
                expression_values[f":{key}"] = value
                expression_names[f"#{key}"] = key

        if not update_parts:
            return self.get_by_id(project_id)

        update_expression = "SET " + ", ".join(update_parts)

        updated_item = self.update_item(
            pk=f"PROJECT#{project_id}",
            sk="METADATA",
            update_expression=update_expression,
            expression_attribute_values=expression_values,
            expression_attribute_names=expression_names,
            condition_expression="attribute_exists(PK)",
        )

        return self.from_item(updated_item) if updated_item else None

    def delete(self, project_id: str) -> bool:
        """Delete project."""
        return self.delete_item(
            pk=f"PROJECT#{project_id}", sk="METADATA", condition_expression="attribute_exists(PK)"
        )

    def publish(self, project_id: str) -> dict[str, Any] | None:
        """Publish project."""
        updated_at = datetime.now(UTC).isoformat()

        updated_item = self.update_item(
            pk=f"PROJECT#{project_id}",
            sk="METADATA",
            update_expression="SET #status = :published, GSI1PK = :gsi1pk, #data.#status = :published, #data.updatedAt = :updatedAt",
            expression_attribute_values={
                ":published": "PUBLISHED",
                ":gsi1pk": "PROJECT#STATUS#PUBLISHED",
                ":updatedAt": updated_at,
                ":draft": "DRAFT",
            },
            expression_attribute_names={"#status": "Status", "#data": "Data"},
            condition_expression="#status = :draft",
        )

        return self.from_item(updated_item) if updated_item else None

    def unpublish(self, project_id: str) -> dict[str, Any] | None:
        """Unpublish project."""
        updated_at = datetime.now(UTC).isoformat()

        updated_item = self.update_item(
            pk=f"PROJECT#{project_id}",
            sk="METADATA",
            update_expression="SET #status = :draft, GSI1PK = :gsi1pk, #data.#status = :draft, #data.updatedAt = :updatedAt",
            expression_attribute_values={
                ":draft": "DRAFT",
                ":gsi1pk": "PROJECT#STATUS#DRAFT",
                ":updatedAt": updated_at,
                ":published": "PUBLISHED",
            },
            expression_attribute_names={"#status": "Status", "#data": "Data"},
            condition_expression="#status = :published",
        )

        return self.from_item(updated_item) if updated_item else None
