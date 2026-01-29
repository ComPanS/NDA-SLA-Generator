from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    content: str
    is_active: bool = True


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateRead(TemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
