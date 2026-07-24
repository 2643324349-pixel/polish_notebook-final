"""Morfeusz analysis and inflection generation for the REST API."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import morfeusz2

from ambiguity import resolve_ambiguity
from case_mapping import (
    INFLECTION_CASE_SPECS,
    VERB_CASE_SPECS,
    filter_positive_candidates,
    pick_gender_form,
    tag_matches_inflection_case,
    tag_matches_verb_case,
)
from tag_parser import extract_grammemes, is_gendered_pos, map_pos, parse_tag

morf = morfeusz2.Morfeusz()

ADJ_NOM_M = "adj:sg:nom.voc:m1.m2.m3:pos"
ADJ_NOM_F = "adj:sg:nom.voc:f:pos"
ADJ_NOM_N = "adj:sg:nom.voc:n:pos"

PPRON_NOM_M = "ppron3:sg:nom:m1.m2.m3:ter:akc.nakc:praep.npraep"
PPRON_NOM_F = "ppron3:sg:nom:f:ter:akc.nakc:praep.npraep"
PPRON_NOM_N = "ppron3:sg:nom:n:ter:akc.nakc:praep.npraep"


# ========== 翻译查找（支持降级匹配） ==========



def get_all_translations_from_gloss(tagged_word: str) -> Optional[dict[str, str]]:
    """
    获取所有语言的翻译，支持降级匹配：
    1. 精确匹配（如 "zamek:Sm3~u" 或 "zamek"）
    2. 如果找不到，提取词根再匹配
    """
    try:
        from gloss_dict import GLOSS_DICT
    except ImportError:
        return None

    # 1. 直接匹配（无论是否带标签）
    result = GLOSS_DICT.get(tagged_word)
    if result:
        return result

    # 2. 提取词根再匹配
    if ":" in tagged_word:
        root = tagged_word.split(":")[0]
        result = GLOSS_DICT.get(root)
        if result:
            return result

    return None


def get_gloss_text_for_lang(tagged_word: str, lang: str = "en") -> str | None:
    """Return a single gloss string for the requested UI language."""
    all_trans = get_all_translations_from_gloss(tagged_word)
    if not all_trans:
        return None

    normalized = lang
    if lang == "zh" or lang.startswith("zh-"):
        normalized = "zh-CN"
    elif lang not in ("en", "de", "uk", "zh-CN"):
        normalized = "en"

    return all_trans.get(normalized) or all_trans.get("en") or all_trans.get("zh-CN") or None


class WordNotFoundError(Exception):
    pass


@dataclass
class Interpretation:
    orth: str
    lemma: str
    tag: str
    names: list[str]
    qualifiers: list[str]
    score: float = 0.0


def _interp_from_tuple(item: tuple) -> Interpretation:
    _, _, data = item
    orth, lemma, tag, names, qualifiers = data
    return Interpretation(
        orth=orth,
        lemma=lemma,
        tag=tag,
        names=list(names or []),
        qualifiers=list(qualifiers or []),
    )


def _display_lemma(lemma: str) -> str:
    return lemma.split(":")[0]


def _get_infinitive_form(lemma: str) -> Optional[str]:
    generated = morf.generate(lemma) or []
    for orth, _, gen_tag, _, _ in generated:
        if gen_tag.startswith("inf:"):
            return orth
    return _display_lemma(lemma)


def _get_nominative_form(lemma: str, tag: str) -> Optional[str]:
    parsed = parse_tag(tag)
    category = parsed.category

    if category in ("fin", "impt", "inf", "pcon", "pant", "bedzie", "ppas", "pact", "ger"):
        return _get_infinitive_form(lemma)

    generated = morf.generate(lemma) or []
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
            if "ppron" in gen_tag and "sg:nom" in gen_tag and ":f:" not in gen_tag and ":n:" not in gen_tag:
                if "m1" in gen_tag:
                    return orth
        return None

    for orth, _, gen_tag, _, _ in generated:
        if "sg:nom" in gen_tag:
            return orth
    return None


def _extract_gender_inflection(lemma: str, tag: str) -> dict[str, str]:
    generated = morf.generate(lemma) or []
    forms: dict[str, str] = {}
    parsed = parse_tag(tag)
    category = parsed.category

    for orth, _, gen_tag, _, _ in generated:
        if category in ("adj", "num"):
            if ":com" in gen_tag or ":sup" in gen_tag:
                continue
            if gen_tag == ADJ_NOM_M:
                forms["m"] = orth
            elif gen_tag == ADJ_NOM_F:
                forms["f"] = orth
            elif gen_tag == ADJ_NOM_N:
                forms["n"] = orth
        elif category.startswith("ppron"):
            if gen_tag == PPRON_NOM_M:
                forms["m"] = orth
            elif gen_tag == PPRON_NOM_F:
                forms["f"] = orth
            elif gen_tag == PPRON_NOM_N:
                forms["n"] = orth

    return forms


def _is_valid_numeral_tag(gen_tag: str) -> bool:
    if not gen_tag.startswith("num:"):
        return False
    if ":com" in gen_tag or ":sup" in gen_tag:
        return False
    if gen_tag.endswith("numcomp"):
        return False
    return True


def _extract_numeral_inflection(lemma: str) -> tuple[dict[str, str], bool]:
    from case_mapping import (
        _tag_case_tokens,
        _tag_gender_bucket,
        _numeral_tag_priority,
    )

    generated = morf.generate(lemma) or []
    candidates: dict[str, list[tuple[str, str, int]]] = {
        "m": [],
        "f": [],
        "n": [],
    }

    for orth, _, gen_tag, _, _ in generated:
        if not _is_valid_numeral_tag(gen_tag):
            continue
        if "nom" not in _tag_case_tokens(gen_tag):
            continue
        bucket = _tag_gender_bucket(gen_tag)
        if not bucket:
            continue
        candidates[bucket].append((orth, gen_tag, _numeral_tag_priority(gen_tag)))

    forms: dict[str, str] = {}
    for gender, items in candidates.items():
        if not items:
            continue
        items.sort(key=lambda item: item[2])
        forms[gender] = items[0][0]

    if "m" in forms and "n" not in forms:
        forms["n"] = forms["m"]

    has_gender = bool(forms) and ("f" in forms or len(forms) >= 2)
    return forms, has_gender


def _build_inflection(interp: Interpretation) -> tuple[dict[str, str], bool]:
    parsed = parse_tag(interp.tag)
    category = parsed.category

    if category in ("fin", "impt", "inf", "pcon", "pant", "bedzie", "ppas", "pact", "ger"):
        inf = _get_infinitive_form(interp.lemma)
        return {"default": inf}, False

    if category == "num":
        forms, has_g = _extract_numeral_inflection(interp.lemma)
        if has_g:
            return forms, True

    if is_gendered_pos(category, interp.tag):
        forms = _extract_gender_inflection(interp.lemma, interp.tag)
        if len(forms) >= 2:
            return forms, True

    nom = _get_nominative_form(interp.lemma, interp.tag) or _display_lemma(interp.lemma)
    return {"default": nom}, False


def _confidence(best: Interpretation, group_size: int) -> str:
    if best.score >= 10:
        return "high"
    if group_size == 1:
        return "medium"
    return "low"


def analyze_word(
    word: str,
    lang: str = "en",
    selected_candidate_id: Optional[str] = None,
) -> dict[str, Any]:
    normalized = word.strip()
    if not normalized:
        raise WordNotFoundError("empty word")

    raw = morf.analyse(normalized)
    if not raw:
        raise WordNotFoundError("no analyses")

    interps = [_interp_from_tuple(item) for item in raw]
    interps = [item for item in interps if parse_tag(item.tag).category != "ign"]
    if not interps:
        raise WordNotFoundError("no valid analyses")

    resolution = resolve_ambiguity(
        normalized,
        interps,
        morf,
        lang,
        selected_candidate_id=selected_candidate_id,
    )

    candidates_payload = [
        {
            "id": item.id,
            "morf_lemma": item.morf_lemma,
            "lemma": item.lemma,
            "pos": item.pos,
            "tag": item.tag,
            "label": item.label,
            "translations": item.translations,
        }
        for item in resolution.candidates
    ]

    if resolution.needs_user_choice:
        return {
            "lemma": "",
            "morf_lemma": "",
            "pos": resolution.pos,
            "grammemes": {},
            "inflection": {},
            "has_gender": False,
            "translations": [],
            "confidence": "low",
            "ambiguity_level": resolution.level,
            "needs_user_choice": True,
            "candidates": candidates_payload,
        }

    best = resolution.primary
    if not best:
        raise WordNotFoundError("no primary interpretation")

    grammemes = extract_grammemes(best.tag)
    inflection, has_gender = _build_inflection(best)

    if not inflection or not any(inflection.values()):
        raise WordNotFoundError("could not build inflection")

    # 获取翻译（使用降级匹配）
    translations = resolution.translations
    if not translations:
        gloss_text = get_gloss_text_for_lang(best.lemma, lang)
        if gloss_text:
            translations = [gloss_text]

    return {
        "lemma": _display_lemma(best.lemma),
        "morf_lemma": best.lemma,
        "pos": resolution.pos,
        "grammemes": grammemes,
        "inflection": inflection,
        "has_gender": has_gender,
        "translations": translations,
        "confidence": _confidence(best, len(resolution.same_pos_interps)),
        "ambiguity_level": resolution.level,
        "needs_user_choice": False,
        "candidates": candidates_payload,
    }


def _pick_inflection_form(
    generated: list,
    number: str,
    case: str,
    has_gender: bool,
    pos: str | None = None,
) -> dict[str, str]:
    numbers_to_try = [number]
    if pos == "numeral" and number == "sg":
        numbers_to_try.append("pl")

    for try_number in numbers_to_try:
        candidates: list[tuple[str, str]] = []
        for orth, _, gen_tag, _, _ in generated:
            if pos == "numeral" and not _is_valid_numeral_tag(gen_tag):
                continue
            if tag_matches_inflection_case(gen_tag, try_number, case):
                candidates.append((orth, gen_tag))

        if not candidates:
            continue

        candidates = filter_positive_candidates(candidates)

        if has_gender:
            forms: dict[str, str] = {}
            for gender in ("m", "f", "n"):
                picked = pick_gender_form(candidates, gender, case)
                if picked:
                    forms[gender] = picked
            if forms:
                if forms.get("m") and not forms.get("n"):
                    forms["n"] = forms["m"]
                return forms

        for orth, tag in candidates:
            if ":m1" in tag or tag.endswith(":m1"):
                return {"default": orth}
        return {"default": candidates[0][0]}

    return {}


def _pick_verb_form(
    generated: list,
    case_type: str,
    use_gender: bool,
) -> dict[str, str]:
    spec = VERB_CASE_SPECS.get(case_type)
    if not spec:
        return {}

    candidates: list[tuple[str, str]] = []
    for orth, _, gen_tag, _, _ in generated:
        if tag_matches_verb_case(gen_tag, spec):
            candidates.append((orth, gen_tag))

    if not candidates:
        return {}

    if spec.get("gendered") and use_gender:
        forms: dict[str, str] = {}
        for gender in ("m", "f", "n"):
            picked = pick_gender_form(candidates, gender)
            if picked:
                forms[gender] = picked
        return forms

    return {"default": candidates[0][0]}


def generate_forms(
    morf_lemma: str,
    pos: str,
    has_gender: bool,
    case_types: list[str],
    lang: str = "en",
) -> dict[str, dict[str, str]]:
    generated = morf.generate(morf_lemma) or []
    forms: dict[str, dict[str, str]] = {}
    is_verb = pos == "verb"

    for case_type in case_types:
        if case_type == "translation":
            gloss_text = get_gloss_text_for_lang(morf_lemma, lang)
            if gloss_text:
                forms["translation"] = {"default": gloss_text}
            continue

        if case_type == "nominative_singular" and is_verb:
            picked = _pick_verb_form(generated, "verb_infinitive", False)
            if picked:
                forms[case_type] = picked
            continue

        if case_type in INFLECTION_CASE_SPECS:
            if is_verb:
                continue
            number, case = INFLECTION_CASE_SPECS[case_type]
            picked = _pick_inflection_form(
                generated,
                number,
                case,
                has_gender,
                pos,
            )
            if picked:
                forms[case_type] = picked
            continue

        if case_type in VERB_CASE_SPECS:
            if not is_verb:
                continue
            spec = VERB_CASE_SPECS[case_type]
            use_gender = bool(spec.get("gendered"))
            picked = _pick_verb_form(generated, case_type, use_gender)
            if picked:
                forms[case_type] = picked

    return forms


def _form_has_value(form: dict[str, str] | None) -> bool:
    if not form:
        return False
    return bool(form.get("default") or form.get("m") or form.get("f") or form.get("n"))


async def generate_forms_with_ai_fallback(
    morf_lemma: str,
    pos: str,
    has_gender: bool,
    case_types: list[str],
    lang: str = "en",
) -> tuple[dict[str, dict[str, str]], list[str]]:
    """
    Generate inflection forms via Morfeusz/gloss, then fill gaps with Qwen AI.
    Returns (forms, ai_generated_cases).
    """
    from ai_fallback import AiFallbackUnavailable, ai_inflect, ai_translate_multilang

    forms = generate_forms(morf_lemma, pos, has_gender, case_types, lang)
    ai_generated_cases: list[str] = []
    word = morf_lemma.split(":")[0]

    normalized_lang = lang
    if lang == "zh" or lang.startswith("zh-"):
        normalized_lang = "zh-CN"
    elif lang not in ("en", "de", "uk", "zh-CN"):
        normalized_lang = "en"

    if "translation" in case_types and not _form_has_value(forms.get("translation")):
        try:
            multilang = await ai_translate_multilang(word, pos)
            if multilang:
                text = (
                    multilang.get(normalized_lang)
                    or multilang.get("en")
                    or next(iter(multilang.values()), None)
                )
                if text:
                    forms["translation"] = {"default": text}
                    ai_generated_cases.append("translation")
        except AiFallbackUnavailable:
            pass

    missing_inflection = [
        case_type
        for case_type in case_types
        if case_type != "translation" and not _form_has_value(forms.get(case_type))
    ]

    if missing_inflection:
        try:
            ai_forms = await ai_inflect(word, pos, missing_inflection, has_gender)
            for case_type in missing_inflection:
                ai_form = ai_forms.get(case_type)
                if _form_has_value(ai_form):
                    forms[case_type] = ai_form
                    ai_generated_cases.append(case_type)
        except AiFallbackUnavailable:
            pass

    return forms, ai_generated_cases