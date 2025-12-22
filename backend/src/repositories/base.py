"""
Base repository class for DynamoDB operations.

Provides common functionality for all repositories following
the single-table design pattern.
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

import boto3
from botocore.exceptions import ClientError

from src.config import settings

T = TypeVar("T")  # Generic type for repository item


class BaseRepository(ABC, Generic[T]):
    """
    Base repository class for DynamoDB single-table design.

    Provides common DynamoDB operations with error handling.
    All repositories should inherit from this class.
    """

    def __init__(self, table_name: str = "portfolio-api-table"):
        """
        Initialize base repository with DynamoDB client.

        Args:
            table_name: Name of the DynamoDB table
        """
        self.table_name = table_name
        self._client = None
        self._resource = None

    @property
    def client(self):
        """
        Lazy-load DynamoDB client.

        Returns:
            boto3 DynamoDB client
        """
        if self._client is None:
            # Check if running locally
            if hasattr(settings, "dynamodb_endpoint") and settings.dynamodb_endpoint:
                self._client = boto3.client(
                    "dynamodb",
                    endpoint_url=settings.dynamodb_endpoint,
                    region_name=settings.aws_region,
                )
            else:
                self._client = boto3.client("dynamodb", region_name=settings.aws_region)
        return self._client

    @property
    def resource(self):
        """
        Lazy-load DynamoDB resource (table).

        Returns:
            boto3 DynamoDB table resource
        """
        if self._resource is None:
            # Check if running locally
            if hasattr(settings, "dynamodb_endpoint") and settings.dynamodb_endpoint:
                dynamodb = boto3.resource(
                    "dynamodb",
                    endpoint_url=settings.dynamodb_endpoint,
                    region_name=settings.aws_region,
                )
            else:
                dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
            self._resource = dynamodb.Table(self.table_name)
        return self._resource

    @property
    def dynamodb_resource(self):
        """
        Get DynamoDB service resource (for batch operations).

        Returns:
            boto3 DynamoDB service resource
        """
        # Check if running locally
        if hasattr(settings, "dynamodb_endpoint") and settings.dynamodb_endpoint:
            return boto3.resource(
                "dynamodb", endpoint_url=settings.dynamodb_endpoint, region_name=settings.aws_region
            )
        else:
            return boto3.resource("dynamodb", region_name=settings.aws_region)

    def get_item(self, pk: str, sk: str, consistent_read: bool = False) -> dict[str, Any] | None:
        """
        Get a single item by primary key.

        Args:
            pk: Partition key value
            sk: Sort key value
            consistent_read: Whether to use strongly consistent read

        Returns:
            Item dict or None if not found
        """
        try:
            response = self.resource.get_item(
                Key={"PK": pk, "SK": sk}, ConsistentRead=consistent_read
            )
            return response.get("Item")
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "ResourceNotFoundException":
                return None
            raise

    def put_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """
        Put (create or replace) an item.

        Args:
            item: Item to put in the table

        Returns:
            The item that was put
        """
        try:
            self.resource.put_item(Item=item)
            return item
        except ClientError:
            raise

    def update_item(
        self,
        pk: str,
        sk: str,
        update_expression: str,
        expression_attribute_values: dict[str, Any],
        expression_attribute_names: dict[str, str] | None = None,
        condition_expression: str | None = None,
    ) -> dict[str, Any]:
        """
        Update an existing item.

        Args:
            pk: Partition key value
            sk: Sort key value
            update_expression: DynamoDB update expression
            expression_attribute_values: Values for the update expression
            expression_attribute_names: Attribute name substitutions
            condition_expression: Condition for the update

        Returns:
            Updated item attributes
        """
        try:
            params = {
                "Key": {"PK": pk, "SK": sk},
                "UpdateExpression": update_expression,
                "ExpressionAttributeValues": expression_attribute_values,
                "ReturnValues": "ALL_NEW",
            }

            if expression_attribute_names:
                params["ExpressionAttributeNames"] = expression_attribute_names

            if condition_expression:
                params["ConditionExpression"] = condition_expression

            response = self.resource.update_item(**params)
            return response["Attributes"]
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "ConditionalCheckFailedException":
                return None
            raise

    def delete_item(self, pk: str, sk: str, condition_expression: str | None = None) -> bool:
        """
        Delete an item.

        Args:
            pk: Partition key value
            sk: Sort key value
            condition_expression: Condition for the delete

        Returns:
            True if deleted, False if condition failed
        """
        try:
            params = {"Key": {"PK": pk, "SK": sk}}

            if condition_expression:
                params["ConditionExpression"] = condition_expression

            self.resource.delete_item(**params)
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "ConditionalCheckFailedException":
                return False
            raise

    def query(
        self,
        key_condition_expression: str,
        expression_attribute_values: dict[str, Any],
        expression_attribute_names: dict[str, str] | None = None,
        filter_expression: str | None = None,
        index_name: str | None = None,
        scan_index_forward: bool = True,
        limit: int | None = None,
        exclusive_start_key: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Query items.

        Args:
            key_condition_expression: Key condition expression
            expression_attribute_values: Values for the expression
            expression_attribute_names: Attribute name substitutions
            filter_expression: Filter expression (applied after query)
            index_name: Name of GSI to query
            scan_index_forward: True for ascending, False for descending
            limit: Maximum number of items to return
            exclusive_start_key: Start key for pagination

        Returns:
            Dict with 'Items' list and optional 'LastEvaluatedKey'
        """
        try:
            params = {
                "KeyConditionExpression": key_condition_expression,
                "ExpressionAttributeValues": expression_attribute_values,
                "ScanIndexForward": scan_index_forward,
            }

            if expression_attribute_names:
                params["ExpressionAttributeNames"] = expression_attribute_names

            if filter_expression:
                params["FilterExpression"] = filter_expression

            if index_name:
                params["IndexName"] = index_name

            if limit:
                params["Limit"] = limit

            if exclusive_start_key:
                params["ExclusiveStartKey"] = exclusive_start_key

            response = self.resource.query(**params)

            return {
                "Items": response.get("Items", []),
                "LastEvaluatedKey": response.get("LastEvaluatedKey"),
            }
        except ClientError:
            raise

    def batch_get_items(self, keys: list[dict[str, str]]) -> list[dict[str, Any]]:
        """
        Get multiple items in a single request.

        Args:
            keys: List of {PK, SK} dicts (plain string values)

        Returns:
            List of items
        """
        try:
            # Use DynamoDB service resource which handles type conversion automatically
            responses = []
            for i in range(0, len(keys), 100):
                batch_keys = keys[i : i + 100]

                response = self.dynamodb_resource.batch_get_item(
                    RequestItems={self.table_name: {"Keys": batch_keys}}
                )

                responses.extend(response["Responses"].get(self.table_name, []))

            return responses
        except ClientError:
            raise

    def batch_write_items(self, items: list[dict[str, Any]]) -> bool:
        """
        Write multiple items in batches.

        Args:
            items: List of items to write

        Returns:
            True if all items written successfully
        """
        try:
            # Batch write items (max 25 per request)
            for i in range(0, len(items), 25):
                batch_items = items[i : i + 25]

                with self.resource.batch_writer() as batch:
                    for item in batch_items:
                        batch.put_item(Item=item)

            return True
        except ClientError:
            raise

    @abstractmethod
    def to_item(self, data: T) -> dict[str, Any]:
        """
        Convert domain model to DynamoDB item.

        Args:
            data: Domain model instance

        Returns:
            DynamoDB item dict
        """
        pass

    @abstractmethod
    def from_item(self, item: dict[str, Any]) -> T:
        """
        Convert DynamoDB item to domain model.

        Args:
            item: DynamoDB item dict

        Returns:
            Domain model instance
        """
        pass
