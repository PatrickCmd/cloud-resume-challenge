"""
Visitor repository implementing DynamoDB access patterns.

Implements visitor tracking operations following the single-table design
specified in docs/DYNAMODB-DESIGN.md.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from src.repositories.base import BaseRepository


class VisitorRepository(BaseRepository):
    """Repository for visitor tracking operations."""

    def to_item(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert visitor data to DynamoDB item."""
        # This is handled differently for different visitor item types
        pass

    def from_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """Convert DynamoDB item to visitor data."""
        if not item or "Data" not in item:
            return None
        return item["Data"]

    def track_visitor(self, session_id: str) -> dict[str, Any]:
        """
        Track visitor with deduplication.

        Args:
            session_id: Visitor session ID

        Returns:
            Dict with count and session_id
        """
        today = datetime.now(UTC).strftime("%Y-%m-%d")

        # Check if session already tracked today
        session_item = self.get_item(pk=f"VISITOR#SESSION#{session_id}", sk="TRACKED")

        # If session already tracked today, just return current count
        if session_item and session_item.get("Data", {}).get("lastTrackedDate") == today:
            daily_item = self.get_item(pk=f"VISITOR#DAILY#{today}", sk="COUNT")
            count = daily_item.get("Data", {}).get("count", 0) if daily_item else 0
            return {"count": count, "sessionId": session_id}

        # Increment daily count
        tomorrow_midnight = int(
            (
                datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
                + timedelta(days=2)
            ).timestamp()
        )

        # First, initialize the Data structure if needed
        self.update_item(
            pk=f"VISITOR#DAILY#{today}",
            sk="COUNT",
            update_expression="SET EntityType = if_not_exists(EntityType, :entity_type), #data = if_not_exists(#data, :empty_data)",
            expression_attribute_values={
                ":entity_type": "VISITOR_DAILY",
                ":empty_data": {"date": today, "count": 0},
            },
            expression_attribute_names={"#data": "Data"},
        )

        # Then increment the count
        self.update_item(
            pk=f"VISITOR#DAILY#{today}",
            sk="COUNT",
            update_expression="SET #data.#count = if_not_exists(#data.#count, :zero) + :increment",
            expression_attribute_values={":increment": 1, ":zero": 0},
            expression_attribute_names={"#data": "Data", "#count": "count"},
        )

        # Record session
        self.put_item(
            {
                "PK": f"VISITOR#SESSION#{session_id}",
                "SK": "TRACKED",
                "EntityType": "VISITOR_SESSION",
                "Data": {
                    "lastTrackedDate": today,
                    "lastTrackedTime": datetime.now(UTC).isoformat(),
                },
                "ExpiresAt": tomorrow_midnight,
            }
        )

        # Get updated count
        daily_item = self.get_item(pk=f"VISITOR#DAILY#{today}", sk="COUNT")
        count = daily_item.get("Data", {}).get("count", 1) if daily_item else 1

        # Also update total count (for efficient retrieval)
        self.update_item(
            pk="VISITOR#TOTAL",
            sk="COUNT",
            update_expression="SET EntityType = if_not_exists(EntityType, :entity_type), #data = if_not_exists(#data, :empty_data)",
            expression_attribute_values={
                ":entity_type": "VISITOR_TOTAL",
                ":empty_data": {"totalCount": 0, "lastUpdated": datetime.now(UTC).isoformat()},
            },
            expression_attribute_names={"#data": "Data"},
        )

        self.update_item(
            pk="VISITOR#TOTAL",
            sk="COUNT",
            update_expression="SET #data.totalCount = if_not_exists(#data.totalCount, :zero) + :increment, #data.lastUpdated = :updated",
            expression_attribute_values={
                ":increment": 1,
                ":zero": 0,
                ":updated": datetime.now(UTC).isoformat(),
            },
            expression_attribute_names={"#data": "Data"},
        )

        return {"count": count, "sessionId": session_id}

    def get_total_count(self) -> int:
        """Get total visitor count (O(1) lookup from aggregated counter)."""
        item = self.get_item(pk="VISITOR#TOTAL", sk="COUNT")
        return item.get("Data", {}).get("totalCount", 0) if item else 0

    def get_daily_trends(self, days: int = 30) -> list[dict[str, Any]]:
        """
        Get daily visitor trends for the last N days.

        Args:
            days: Number of days to retrieve

        Returns:
            List of {date, visitors} dicts
        """
        # Generate date keys for last N days
        dates = []
        for i in range(days):
            date = (datetime.now(UTC) - timedelta(days=i)).strftime("%Y-%m-%d")
            dates.append(date)

        # Batch get items
        keys = [{"PK": f"VISITOR#DAILY#{date}", "SK": "COUNT"} for date in dates]
        items = self.batch_get_items(keys)

        # Create map of date -> count
        count_map = {
            item.get("Data", {}).get("date"): item.get("Data", {}).get("count", 0) for item in items
        }

        # Build result with 0 for missing days
        trends = []
        for date in reversed(dates):  # Oldest first
            trends.append({"date": date, "visitors": count_map.get(date, 0)})

        return trends

    def get_monthly_trends(self, months: int = 6) -> list[dict[str, Any]]:
        """
        Get monthly visitor trends.

        Args:
            months: Number of months to retrieve

        Returns:
            List of {month, visitors} dicts
        """
        from boto3.dynamodb.conditions import Key

        trends = []

        for i in range(months):
            # Calculate month
            date = datetime.now(UTC) - timedelta(days=30 * i)
            year_month = date.strftime("%Y-%m")

            # Use Scan with filter since we can't use begins_with on PK in Query
            result = self.resource.scan(
                FilterExpression=Key("PK").begins_with(f"VISITOR#DAILY#{year_month}")
                & Key("SK").eq("COUNT")
            )

            # Sum counts
            total = sum(item.get("Data", {}).get("count", 0) for item in result["Items"])

            trends.insert(
                0,
                {  # Insert at beginning for chronological order
                    "month": year_month,
                    "visitors": total,
                },
            )

        return trends
