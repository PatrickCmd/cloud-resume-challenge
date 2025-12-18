"""
Simple test to verify pytest setup is working.
"""

import pytest


def test_hello():
    """Test that pytest is working."""
    assert True


def test_addition():
    """Test basic addition."""
    assert 1 + 1 == 2


def test_string():
    """Test string operations."""
    assert "hello".upper() == "HELLO"


@pytest.mark.asyncio
async def test_async():
    """Test async functionality."""
    async def get_value():
        return 42

    result = await get_value()
    assert result == 42
