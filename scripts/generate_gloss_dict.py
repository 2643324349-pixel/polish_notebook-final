#!/usr/bin/env python3
"""
批量翻译波兰语词根，生成 gloss_dict.py
"""

import os
import json
import time
from pathlib import Path
import requests
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 配置
API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not API_KEY:
    print("❌ 错误：未找到 DASHSCOPE_API_KEY 环境变量")
    exit(1)

# 北京地域的 Base URL
BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

# 目标语言列表（支持的语言）
LANGUAGES = {
    "zh-CN": "中文",
    "en": "英语",
    "de": "德语",
    "uk": "乌克兰语"
}

def translate_word(word: str, target_lang: str) -> str:
    """翻译单个词"""
    prompt = f"翻译波兰语单词 '{word}' 到 {target_lang}。只返回翻译结果，不要解释。"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    data = {
        "model": "qwen-plus",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 50,
        "temperature": 0.1
    }
    
    try:
        response = requests.post(BASE_URL, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            print(f"⚠️ 翻译 '{word}' 失败: HTTP {response.status_code}")
            return ""
    except Exception as e:
        print(f"⚠️ 翻译 '{word}' 异常: {e}")
        return ""

def generate_gloss_dict(words_file: Path, output_file: Path):
    """批量翻译并生成 gloss_dict.py"""
    with open(words_file, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]
    
    print(f"📖 读取到 {len(words)} 个词根")
    
    gloss_dict = {}
    total = len(words)
    
    for i, word in enumerate(words, 1):
        print(f"🔄 [{i}/{total}] 翻译: {word}")
        
        translations = {}
        for lang_code, lang_name in LANGUAGES.items():
            result = translate_word(word, lang_name)
            if result:
                translations[lang_code] = result
            else:
                # 翻译失败时留空
                translations[lang_code] = ""
        
        # 只有至少有一种语言翻译成功才加入词典
        if any(translations.values()):
            gloss_dict[word] = translations
        else:
            print(f"⚠️ 跳过 {word}: 所有语言翻译均失败")
        
        # 延迟 0.5 秒，避免触发限流
        time.sleep(0.5)
    
    # 生成 gloss_dict.py 文件
    with open(output_file, "w", encoding="utf-8") as f:
        f.write('#!/usr/bin/env python3\n')
        f.write('# -*- coding: utf-8 -*-\n')
        f.write('"""自动生成的波兰语多语言词表"""\n\n')
        f.write('GLOSS_DICT = {\n')
        for word, translations in gloss_dict.items():
            f.write(f'    "{word}": {{\n')
            for lang_code, value in translations.items():
                f.write(f'        "{lang_code}": "{value}",\n')
            f.write('    },\n')
        f.write('}\n')
    
    print(f"✅ 完成！共生成 {len(gloss_dict)} 个词条")
    print(f"📁 输出文件: {output_file}")

if __name__ == "__main__":
    # 文件路径
    words_file = Path("data/polish_base_words.txt")
    output_file = Path("inflection-server/gloss_dict.py")
    
    if not words_file.exists():
        print(f"❌ 错误：找不到词表文件 {words_file}")
        print("请先在 data/polish_base_words.txt 中列出波兰语词根，每行一个。")
        exit(1)
    
    generate_gloss_dict(words_file, output_file)