from fastapi import HTTPException, status

from app.models.subscription import SubscriptionStatus
from app.models.user import User


async def ensure_can_generate(user: User) -> None:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )
    # Stub: extend with limits and subscription checks
    return None
