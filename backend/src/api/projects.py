"""
Projects API endpoints.

Handles project portfolio management - create, read, update, delete.
Public endpoints for reading, owner-only for write operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.dependencies import get_project_repository, require_owner_role
from src.models.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate
from src.repositories.project import ProjectRepository

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status: PUBLISHED, DRAFT, or omit for all"
    ),
    featured: bool | None = Query(None, description="Filter by featured projects"),
    limit: int = Query(20, ge=1, le=100),
    last_key: str | None = Query(None, description="Pagination token from previous response"),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """List all projects. Public endpoint - returns published projects by default."""
    # Default to PUBLISHED if no filter specified
    if status_filter is None:
        status_filter = "PUBLISHED"

    # Validate status filter
    if status_filter and status_filter.upper() not in ["PUBLISHED", "DRAFT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status filter. Must be PUBLISHED or DRAFT",
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
    result = project_repo.list_projects(
        status=status_filter.upper() if status_filter else None,
        featured=featured,
        limit=limit,
        last_evaluated_key=last_evaluated_key,
    )

    return result


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Get a single project by ID. Public endpoint."""
    project = project_repo.get_by_id(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only return published projects to public
    if project.get("status") != "PUBLISHED":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(require_owner_role),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Create a new project. Requires owner authentication."""
    project_data = project.model_dump()
    created_project = project_repo.create(project_data)

    if not created_project:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )

    return created_project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    current_user: dict = Depends(require_owner_role),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Update an existing project. Requires owner authentication."""
    project_data = project.model_dump(exclude_unset=True)

    if not project_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_project = project_repo.update(project_id, project_data)

    if not updated_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return updated_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(require_owner_role),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Delete a project. Requires owner authentication."""
    deleted = project_repo.delete(project_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return None


@router.post("/{project_id}/publish", response_model=ProjectResponse)
async def publish_project(
    project_id: str,
    current_user: dict = Depends(require_owner_role),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Publish a project (change status from DRAFT to PUBLISHED). Requires owner authentication."""
    published_project = project_repo.publish(project_id)

    if not published_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or already published",
        )

    return published_project


@router.post("/{project_id}/unpublish", response_model=ProjectResponse)
async def unpublish_project(
    project_id: str,
    current_user: dict = Depends(require_owner_role),
    project_repo: ProjectRepository = Depends(get_project_repository),
):
    """Unpublish a project (change status from PUBLISHED to DRAFT). Requires owner authentication."""
    unpublished_project = project_repo.unpublish(project_id)

    if not unpublished_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or already unpublished",
        )

    return unpublished_project
