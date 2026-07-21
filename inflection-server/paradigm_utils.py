"""Paradigm key extraction for L1/L2 ambiguity grouping."""

from __future__ import annotations


def display_lemma(morf_lemma: str) -> str:
    return morf_lemma.split(":")[0]


def paradigm_key(morf_lemma: str) -> str:
    """Normalize Morfeusz lemma id so homographs share a family (e.g. Sm3~a / Sm3~u)."""
    if ":" not in morf_lemma:
        return morf_lemma.lower()

    stem, suffix = morf_lemma.split(":", 1)
    normalized = suffix
    if "~" in suffix:
        normalized = suffix.split("~", 1)[0]

    return f"{stem.lower()}:{normalized.lower()}"
