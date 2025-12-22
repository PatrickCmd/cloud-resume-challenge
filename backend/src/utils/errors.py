"""
Custom error handlers and exceptions.

Defines custom exceptions and error handling middleware for the API.
"""

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class PortfolioAPIException(Exception):
    """Base exception for Portfolio API."""

    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ResourceNotFoundException(PortfolioAPIException):
    """Exception raised when a resource is not found."""

    def __init__(self, resource_type: str, resource_id: str):
        message = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(PortfolioAPIException):
    """Exception raised for unauthorized access."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(PortfolioAPIException):
    """Exception raised for forbidden access."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(PortfolioAPIException):
    """Exception raised for validation errors."""

    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)


class DuplicateResourceException(PortfolioAPIException):
    """Exception raised when trying to create a duplicate resource."""

    def __init__(self, resource_type: str, field: str, value: str):
        message = f"{resource_type} with {field}='{value}' already exists"
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


# Error handlers


async def portfolio_api_exception_handler(request: Request, exc: PortfolioAPIException):
    """Handle PortfolioAPIException."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "status_code": exc.status_code,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTPException."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "status_code": status.HTTP_422_UNPROCESSABLE_CONTENT,
        },
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )


def register_error_handlers(app):
    """
    Register all error handlers with the FastAPI app.

    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(PortfolioAPIException, portfolio_api_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
