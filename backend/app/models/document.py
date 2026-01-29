from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin, uuid_pk


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    FINAL = "final"


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped = mapped_column(ForeignKey("users.id"), nullable=False)
    template_id: Mapped | None = mapped_column(
        ForeignKey("templates.id"), nullable=True
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status"),
        default=DocumentStatus.DRAFT,
        nullable=False,
    )

    owner: Mapped["User"] = relationship("User", back_populates="documents")
    template: Mapped["Template"] = relationship("Template")
    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion", back_populates="document", cascade="all, delete-orphan"
    )
