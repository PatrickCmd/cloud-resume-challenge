"""
Certifications API endpoints.

Manages professional certifications and achievements.
Public endpoints for reading, owner-only for write operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.dependencies import get_certification_repository, require_owner_role
from src.models.certification import (
    CertificationCreate,
    CertificationListResponse,
    CertificationResponse,
    CertificationUpdate,
)
from src.repositories.certification import CertificationRepository

router = APIRouter()


@router.get("", response_model=CertificationListResponse)
async def list_certifications(
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status: PUBLISHED, DRAFT, or omit for all"
    ),
    cert_type: str | None = Query(None, description="Filter by type: certification or course"),
    featured: bool | None = Query(None, description="Filter by featured certifications"),
    limit: int = Query(20, ge=1, le=100),
    last_key: str | None = Query(None, description="Pagination token from previous response"),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """List all certifications. Public endpoint - returns published certifications by default."""
    # Default to PUBLISHED if no filter specified
    if status_filter is None:
        status_filter = "PUBLISHED"

    # Validate status filter
    if status_filter and status_filter.upper() not in ["PUBLISHED", "DRAFT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status filter. Must be PUBLISHED or DRAFT",
        )

    # Validate type filter
    if cert_type and cert_type not in ["certification", "course"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid type filter. Must be certification or course",
        )

    # Parse last_evaluated_key if provided
    last_evaluated_key = None
    if last_key:
        try:
            import json

            last_evaluated_key = json.loads(last_key)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid pagination token",
            )

    # Query repository
    result = cert_repo.list_certifications(
        status=status_filter.upper() if status_filter else None,
        cert_type=cert_type,
        featured=featured,
        limit=limit,
        last_evaluated_key=last_evaluated_key,
    )

    return result


@router.get("/{cert_id}", response_model=CertificationResponse)
async def get_certification(
    cert_id: str,
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Get a single certification by ID. Public endpoint."""
    cert = cert_repo.get_by_id(cert_id)

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    # Only return published certifications to public
    if cert.get("status") != "PUBLISHED":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    return cert


@router.post("", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
async def create_certification(
    cert: CertificationCreate,
    current_user: dict = Depends(require_owner_role),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Create a new certification. Requires owner authentication."""
    cert_data = cert.model_dump()
    created_cert = cert_repo.create(cert_data)

    if not created_cert:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create certification",
        )

    return created_cert


@router.put("/{cert_id}", response_model=CertificationResponse)
async def update_certification(
    cert_id: str,
    cert: CertificationUpdate,
    current_user: dict = Depends(require_owner_role),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Update an existing certification. Requires owner authentication."""
    cert_data = cert.model_dump(exclude_unset=True)

    if not cert_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_cert = cert_repo.update(cert_id, cert_data)

    if not updated_cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    return updated_cert


@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(
    cert_id: str,
    current_user: dict = Depends(require_owner_role),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Delete a certification. Requires owner authentication."""
    deleted = cert_repo.delete(cert_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    return None


@router.post("/{cert_id}/publish", response_model=CertificationResponse)
async def publish_certification(
    cert_id: str,
    current_user: dict = Depends(require_owner_role),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Publish a certification (change status from DRAFT to PUBLISHED). Requires owner authentication."""
    published_cert = cert_repo.publish(cert_id)

    if not published_cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found or already published",
        )

    return published_cert


@router.post("/{cert_id}/unpublish", response_model=CertificationResponse)
async def unpublish_certification(
    cert_id: str,
    current_user: dict = Depends(require_owner_role),
    cert_repo: CertificationRepository = Depends(get_certification_repository),
):
    """Unpublish a certification (change status from PUBLISHED to DRAFT). Requires owner authentication."""
    unpublished_cert = cert_repo.unpublish(cert_id)

    if not unpublished_cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found or already unpublished",
        )

    return unpublished_cert
