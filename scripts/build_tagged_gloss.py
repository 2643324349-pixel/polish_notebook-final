#!/usr/bin/env python3
"""
从词表文件读取词根，生成带 Morfeusz 精简标签的多语言 gloss_dict。

每个词根生成：
  1. 词根键（如 "kot"）→ 兜底匹配
  2. 精简标签键（如 "kot:Sm1"）→ 精确匹配（同形异义如 zamek:Sm3~a / zamek:Sm3~u）

诊断说明（get_short_tags 旧版失败原因）：
  morfeusz2.Morfeusz 没有 get_tagset() 方法（AttributeError），
  且 NKJP 完整标签（subst:sg:nom:m1）与精简标签（Sm1）之间不存在 tagset 映射表。
  精简标签已直接出现在 analyse() 结果的 lemma 字段，例如：
    ('kot', 'kot:Sm1', 'subst:sg:nom:m1', ...)
  因此应从 lemma 提取 "词根:标签" 而非调用 get_tagset()。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import morfeusz2
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DASHSCOPE_API_KEY")
BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

LANGUAGES = ("zh-CN", "en", "de", "uk")
LANG_NAMES = {
    "zh-CN": "简体中文",
    "en": "English",
    "de": "Deutsch",
    "uk": "українська",
}

# 复用单个 Morfeusz 实例
_MORF: morfeusz2.Morfeusz | None = None


def get_morfeusz() -> morfeusz2.Morfeusz:
    global _MORF
    if _MORF is None:
        _MORF = morfeusz2.Morfeusz()
    return _MORF


def load_words(file_path: Path) -> list[str]:
    if not file_path.exists():
        print(f"❌ 词表文件不存在: {file_path}")
        return []
    with open(file_path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def extract_tagged_lemmas(word: str) -> list[str]:
    """
    从 Morfeusz analyse() 提取带精简标签的 lemma ID（如 kot:Sm1、zamek:Sm3~a）。

    规则：
      - lemma 含 ':' 且 ':' 前词干与输入词根相同（忽略大小写）
      - 忽略 ign 类标签
      - 去重并保持稳定排序
    """
    morf = get_morfeusz()
    word_lower = word.lower()
    seen: set[str] = set()
    tagged: list[str] = []

    for item in morf.analyse(word):
        _, _, data = item
        _orth, lemma, tag, _names, _quals = data
        if not lemma or ":" not in lemma:
            continue
        if tag.startswith("ign"):
            continue
        stem, _short = lemma.split(":", 1)
        if stem.lower() != word_lower:
            continue
        if lemma not in seen:
            seen.add(lemma)
            tagged.append(lemma)

    tagged.sort()
    return tagged


def empty_translations() -> dict[str, str]:
    return {code: "" for code in LANGUAGES}


def parse_json_translations(text: str) -> dict[str, str]:
    """从 AI 回复中解析 JSON 翻译对象。"""
    result = empty_translations()
    text = text.strip()
    # 去掉 markdown 代码块
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 尝试提取第一个 {...}
        match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
        if not match:
            return result
        try:
            data = json.loads(match.group())
        except json.JSONDecodeError:
            return result

    if not isinstance(data, dict):
        return result

    for code in LANGUAGES:
        val = data.get(code, "")
        if val is not None:
            result[code] = str(val).strip()
    return result


def call_qwen(prompt: str, *, dry_run: bool = False) -> dict[str, str]:
    if dry_run:
        return empty_translations()

    if not API_KEY:
        print("❌ 未设置 DASHSCOPE_API_KEY")
        sys.exit(1)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": "qwen-plus",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.1,
    }

    try:
        resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=60)
        if resp.status_code != 200:
            print(f"⚠️ API HTTP {resp.status_code}: {resp.text[:200]}")
            return empty_translations()
        content = resp.json()["choices"][0]["message"]["content"]
        return parse_json_translations(content)
    except Exception as exc:
        print(f"⚠️ API 异常: {exc}")
        return empty_translations()


def translate_root(word: str, *, dry_run: bool = False) -> dict[str, str]:
    """为词根生成 4 语言翻译（最常见含义）。"""
    if dry_run:
        return {code: f"[{code}:{word}]" for code in LANGUAGES}

    lang_list = ", ".join(f'"{c}": {LANG_NAMES[c]}' for c in LANGUAGES)
    prompt = (
        f'你是波兰语词典编纂专家。将波兰语词根 "{word}" 翻译为以下语言，'
        f"给出最常见、最适合语言学习者使用的释义。\n"
        f"返回严格 JSON，键为: {lang_list}\n"
        f'示例格式: {{"zh-CN":"猫","en":"cat","de":"Katze","uk":"кіт"}}\n'
        f"只返回 JSON，不要其他文字。"
    )
    result = call_qwen(prompt, dry_run=dry_run)
    time.sleep(0.3)
    return result


def translate_tagged(word: str, tagged_lemma: str, *, dry_run: bool = False) -> dict[str, str]:
    """为带 Morfeusz 标签的词条生成 4 语言翻译（区分同形异义）。"""
    if dry_run:
        return {code: f"[{code}:{tagged_lemma}]" for code in LANGUAGES}

    short_tag = tagged_lemma.split(":", 1)[1]
    lang_list = ", ".join(f'"{c}": {LANG_NAMES[c]}' for c in LANGUAGES)
    prompt = (
        f'你是波兰语词典编纂专家。波兰语词 "{word}" 在 Morfeusz 词库中的词条 ID 为 '
        f'"{tagged_lemma}"（精简变格标签 {short_tag}）。\n'
        f"该 ID 可能对应同形异义词的某一变格类（例如 zamek:Sm3~a=城堡，zamek:Sm3~u=拉链）。\n"
        f"请只翻译此词条 ID 对应的含义，不要合并其他变格类的含义。\n"
        f"返回严格 JSON，键为: {lang_list}\n"
        f'只返回 JSON，不要其他文字。'
    )
    result = call_qwen(prompt, dry_run=dry_run)
    time.sleep(0.3)
    return result


def ensure_all_langs(trans: dict[str, str]) -> dict[str, str]:
    out = empty_translations()
    for code in LANGUAGES:
        out[code] = trans.get(code, "") or ""
    return out


def paradigms_need_separate_translation(tagged_lemmas: list[str]) -> bool:
    """
    判断多个标签键是否需要分别翻译。
    Sm3~a / Sm3~u 等同形异义变格类 → 是
    Sm1 / Sm2 等同义词性类 → 否（共用词根译）
    """
    if len(tagged_lemmas) <= 1:
        return False

    tilde_suffixes: set[str] = set()
    pos_suffixes: set[str] = set()
    for lemma in tagged_lemmas:
        _stem, suffix = lemma.split(":", 1)
        if "~" in suffix:
            tilde_suffixes.add(suffix.split("~", 1)[1])
        if suffix.endswith("A") or suffix == "A":
            pos_suffixes.add("adj")
        elif suffix.startswith(("Sm", "Sf", "S")):
            pos_suffixes.add("subst")

    if len(tilde_suffixes) > 1:
        return True
    if len(pos_suffixes) > 1:
        return True
    return False


def build_gloss_dict(words: list[str], *, dry_run: bool = False) -> dict[str, dict[str, str]]:
    gloss_dict: dict[str, dict[str, str]] = {}
    total = len(words)

    print("🔄 步骤 1：提取 Morfeusz 精简标签...")
    tags_by_word: dict[str, list[str]] = {}
    for i, word in enumerate(words, 1):
        tags = extract_tagged_lemmas(word)
        tags_by_word[word] = tags
        tag_preview = ", ".join(t.split(":", 1)[1] for t in tags) if tags else "(无)"
        print(f"  [{i}/{total}] {word} → 标签: {tag_preview}")

    print("\n🔄 步骤 2：AI 翻译词根键...")
    root_trans: dict[str, dict[str, str]] = {}
    for i, word in enumerate(words, 1):
        print(f"  [{i}/{total}] 翻译词根: {word}")
        root_trans[word] = ensure_all_langs(translate_root(word, dry_run=dry_run))

    print("\n🔄 步骤 3：生成词根键 + 精简标签键...")
    for i, word in enumerate(words, 1):
        print(f"  [{i}/{total}] 写入: {word}")
        root = ensure_all_langs(root_trans.get(word, empty_translations()))
        gloss_dict[word] = root

        tagged_lemmas = tags_by_word.get(word, [])
        if not tagged_lemmas:
            continue

        if len(tagged_lemmas) == 1:
            gloss_dict[tagged_lemmas[0]] = root.copy()
            continue

        if not paradigms_need_separate_translation(tagged_lemmas):
            for tagged_lemma in tagged_lemmas:
                gloss_dict[tagged_lemma] = root.copy()
            continue

        # 同形异义：每个变格类单独翻译
        for tagged_lemma in tagged_lemmas:
            print(f"      ↳ 标签键 {tagged_lemma}")
            tagged_trans = ensure_all_langs(
                translate_tagged(word, tagged_lemma, dry_run=dry_run)
            )
            # 若 AI 失败则回退词根译
            if not any(tagged_trans.values()):
                tagged_trans = root.copy()
            gloss_dict[tagged_lemma] = tagged_trans

    return gloss_dict


def save_gloss_dict(gloss_dict: dict[str, dict[str, str]], output_path: Path) -> None:
    lines = [
        "#!/usr/bin/env python3",
        "# -*- coding: utf-8 -*-",
        '"""带 Morfeusz 精简标签的多语言波兰语词表（含词根兜底）"""',
        "",
        "GLOSS_DICT: dict[str, dict[str, str]] = {",
    ]

    for key in sorted(gloss_dict.keys()):
        trans = gloss_dict[key]
        lines.append(f"    {json.dumps(key, ensure_ascii=False)}: {{")
        for code in LANGUAGES:
            val = trans.get(code, "")
            lines.append(f'        {json.dumps(code)}: {json.dumps(val, ensure_ascii=False)},')
        lines.append("    },")

    lines.append("}")
    lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")


def count_keys(gloss_dict: dict, words: list[str]) -> tuple[int, int]:
    roots = sum(1 for w in words if w in gloss_dict)
    tagged = len(gloss_dict) - roots
    return roots, tagged


def main() -> None:
    parser = argparse.ArgumentParser(description="生成带 Morfeusz 标签的多语言 gloss_dict.py")
    parser.add_argument(
        "--words",
        type=Path,
        default=Path("data/polish_words.txt"),
        help="词表文件路径",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("inflection-server/gloss_dict.py"),
        help="输出 gloss_dict.py 路径",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="不调用 AI，用占位翻译测试标签提取与文件生成",
    )
    args = parser.parse_args()

    words = load_words(args.words)
    if not words:
        sys.exit(1)

    if not args.dry_run and not API_KEY:
        print("❌ 未找到 DASHSCOPE_API_KEY，请配置 .env 或使用 --dry-run")
        sys.exit(1)

    print(f"📖 共 {len(words)} 个词根")
    if args.dry_run:
        print("ℹ️  dry-run 模式：跳过 AI，仅测试 Morfeusz 标签提取\n")

    gloss_dict = build_gloss_dict(words, dry_run=args.dry_run)
    save_gloss_dict(gloss_dict, args.output)

    roots, tagged = count_keys(gloss_dict, words)
    print(f"\n✅ 完成！共 {len(gloss_dict)} 个词条")
    print(f"   - {roots} 个词根键")
    print(f"   - {tagged} 个精简标签键")
    print(f"📁 输出: {args.output.resolve()}")


if __name__ == "__main__":
    main()
