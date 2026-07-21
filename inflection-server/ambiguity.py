"""L1/L2/L3 ambiguity resolution for Morfeusz interpretations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

from gloss_dict import GLOSS_DICT
from paradigm_utils import display_lemma, paradigm_key
from tag_parser import map_pos, parse_tag

if TYPE_CHECKING:
    from morfeusz_service import Interpretation

ADJ_NOM_M = "adj:sg:nom.voc:m1.m2.m3:pos"

POS_LABELS: dict[str, dict[str, str]] = {
    "en": {
        "noun": "Noun",
        "verb": "Verb",
        "adjective": "Adjective",
        "pronoun": "Pronoun",
        "numeral": "Numeral",
        "adverb": "Adverb",
        "preposition": "Preposition",
        "conjunction": "Conjunction",
    },
    "zh-CN": {
        "noun": "名词",
        "verb": "动词",
        "adjective": "形容词",
        "pronoun": "代词",
        "numeral": "数词",
        "adverb": "副词",
        "preposition": "介词",
        "conjunction": "连词",
    },
    "de": {
        "noun": "Substantiv",
        "verb": "Verb",
        "adjective": "Adjektiv",
        "pronoun": "Pronomen",
        "numeral": "Numerale",
        "adverb": "Adverb",
        "preposition": "Präposition",
        "conjunction": "Konjunktion",
    },
    "uk": {
        "noun": "Іменник",
        "verb": "Дієслово",
        "adjective": "Прикметник",
        "pronoun": "Займенник",
        "numeral": "Числівник",
        "adverb": "Прислівник",
        "preposition": "Прийменник",
        "conjunction": "Сполучник",
    },
}

TAG_LABELS: dict[str, dict[str, str]] = {
    "en": {
        "inf": "Infinitive",
        "fin": "Conjugated",
        "impt": "Imperative",
        "subst": "Noun",
        "adj": "Adjective",
    },
    "zh-CN": {
        "inf": "不定式",
        "fin": "变位",
        "impt": "命令式",
        "subst": "名词",
        "adj": "形容词",
    },
    "de": {
        "inf": "Infinitiv",
        "fin": "Konjugiert",
        "impt": "Imperativ",
        "subst": "Substantiv",
        "adj": "Adjektiv",
    },
    "uk": {
        "inf": "Інфінітив",
        "fin": "Діє відмінювання",
        "impt": "Наказовий",
        "subst": "Іменник",
        "adj": "Прикметник",
    },
}


def _normalize_lang(lang: str) -> str:
    if lang == "zh" or lang.startswith("zh-"):
        return "zh-CN"
    if lang in POS_LABELS:
        return lang
    return "en"


def _pick_gloss_text(entry: dict[str, str] | None, lang: str) -> str | None:
    if not entry:
        return None
    normalized = _normalize_lang(lang)
    return entry.get(normalized) or entry.get("en") or entry.get("zh-CN") or None


@dataclass
class AnalyzeCandidate:
    id: str
    morf_lemma: str
    lemma: str
    pos: str
    tag: str
    label: str
    translations: list[str]
    score: float


@dataclass
class AmbiguityResolution:
    level: str  # none | L1 | L2 | L3
    needs_user_choice: bool
    primary: Optional["Interpretation"]
    pos: str
    translations: list[str]
    candidates: list[AnalyzeCandidate]
    same_pos_interps: list["Interpretation"]


# ========== 新增：直接从 GLOSS_DICT 读取翻译 ==========
def _get_gloss(word: str, lang: str = "en") -> str | None:
    """从 GLOSS_DICT 获取翻译（先精确键，再词根降级）。"""
    if not word:
        return None

    try:
        from gloss_dict import GLOSS_DICT
    except ImportError:
        return None

    entry = GLOSS_DICT.get(word)
    if not entry:
        if ":" in word:
            entry = GLOSS_DICT.get(word.split(":")[0])
    return _pick_gloss_text(entry, lang)


def _get_glosses_for_word(
    words: list[str],
    orth: str = "",
    lang: str = "en",
) -> list[str]:
    """从 GLOSS_DICT 获取多个 morf_lemma 的翻译（精确标签优先，去重）。"""
    result: list[str] = []
    seen_glosses: set[str] = set()

    for word in words:
        gloss = _get_gloss(word, lang)
        if gloss and gloss not in seen_glosses:
            seen_glosses.add(gloss)
            result.append(gloss)

    if result:
        return result

    if orth:
        gloss = _get_gloss(orth, lang)
        if gloss:
            return [gloss]

    return []


def _get_nominative_form(lemma: str, tag: str, morf) -> Optional[str]:
    generated = morf.generate(lemma) or []
    parsed = parse_tag(tag)
    category = parsed.category

    if category == "subst":
        for orth, _, gen_tag, _, _ in generated:
            if gen_tag.startswith("subst:sg:nom:"):
                return orth
        return None

    if category == "adj":
        for orth, _, gen_tag, _, _ in generated:
            if gen_tag == ADJ_NOM_M:
                return orth
        return None

    if category.startswith("ppron"):
        for orth, _, gen_tag, _, _ in generated:
            if (
                "ppron" in gen_tag
                and "sg:nom" in gen_tag
                and ":f:" not in gen_tag
                and ":n:" not in gen_tag
                and "m1" in gen_tag
            ):
                return orth
        return None

    if category == "inf":
        for orth, _, gen_tag, _, _ in generated:
            if gen_tag.startswith("inf:"):
                return orth
        return display_lemma(lemma)

    for orth, _, gen_tag, _, _ in generated:
        if "sg:nom" in gen_tag:
            return orth
    return None


def score_interpretation(orth: str, interp: "Interpretation", morf) -> float:
    score = 0.0
    parsed = parse_tag(interp.tag)
    category = parsed.category

    if category == "ign":
        return -1000.0

    if category == "inf":
        score += 25.0
    elif category == "adj":
        score += 10.0
    elif category.startswith("ppron"):
        score += 12.0
    elif category == "num":
        score += 9.0
    elif category == "subst":
        score += 5.0
    elif category in ("fin", "impt", "pcon", "pant", "bedzie", "ppas", "pact", "ger"):
        score += 8.0
    else:
        score += 1.0

    if display_lemma(interp.lemma).lower() == orth.lower():
        score += 8.0

    if "nazwa_pospolita" in interp.names:
        score += 4.0

    if parsed.number == "sg":
        score += 5.0
    elif parsed.number == "pl":
        score -= 2.0

    case_str = parsed.case or ""
    if "nom" in case_str:
        score += 5.0
    elif case_str and category not in ("inf", "impt", "fin"):
        nom_form = _get_nominative_form(interp.lemma, interp.tag, morf)
        if nom_form and nom_form.lower() != orth.lower():
            score += 6.0

    if any(q for q in interp.qualifiers if q in ("pot.", "szkol.", "daw.")):
        score -= 4.0

    return score


def _candidate_label(pos: str, interp: "Interpretation", lang: str = "en") -> str:
    normalized = _normalize_lang(lang)
    pos_label = POS_LABELS.get(normalized, POS_LABELS["en"]).get(pos, pos)
    category = parse_tag(interp.tag).category
    tag_label = TAG_LABELS.get(normalized, TAG_LABELS["en"]).get(category, category)
    lemma = display_lemma(interp.lemma)

    gloss = GLOSS_DICT.get(interp.lemma)
    if not gloss or not _pick_gloss_text(gloss, normalized):
        root = interp.lemma.split(":")[0] if ":" in interp.lemma else interp.lemma
        gloss = GLOSS_DICT.get(root) or gloss

    gloss_part = ""
    gloss_text = _pick_gloss_text(gloss, normalized)
    if gloss_text:
        gloss_part = f" · {gloss_text}"

    return f"{pos_label} · {lemma} ({tag_label}){gloss_part}"


def _candidate_id(interp: "Interpretation") -> str:
    return f"{interp.lemma}|{interp.tag}"


def _build_candidate(
    interp: "Interpretation",
    pos: str,
    lang: str,
) -> AnalyzeCandidate:
    glosses = _get_glosses_for_word([interp.lemma], display_lemma(interp.lemma), lang)
    return AnalyzeCandidate(
        id=_candidate_id(interp),
        morf_lemma=interp.lemma,
        lemma=display_lemma(interp.lemma),
        pos=pos,
        tag=interp.tag,
        label=_candidate_label(pos, interp, lang),
        translations=glosses,
        score=interp.score,
    )


def _group_by_pos(
    scored: list[tuple["Interpretation", float, str]],
) -> dict[str, list["Interpretation"]]:
    groups: dict[str, list["Interpretation"]] = {}
    for interp, _, pos in scored:
        groups.setdefault(pos, []).append(interp)
    for pos in groups:
        groups[pos].sort(key=lambda item: item.score, reverse=True)
    return groups


def _group_by_paradigm(
    interps: list["Interpretation"],
) -> dict[str, list["Interpretation"]]:
    groups: dict[str, list["Interpretation"]] = {}
    for interp in interps:
        key = paradigm_key(interp.lemma)
        groups.setdefault(key, []).append(interp)
    for key in groups:
        groups[key].sort(key=lambda item: item.score, reverse=True)
    return groups


def _pick_representatives(
    paradigm_groups: dict[str, list["Interpretation"]],
) -> list["Interpretation"]:
    reps: list["Interpretation"] = []
    for group in paradigm_groups.values():
        reps.append(group[0])
    reps.sort(key=lambda item: item.score, reverse=True)
    return reps


def resolve_ambiguity(
    orth: str,
    interps: list["Interpretation"],
    morf,
    lang: str = "zh-CN",
    selected_candidate_id: str | None = None,
) -> AmbiguityResolution:
    """Classify L1/L2/L3 and optionally apply a user-selected candidate."""
    scored: list[tuple["Interpretation", float, str]] = []
    for interp in interps:
        pos = map_pos(parse_tag(interp.tag).category)
        value = score_interpretation(orth, interp, morf)
        interp.score = value
        scored.append((interp, value, pos))

    scored.sort(key=lambda item: item[1], reverse=True)

    if selected_candidate_id is not None:
        for interp, _, pos in scored:
            if _candidate_id(interp) == selected_candidate_id:
                glosses = _get_glosses_for_word([interp.lemma], orth, lang)
                return AmbiguityResolution(
                    level="none",
                    needs_user_choice=False,
                    primary=interp,
                    pos=pos,
                    translations=glosses,
                    candidates=[],
                    same_pos_interps=[interp],
                )

    pos_groups = _group_by_pos(scored)
    pos_ranked = sorted(
        pos_groups.items(),
        key=lambda item: item[1][0].score,
        reverse=True,
    )

    best_pos, best_group = pos_ranked[0]
    best_score = best_group[0].score

    competitive_pos = [
        (pos, group)
        for pos, group in pos_ranked
        if group[0].score >= best_score - 3.0
    ]

    if len(competitive_pos) >= 2:
        candidates: list[AnalyzeCandidate] = []
        for pos, group in competitive_pos:
            reps = _pick_representatives(_group_by_paradigm(group))
            for rep in reps:
                candidates.append(_build_candidate(rep, pos, lang))
        return AmbiguityResolution(
            level="L3",
            needs_user_choice=True,
            primary=None,
            pos=best_pos,
            translations=[],
            candidates=candidates,
            same_pos_interps=[],
        )

    paradigm_groups = _group_by_paradigm(best_group)
    if len(paradigm_groups) >= 2:
        reps = _pick_representatives(paradigm_groups)
        candidates = [_build_candidate(rep, best_pos, lang) for rep in reps]
        return AmbiguityResolution(
            level="L2",
            needs_user_choice=True,
            primary=None,
            pos=best_pos,
            translations=[],
            candidates=candidates,
            same_pos_interps=[],
        )

    primary = best_group[0]
    morf_lemmas = list(dict.fromkeys(item.lemma for item in best_group))
    translations = _get_glosses_for_word(morf_lemmas, orth, lang)

    return AmbiguityResolution(
        level="L1",
        needs_user_choice=False,
        primary=primary,
        pos=best_pos,
        translations=translations,
        candidates=[],
        same_pos_interps=best_group,
    )


def select_l1(
    orth: str,
    interps: list["Interpretation"],
    morf,
    lang: str = "zh-CN",
) -> AmbiguityResolution:
    """Backward-compatible entry point used by older callers."""
    return resolve_ambiguity(orth, interps, morf, lang)