"""Organization router."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationList,
)

router = APIRouter()


@router.get("", response_model=OrganizationList)
async def list_organizations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sector: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all organizations with pagination and filtering."""
    query = select(Organization)

    # Apply filters
    if sector:
        query = query.where(Organization.sector == sector)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Organization.name_en.ilike(search_term))
            | (Organization.name_ar.ilike(search_term))
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Organization.created_at.desc())

    result = await db.execute(query)
    organizations = result.scalars().all()

    return OrganizationList(
        items=[OrganizationResponse.model_validate(org) for org in organizations],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization."""
    organization = Organization(**data.model_dump())
    db.add(organization)
    await db.flush()
    await db.refresh(organization)
    return OrganizationResponse.model_validate(organization)


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get organization by ID."""
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    organization = result.scalar_one_or_none()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    return OrganizationResponse.model_validate(organization)


@router.put("/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    organization_id: UUID,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an organization."""
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    organization = result.scalar_one_or_none()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(organization, field, value)

    await db.flush()
    await db.refresh(organization)
    return OrganizationResponse.model_validate(organization)


@router.delete("/{organization_id}", status_code=204)
async def delete_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an organization."""
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    organization = result.scalar_one_or_none()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    await db.delete(organization)
