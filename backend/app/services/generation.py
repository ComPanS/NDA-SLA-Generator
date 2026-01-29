from __future__ import annotations

import re
from typing import Optional

from app.models.template import Template
from app.prompts import (
    FormatMode,
    RISK_CHECK_PROMPT,
    build_generation_prompt,
    build_refine_prompt,
)
from app.services.yandex_gpt_client import YandexGPTError, get_yandex_gpt_client


def _postprocess_markdown(text: str) -> str:
    # Collapse extra blank lines and normalize heading hashes
    text = re.sub(r"\n{3,}", "\n\n", text.strip())
    text = re.sub(
        r"^#+", lambda m: "#" * min(len(m.group(0)), 3), text, flags=re.MULTILINE
    )
    return text


def _parse_risk_report(text: str) -> list[str]:
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    return lines if lines else ["Нет существенных рисков"]


async def generate_contract_content(
    prompt: str,
    template: Optional[Template],
    format_mode: FormatMode = FormatMode.FLEX,
    run_risk_check: bool = False,
) -> tuple[str, Optional[list[str]]]:
    template_hint = template.content if template else None
    prompt_text = build_generation_prompt(prompt, format_mode, template_hint)
    client = get_yandex_gpt_client()
    content = _postprocess_markdown((await client.generate(prompt_text)).text)

    risk_report: Optional[list[str]] = None
    if run_risk_check:
        risk_prompt = f"{RISK_CHECK_PROMPT}\n\nТекст договора:\n{content}"
        risk_resp = await client.risk_check(risk_prompt)
        risk_report = _parse_risk_report(risk_resp.text)

    return content, risk_report


async def refine_contract_content(
    existing: str,
    prompt: str,
    format_mode: FormatMode = FormatMode.FLEX,
    run_risk_check: bool = False,
) -> tuple[str, Optional[list[str]]]:
    refine_prompt = build_refine_prompt(prompt, existing)
    client = get_yandex_gpt_client()
    content = _postprocess_markdown((await client.refine(refine_prompt)).text)

    risk_report: Optional[list[str]] = None
    if run_risk_check:
        risk_prompt = f"{RISK_CHECK_PROMPT}\n\nТекст договора:\n{content}"
        risk_resp = await client.risk_check(risk_prompt)
        risk_report = _parse_risk_report(risk_resp.text)

    return content, risk_report
