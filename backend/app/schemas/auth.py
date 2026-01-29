from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str


class RefreshRequest(BaseModel):
    refresh_token: str
