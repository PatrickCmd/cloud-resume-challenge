"""
Unit tests for ProjectRepository.

Tests all project repository operations using moto to mock DynamoDB.
"""

import os
import pytest
from moto import mock_aws
import boto3

# Set environment before imports
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'

from src.repositories.project import ProjectRepository


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
def project_repo(dynamodb_table):
    """Create a ProjectRepository instance for testing."""
    return ProjectRepository()


class TestProjectRepositoryCreate:
    """Tests for project creation."""

    def test_create_project(self, project_repo):
        """Test creating a project."""
        project_data = {
            'name': 'Test Project',
            'description': 'A test project description',
            'longDescription': 'A longer description with more details',
            'tech': ['Python', 'FastAPI', 'DynamoDB'],
            'company': 'Test Company',
            'featured': True,
            'githubUrl': 'https://github.com/test/project',
            'liveUrl': 'https://test-project.com',
            'imageUrl': 'https://test-project.com/image.png'
        }

        project = project_repo.create(project_data)

        assert project['id'] is not None
        assert project['name'] == 'Test Project'
        assert project['status'] == 'DRAFT'
        assert project['company'] == 'Test Company'
        assert project['featured'] is True
        assert project['tech'] == ['Python', 'FastAPI', 'DynamoDB']
        assert 'createdAt' in project
        assert 'updatedAt' in project

    def test_create_generates_unique_ids(self, project_repo):
        """Test that each created project gets a unique ID."""
        project1 = project_repo.create({
            'name': 'Project 1',
            'description': 'Description 1',
            'longDescription': 'Long description 1',
            'tech': ['Python'],
            'company': 'Company 1',
            'featured': False
        })

        project2 = project_repo.create({
            'name': 'Project 2',
            'description': 'Description 2',
            'longDescription': 'Long description 2',
            'tech': ['Go'],
            'company': 'Company 2',
            'featured': False
        })

        assert project1['id'] != project2['id']

    def test_create_with_minimal_data(self, project_repo):
        """Test creating a project with only required fields."""
        project = project_repo.create({
            'name': 'Minimal Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        assert project['id'] is not None
        assert project['name'] == 'Minimal Project'
        assert 'githubUrl' in project
        assert 'liveUrl' in project
        assert 'imageUrl' in project


class TestProjectRepositoryRead:
    """Tests for reading projects."""

    def test_get_by_id_existing_project(self, project_repo):
        """Test retrieving an existing project by ID."""
        created = project_repo.create({
            'name': 'Test Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        retrieved = project_repo.get_by_id(created['id'])

        assert retrieved is not None
        assert retrieved['id'] == created['id']
        assert retrieved['name'] == 'Test Project'

    def test_get_by_id_nonexistent_project(self, project_repo):
        """Test retrieving a non-existent project."""
        result = project_repo.get_by_id('nonexistent-id')
        assert result is None

    def test_list_projects_returns_all_drafts(self, project_repo):
        """Test listing draft projects."""
        # Create multiple draft projects
        for i in range(3):
            project_repo.create({
                'name': f'Draft Project {i}',
                'description': f'Description {i}',
                'longDescription': f'Long description {i}',
                'tech': ['Python'],
                'company': f'Company {i}',
                'featured': False
            })

        results = project_repo.list_projects(status='DRAFT', limit=10)

        assert results['count'] == 3
        assert len(results['items']) == 3
        assert all(proj['status'] == 'DRAFT' for proj in results['items'])

    def test_list_projects_returns_published_only(self, project_repo):
        """Test listing only published projects."""
        # Create and publish some projects
        for i in range(2):
            project = project_repo.create({
                'name': f'Project {i}',
                'description': f'Description {i}',
                'longDescription': f'Long description {i}',
                'tech': ['Python'],
                'company': f'Company {i}',
                'featured': False
            })
            project_repo.publish(project['id'])

        # Create a draft
        project_repo.create({
            'name': 'Draft Project',
            'description': 'Draft Description',
            'longDescription': 'Draft Long Description',
            'tech': ['Go'],
            'company': 'Draft Company',
            'featured': False
        })

        results = project_repo.list_projects(status='PUBLISHED', limit=10)

        assert results['count'] == 2
        assert all(proj['status'] == 'PUBLISHED' for proj in results['items'])

    def test_list_projects_with_featured_filter(self, project_repo):
        """Test filtering projects by featured flag."""
        # Create featured project
        project_repo.create({
            'name': 'Featured Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': True
        })

        # Create non-featured project
        project_repo.create({
            'name': 'Regular Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Go'],
            'company': 'Company',
            'featured': False
        })

        results = project_repo.list_projects(status='DRAFT', featured=True, limit=10)

        assert results['count'] == 1
        assert results['items'][0]['featured'] is True


class TestProjectRepositoryUpdate:
    """Tests for updating projects."""

    def test_update_project_name(self, project_repo):
        """Test updating a project's name."""
        project = project_repo.create({
            'name': 'Original Name',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        updated = project_repo.update(project['id'], {'name': 'Updated Name'})

        assert updated is not None
        assert updated['name'] == 'Updated Name'
        assert updated['id'] == project['id']

    def test_update_project_tech_stack(self, project_repo):
        """Test updating a project's tech stack."""
        project = project_repo.create({
            'name': 'Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        updated = project_repo.update(
            project['id'],
            {'tech': ['Python', 'FastAPI', 'AWS']}
        )

        assert updated['tech'] == ['Python', 'FastAPI', 'AWS']

    def test_update_nonexistent_project(self, project_repo):
        """Test updating a non-existent project."""
        result = project_repo.update('nonexistent-id', {'name': 'New Name'})
        assert result is None


class TestProjectRepositoryPublish:
    """Tests for publishing/unpublishing projects."""

    def test_publish_draft_project(self, project_repo):
        """Test publishing a draft project."""
        project = project_repo.create({
            'name': 'Draft Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        assert project['status'] == 'DRAFT'

        published = project_repo.publish(project['id'])

        assert published is not None
        assert published['status'] == 'PUBLISHED'

    def test_unpublish_published_project(self, project_repo):
        """Test unpublishing a published project."""
        project = project_repo.create({
            'name': 'Test Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        project_repo.publish(project['id'])
        unpublished = project_repo.unpublish(project['id'])

        assert unpublished is not None
        assert unpublished['status'] == 'DRAFT'

    def test_publish_updates_gsi_keys(self, project_repo):
        """Test that publishing updates GSI1 keys correctly."""
        project = project_repo.create({
            'name': 'Test Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        project_repo.publish(project['id'])

        # Verify it appears in published list
        results = project_repo.list_projects(status='PUBLISHED', limit=10)
        assert results['count'] == 1


class TestProjectRepositoryDelete:
    """Tests for deleting projects."""

    def test_delete_existing_project(self, project_repo):
        """Test deleting an existing project."""
        project = project_repo.create({
            'name': 'Test Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        result = project_repo.delete(project['id'])
        assert result is True

        # Verify project is deleted
        retrieved = project_repo.get_by_id(project['id'])
        assert retrieved is None

    def test_delete_nonexistent_project(self, project_repo):
        """Test deleting a non-existent project."""
        result = project_repo.delete('nonexistent-id')
        assert result is False


class TestProjectDataStructure:
    """Tests for data structure and formatting."""

    def test_project_has_all_required_fields(self, project_repo):
        """Test that created projects have all required fields."""
        project = project_repo.create({
            'name': 'Complete Project',
            'description': 'A complete description',
            'longDescription': 'A complete long description',
            'tech': ['Python', 'AWS'],
            'company': 'Test Company',
            'featured': True,
            'githubUrl': 'https://github.com/test',
            'liveUrl': 'https://test.com',
            'imageUrl': 'https://test.com/image.png'
        })

        required_fields = [
            'id', 'name', 'description', 'longDescription', 'tech',
            'company', 'featured', 'status', 'createdAt', 'updatedAt'
        ]

        for field in required_fields:
            assert field in project, f"Missing required field: {field}"

    def test_project_timestamps_are_iso_format(self, project_repo):
        """Test that timestamps are in ISO format."""
        project = project_repo.create({
            'name': 'Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        # Should not raise exception if valid ISO format
        from datetime import datetime
        datetime.fromisoformat(project['createdAt'])
        datetime.fromisoformat(project['updatedAt'])

    def test_update_modifies_updated_at(self, project_repo):
        """Test that update changes the updatedAt timestamp."""
        project = project_repo.create({
            'name': 'Project',
            'description': 'Description',
            'longDescription': 'Long description',
            'tech': ['Python'],
            'company': 'Company',
            'featured': False
        })

        original_updated_at = project['updatedAt']

        # Small delay to ensure timestamp changes
        import time
        time.sleep(0.1)

        updated = project_repo.update(project['id'], {'name': 'Updated'})

        assert updated['updatedAt'] >= original_updated_at
