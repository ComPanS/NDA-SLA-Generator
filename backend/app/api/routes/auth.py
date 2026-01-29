from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_session
from app.core.security import create_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas import auth as auth_schema
from app.schemas.user import UserCreate, UserRead

router = APIRouter()


async def _issue_tokens(user_id: str) -> auth_schema.TokenPair:
    access_expires = timedelta(minutes=settings.jwt_access_token_expires_minutes)
    refresh_expires = timedelta(days=settings.jwt_refresh_token_expires_days)

    access_token = create_token(user_id, access_expires, token_type="access")
    refresh_token = create_token(user_id, refresh_expires, token_type="refresh")
    return auth_schema.TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/register",
    response_model=auth_schema.TokenPair,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: UserCreate, session: AsyncSession = Depends(get_session)
) -> auth_schema.TokenPair:
    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken"
        )

    user = User(
        email=payload.email, hashed_password=get_password_hash(payload.password)
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return await _issue_tokens(str(user.id))


@router.post("/login", response_model=auth_schema.TokenPair)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> auth_schema.TokenPair:
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials"
        )
    return await _issue_tokens(str(user.id))


@router.post("/refresh", response_model=auth_schema.TokenPair)
async def refresh(payload: auth_schema.RefreshRequest) -> auth_schema.TokenPair:
    from jose import JWTError

    try:
        from app.core.security import verify_token

        token_data = verify_token(payload.refresh_token, token_type="refresh")
    except (ValueError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject"
        )
    return await _issue_tokens(str(user_id))
