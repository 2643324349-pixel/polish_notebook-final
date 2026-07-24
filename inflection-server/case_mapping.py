"""Map frontend case_type values to Morfeusz tag filters."""

from __future__ import annotations

INFLECTION_CASE_SPECS: dict[str, tuple[str, str]] = {
    "nominative_singular": ("sg", "nom"),
    "genitive_singular": ("sg", "gen"),
    "dative_singular": ("sg", "dat"),
    "accusative_singular": ("sg", "acc"),
    "instrumental_singular": ("sg", "inst"),
    "locative_singular": ("sg", "loc"),
    "vocative_singular": ("sg", "voc"),
    "nominative_plural": ("pl", "nom"),
    "genitive_plural": ("pl", "gen"),
    "dative_plural": ("pl", "dat"),
    "accusative_plural": ("pl", "acc"),
    "instrumental_plural": ("pl", "inst"),
    "locative_plural": ("pl", "loc"),
    "vocative_plural": ("pl", "voc"),
}

VERB_CASE_SPECS: dict[str, dict[str, object]] = {
    "verb_infinitive": {"kind": "inf"},
    "verb_present_1sg": {"kind": "fin", "number": "sg", "person": "pri"},
    "verb_present_2sg": {"kind": "fin", "number": "sg", "person": "sec"},
    "verb_present_3sg": {"kind": "fin", "number": "sg", "person": "ter"},
    "verb_present_1pl": {"kind": "fin", "number": "pl", "person": "pri"},
    "verb_present_2pl": {"kind": "fin", "number": "pl", "person": "sec"},
    "verb_present_3pl": {"kind": "fin", "number": "pl", "person": "ter"},
    "verb_past_1sg": {"kind": "praet", "number": "sg", "gendered": True},
    "verb_past_2sg": {"kind": "praet", "number": "sg", "gendered": True},
    "verb_past_3sg": {"kind": "praet", "number": "sg", "gendered": True},
    "verb_past_1pl": {"kind": "praet", "number": "pl", "gendered": True},
    "verb_past_2pl": {"kind": "praet", "number": "pl", "gendered": True},
    "verb_past_3pl": {"kind": "praet", "number": "pl", "gendered": True},
}


def _tag_number(tag: str) -> str | None:
    parts = tag.split(":")
    if "sg" in parts:
        return "sg"
    if "pl" in parts:
        return "pl"
    return None


def _tag_case_tokens(tag: str) -> list[str]:
    tokens: list[str] = []
    for part in tag.split(":"):
        if part in ("nom", "gen", "dat", "acc", "inst", "loc", "voc"):
            tokens.append(part)
        elif "." in part:
            tokens.extend(p for p in part.split(".") if p in ("nom", "gen", "dat", "acc", "inst", "loc", "voc"))
    return tokens


def tag_matches_inflection_case(tag: str, number: str, case: str) -> bool:
    if _tag_number(tag) != number:
        return False

    tokens = _tag_case_tokens(tag)
    if not tokens:
        return False

    if case == "acc":
        return "acc" in tokens or "gen.acc" in ":".join(tag.split(":"))
    if case == "gen":
        return "gen" in tokens
    if case == "nom":
        return "nom" in tokens
    if case == "dat":
        return "dat" in tokens
    if case == "inst":
        return "inst" in tokens
    if case == "loc":
        return "loc" in tokens
    if case == "voc":
        return "voc" in tokens
    return False


def _tag_gender_bucket(tag: str) -> str | None:
    for part in tag.split(":"):
        if part in ("f", "n"):
            return part
        if "m1" in part or "m2" in part or "m3" in part:
            return "m"
    return None


def _tag_covers_gender(tag: str, gender: str) -> bool:
    for part in tag.split(":"):
        tokens = part.split(".") if "." in part else [part]
        if gender == "m" and any(token in ("m1", "m2", "m3") for token in tokens):
            return True
        if gender == "f" and "f" in tokens:
            return True
        if gender == "n" and "n" in tokens:
            return True
    return False


def _case_specificity(tag: str, case: str) -> int:
    tokens = _tag_case_tokens(tag)
    if case not in tokens:
        return 999
    return len(tokens)


def tag_matches_verb_case(tag: str, spec: dict[str, object]) -> bool:
    kind = spec.get("kind")
    if kind == "inf":
        return tag.startswith("inf:")

    if kind == "fin":
        if not tag.startswith("fin:"):
            return False
        number = spec.get("number")
        person = spec.get("person")
        parts = tag.split(":")
        return (number in parts) and (person in parts)

    if kind == "praet":
        if not tag.startswith("praet:"):
            return False
        number = spec.get("number")
        return number in tag.split(":")

    return False


def _numeral_tag_priority(tag: str) -> int:
    if ":rec:" in tag or tag.endswith(":rec"):
        return 3
    if ":col" in tag and ":ncol" not in tag:
        return 2
    if ":m1:" in tag and "m2" not in tag and "m3" not in tag:
        return 1
    return 0


def pick_gender_form(
    candidates: list[tuple[str, str]],
    gender: str,
    case: str | None = None,
) -> str | None:
    def rank(item: tuple[str, str]) -> tuple[int, int]:
        _orth, tag = item
        specificity = _case_specificity(tag, case) if case else 0
        return (_numeral_tag_priority(tag), specificity)

    ranked = sorted(candidates, key=rank)
    for orth, tag in ranked:
        if _tag_covers_gender(tag, gender):
            return orth
    return None


def is_positive_degree_tag(tag: str) -> bool:
    """Exclude comparative/superlative; adjectives must be positive (:pos)."""
    if ":com" in tag or ":sup" in tag:
        return False
    if tag.startswith("adj:"):
        return ":pos" in tag
    return True


def filter_positive_candidates(
    candidates: list[tuple[str, str]],
) -> list[tuple[str, str]]:
    positive = [(orth, tag) for orth, tag in candidates if is_positive_degree_tag(tag)]
    return positive if positive else candidates
