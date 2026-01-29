from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


class YandexGPTError(Exception):
    pass


@dataclass
class YandexGPTResponse:
    text: str
    model: str


class YandexGPTClient:
    def __init__(
        self,
        api_key: str | None = None,
        folder_id: str | None = None,
        endpoint: str | None = None,
        timeout: float | None = None,
        retries: int | None = None,
    ) -> None:
        self.api_key = api_key or settings.yandex_gpt_api_key
        self.folder_id = folder_id or settings.yandex_gpt_folder_id
        self.endpoint = endpoint or settings.yandex_gpt_endpoint
        self.timeout = timeout or settings.yandex_gpt_timeout
        self.retries = retries or settings.yandex_gpt_retries
        self.model = settings.yandex_gpt_model

        if not self.api_key or not self.folder_id:
            raise YandexGPTError(
                "YANDEX_GPT_API_KEY and YANDEX_GPT_FOLDER_ID are required"
            )

    async def _post(self, payload: dict[str, Any]) -> YandexGPTResponse:
        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "x-folder-id": self.folder_id,
            "Content-Type": "application/json",
        }

        backoff = 0.5
        last_error: Exception | None = None

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(1, self.retries + 1):
                try:
                    resp = await client.post(
                        self.endpoint, json=payload, headers=headers
                    )
                    if resp.status_code in {429, 500, 502, 503}:
                        raise YandexGPTError(
                            f"Upstream error {resp.status_code}: {resp.text}"
                        )
                    resp.raise_for_status()
                    data = resp.json()
                    text = (
                        data.get("result", {})
                        .get("alternatives", [{}])[0]
                        .get("text", "")
                    )
                    if not text:
                        raise YandexGPTError("Empty response from YandexGPT")
                    return YandexGPTResponse(text=text, model=self.model)
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    if attempt >= self.retries:
                        break
                    await asyncio.sleep(backoff)
                    backoff *= 2

        raise YandexGPTError(
            str(last_error) if last_error else "Unknown YandexGPT error"
        )

    async def generate(self, prompt: str) -> YandexGPTResponse:
        payload = {
            "modelUri": f"gpt://{self.folder_id}/{self.model}",
            "completionOptions": {
                "stream": False,
                "temperature": 0.2,
                "maxTokens": 1500,
            },
            "messages": [{"role": "system", "text": prompt}],
        }
        return await self._post(payload)

    async def refine(self, prompt: str) -> YandexGPTResponse:
        return await self.generate(prompt)

    async def risk_check(self, prompt: str) -> YandexGPTResponse:
        payload = {
            "modelUri": f"gpt://{self.folder_id}/{self.model}",
            "completionOptions": {
                "stream": False,
                "temperature": 0.1,
                "maxTokens": 800,
            },
            "messages": [{"role": "system", "text": prompt}],
        }
        return await self._post(payload)


def get_yandex_gpt_client() -> YandexGPTClient:
    return YandexGPTClient()
