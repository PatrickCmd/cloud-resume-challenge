"""
Unit tests for BlogRepository.

Tests all blog repository operations using moto to mock DynamoDB.
"""

import os
import pytest
from datetime import datetime
from moto import mock_aws
import boto3

# Set environment before imports
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'

from src.repositories.blog import BlogRepository


@pytest.fixture
def dynamodb_table():
    """Create a mock DynamoDB table for testing."""
    with mock_aws():
        # Create DynamoDB client
        dynamodb = boto3.client('dynamodb', region_name='us-east-1')

        # Create table
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
def blog_repo(dynamodb_table):
    """Create a BlogRepository instance for testing."""
    return BlogRepository()


class TestBlogRepositoryCreate:
    """Tests for blog post creation."""

    def test_create_blog_post(self, blog_repo):
        """Test creating a blog post."""
        post_data = {
            'title': 'Test Blog Post',
            'content': 'This is test content for the blog post.',
            'excerpt': 'A test post',
            'category': 'Testing',
            'tags': ['test', 'python']
        }

        post = blog_repo.create(post_data)

        assert post['id'] is not None
        assert post['title'] == 'Test Blog Post'
        assert post['slug'] == 'test-blog-post'
        assert post['status'] == 'DRAFT'
        assert post['category'] == 'Testing'
        assert post['tags'] == ['test', 'python']
        assert 'createdAt' in post
        assert 'updatedAt' in post
        assert post['readTime'] > 0

    def test_create_generates_unique_ids(self, blog_repo):
        """Test that each created post gets a unique ID."""
        post1 = blog_repo.create({
            'title': 'Post 1',
            'content': 'Content 1',
            'excerpt': 'Excerpt 1',
            'category': 'Test',
            'tags': []
        })

        post2 = blog_repo.create({
            'title': 'Post 2',
            'content': 'Content 2',
            'excerpt': 'Excerpt 2',
            'category': 'Test',
            'tags': []
        })

        assert post1['id'] != post2['id']

    def test_create_generates_slug_from_title(self, blog_repo):
        """Test slug generation from title."""
        post = blog_repo.create({
            'title': 'Building REST APIs with FastAPI',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Backend',
            'tags': []
        })

        assert post['slug'] == 'building-rest-apis-with-fastapi'

    def test_create_calculates_read_time(self, blog_repo):
        """Test read time calculation based on content length."""
        # Short content (< 200 words)
        short_post = blog_repo.create({
            'title': 'Short Post',
            'content': 'This is a short post.',
            'excerpt': 'Short',
            'category': 'Test',
            'tags': []
        })
        assert short_post['readTime'] == 1  # Minimum 1 minute

        # Longer content (~400 words = 2 min read)
        long_content = ' '.join(['word'] * 400)
        long_post = blog_repo.create({
            'title': 'Long Post',
            'content': long_content,
            'excerpt': 'Long',
            'category': 'Test',
            'tags': []
        })
        assert long_post['readTime'] == 2


class TestBlogRepositoryRead:
    """Tests for reading blog posts."""

    def test_get_by_id_existing_post(self, blog_repo):
        """Test retrieving an existing post by ID."""
        created = blog_repo.create({
            'title': 'Test Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': ['tag1']
        })

        retrieved = blog_repo.get_by_id(created['id'])

        assert retrieved is not None
        assert retrieved['id'] == created['id']
        assert retrieved['title'] == 'Test Post'

    def test_get_by_id_nonexistent_post(self, blog_repo):
        """Test retrieving a non-existent post."""
        result = blog_repo.get_by_id('nonexistent-id')
        assert result is None

    def test_list_posts_returns_all_drafts(self, blog_repo):
        """Test listing draft posts."""
        # Create multiple draft posts
        for i in range(3):
            blog_repo.create({
                'title': f'Draft Post {i}',
                'content': f'Content {i}',
                'excerpt': f'Excerpt {i}',
                'category': 'Test',
                'tags': []
            })

        results = blog_repo.list_posts(status='DRAFT', limit=10)

        assert results['count'] == 3
        assert len(results['items']) == 3
        assert all(post['status'] == 'DRAFT' for post in results['items'])

    def test_list_posts_returns_published_only(self, blog_repo):
        """Test listing only published posts."""
        # Create and publish some posts
        for i in range(2):
            post = blog_repo.create({
                'title': f'Post {i}',
                'content': f'Content {i}',
                'excerpt': f'Excerpt {i}',
                'category': 'Test',
                'tags': []
            })
            blog_repo.publish(post['id'])

        # Create a draft
        blog_repo.create({
            'title': 'Draft Post',
            'content': 'Draft Content',
            'excerpt': 'Draft Excerpt',
            'category': 'Test',
            'tags': []
        })

        results = blog_repo.list_posts(status='PUBLISHED', limit=10)

        assert results['count'] == 2
        assert all(post['status'] == 'PUBLISHED' for post in results['items'])

    def test_list_posts_with_category_filter(self, blog_repo):
        """Test filtering posts by category."""
        # Create posts in different categories
        blog_repo.create({
            'title': 'Backend Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Backend',
            'tags': []
        })

        blog_repo.create({
            'title': 'DevOps Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'DevOps',
            'tags': []
        })

        results = blog_repo.list_posts(status='DRAFT', category='Backend', limit=10)

        assert results['count'] == 1
        assert results['items'][0]['category'] == 'Backend'


class TestBlogRepositoryUpdate:
    """Tests for updating blog posts."""

    def test_update_post_title(self, blog_repo):
        """Test updating a post's title."""
        post = blog_repo.create({
            'title': 'Original Title',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        updated = blog_repo.update(post['id'], {'title': 'Updated Title'})

        assert updated is not None
        assert updated['title'] == 'Updated Title'
        assert updated['id'] == post['id']

    def test_update_post_content_recalculates_read_time(self, blog_repo):
        """Test that updating content recalculates read time."""
        post = blog_repo.create({
            'title': 'Test Post',
            'content': 'Short content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        original_read_time = int(post['readTime']) if isinstance(post['readTime'], (int, float)) else int(post['readTime'])

        # Update with much longer content
        long_content = ' '.join(['word'] * 600)
        updated = blog_repo.update(post['id'], {'content': long_content})

        updated_read_time = int(updated['readTime']) if isinstance(updated['readTime'], (int, float)) else int(updated['readTime'])
        assert updated_read_time > original_read_time

    def test_update_nonexistent_post(self, blog_repo):
        """Test updating a non-existent post."""
        result = blog_repo.update('nonexistent-id', {'title': 'New Title'})
        assert result is None


class TestBlogRepositoryPublish:
    """Tests for publishing/unpublishing posts."""

    def test_publish_draft_post(self, blog_repo):
        """Test publishing a draft post."""
        post = blog_repo.create({
            'title': 'Draft Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        assert post['status'] == 'DRAFT'

        published = blog_repo.publish(post['id'])

        assert published is not None
        assert published['status'] == 'PUBLISHED'
        assert 'publishedAt' in published

    def test_unpublish_published_post(self, blog_repo):
        """Test unpublishing a published post."""
        post = blog_repo.create({
            'title': 'Test Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        blog_repo.publish(post['id'])
        unpublished = blog_repo.unpublish(post['id'])

        assert unpublished is not None
        assert unpublished['status'] == 'DRAFT'

    def test_publish_updates_gsi_keys(self, blog_repo):
        """Test that publishing updates GSI1 keys correctly."""
        post = blog_repo.create({
            'title': 'Test Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        blog_repo.publish(post['id'])

        # Verify it appears in published list
        results = blog_repo.list_posts(status='PUBLISHED', limit=10)
        assert results['count'] == 1


class TestBlogRepositoryDelete:
    """Tests for deleting blog posts."""

    def test_delete_existing_post(self, blog_repo):
        """Test deleting an existing post."""
        post = blog_repo.create({
            'title': 'Test Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Test',
            'tags': []
        })

        result = blog_repo.delete(post['id'])
        assert result is True

        # Verify post is deleted
        retrieved = blog_repo.get_by_id(post['id'])
        assert retrieved is None

    def test_delete_nonexistent_post(self, blog_repo):
        """Test deleting a non-existent post."""
        result = blog_repo.delete('nonexistent-id')
        assert result is False


class TestBlogRepositoryCategories:
    """Tests for category operations."""

    def test_get_categories_with_counts(self, blog_repo):
        """Test getting categories with post counts."""
        # Create posts in different categories
        blog_repo.create({
            'title': 'Backend Post 1',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Backend',
            'tags': []
        })

        blog_repo.create({
            'title': 'Backend Post 2',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Backend',
            'tags': []
        })

        blog_repo.create({
            'title': 'DevOps Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'DevOps',
            'tags': []
        })

        categories = blog_repo.get_categories()

        assert len(categories) == 2
        backend_cat = next(c for c in categories if c['name'] == 'Backend')
        assert backend_cat['count'] == 2

        devops_cat = next(c for c in categories if c['name'] == 'DevOps')
        assert devops_cat['count'] == 1

    def test_delete_post_decrements_category_count(self, blog_repo):
        """Test that deleting a post decrements category count."""
        post = blog_repo.create({
            'title': 'Test Post',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'category': 'Testing',
            'tags': []
        })

        categories_before = blog_repo.get_categories()
        testing_cat = next(c for c in categories_before if c['name'] == 'Testing')
        count_before = testing_cat['count']

        blog_repo.delete(post['id'])

        categories_after = blog_repo.get_categories()
        testing_cat_after = next((c for c in categories_after if c['name'] == 'Testing'), None)

        if testing_cat_after:
            assert testing_cat_after['count'] == count_before - 1
        else:
            # Category removed if count reached 0
            assert count_before == 1
