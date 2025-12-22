"""
Unit tests for VisitorRepository.

Tests visitor tracking and analytics operations using moto to mock DynamoDB.
"""

import os
import uuid
from datetime import datetime

import boto3
import pytest
from moto import mock_aws

# Set environment before imports
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"

from src.repositories.visitor import VisitorRepository


@pytest.fixture
def dynamodb_table():
    """Create a mock DynamoDB table for testing."""
    with mock_aws():
        # Create DynamoDB client
        dynamodb = boto3.client("dynamodb", region_name="us-east-1")

        # Create table
        table_name = "portfolio-api-table"
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        yield table_name


@pytest.fixture
def visitor_repo(dynamodb_table):
    """Create a VisitorRepository instance for testing."""
    return VisitorRepository()


class TestVisitorTracking:
    """Tests for visitor tracking operations."""

    def test_track_new_visitor(self, visitor_repo):
        """Test tracking a new visitor."""
        session_id = str(uuid.uuid4())

        result = visitor_repo.track_visitor(session_id)

        assert "count" in result
        assert "sessionId" in result
        assert result["sessionId"] == session_id
        assert result["count"] >= 1

    def test_track_visitor_deduplication_same_day(self, visitor_repo):
        """Test that same visitor is not counted twice on same day."""
        session_id = str(uuid.uuid4())

        # Track visitor first time
        result1 = visitor_repo.track_visitor(session_id)
        count1 = result1["count"]

        # Track same visitor again (should be deduplicated)
        result2 = visitor_repo.track_visitor(session_id)
        count2 = result2["count"]

        assert count2 == count1  # Count should not increase

    def test_track_different_visitors(self, visitor_repo):
        """Test tracking different visitors increments count."""
        session1 = str(uuid.uuid4())
        session2 = str(uuid.uuid4())

        result1 = visitor_repo.track_visitor(session1)
        count1 = result1["count"]

        result2 = visitor_repo.track_visitor(session2)
        count2 = result2["count"]

        assert count2 > count1  # Count should increase

    def test_track_visitor_creates_session_record(self, visitor_repo):
        """Test that tracking creates a session record."""
        session_id = str(uuid.uuid4())

        visitor_repo.track_visitor(session_id)

        # Verify session record exists
        today = datetime.now().strftime("%Y-%m-%d")
        session_item = visitor_repo.get_item(pk=f"VISITOR#SESSION#{session_id}", sk="TRACKED")

        assert session_item is not None
        assert session_item["Data"]["lastTrackedDate"] == today

    def test_track_visitor_updates_total_count(self, visitor_repo):
        """Test that tracking updates the total visitor count."""
        initial_total = visitor_repo.get_total_count()

        session_id = str(uuid.uuid4())
        visitor_repo.track_visitor(session_id)

        new_total = visitor_repo.get_total_count()

        assert new_total > initial_total


class TestVisitorCounts:
    """Tests for visitor count retrieval."""

    def test_get_total_count_initial(self, visitor_repo):
        """Test getting total count when no visitors tracked."""
        count = visitor_repo.get_total_count()
        assert count == 0

    def test_get_total_count_after_tracking(self, visitor_repo):
        """Test getting total count after tracking visitors."""
        # Track multiple visitors
        for _ in range(5):
            session_id = str(uuid.uuid4())
            visitor_repo.track_visitor(session_id)

        total = visitor_repo.get_total_count()
        assert total == 5

    def test_get_total_count_with_deduplication(self, visitor_repo):
        """Test that total count respects deduplication."""
        session_id = str(uuid.uuid4())

        # Track same visitor multiple times
        for _ in range(3):
            visitor_repo.track_visitor(session_id)

        total = visitor_repo.get_total_count()
        assert total == 1  # Should only count once


class TestDailyTrends:
    """Tests for daily visitor trends."""

    def test_get_daily_trends_empty(self, visitor_repo):
        """Test getting daily trends with no data."""
        trends = visitor_repo.get_daily_trends(days=7)

        assert len(trends) == 7
        # All days should have 0 visitors
        assert all(trend["visitors"] == 0 for trend in trends)

    def test_get_daily_trends_with_data(self, visitor_repo):
        """Test getting daily trends with visitor data."""
        # Track some visitors today
        for _ in range(3):
            session_id = str(uuid.uuid4())
            visitor_repo.track_visitor(session_id)

        trends = visitor_repo.get_daily_trends(days=7)

        assert len(trends) == 7
        # Today should have 3 visitors
        today_trend = trends[-1]  # Last item is most recent
        assert today_trend["visitors"] == 3

    def test_daily_trends_ordered_chronologically(self, visitor_repo):
        """Test that daily trends are ordered from oldest to newest."""
        trends = visitor_repo.get_daily_trends(days=7)

        # Convert dates to datetime objects and verify order
        dates = [datetime.strptime(trend["date"], "%Y-%m-%d") for trend in trends]
        assert dates == sorted(dates)

    def test_daily_trends_includes_correct_dates(self, visitor_repo):
        """Test that daily trends includes the correct date range."""
        days = 7
        trends = visitor_repo.get_daily_trends(days=days)

        # Check that we have the right number of days
        assert len(trends) == days

        # Check that the most recent date is today
        today = datetime.now().strftime("%Y-%m-%d")
        assert trends[-1]["date"] == today


class TestMonthlyTrends:
    """Tests for monthly visitor trends."""

    def test_get_monthly_trends_empty(self, visitor_repo):
        """Test getting monthly trends with no data."""
        trends = visitor_repo.get_monthly_trends(months=6)

        assert len(trends) == 6
        # All months should have 0 visitors
        assert all(trend["visitors"] == 0 for trend in trends)

    def test_get_monthly_trends_with_data(self, visitor_repo):
        """Test getting monthly trends with visitor data."""
        # Track some visitors
        for _ in range(5):
            session_id = str(uuid.uuid4())
            visitor_repo.track_visitor(session_id)

        trends = visitor_repo.get_monthly_trends(months=6)

        assert len(trends) == 6
        # Current month should have visitors
        current_month = datetime.now().strftime("%Y-%m")
        current_month_trend = next((t for t in trends if t["month"] == current_month), None)
        assert current_month_trend is not None
        assert current_month_trend["visitors"] == 5

    def test_monthly_trends_ordered_chronologically(self, visitor_repo):
        """Test that monthly trends are ordered from oldest to newest."""
        trends = visitor_repo.get_monthly_trends(months=6)

        # Verify months are in chronological order
        months = [trend["month"] for trend in trends]
        assert months == sorted(months)


class TestSessionExpiry:
    """Tests for session expiry (TTL) functionality."""

    def test_session_has_expiry_timestamp(self, visitor_repo):
        """Test that session records have ExpiresAt for TTL."""
        from decimal import Decimal

        session_id = str(uuid.uuid4())
        visitor_repo.track_visitor(session_id)

        session_item = visitor_repo.get_item(pk=f"VISITOR#SESSION#{session_id}", sk="TRACKED")

        assert "ExpiresAt" in session_item
        assert isinstance(session_item["ExpiresAt"], (int, float, Decimal))

    def test_session_expiry_is_future(self, visitor_repo):
        """Test that session expiry is set to a future timestamp."""
        session_id = str(uuid.uuid4())
        visitor_repo.track_visitor(session_id)

        session_item = visitor_repo.get_item(pk=f"VISITOR#SESSION#{session_id}", sk="TRACKED")

        expiry = session_item["ExpiresAt"]
        now = int(datetime.now().timestamp())

        assert expiry > now  # Expiry should be in the future


class TestDataStructure:
    """Tests for data structure and formatting."""

    def test_daily_count_structure(self, visitor_repo):
        """Test that daily count records have correct structure."""
        session_id = str(uuid.uuid4())
        visitor_repo.track_visitor(session_id)

        today = datetime.now().strftime("%Y-%m-%d")
        daily_item = visitor_repo.get_item(pk=f"VISITOR#DAILY#{today}", sk="COUNT")

        assert daily_item is not None
        assert "Data" in daily_item
        assert "date" in daily_item["Data"]
        assert "count" in daily_item["Data"]
        assert daily_item["EntityType"] == "VISITOR_DAILY"

    def test_total_count_structure(self, visitor_repo):
        """Test that total count record has correct structure."""
        session_id = str(uuid.uuid4())
        visitor_repo.track_visitor(session_id)

        total_item = visitor_repo.get_item(pk="VISITOR#TOTAL", sk="COUNT")

        assert total_item is not None
        assert "Data" in total_item
        assert "totalCount" in total_item["Data"]
        assert "lastUpdated" in total_item["Data"]
        assert total_item["EntityType"] == "VISITOR_TOTAL"
