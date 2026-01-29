from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "NDA/SLA Generator"
    environment: str = Field(default="dev")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@postgres:5432/nda_sla",
        alias="DATABASE_URL",
    )

    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expires_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRES_MINUTES"
    )
    jwt_refresh_token_expires_days: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRES_DAYS"
    )

    yandex_gpt_folder_id: Optional[str] = Field(
        default=None, alias="YANDEX_GPT_FOLDER_ID"
    )
    yandex_gpt_api_key: Optional[str] = Field(default=None, alias="YANDEX_GPT_API_KEY")
    yandex_gpt_model: str = Field(default="general", alias="YANDEX_GPT_MODEL")
    yandex_gpt_endpoint: str = Field(
        default="https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        alias="YANDEX_GPT_ENDPOINT",
    )
    yandex_gpt_timeout: float = Field(default=30.0, alias="YANDEX_GPT_TIMEOUT")
    yandex_gpt_retries: int = Field(default=3, alias="YANDEX_GPT_RETRIES")

    cors_origins: List[AnyHttpUrl] | List[str] = Field(
        default=["*"], alias="CORS_ORIGINS"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
