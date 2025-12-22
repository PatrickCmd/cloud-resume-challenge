"""
Unit tests for AnalyticsRepository.

Tests analytics tracking and view count operations using moto to mock DynamoDB.
"""

import os
import pytest
import uuid
from datetime import datetime
from moto import mock_aws
import boto3

# Set environment before imports
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'

from src.repositories.analytics import AnalyticsRepository


@pytest.fixture
def dynamodb_table():
    """Create a mock DynamoDB table for testing."""
    with mock_aws():
        # Create DynamoDB client
        dynamodb = boto3.client('dynamodb', region_name='us-east-1')

        # Create table with GSI
        table_name = 'portfolio-api-table'
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                        {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            BillingMode='PROVISIONED',
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )

        yield table_name


@pytest.fixture
def analytics_repo(dynamodb_table):
    """Create an AnalyticsRepository instance for testing."""
    return AnalyticsRepository()


class TestTrackView:
    """Tests for view tracking operations."""

    def test_track_view_new_content(self, analytics_repo):
        """Test tracking a view for new content."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        result = analytics_repo.track_view('blog', content_id, session_id)

        assert 'views' in result
        assert result['views'] == 1

    def test_track_view_deduplication_same_session(self, analytics_repo):
        """Test that same session doesn't count twice."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        # Track view first time
        result1 = analytics_repo.track_view('blog', content_id, session_id)
        views1 = result1['views']

        # Track same view again (should be deduplicated)
        result2 = analytics_repo.track_view('blog', content_id, session_id)
        views2 = result2['views']

        assert views2 == views1  # View count should not increase

    def test_track_view_different_sessions(self, analytics_repo):
        """Test tracking views from different sessions."""
        content_id = str(uuid.uuid4())
        session1 = str(uuid.uuid4())
        session2 = str(uuid.uuid4())

        result1 = analytics_repo.track_view('blog', content_id, session1)
        views1 = result1['views']

        result2 = analytics_repo.track_view('blog', content_id, session2)
        views2 = result2['views']

        assert views2 > views1  # View count should increase

    def test_track_view_multiple_content_types(self, analytics_repo):
        """Test tracking views across different content types."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        blog_result = analytics_repo.track_view('blog', content_id, session_id)
        project_result = analytics_repo.track_view('project', content_id, session_id)
        cert_result = analytics_repo.track_view('certification', content_id, session_id)

        assert blog_result['views'] == 1
        assert project_result['views'] == 1
        assert cert_result['views'] == 1

    def test_track_view_creates_session_record(self, analytics_repo):
        """Test that tracking creates a session record."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        analytics_repo.track_view('blog', content_id, session_id)

        # Verify session record exists
        session_item = analytics_repo.get_item(
            pk=f'ANALYTICS#SESSION#{session_id}',
            sk=f'blog#{content_id}'
        )

        assert session_item is not None
        assert session_item['EntityType'] == 'ANALYTICS_SESSION'

    def test_track_view_updates_total_views(self, analytics_repo):
        """Test that tracking updates total views."""
        initial_total = analytics_repo.get_total_views()

        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        analytics_repo.track_view('blog', content_id, session_id)

        new_total = analytics_repo.get_total_views()

        assert new_total > initial_total


class TestGetViewCount:
    """Tests for getting view counts."""

    def test_get_view_count_new_content(self, analytics_repo):
        """Test getting view count for content that hasn't been viewed."""
        content_id = str(uuid.uuid4())
        count = analytics_repo.get_view_count('blog', content_id)
        assert count == 0

    def test_get_view_count_after_tracking(self, analytics_repo):
        """Test getting view count after tracking views."""
        content_id = str(uuid.uuid4())

        # Track views from different sessions
        for _ in range(3):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', content_id, session_id)

        count = analytics_repo.get_view_count('blog', content_id)
        assert count == 3

    def test_get_view_count_different_content_types(self, analytics_repo):
        """Test that view counts are separate per content type."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        analytics_repo.track_view('blog', content_id, session_id)

        blog_count = analytics_repo.get_view_count('blog', content_id)
        project_count = analytics_repo.get_view_count('project', content_id)

        assert blog_count == 1
        assert project_count == 0


class TestGetAllViewsForType:
    """Tests for getting all views by content type."""

    def test_get_all_views_empty(self, analytics_repo):
        """Test getting views when no content has been viewed."""
        stats = analytics_repo.get_all_views_for_type('blog')
        assert len(stats) == 0

    def test_get_all_views_with_data(self, analytics_repo):
        """Test getting all views for a content type."""
        # Track views for multiple blog posts
        content_ids = [str(uuid.uuid4()) for _ in range(3)]

        for content_id in content_ids:
            for _ in range(2):  # 2 views each
                session_id = str(uuid.uuid4())
                analytics_repo.track_view('blog', content_id, session_id)

        stats = analytics_repo.get_all_views_for_type('blog')

        assert len(stats) == 3
        for content_id in content_ids:
            assert content_id in stats
            assert stats[content_id] == 2

    def test_get_all_views_filters_by_type(self, analytics_repo):
        """Test that views are filtered by content type."""
        blog_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())

        session_id = str(uuid.uuid4())
        analytics_repo.track_view('blog', blog_id, session_id)
        analytics_repo.track_view('project', project_id, session_id)

        blog_stats = analytics_repo.get_all_views_for_type('blog')
        project_stats = analytics_repo.get_all_views_for_type('project')

        assert len(blog_stats) == 1
        assert len(project_stats) == 1
        assert blog_id in blog_stats
        assert project_id in project_stats


class TestGetTopContent:
    """Tests for getting top viewed content."""

    def test_get_top_content_empty(self, analytics_repo):
        """Test getting top content with no views."""
        result = analytics_repo.get_top_content(limit=5)

        assert 'blogs' in result
        assert 'projects' in result
        assert 'certifications' in result
        assert len(result['blogs']) == 0
        assert len(result['projects']) == 0
        assert len(result['certifications']) == 0

    def test_get_top_content_with_data(self, analytics_repo):
        """Test getting top content with view data."""
        # Create blog posts with different view counts
        blog_ids = [str(uuid.uuid4()) for _ in range(3)]

        # First blog: 5 views
        for _ in range(5):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', blog_ids[0], session_id)

        # Second blog: 3 views
        for _ in range(3):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', blog_ids[1], session_id)

        # Third blog: 1 view
        session_id = str(uuid.uuid4())
        analytics_repo.track_view('blog', blog_ids[2], session_id)

        result = analytics_repo.get_top_content(limit=5)

        assert len(result['blogs']) == 3
        # Verify sorted by view count (descending)
        assert result['blogs'][0]['views'] == 5
        assert result['blogs'][1]['views'] == 3
        assert result['blogs'][2]['views'] == 1
        assert result['blogs'][0]['contentId'] == blog_ids[0]

    def test_get_top_content_respects_limit(self, analytics_repo):
        """Test that top content respects the limit parameter."""
        # Create 10 blog posts
        for _ in range(10):
            content_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', content_id, session_id)

        result = analytics_repo.get_top_content(limit=3)

        assert len(result['blogs']) <= 3

    def test_get_top_content_all_types(self, analytics_repo):
        """Test getting top content across all content types."""
        # Track views for different content types
        blog_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        cert_id = str(uuid.uuid4())

        for _ in range(2):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', blog_id, session_id)
            analytics_repo.track_view('project', project_id, session_id)
            analytics_repo.track_view('certification', cert_id, session_id)

        result = analytics_repo.get_top_content(limit=5)

        assert len(result['blogs']) == 1
        assert len(result['projects']) == 1
        assert len(result['certifications']) == 1


class TestGetTotalViews:
    """Tests for getting total views across all content."""

    def test_get_total_views_initial(self, analytics_repo):
        """Test getting total views when no content viewed."""
        total = analytics_repo.get_total_views()
        assert total == 0

    def test_get_total_views_after_tracking(self, analytics_repo):
        """Test getting total views after tracking multiple views."""
        # Track views across different content types
        for i in range(5):
            content_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            content_type = ['blog', 'project', 'certification'][i % 3]
            analytics_repo.track_view(content_type, content_id, session_id)

        total = analytics_repo.get_total_views()
        assert total == 5

    def test_get_total_views_with_deduplication(self, analytics_repo):
        """Test that total views respects deduplication."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        # Track same view multiple times
        for _ in range(3):
            analytics_repo.track_view('blog', content_id, session_id)

        total = analytics_repo.get_total_views()
        assert total == 1  # Should only count once


class TestViewCountPadding:
    """Tests for view count padding in GSI1SK."""

    def test_view_count_padded_in_gsi(self, analytics_repo):
        """Test that view counts are zero-padded for proper sorting."""
        content_id = str(uuid.uuid4())

        # Track 127 views
        for _ in range(127):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', content_id, session_id)

        # Get the item and check GSI1SK
        item = analytics_repo.get_item(
            pk=f'ANALYTICS#blog#{content_id}',
            sk='VIEWS'
        )

        assert item is not None
        # GSI1SK should be padded to 10 digits
        assert item['GSI1SK'] == 'ANALYTICS#VIEWS#0000000127'

    def test_view_count_padding_maintains_sort_order(self, analytics_repo):
        """Test that padded view counts maintain proper sort order."""
        # Create content with different view counts
        low_id = str(uuid.uuid4())
        high_id = str(uuid.uuid4())

        # Low count: 5 views
        for _ in range(5):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', low_id, session_id)

        # High count: 100 views
        for _ in range(100):
            session_id = str(uuid.uuid4())
            analytics_repo.track_view('blog', high_id, session_id)

        # Get items
        low_item = analytics_repo.get_item(
            pk=f'ANALYTICS#blog#{low_id}',
            sk='VIEWS'
        )
        high_item = analytics_repo.get_item(
            pk=f'ANALYTICS#blog#{high_id}',
            sk='VIEWS'
        )

        # Verify padding maintains sort order
        assert low_item['GSI1SK'] == 'ANALYTICS#VIEWS#0000000005'
        assert high_item['GSI1SK'] == 'ANALYTICS#VIEWS#0000000100'
        # String comparison should work correctly with padding
        assert high_item['GSI1SK'] > low_item['GSI1SK']


class TestDataStructure:
    """Tests for data structure and formatting."""

    def test_view_record_structure(self, analytics_repo):
        """Test that view records have correct structure."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        analytics_repo.track_view('blog', content_id, session_id)

        item = analytics_repo.get_item(
            pk=f'ANALYTICS#blog#{content_id}',
            sk='VIEWS'
        )

        assert item is not None
        assert 'Data' in item
        assert 'contentId' in item['Data']
        assert 'contentType' in item['Data']
        assert 'viewCount' in item['Data']
        assert 'lastViewed' in item['Data']
        assert item['EntityType'] == 'ANALYTICS_VIEW'
        assert item['GSI1PK'] == 'ANALYTICS#blog'

    def test_total_views_structure(self, analytics_repo):
        """Test that total views record has correct structure."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        analytics_repo.track_view('blog', content_id, session_id)

        total_item = analytics_repo.get_item(
            pk='ANALYTICS#TOTAL',
            sk='VIEWS'
        )

        assert total_item is not None
        assert 'Data' in total_item
        assert 'totalViews' in total_item['Data']
        assert 'lastUpdated' in total_item['Data']
        assert total_item['EntityType'] == 'ANALYTICS_TOTAL'


class TestSessionExpiry:
    """Tests for session expiry (TTL) functionality."""

    def test_session_has_expiry_timestamp(self, analytics_repo):
        """Test that session records have ExpiresAt for TTL."""
        from decimal import Decimal

        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        analytics_repo.track_view('blog', content_id, session_id)

        session_item = analytics_repo.get_item(
            pk=f'ANALYTICS#SESSION#{session_id}',
            sk=f'blog#{content_id}'
        )

        assert 'ExpiresAt' in session_item
        assert isinstance(session_item['ExpiresAt'], (int, float, Decimal))

    def test_session_expiry_is_future(self, analytics_repo):
        """Test that session expiry is set to a future timestamp."""
        content_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        analytics_repo.track_view('blog', content_id, session_id)

        session_item = analytics_repo.get_item(
            pk=f'ANALYTICS#SESSION#{session_id}',
            sk=f'blog#{content_id}'
        )

        expiry = session_item['ExpiresAt']
        now = int(datetime.now().timestamp())

        assert expiry > now  # Expiry should be in the future (24 hours)
