"""
Analytics repository implementing DynamoDB access patterns.

Implements analytics tracking operations following the single-table design
specified in docs/DYNAMODB-DESIGN.md.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone

from src.repositories.base import BaseRepository


class AnalyticsRepository(BaseRepository):
    """Repository for analytics operations."""

    def to_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert analytics data to DynamoDB item."""
        # This is handled differently for different analytics item types
        pass

    def from_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item to analytics data."""
        if not item or 'Data' not in item:
            return None
        return item['Data']

    def track_view(self, content_type: str, content_id: str, session_id: str) -> Dict[str, Any]:
        """
        Track content view with deduplication.

        Args:
            content_type: Type of content (blog, project, certification)
            content_id: Content ID
            session_id: Session ID

        Returns:
            Dict with views count
        """
        # Check if session already viewed this content
        session_item = self.get_item(
            pk=f'ANALYTICS#SESSION#{session_id}',
            sk=f'{content_type}#{content_id}'
        )

        if session_item:
            # Already viewed, just return current count
            view_item = self.get_item(
                pk=f'ANALYTICS#{content_type}#{content_id}',
                sk='VIEWS'
            )
            views = view_item.get('Data', {}).get('viewCount', 0) if view_item else 0
            return {'views': views}

        # First, initialize the Data structure if needed
        self.update_item(
            pk=f'ANALYTICS#{content_type}#{content_id}',
            sk='VIEWS',
            update_expression='SET GSI1PK = if_not_exists(GSI1PK, :gsi1pk), EntityType = if_not_exists(EntityType, :entity_type), #data = if_not_exists(#data, :empty_data)',
            expression_attribute_values={
                ':gsi1pk': f'ANALYTICS#{content_type}',
                ':entity_type': 'ANALYTICS_VIEW',
                ':empty_data': {
                    'contentId': content_id,
                    'contentType': content_type,
                    'viewCount': 0,
                    'lastViewed': datetime.now(timezone.utc).isoformat()
                }
            },
            expression_attribute_names={
                '#data': 'Data'
            }
        )

        # Then increment view count and update lastViewed
        updated_item = self.update_item(
            pk=f'ANALYTICS#{content_type}#{content_id}',
            sk='VIEWS',
            update_expression='SET #data.viewCount = if_not_exists(#data.viewCount, :zero) + :increment, #data.lastViewed = :lastViewed',
            expression_attribute_values={
                ':increment': 1,
                ':zero': 0,
                ':lastViewed': datetime.now(timezone.utc).isoformat()
            },
            expression_attribute_names={
                '#data': 'Data'
            }
        )

        # Get new view count and update GSI1SK with padded count
        view_count = updated_item.get('Data', {}).get('viewCount', 1) if updated_item else 1
        padded_count = str(view_count).zfill(10)  # Pad to 10 digits

        self.update_item(
            pk=f'ANALYTICS#{content_type}#{content_id}',
            sk='VIEWS',
            update_expression='SET GSI1SK = :gsi1sk',
            expression_attribute_values={
                ':gsi1sk': f'ANALYTICS#VIEWS#{padded_count}'
            },
            expression_attribute_names={}
        )

        # Record session view (expires after 24 hours)
        expires_at = int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp())

        self.put_item({
            'PK': f'ANALYTICS#SESSION#{session_id}',
            'SK': f'{content_type}#{content_id}',
            'EntityType': 'ANALYTICS_SESSION',
            'Data': {
                'viewedAt': datetime.now(timezone.utc).isoformat()
            },
            'ExpiresAt': expires_at
        })

        # Also update total views counter (for efficient retrieval)
        self.update_item(
            pk='ANALYTICS#TOTAL',
            sk='VIEWS',
            update_expression='SET EntityType = if_not_exists(EntityType, :entity_type), #data = if_not_exists(#data, :empty_data)',
            expression_attribute_values={
                ':entity_type': 'ANALYTICS_TOTAL',
                ':empty_data': {'totalViews': 0, 'lastUpdated': datetime.now(timezone.utc).isoformat()}
            },
            expression_attribute_names={
                '#data': 'Data'
            }
        )

        self.update_item(
            pk='ANALYTICS#TOTAL',
            sk='VIEWS',
            update_expression='SET #data.totalViews = if_not_exists(#data.totalViews, :zero) + :increment, #data.lastUpdated = :updated',
            expression_attribute_values={
                ':increment': 1,
                ':zero': 0,
                ':updated': datetime.now(timezone.utc).isoformat()
            },
            expression_attribute_names={
                '#data': 'Data'
            }
        )

        return {'views': view_count}

    def get_view_count(self, content_type: str, content_id: str) -> int:
        """Get view count for specific content."""
        item = self.get_item(
            pk=f'ANALYTICS#{content_type}#{content_id}',
            sk='VIEWS'
        )

        return item.get('Data', {}).get('viewCount', 0) if item else 0

    def get_all_views_for_type(self, content_type: str) -> Dict[str, int]:
        """
        Get view counts for all content of a type.

        Args:
            content_type: Type of content

        Returns:
            Dict mapping content_id to view_count
        """
        from boto3.dynamodb.conditions import Key

        # Use Scan with filter since we can't use begins_with on PK in Query
        result = self.resource.scan(
            FilterExpression=Key('PK').begins_with(f'ANALYTICS#{content_type}#') & Key('SK').eq('VIEWS')
        )

        stats = {}
        for item in result['Items']:
            content_id = item.get('Data', {}).get('contentId')
            view_count = item.get('Data', {}).get('viewCount', 0)
            if content_id:
                stats[content_id] = view_count

        return stats

    def get_top_content(self, limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get top viewed content across all types.

        Args:
            limit: Number of items per type

        Returns:
            Dict with 'blogs', 'projects', 'certifications' lists
        """
        result = {
            'blogs': [],
            'projects': [],
            'certifications': []
        }

        # Query top blogs
        blog_result = self.query(
            key_condition_expression='GSI1PK = :gsi1pk',
            expression_attribute_values={
                ':gsi1pk': 'ANALYTICS#blog'
            },
            index_name='GSI1',
            scan_index_forward=False,  # Descending by view count
            limit=limit
        )

        for item in blog_result['Items']:
            result['blogs'].append({
                'contentId': item.get('Data', {}).get('contentId'),
                'views': item.get('Data', {}).get('viewCount', 0)
            })

        # Query top projects
        project_result = self.query(
            key_condition_expression='GSI1PK = :gsi1pk',
            expression_attribute_values={
                ':gsi1pk': 'ANALYTICS#project'
            },
            index_name='GSI1',
            scan_index_forward=False,
            limit=limit
        )

        for item in project_result['Items']:
            result['projects'].append({
                'contentId': item.get('Data', {}).get('contentId'),
                'views': item.get('Data', {}).get('viewCount', 0)
            })

        # Query top certifications
        cert_result = self.query(
            key_condition_expression='GSI1PK = :gsi1pk',
            expression_attribute_values={
                ':gsi1pk': 'ANALYTICS#certification'
            },
            index_name='GSI1',
            scan_index_forward=False,
            limit=limit
        )

        for item in cert_result['Items']:
            result['certifications'].append({
                'contentId': item.get('Data', {}).get('contentId'),
                'views': item.get('Data', {}).get('viewCount', 0)
            })

        return result

    def get_total_views(self) -> int:
        """Get total views across all content (O(1) lookup from aggregated counter)."""
        item = self.get_item(pk='ANALYTICS#TOTAL', sk='VIEWS')
        return item.get('Data', {}).get('totalViews', 0) if item else 0
