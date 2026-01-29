from __future__ import annotations

from sqlalchemy import Boolean, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin, uuid_pk


class Template(TimestampMixin, Base):
    __tablename__ = "templates"

    id: Mapped = uuid_pk()
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(512))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped = mapped_column(ForeignKey("users.id"), nullable=True)

    created_by_user: Mapped["User"] = relationship("User", back_populates="templates")
