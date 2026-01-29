from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_session
from app.models.document import Document, DocumentStatus
from app.models.document_version import DocumentVersion
from app.models.template import Template
from app.schemas.contracts import (
    ContractResponse,
    ExportResponse,
    GenerateContractRequest,
    RefineContractRequest,
)
from app.services.export import export_document
from app.services.generation import generate_contract_content, refine_contract_content
from app.services.subscription import ensure_can_generate

router = APIRouter()


@router.post(
    "/generate", response_model=ContractResponse, status_code=status.HTTP_201_CREATED
)
async def generate_contract(
    payload: GenerateContractRequest,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
) -> ContractResponse:
    await ensure_can_generate(current_user)

    template = None
    if payload.template_id:
        result = await session.execute(
            select(Template).where(Template.id == payload.template_id)
        )
        template = result.scalar_one_or_none()

    content, risk_report = await generate_contract_content(
        payload.prompt,
        template,
        format_mode=payload.format_mode,
        run_risk_check=payload.risk_check,
    )
    document = Document(
        title=payload.title,
        owner_id=current_user.id,
        template_id=payload.template_id,
        status=DocumentStatus.DRAFT,
    )
    session.add(document)
    await session.flush()

    version = DocumentVersion(document_id=document.id, version=1, content=content)
    session.add(version)

    await session.commit()
    await session.refresh(document)

    result = await session.execute(
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == document.id)
    )
    return ContractResponse(document=result.scalar_one(), risk_report=risk_report)


@router.post("/{document_id}/refine", response_model=ContractResponse)
async def refine_contract(
    document_id: str,
    payload: RefineContractRequest,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
) -> ContractResponse:
    result = await session.execute(
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    latest_version_number = (
        max((v.version for v in document.versions), default=0)
        if document.versions
        else 0
    )
    latest_content = document.versions[-1].content if document.versions else ""
    new_content, risk_report = await refine_contract_content(
        latest_content,
        payload.prompt,
        format_mode=payload.format_mode,
        run_risk_check=payload.risk_check,
    )

    new_version = DocumentVersion(
        document_id=document.id, version=latest_version_number + 1, content=new_content
    )
    session.add(new_version)
    await session.commit()

    result = await session.execute(
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == document.id)
    )
    return ContractResponse(document=result.scalar_one(), risk_report=risk_report)


@router.post("/{document_id}/export/{fmt}", response_model=ExportResponse)
async def export_contract(
    document_id: str,
    fmt: str,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
) -> ExportResponse:
    if fmt not in {"docx", "pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported format"
        )

    result = await session.execute(
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    latest_content = document.versions[-1].content if document.versions else ""
    return await export_document(document_id, latest_content, fmt)
