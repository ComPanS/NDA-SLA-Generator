from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.prompts import FormatMode
from app.schemas.document import DocumentRead


class GenerateContractRequest(BaseModel):
    title: str
    template_id: Optional[UUID] = None
    prompt: str
    format_mode: FormatMode = FormatMode.FLEX
    risk_check: bool = False


class RefineContractRequest(BaseModel):
    prompt: str
    format_mode: FormatMode = FormatMode.FLEX
    risk_check: bool = False


class ContractResponse(BaseModel):
    document: DocumentRead
    risk_report: Optional[list[str]] = None


class ExportResponse(BaseModel):
    document_id: UUID
    format: str
    message: str
    content_preview: str
