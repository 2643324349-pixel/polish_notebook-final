"""Optional AI fallback for inflection and translation when Morfeusz / gloss miss."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

# Ensure project-root .env is loaded before reading config (import order safe).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

logger = logging.getLogger(__name__)

SUPPORTED_LANGS = ("zh-CN", "en", "de", "uk")


class AiFallbackUnavailable(Exception):
    pass


def _get_api_key() -> str:
    return (
        os.getenv("QWEN_SINGAPORE_API_KEY", "").strip()
        or os.getenv("INFLECTION_AI_API_KEY", "").strip()
    )


def _get_base_url() -> str:
    return (
        os.getenv("QWEN_SINGAPORE_BASE_URL", "").strip()
        or os.getenv("INFLECTION_AI_BASE_URL", "https://api.openai.com/v1").strip()
    )


def _get_model() -> str:
    return (
        os.getenv("QWEN_SINGAPORE_MODEL", "").strip()
        or os.getenv("INFLECTION_AI_MODEL", "qwen-flash").strip()
    )


def _ai_enabled() -> bool:
    return bool(_get_api_key())


def _normalize_lang(lang: str) -> str:
    if lang == "zh" or lang.startswith("zh-"):
        return "zh-CN"
    if lang in SUPPORTED_LANGS:
        return lang
    return "en"


def _parse_json_content(raw: str) -> Any:
    content = raw.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        if content.endswith("```"):
            content = content[:-3]
    return json.loads(content.strip())


def _extract_multilang(parsed: Any) -> dict[str, str]:
    if not isinstance(parsed, dict):
        return {}

    # Direct shape: {"zh-CN": "...", "en": "...", ...}
    result: dict[str, str] = {}
    for lang in SUPPORTED_LANGS:
        text = str(parsed.get(lang, "")).strip()
        if text:
            result[lang] = text
    if result:
        return result

    # Nested shape: {"translation": {"zh-CN": "...", ...}}
    nested = parsed.get("translation")
    if isinstance(nested, dict):
        for lang in SUPPORTED_LANGS:
            text = str(nested.get(lang, "")).strip()
            if text:
                result[lang] = text
        if result:
            return result

    # Alternate key spellings from some models.
    aliases = {
        "zh-CN": ("zh-CN", "zh_CN", "zh", "chinese", "zh-cn"),
        "en": ("en", "english"),
        "de": ("de", "german", "deutsch"),
        "uk": ("uk", "ukrainian", "ua"),
    }
    for lang, keys in aliases.items():
        for key in keys:
            text = str(parsed.get(key, "")).strip()
            if text:
                result[lang] = text
                break

    return result


async def _chat(prompt: str) -> str:
    if not _ai_enabled():
        raise AiFallbackUnavailable("AI API key not configured")

    base_url = _get_base_url()
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": _get_model(),
        "temperature": 0.1,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a Polish linguistics assistant. "
                    "Reply with valid JSON only, no markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text[:500]
        logger.error(
            "Qwen API HTTP %s: %s",
            exc.response.status_code,
            body,
        )
        raise AiFallbackUnavailable(
            f"Qwen API error {exc.response.status_code}"
        ) from exc
    except Exception as exc:
        logger.error("Qwen API request failed: %s", exc)
        raise AiFallbackUnavailable("Qwen API request failed") from exc

    return data["choices"][0]["message"]["content"].strip()


async def ai_translate_multilang(word: str, pos: str) -> dict[str, str]:
    """Translate a Polish word into zh-CN, en, de, and uk via Qwen."""
    prompt = (
        f'Translate the Polish {pos} "{word}" into four languages. '
        'Return JSON with exactly these keys: '
        '{"zh-CN": "...", "en": "...", "de": "...", "uk": "..."}'
    )
    try:
        raw = await _chat(prompt)
        parsed = _parse_json_content(raw)
        result = _extract_multilang(parsed)
        if not result:
            logger.warning(
                "Qwen returned no usable translations for %r: %s",
                word,
                raw[:300],
            )
        return result
    except AiFallbackUnavailable:
        raise
    except Exception as exc:
        logger.error("Failed to parse Qwen translation for %r: %s", word, exc)
        return {}


async def ai_translate(word: str, pos: str, lang: str = "zh-CN") -> str | None:
    translations = await ai_translate_multilang(word, pos)
    if not translations:
        return None

    normalized = _normalize_lang(lang)
    return (
        translations.get(normalized)
        or translations.get("en")
        or next(iter(translations.values()), None)
    )


async def ai_inflect(
    word: str,
    pos: str,
    case_types: list[str],
    has_gender: bool,
) -> dict[str, dict[str, str]]:
    gender_hint = (
        'Use keys "m", "f", "n" inside each case when gender applies.'
        if has_gender
        else 'Use key "default" inside each case.'
    )
    prompt = (
        f'Inflect the Polish {pos} "{word}" for these case types: {case_types}. '
        f"{gender_hint} "
        'Return JSON: {"forms": {"case_type": {"default": "..."} or {"m":"...","f":"...","n":"..."}}}'
    )
    try:
        raw = await _chat(prompt)
        parsed = _parse_json_content(raw)
        forms = parsed.get("forms", {})
        if isinstance(forms, dict):
            return forms
    except AiFallbackUnavailable:
        raise
    except Exception as exc:
        logger.error("Failed to parse Qwen inflection for %r: %s", word, exc)
    return {}
