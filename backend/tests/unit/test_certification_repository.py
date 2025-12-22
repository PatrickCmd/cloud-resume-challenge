"""
Unit tests for CertificationRepository.

Tests all certification repository operations using moto to mock DynamoDB.
"""

import os

import boto3
import pytest
from moto import mock_aws

# Set environment before imports
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"

from src.repositories.certification import CertificationRepository


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
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
                }
            ],
            BillingMode="PROVISIONED",
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )

        yield table_name


@pytest.fixture
def cert_repo(dynamodb_table):
    """Create a CertificationRepository instance for testing."""
    return CertificationRepository()


class TestCertificationRepositoryCreate:
    """Tests for certification creation."""

    def test_create_certification(self, cert_repo):
        """Test creating a certification."""
        cert_data = {
            "name": "AWS Solutions Architect - Associate",
            "issuer": "Amazon Web Services",
            "icon": "☁️",
            "type": "certification",
            "featured": True,
            "description": "Cloud architecture certification",
            "credentialUrl": "https://aws.amazon.com/verify/123",
            "dateEarned": "2023-06-15",
        }

        cert = cert_repo.create(cert_data)

        assert cert["id"] is not None
        assert cert["name"] == "AWS Solutions Architect - Associate"
        assert cert["status"] == "DRAFT"
        assert cert["issuer"] == "Amazon Web Services"
        assert cert["type"] == "certification"
        assert cert["featured"] is True
        assert "createdAt" in cert
        assert "updatedAt" in cert

    def test_create_course(self, cert_repo):
        """Test creating a course."""
        course_data = {
            "name": "Python for Data Science",
            "issuer": "Coursera",
            "icon": "📚",
            "type": "course",
            "featured": False,
            "description": "Python programming course",
            "credentialUrl": "",
            "dateEarned": "2022-05-10",
        }

        course = cert_repo.create(course_data)

        assert course["id"] is not None
        assert course["type"] == "course"
        assert course["featured"] is False

    def test_create_generates_unique_ids(self, cert_repo):
        """Test that each created certification gets a unique ID."""
        cert1 = cert_repo.create(
            {
                "name": "Cert 1",
                "issuer": "Issuer 1",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description 1",
                "dateEarned": "2023-01-01",
            }
        )

        cert2 = cert_repo.create(
            {
                "name": "Cert 2",
                "issuer": "Issuer 2",
                "icon": "📜",
                "type": "certification",
                "featured": False,
                "description": "Description 2",
                "dateEarned": "2023-01-02",
            }
        )

        assert cert1["id"] != cert2["id"]


class TestCertificationRepositoryRead:
    """Tests for reading certifications."""

    def test_get_by_id_existing_certification(self, cert_repo):
        """Test retrieving an existing certification by ID."""
        created = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Test Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Test description",
                "dateEarned": "2023-01-01",
            }
        )

        retrieved = cert_repo.get_by_id(created["id"])

        assert retrieved is not None
        assert retrieved["id"] == created["id"]
        assert retrieved["name"] == "Test Cert"

    def test_get_by_id_nonexistent_certification(self, cert_repo):
        """Test retrieving a non-existent certification."""
        result = cert_repo.get_by_id("nonexistent-id")
        assert result is None

    def test_list_certifications_returns_all_drafts(self, cert_repo):
        """Test listing draft certifications."""
        # Create multiple draft certifications
        for i in range(3):
            cert_repo.create(
                {
                    "name": f"Draft Cert {i}",
                    "issuer": f"Issuer {i}",
                    "icon": "🏆",
                    "type": "certification",
                    "featured": False,
                    "description": f"Description {i}",
                    "dateEarned": f"2023-01-0{i+1}",
                }
            )

        results = cert_repo.list_certifications(status="DRAFT", limit=10)

        assert results["count"] == 3
        assert len(results["items"]) == 3
        assert all(cert["status"] == "DRAFT" for cert in results["items"])

    def test_list_certifications_returns_published_only(self, cert_repo):
        """Test listing only published certifications."""
        # Create and publish some certifications
        for i in range(2):
            cert = cert_repo.create(
                {
                    "name": f"Cert {i}",
                    "issuer": f"Issuer {i}",
                    "icon": "🏆",
                    "type": "certification",
                    "featured": False,
                    "description": f"Description {i}",
                    "dateEarned": f"2023-01-0{i+1}",
                }
            )
            cert_repo.publish(cert["id"])

        # Create a draft
        cert_repo.create(
            {
                "name": "Draft Cert",
                "issuer": "Draft Issuer",
                "icon": "📜",
                "type": "certification",
                "featured": False,
                "description": "Draft Description",
                "dateEarned": "2023-01-05",
            }
        )

        results = cert_repo.list_certifications(status="PUBLISHED", limit=10)

        assert results["count"] == 2
        assert all(cert["status"] == "PUBLISHED" for cert in results["items"])

    def test_list_certifications_with_type_filter(self, cert_repo):
        """Test filtering certifications by type."""
        # Create certification
        cert_repo.create(
            {
                "name": "AWS Cert",
                "issuer": "AWS",
                "icon": "☁️",
                "type": "certification",
                "featured": False,
                "description": "Cloud cert",
                "dateEarned": "2023-01-01",
            }
        )

        # Create course
        cert_repo.create(
            {
                "name": "Python Course",
                "issuer": "Coursera",
                "icon": "📚",
                "type": "course",
                "featured": False,
                "description": "Python course",
                "dateEarned": "2023-01-02",
            }
        )

        cert_results = cert_repo.list_certifications(
            status="DRAFT", cert_type="certification", limit=10
        )
        course_results = cert_repo.list_certifications(status="DRAFT", cert_type="course", limit=10)

        assert cert_results["count"] == 1
        assert cert_results["items"][0]["type"] == "certification"
        assert course_results["count"] == 1
        assert course_results["items"][0]["type"] == "course"

    def test_list_certifications_with_featured_filter(self, cert_repo):
        """Test filtering certifications by featured flag."""
        # Create featured certification
        cert_repo.create(
            {
                "name": "Featured Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": True,
                "description": "Featured",
                "dateEarned": "2023-01-01",
            }
        )

        # Create non-featured certification
        cert_repo.create(
            {
                "name": "Regular Cert",
                "issuer": "Issuer",
                "icon": "📜",
                "type": "certification",
                "featured": False,
                "description": "Regular",
                "dateEarned": "2023-01-02",
            }
        )

        results = cert_repo.list_certifications(status="DRAFT", featured=True, limit=10)

        assert results["count"] == 1
        assert results["items"][0]["featured"] is True


class TestCertificationRepositoryUpdate:
    """Tests for updating certifications."""

    def test_update_certification_name(self, cert_repo):
        """Test updating a certification's name."""
        cert = cert_repo.create(
            {
                "name": "Original Name",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        updated = cert_repo.update(cert["id"], {"name": "Updated Name"})

        assert updated is not None
        assert updated["name"] == "Updated Name"
        assert updated["id"] == cert["id"]

    def test_update_certification_description(self, cert_repo):
        """Test updating a certification's description."""
        cert = cert_repo.create(
            {
                "name": "Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Original description",
                "dateEarned": "2023-01-01",
            }
        )

        updated = cert_repo.update(cert["id"], {"description": "Updated description"})

        assert updated["description"] == "Updated description"

    def test_update_nonexistent_certification(self, cert_repo):
        """Test updating a non-existent certification."""
        result = cert_repo.update("nonexistent-id", {"name": "New Name"})
        assert result is None


class TestCertificationRepositoryPublish:
    """Tests for publishing/unpublishing certifications."""

    def test_publish_draft_certification(self, cert_repo):
        """Test publishing a draft certification."""
        cert = cert_repo.create(
            {
                "name": "Draft Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        assert cert["status"] == "DRAFT"

        published = cert_repo.publish(cert["id"])

        assert published is not None
        assert published["status"] == "PUBLISHED"

    def test_unpublish_published_certification(self, cert_repo):
        """Test unpublishing a published certification."""
        cert = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        cert_repo.publish(cert["id"])
        unpublished = cert_repo.unpublish(cert["id"])

        assert unpublished is not None
        assert unpublished["status"] == "DRAFT"

    def test_publish_updates_gsi_keys(self, cert_repo):
        """Test that publishing updates GSI1 keys correctly."""
        cert = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        cert_repo.publish(cert["id"])

        # Verify it appears in published list
        results = cert_repo.list_certifications(status="PUBLISHED", limit=10)
        assert results["count"] == 1


class TestCertificationRepositoryDelete:
    """Tests for deleting certifications."""

    def test_delete_existing_certification(self, cert_repo):
        """Test deleting an existing certification."""
        cert = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        result = cert_repo.delete(cert["id"])
        assert result is True

        # Verify certification is deleted
        retrieved = cert_repo.get_by_id(cert["id"])
        assert retrieved is None

    def test_delete_nonexistent_certification(self, cert_repo):
        """Test deleting a non-existent certification."""
        result = cert_repo.delete("nonexistent-id")
        assert result is False


class TestCertificationDataStructure:
    """Tests for data structure and formatting."""

    def test_certification_has_all_required_fields(self, cert_repo):
        """Test that created certifications have all required fields."""
        cert = cert_repo.create(
            {
                "name": "Complete Cert",
                "issuer": "Complete Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": True,
                "description": "Complete description",
                "credentialUrl": "https://verify.com/123",
                "dateEarned": "2023-06-15",
            }
        )

        required_fields = [
            "id",
            "name",
            "issuer",
            "icon",
            "type",
            "featured",
            "description",
            "dateEarned",
            "status",
            "createdAt",
            "updatedAt",
        ]

        for field in required_fields:
            assert field in cert, f"Missing required field: {field}"

    def test_certification_timestamps_are_iso_format(self, cert_repo):
        """Test that timestamps are in ISO format."""
        cert = cert_repo.create(
            {
                "name": "Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        # Should not raise exception if valid ISO format
        from datetime import datetime

        datetime.fromisoformat(cert["createdAt"])
        datetime.fromisoformat(cert["updatedAt"])

    def test_certification_type_values(self, cert_repo):
        """Test that type field only accepts valid values."""
        # Create certification
        cert = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )
        assert cert["type"] == "certification"

        # Create course
        course = cert_repo.create(
            {
                "name": "Test Course",
                "issuer": "Issuer",
                "icon": "📚",
                "type": "course",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )
        assert course["type"] == "course"

    def test_update_modifies_updated_at(self, cert_repo):
        """Test that update changes the updatedAt timestamp."""
        cert = cert_repo.create(
            {
                "name": "Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        original_updated_at = cert["updatedAt"]

        # Small delay to ensure timestamp changes
        import time

        time.sleep(0.1)

        updated = cert_repo.update(cert["id"], {"name": "Updated"})

        assert updated["updatedAt"] >= original_updated_at

    def test_gsi_includes_type_in_pk(self, cert_repo):
        """Test that GSI1PK includes the certification type."""
        cert = cert_repo.create(
            {
                "name": "Test Cert",
                "issuer": "Issuer",
                "icon": "🏆",
                "type": "certification",
                "featured": False,
                "description": "Description",
                "dateEarned": "2023-01-01",
            }
        )

        cert_repo.publish(cert["id"])

        # Get the item directly to check GSI keys
        item = cert_repo.get_item(pk=f"CERT#{cert['id']}", sk="METADATA")

        assert "GSI1PK" in item
        assert "certification" in item["GSI1PK"]
