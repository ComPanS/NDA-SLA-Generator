from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin, uuid_pk
from app.core.db import Base


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped = uuid_pk()
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="owner"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="user"
    )
    templates: Mapped[list["Template"]] = relationship(
        "Template", back_populates="created_by_user"
    )
