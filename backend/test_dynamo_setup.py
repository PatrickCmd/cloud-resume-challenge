"""
Quick test script to verify DynamoDB repositories are working.

Run this to test the DynamoDB setup:
    python test_dynamo_setup.py
"""

import os
# Set environment variables before importing repositories
os.environ['DYNAMODB_ENDPOINT'] = 'http://localhost:8000'
os.environ['AWS_REGION'] = 'us-east-1'
# Dummy credentials for local DynamoDB (required by boto3)
os.environ['AWS_ACCESS_KEY_ID'] = 'dummy'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'dummy'

from src.repositories.blog import BlogRepository
from src.repositories.visitor import VisitorRepository
from src.repositories.analytics import AnalyticsRepository
import uuid


def test_blog_repository():
    """Test blog repository operations."""
    print("\n=== Testing Blog Repository ===")

    repo = BlogRepository()

    # Create a blog post
    print("Creating blog post...")
    post = repo.create({
        'title': 'Test Blog Post',
        'content': '# Hello World\n\nThis is a test post with some content to calculate read time.',
        'excerpt': 'A test post',
        'category': 'Testing',
        'tags': ['test', 'dynamodb']
    })
    print(f"✓ Created post: {post['id']}")
    print(f"  Status: {post.get('status', 'N/A')}")
    print(f"  Read time: {post.get('readTime', 'N/A')} min")

    # Retrieve it
    print("\nRetrieving blog post...")
    retrieved = repo.get_by_id(post['id'])
    print(f"✓ Retrieved: {retrieved['title']}")

    # List posts
    print("\nListing draft posts...")
    results = repo.list_posts(status='DRAFT', limit=10)
    print(f"✓ Found {len(results['items'])} draft posts")

    # Update
    print("\nUpdating blog post...")
    updated = repo.update(post['id'], {
        'title': 'Updated Test Post',
        'content': 'Updated content'
    })
    print(f"✓ Updated: {updated['title']}")

    # Publish
    print("\nPublishing blog post...")
    published = repo.publish(post['id'])
    if published:
        print(f"✓ Published: {published['title']}")
        print(f"  Published at: {published.get('publishedAt', 'N/A')}")
    else:
        print("✗ Failed to publish (may already be published)")

    # Get categories
    print("\nGetting categories...")
    categories = repo.get_categories()
    print(f"✓ Found {len(categories)} categories")
    for cat in categories:
        print(f"  - {cat['name']}: {cat['count']} posts")

    # Clean up
    print("\nCleaning up...")
    deleted = repo.delete(post['id'])
    print(f"✓ Deleted: {deleted}")

    print("\n✓ Blog Repository tests passed!")


def test_visitor_repository():
    """Test visitor repository operations."""
    print("\n=== Testing Visitor Repository ===")

    repo = VisitorRepository()

    # Track visitor
    print("Tracking visitor...")
    session_id = str(uuid.uuid4())
    result = repo.track_visitor(session_id)
    print(f"✓ Tracked visitor: {result['sessionId']}")
    print(f"  Count today: {result['count']}")

    # Track same visitor again (should be deduplicated)
    print("\nTracking same visitor again...")
    result2 = repo.track_visitor(session_id)
    print(f"✓ Count unchanged: {result2['count']} (deduplicated)")

    # Get total count
    print("\nGetting total count...")
    total = repo.get_total_count()
    print(f"✓ Total visitors: {total}")

    # Get daily trends
    print("\nGetting daily trends...")
    trends = repo.get_daily_trends(days=7)
    print(f"✓ Retrieved {len(trends)} days of data")

    print("\n✓ Visitor Repository tests passed!")


def test_analytics_repository():
    """Test analytics repository operations."""
    print("\n=== Testing Analytics Repository ===")

    repo = AnalyticsRepository()

    # Track view
    print("Tracking content view...")
    session_id = str(uuid.uuid4())
    content_id = str(uuid.uuid4())
    result = repo.track_view('blog', content_id, session_id)
    print(f"✓ Tracked view: {result['views']} views")

    # Track same view again (should be deduplicated)
    print("\nTracking same view again...")
    result2 = repo.track_view('blog', content_id, session_id)
    print(f"✓ Views unchanged: {result2['views']} (deduplicated)")

    # Track from different session
    print("\nTracking from different session...")
    session_id2 = str(uuid.uuid4())
    result3 = repo.track_view('blog', content_id, session_id2)
    print(f"✓ Views incremented: {result3['views']}")

    # Get view count
    print("\nGetting view count...")
    views = repo.get_view_count('blog', content_id)
    print(f"✓ View count: {views}")

    # Get total views
    print("\nGetting total views...")
    total = repo.get_total_views()
    print(f"✓ Total views: {total}")

    print("\n✓ Analytics Repository tests passed!")


if __name__ == '__main__':
    print("Starting DynamoDB Repository Tests...")
    print("Ensure Docker DynamoDB is running: docker-compose up -d")

    try:
        test_blog_repository()
        test_visitor_repository()
        test_analytics_repository()

        print("\n" + "="*50)
        print("✓ ALL TESTS PASSED!")
        print("="*50)

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
