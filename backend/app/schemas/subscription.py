from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.subscription import SubscriptionPlan, SubscriptionStatus


class SubscriptionBase(BaseModel):
    plan: SubscriptionPlan = SubscriptionPlan.FREE
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    expires_at: Optional[datetime] = None


class SubscriptionCreate(SubscriptionBase):
    user_id: UUID


class SubscriptionRead(SubscriptionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
