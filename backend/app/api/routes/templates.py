from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_session, require_admin
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateRead, TemplateUpdate

router = APIRouter()


@router.get("/", response_model=list[TemplateRead])
async def list_templates(
    session: AsyncSession = Depends(get_session),
    _user=Depends(get_current_user),
) -> list[Template]:
    result = await session.execute(select(Template).where(Template.is_active.is_(True)))
    return result.scalars().all()


@router.post("/", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate,
    session: AsyncSession = Depends(get_session),
    admin=Depends(require_admin),
) -> Template:
    template = Template(**payload.dict(), created_by=admin.id)
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template


@router.get("/{template_id}", response_model=TemplateRead)
async def get_template(
    template_id: str,
    session: AsyncSession = Depends(get_session),
    _user=Depends(get_current_user),
) -> Template:
    result = await session.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )
    return template


@router.put("/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: str,
    payload: TemplateUpdate,
    session: AsyncSession = Depends(get_session),
    admin=Depends(require_admin),
) -> Template:
    result = await session.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(template, field, value)

    await session.commit()
    await session.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    session: AsyncSession = Depends(get_session),
    admin=Depends(require_admin),
) -> None:
    result = await session.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    await session.delete(template)
    await session.commit()
