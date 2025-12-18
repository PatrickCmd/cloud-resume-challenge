"""
Certifications API endpoints.

Manages professional certifications and achievements.
Public endpoints for reading, owner-only for write operations.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from src.dependencies import require_owner_role
from src.models.certification import CertificationCreate, CertificationUpdate, CertificationResponse

router = APIRouter()


@router.get("", response_model=List[CertificationResponse])
async def list_certifications():
    """List all certifications. Public endpoint."""
    # TODO: Implement certification listing from DynamoDB
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Certification listing not yet implemented",
    )


@router.get("/{cert_id}", response_model=CertificationResponse)
async def get_certification(cert_id: str):
    """Get a single certification by ID. Public endpoint."""
    # TODO: Implement certification retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Certification retrieval not yet implemented",
    )


@router.post("", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
async def create_certification(
    cert: CertificationCreate,
    current_user: dict = Depends(require_owner_role),
):
    """Create a new certification. Requires owner authentication."""
    # TODO: Implement certification creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Certification creation not yet implemented",
    )


@router.put("/{cert_id}", response_model=CertificationResponse)
async def update_certification(
    cert_id: str,
    cert: CertificationUpdate,
    current_user: dict = Depends(require_owner_role),
):
    """Update an existing certification. Requires owner authentication."""
    # TODO: Implement certification update
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Certification update not yet implemented",
    )


@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(
    cert_id: str,
    current_user: dict = Depends(require_owner_role),
):
    """Delete a certification. Requires owner authentication."""
    # TODO: Implement certification deletion
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Certification deletion not yet implemented",
    )
