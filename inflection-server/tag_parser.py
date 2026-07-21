"""Parse Morfeusz NKJP tags into structured grammemes and frontend POS."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ParsedTag:
    raw: str
    category: str
    number: Optional[str] = None
    case: Optional[str] = None
    gender: Optional[str] = None
    degree: Optional[str] = None


POS_MAP: dict[str, str] = {
    "subst": "noun",
    "adj": "adjective",
    "adv": "adverb",
    "ppron3": "pronoun",
    "ppron12": "pronoun",
    "siebie": "pronoun",
    "num": "numeral",
    "fin": "verb",
    "impt": "verb",
    "inf": "verb",
    "pcon": "verb",
    "pant": "verb",
    "bedzie": "verb",
    "ppas": "verb",
    "pact": "verb",
    "ger": "verb",
    "prep": "preposition",
    "conj": "conjunction",
    "qub": "conjunction",
    "interj": "conjunction",
}


def parse_tag(tag: str) -> ParsedTag:
    parts = tag.split(":")
    category = parts[0] if parts else ""

    number = next((p for p in parts if p in ("sg", "pl")), None)

    case = None
    for part in parts:
        if part in ("nom", "gen", "dat", "acc", "inst", "loc", "voc"):
            case = part
            break
        if "." in part and any(
            c in part.split(".") for c in ("nom", "gen", "dat", "acc", "inst", "loc", "voc")
        ):
            case = part
            break

    gender = None
    for part in parts:
        if part in ("m1", "m2", "m3", "f", "n", "m1.m2.m3", "m1.m2", "m1.m2.m3.f.n"):
            gender = part
            break
        if any(g in part for g in ("m1", "m2", "m3", "f", "n")) and "ppron" not in part:
            gender = part
            break

    degree = next((p for p in parts if p in ("pos", "com", "sup")), None)

    return ParsedTag(
        raw=tag,
        category=category,
        number=number,
        case=case,
        gender=gender,
        degree=degree,
    )


def map_pos(category: str) -> str:
    return POS_MAP.get(category, "noun")


def get_pos_group(category: str) -> str:
    """Normalized POS group key for L1 ambiguity clustering."""
    return map_pos(category)


def extract_grammemes(tag: str) -> dict:
    parsed = parse_tag(tag)
    grammemes: dict = {}

    if parsed.gender:
        genders = []
        for token in parsed.gender.replace(".", " ").split():
            if token in ("m1", "m2", "m3"):
                genders.append("m")
            elif token == "f":
                genders.append("f")
            elif token == "n":
                genders.append("n")
        if genders:
            grammemes["gender"] = list(dict.fromkeys(genders))

    if parsed.number:
        grammemes["number"] = parsed.number

    if parsed.case:
        case = parsed.case.split(".")[0]
        if case in ("nom", "gen", "dat", "acc", "inst", "loc", "voc"):
            grammemes["case"] = case

    return grammemes


def is_gendered_pos(category: str, tag: str) -> bool:
    if category == "adj":
        return True
    if category.startswith("ppron"):
        return True
    if category == "num":
        return True
    return False
