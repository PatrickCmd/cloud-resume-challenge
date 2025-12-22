"""
Application configuration management.

Loads configuration from environment variables with sensible defaults.
Uses Pydantic Settings for validation and type safety.
"""

import os
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Portfolio API"
    version: str = "0.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")

    # AWS Region
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")

    # Cognito Configuration
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID", "")
    cognito_client_id: str = os.getenv("COGNITO_CLIENT_ID", "")
    cognito_region: str = os.getenv("AWS_REGION", "us-east-1")

    # DynamoDB Configuration
    dynamodb_table_name: str = os.getenv("DYNAMODB_TABLE_NAME", "portfolio-api-table")
    dynamodb_endpoint: str = os.getenv("DYNAMODB_ENDPOINT", "")  # For local DynamoDB (http://localhost:8000)

    # CORS Configuration
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://patrickcmd.dev",
        "https://www.patrickcmd.dev",
    ]

    # JWT Configuration
    jwt_algorithm: str = "RS256"
    jwt_issuer: str = f"https://cognito-idp.{aws_region}.amazonaws.com/{cognito_user_pool_id}"

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Ignore extra fields from .env file
    )


# Global settings instance
settings = Settings()
