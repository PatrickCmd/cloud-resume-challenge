"""
Blog repository implementing DynamoDB access patterns.

Implements all blog post operations following the single-table design
specified in docs/DYNAMODB-DESIGN.md.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from src.repositories.base import BaseRepository


class BlogRepository(BaseRepository):
    """
    Repository for blog post operations.

    Access Patterns:
    1. List all blog posts (filtered by status)
    2. Get single blog post by ID
    3. Create blog post
    4. Update blog post
    5. Delete blog post
    6. Publish blog post
    7. Unpublish blog post
    8. Get blog categories
    """

    def to_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert blog post dict to DynamoDB item.

        Args:
            data: Blog post data

        Returns:
            DynamoDB item following single-table design
        """
        blog_id = data.get('id') or str(uuid.uuid4())
        status = data.get('status', 'DRAFT')
        published_at = data.get('publishedAt')
        created_at = data.get('createdAt') or datetime.now(timezone.utc).isoformat()

        # Calculate read time (simple: 200 words per minute)
        content = data.get('content', '')
        word_count = len(content.split())
        read_time = max(1, word_count // 200)

        item = {
            'PK': f'BLOG#{blog_id}',
            'SK': 'METADATA',
            'GSI1PK': f'BLOG#STATUS#{status}',
            'GSI1SK': f'BLOG#{published_at or created_at}',
            'EntityType': 'BLOG',
            'Status': status,
            'Data': {
                'id': blog_id,
                'slug': data.get('slug', ''),
                'title': data.get('title', ''),
                'excerpt': data.get('excerpt', ''),
                'content': content,
                'category': data.get('category', ''),
                'tags': data.get('tags', []),
                'readTime': read_time,
                'publishedAt': published_at,
                'createdAt': created_at,
                'updatedAt': data.get('updatedAt') or datetime.now(timezone.utc).isoformat()
            }
        }

        return item

    def from_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert DynamoDB item to blog post dict.

        Args:
            item: DynamoDB item

        Returns:
            Blog post data dict
        """
        if not item or 'Data' not in item:
            return None

        # Merge Data with top-level Status field
        result = {**item['Data']}
        if 'Status' in item:
            result['status'] = item['Status']

        return result

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new blog post.

        Args:
            data: Blog post data

        Returns:
            Created blog post
        """
        # Generate slug from title if not provided
        if not data.get('slug') and data.get('title'):
            slug = data['title'].lower().replace(' ', '-')
            # Remove special characters
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            data['slug'] = slug

        # Set initial status as draft
        data['status'] = 'DRAFT'
        data['createdAt'] = datetime.now(timezone.utc).isoformat()
        data['updatedAt'] = datetime.now(timezone.utc).isoformat()

        item = self.to_item(data)
        self.put_item(item)

        # Update category count
        category = data.get('category')
        if category:
            self._increment_category_count(category)

        return self.from_item(item)

    def get_by_id(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """
        Get blog post by ID.

        Args:
            blog_id: Blog post ID

        Returns:
            Blog post data or None if not found
        """
        item = self.get_item(pk=f'BLOG#{blog_id}', sk='METADATA')
        return self.from_item(item) if item else None

    def list_posts(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 20,
        last_evaluated_key: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        List blog posts with filtering.

        Args:
            status: Filter by status (PUBLISHED, DRAFT, or None for all)
            category: Filter by category
            limit: Maximum number of posts to return
            last_evaluated_key: Pagination key

        Returns:
            Dict with 'items' list and optional 'lastEvaluatedKey'
        """
        # Build key condition
        if status:
            key_condition = 'GSI1PK = :gsi1pk'
            expression_values = {':gsi1pk': f'BLOG#STATUS#{status}'}
        else:
            # Query all blog posts (requires begins_with)
            key_condition = 'begins_with(GSI1PK, :gsi1pk)'
            expression_values = {':gsi1pk': 'BLOG#STATUS#'}

        # Add category filter if provided
        filter_expression = None
        if category:
            filter_expression = '#data.#category = :category'
            expression_values[':category'] = category

        result = self.query(
            key_condition_expression=key_condition,
            expression_attribute_values=expression_values,
            expression_attribute_names={'#data': 'Data', '#category': 'category'} if category else None,
            filter_expression=filter_expression,
            index_name='GSI1',
            scan_index_forward=False,  # Newest first
            limit=limit,
            exclusive_start_key=last_evaluated_key
        )

        items = [self.from_item(item) for item in result['Items']]

        return {
            'items': items,
            'count': len(items),
            'lastEvaluatedKey': result.get('LastEvaluatedKey')
        }

    def update(self, blog_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update blog post.

        Args:
            blog_id: Blog post ID
            data: Updated data

        Returns:
            Updated blog post or None if not found
        """
        # Get current post to check category change
        current_post = self.get_by_id(blog_id)
        if not current_post:
            return None

        # Build update expression
        update_parts = []
        expression_values = {}
        expression_names = {}

        # Update timestamp
        data['updatedAt'] = datetime.now(timezone.utc).isoformat()

        # Recalculate read time if content changed
        if 'content' in data:
            word_count = len(data['content'].split())
            data['readTime'] = max(1, word_count // 200)  # 200 words per minute

        # Build update expression for Data attributes
        for key, value in data.items():
            if key in ['title', 'excerpt', 'content', 'category', 'tags', 'readTime', 'updatedAt']:
                update_parts.append(f'#data.#{key} = :{key}')
                expression_values[f':{key}'] = value
                expression_names[f'#{key}'] = key

        if not update_parts:
            return current_post

        expression_names['#data'] = 'Data'
        update_expression = 'SET ' + ', '.join(update_parts)

        updated_item = self.update_item(
            pk=f'BLOG#{blog_id}',
            sk='METADATA',
            update_expression=update_expression,
            expression_attribute_values=expression_values,
            expression_attribute_names=expression_names,
            condition_expression='attribute_exists(PK)'
        )

        # Handle category count update if category changed
        if 'category' in data and data['category'] != current_post.get('category'):
            old_category = current_post.get('category')
            new_category = data['category']

            if old_category:
                self._decrement_category_count(old_category)
            if new_category:
                self._increment_category_count(new_category)

        return self.from_item(updated_item) if updated_item else None

    def delete(self, blog_id: str) -> bool:
        """
        Delete blog post.

        Args:
            blog_id: Blog post ID

        Returns:
            True if deleted, False if not found
        """
        # Get post to update category count
        post = self.get_by_id(blog_id)
        if not post:
            return False

        # Delete the post
        deleted = self.delete_item(
            pk=f'BLOG#{blog_id}',
            sk='METADATA',
            condition_expression='attribute_exists(PK)'
        )

        # Decrement category count
        if deleted and post.get('category'):
            self._decrement_category_count(post['category'])

        return deleted

    def publish(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """
        Publish blog post (change status from DRAFT to PUBLISHED).

        Args:
            blog_id: Blog post ID

        Returns:
            Updated blog post or None if not found
        """
        published_at = datetime.now(timezone.utc).isoformat()

        updated_item = self.update_item(
            pk=f'BLOG#{blog_id}',
            sk='METADATA',
            update_expression='SET #status = :published, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk, #data.#status = :published, #data.publishedAt = :publishedAt, #data.updatedAt = :updatedAt',
            expression_attribute_values={
                ':published': 'PUBLISHED',
                ':gsi1pk': 'BLOG#STATUS#PUBLISHED',
                ':gsi1sk': f'BLOG#{published_at}',
                ':publishedAt': published_at,
                ':updatedAt': published_at,
                ':draft': 'DRAFT'
            },
            expression_attribute_names={
                '#status': 'Status',
                '#data': 'Data'
            },
            condition_expression='#status = :draft'
        )

        return self.from_item(updated_item) if updated_item else None

    def unpublish(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """
        Unpublish blog post (change status from PUBLISHED to DRAFT).

        Args:
            blog_id: Blog post ID

        Returns:
            Updated blog post or None if not found
        """
        # Get current post to get createdAt for GSI1SK
        post = self.get_by_id(blog_id)
        if not post:
            return None

        created_at = post.get('createdAt', datetime.now(timezone.utc).isoformat())
        updated_at = datetime.now(timezone.utc).isoformat()

        updated_item = self.update_item(
            pk=f'BLOG#{blog_id}',
            sk='METADATA',
            update_expression='SET #status = :draft, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk, #data.#status = :draft, #data.publishedAt = :null, #data.updatedAt = :updatedAt',
            expression_attribute_values={
                ':draft': 'DRAFT',
                ':gsi1pk': 'BLOG#STATUS#DRAFT',
                ':gsi1sk': f'BLOG#{created_at}',
                ':null': None,
                ':updatedAt': updated_at,
                ':published': 'PUBLISHED'
            },
            expression_attribute_names={
                '#status': 'Status',
                '#data': 'Data'
            },
            condition_expression='#status = :published'
        )

        return self.from_item(updated_item) if updated_item else None

    def get_categories(self) -> List[Dict[str, Any]]:
        """
        Get all blog categories with post counts.

        Returns:
            List of categories with counts
        """
        from boto3.dynamodb.conditions import Key

        # Use scan with filter since we can't use begins_with on partition key in query
        result = self.resource.scan(
            FilterExpression=Key('PK').begins_with('BLOG#CATEGORY#') & Key('SK').eq('COUNT')
        )

        categories = []
        for item in result.get('Items', []):
            category_name = item['PK'].replace('BLOG#CATEGORY#', '')
            categories.append({
                'name': category_name,
                'count': item.get('Data', {}).get('count', 0)
            })

        return categories

    def _increment_category_count(self, category: str) -> None:
        """
        Increment category count.

        Args:
            category: Category name
        """
        try:
            # First, set the Data structure if it doesn't exist
            self.update_item(
                pk=f'BLOG#CATEGORY#{category}',
                sk='COUNT',
                update_expression='SET EntityType = if_not_exists(EntityType, :entity_type), #data = if_not_exists(#data, :empty_data)',
                expression_attribute_values={
                    ':entity_type': 'BLOG_CATEGORY',
                    ':empty_data': {'category': category, 'count': 0}
                },
                expression_attribute_names={
                    '#data': 'Data'
                }
            )

            # Then increment the count
            self.update_item(
                pk=f'BLOG#CATEGORY#{category}',
                sk='COUNT',
                update_expression='SET #data.#count = if_not_exists(#data.#count, :zero) + :increment',
                expression_attribute_values={
                    ':increment': 1,
                    ':zero': 0
                },
                expression_attribute_names={
                    '#data': 'Data',
                    '#count': 'count'
                }
            )
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Error incrementing category count: {e}")

    def _decrement_category_count(self, category: str) -> None:
        """
        Decrement category count.

        Args:
            category: Category name
        """
        try:
            self.update_item(
                pk=f'BLOG#CATEGORY#{category}',
                sk='COUNT',
                update_expression='SET #data.#count = #data.#count - :decrement',
                expression_attribute_values={
                    ':decrement': 1
                },
                expression_attribute_names={
                    '#data': 'Data',
                    '#count': 'count'
                }
            )
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Error decrementing category count: {e}")
