"""
Prompt templates for contract generation, refinement, and risk checks.
"""

from enum import Enum
from textwrap import dedent


class FormatMode(str, Enum):
    FLEX = "flex"
    SKELETON = "skeleton"


BASE_SYSTEM_PROMPT = dedent(
    """
    You are an assistant that drafts Russian-language legal agreements (NDA, SLA).
    Respond in Markdown with clear headings, numbered lists, and tables where appropriate.
    Be concise and avoid boilerplate explanations.
    """
).strip()


SKELETON_NDA = dedent(
    """
    # Договор NDA
    ## Стороны
    ## Предмет договора
    ## Определения
    ## Обязанности сторон
    ## Срок действия
    ## Исключения из конфиденциальности
    ## Ответственность
    ## Применимое право
    ## Подписи
    """
).strip()


SKELETON_SLA = dedent(
    """
    # Соглашение об уровне обслуживания (SLA)
    ## Стороны
    ## Описание услуги
    ## Уровни сервиса и KPI
    ## Обслуживание и поддержка
    ## Измерение и отчётность
    ## Инциденты и эскалации
    ## Ответственность и штрафы
    ## Изменения SLA
    ## Срок действия и прекращение
    ## Применимое право
    ## Подписи
    """
).strip()


RISK_CHECK_PROMPT = dedent(
    """
    Выполни юридический risk-check текста. Верни нумерованный список кратких замечаний в Markdown.
    Формат:
    1. Краткое описание риска
       - Статья/норма (если применимо)
       - Предложение по исправлению
    Если рисков нет, верни строку: \"Нет существенных рисков\".
    """
).strip()


def build_generation_prompt(
    user_prompt: str,
    format_mode: FormatMode,
    template_hint: str | None = None,
) -> str:
    skeleton = ""
    if format_mode == FormatMode.SKELETON:
        skeleton = f"\n\nИспользуй следующий каркас:\n{SKELETON_NDA}"

    tpl = f"\n\nШаблон:\n{template_hint}" if template_hint else ""
    return dedent(
        f"""
        {BASE_SYSTEM_PROMPT}

        Пользовательский запрос:
        {user_prompt}
        {tpl}
        {skeleton}
        """
    ).strip()


def build_refine_prompt(user_prompt: str, existing: str) -> str:
    return dedent(
        f"""
        {BASE_SYSTEM_PROMPT}

        До работ:
        {existing}

        Инструкции по улучшению:
        {user_prompt}
        """
    ).strip()
