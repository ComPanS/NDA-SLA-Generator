from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentBase(BaseModel):
    title: str
    template_id: Optional[UUID] = None
    status: DocumentStatus = DocumentStatus.DRAFT


class DocumentCreate(DocumentBase):
    content: str


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[DocumentStatus] = None
    content: Optional[str] = None


class DocumentVersionRead(BaseModel):
    id: UUID
    version: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentRead(DocumentBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    versions: list[DocumentVersionRead] = []

    class Config:
        from_attributes = True
