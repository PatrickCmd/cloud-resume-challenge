"""
DynamoDB utilities.

Provides helper functions for DynamoDB operations.
"""

from datetime import datetime
from typing import Any

import boto3

from src.config import settings


def get_dynamodb_resource():
    """
    Get boto3 DynamoDB resource.

    Returns:
        Configured DynamoDB resource
    """
    return boto3.resource(
        "dynamodb",
        region_name=settings.aws_region,
    )


def get_table():
    """
    Get the portfolio DynamoDB table.

    Returns:
        DynamoDB table resource
    """
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_table_name)


def serialize_datetime(dt: datetime) -> str:
    """
    Serialize datetime to ISO format string for DynamoDB.

    Args:
        dt: Datetime object

    Returns:
        ISO format string
    """
    return dt.isoformat()


def deserialize_datetime(dt_str: str) -> datetime:
    """
    Deserialize ISO format string to datetime.

    Args:
        dt_str: ISO format datetime string

    Returns:
        Datetime object
    """
    return datetime.fromisoformat(dt_str)


def build_update_expression(updates: dict[str, Any]) -> tuple:
    """
    Build DynamoDB update expression from dictionary.

    Args:
        updates: Dictionary of field names and values to update

    Returns:
        Tuple of (update_expression, expression_attribute_names, expression_attribute_values)
    """
    if not updates:
        raise ValueError("Updates dictionary cannot be empty")

    update_parts = []
    attr_names = {}
    attr_values = {}

    for i, (key, value) in enumerate(updates.items()):
        name_placeholder = f"#field{i}"
        value_placeholder = f":value{i}"

        update_parts.append(f"{name_placeholder} = {value_placeholder}")
        attr_names[name_placeholder] = key
        attr_values[value_placeholder] = value

    update_expression = "SET " + ", ".join(update_parts)

    return update_expression, attr_names, attr_values


def paginate_query(
    table,
    key_condition_expression,
    limit: int = 20,
    last_evaluated_key: dict | None = None,
    **kwargs,
) -> dict:
    """
    Execute a paginated DynamoDB query.

    Args:
        table: DynamoDB table resource
        key_condition_expression: Query key condition
        limit: Maximum items per page
        last_evaluated_key: Pagination token from previous query
        **kwargs: Additional query parameters

    Returns:
        Dictionary with items and pagination info
    """
    query_params = {"KeyConditionExpression": key_condition_expression, "Limit": limit, **kwargs}

    if last_evaluated_key:
        query_params["ExclusiveStartKey"] = last_evaluated_key

    response = table.query(**query_params)

    return {
        "items": response.get("Items", []),
        "last_evaluated_key": response.get("LastEvaluatedKey"),
        "count": response.get("Count", 0),
    }
