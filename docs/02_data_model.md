markdown
# 数据结构设计

## 1. 语言配置（独立于业务数据）

```typescript
// 用户偏好（存于 user_preferences 表）
interface UserPreferences {
  ui_lang: 'zh-CN' | 'en' | 'uk' | 'de';  // 默认 'en'
  theme: 'light' | 'dark';                // 默认 'light'
}

// 系统支持语言（配置表，前端硬编码或从API获取）
const SUPPORTED_UI_LANGS = ['zh-CN', 'en', 'uk', 'de'];
const FALLBACK_LANG = 'en';
## 2. 核心数据表
2.1 Notebook 表
sql
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('global', 'cn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
2.2 Sheet 表
sql
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT DEFAULT '无标题页',
  columns_config JSONB NOT NULL,
  rows_order UUID[] DEFAULT '{}',
  frozen_config JSONB DEFAULT '{"freeze_rows": 1, "freeze_cols": 1}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
columns_config 结构：
json
{
  "columns": [
    {
      "id": "col_A",
      "case_type": "nominative_singular",
      "label_i18n": {
        "en": "Nominative (sg.)",
        "zh-CN": "主格（单数）"
      },
      "width": 150,
      "is_visible": true,
      "is_system": true,
      "supports_gender": true
    },
    {
      "id": "col_B",
      "case_type": "translation",
      "label_i18n": {
        "en": "Translation",
        "zh-CN": "翻译"
      },
      "width": 150,
      "is_visible": true,
      "is_system": false,
      "supports_gender": false
    }
  ],
  "column_order": ["col_A", "col_B"]
}
frozen_config 结构：
json
{
  "freeze_rows": 1,
  "freeze_cols": 1
}
2.3 case_type 枚举
text
nominative_singular, genitive_singular, dative_singular,
accusative_singular, instrumental_singular, locative_singular,
vocative_singular,
nominative_plural, genitive_plural, dative_plural,
accusative_plural, instrumental_plural, locative_plural,
vocative_plural,
translation, note
2.4 Row 表
sql
CREATE TABLE rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  cells_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
cells_data 结构：

json
{
  "col_A": {
    "gender_values": {
      "m": { "value": "dobry", "is_hidden": false },
      "f": { "value": "dobra", "is_hidden": false },
      "n": { "value": "dobre", "is_hidden": false }
    },
    "notes": { "zh-CN": "形容词：好的" }
  },
  "col_B": {
    "gender_values": {
      "default": { "value": "好的", "is_hidden": false }
    }
  }
}
2.5 类型定义
typescript
// 性别类型
type Gender = 'm' | 'f' | 'n';
type GenderOrDefault = Gender | 'default';

// 单元格数据结构
interface CellData {
  gender_values: Record<GenderOrDefault, {
    value: string;
    is_hidden: boolean;
  }>;
  notes?: Record<UILang, string>;
}

// 列配置
interface ColumnConfig {
  id: string;
  case_type: CaseType;
  label_i18n: Record<UILang, string>;
  width: number;
  is_visible: boolean;
  is_system: boolean;
  supports_gender: boolean;
}

// CaseType 枚举（字符串字面量联合类型）
type CaseType = 
  | 'nominative_singular' | 'genitive_singular' | 'dative_singular'
  | 'accusative_singular' | 'instrumental_singular' | 'locative_singular' | 'vocative_singular'
  | 'nominative_plural' | 'genitive_plural' | 'dative_plural'
  | 'accusative_plural' | 'instrumental_plural' | 'locative_plural' | 'vocative_plural'
  | 'translation' | 'note';
3. 规则引擎抽象层
  typescript
  // ============================================
// 类型定义
// ============================================

type Gender = 'm' | 'f' | 'n';
type POS = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'numeral' | 'preposition' | 'conjunction';

// 变格结果：支持多性别
interface InflectionResult {
  m?: string;          // 阳性形式
  f?: string;          // 阴性形式
  n?: string;          // 中性形式
  default?: string;    // 无性别区分时的默认形式
  hasGender: boolean;  // 是否包含性别区分
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// 引擎接口
// ============================================

interface InflectionEngine {
  /**
   * 分析单词，返回词元信息
   */
  analyze(word: string): {
    lemma: string;
    pos: POS;
    grammemes: {
      gender?: Gender[];  // 支持多种性别
      number?: 'sg' | 'pl';
      case?: string;
      person?: 1 | 2 | 3;
      tense?: 'present' | 'past' | 'future';
      aspect?: 'imperfective' | 'perfective';
    };
    confidence: 'high' | 'medium' | 'low';
  };
  
  /**
   * 根据词元和语法特征生成变格形式（返回多性别结果）
   */
  inflect(lemma: string, pos: POS, grammemes: Record<string, any>): InflectionResult;
  
  /**
   * 检查词是否在词典中
   */
  hasWord(word: string): boolean;
  
  /**
   * 获取词支持的所有性别
   */
  getSupportedGenders(word: string): Gender[];
}

// ============================================
// 引擎工厂（支持多语言切换）
// ============================================

class EngineFactory {
  static getEngine(language: 'pl' | 'de'): InflectionEngine;
}

// ============================================
// 波兰语实现（使用 Morfeusz）
// ============================================

class PolishInflectionEngine implements InflectionEngine {
  analyze(word: string): { lemma: string; pos: POS; grammemes: {...}; confidence: ... } {
    // Morfeusz 实现
  }
  
  inflect(lemma: string, pos: POS, grammemes: Record<string, any>): InflectionResult {
    const needsGender = ['adjective', 'pronoun', 'numeral'].includes(pos);
    if (needsGender) {
      return {
        m: this.generateForm(lemma, { ...grammemes, gender: 'masc' }),
        f: this.generateForm(lemma, { ...grammemes, gender: 'fem' }),
        n: this.generateForm(lemma, { ...grammemes, gender: 'neut' }),
        hasGender: true,
        confidence: 'high'
      };
    } else {
      const form = this.generateForm(lemma, grammemes);
      return { default: form, hasGender: false, confidence: 'high' };
    }
  }
  
  hasWord(word: string): boolean {
    // Morfeusz 实现
  }
  
  getSupportedGenders(word: string): Gender[] {
    // Morfeusz 实现
  }
  
  private generateForm(lemma: string, grammemes: Record<string, any>): string {
    // Morfeusz 变格调用
  }
}

// ============================================
// 德语实现（后期使用 spacy 或 German-NLP）
// ============================================

class GermanInflectionEngine implements InflectionEngine {
  // 德语实现（占位）
}
4. RLS 策略（安全）
sql
-- Notebooks: 用户只能访问自己的笔记本，且只能访问本区域数据
CREATE POLICY user_notebooks ON notebooks
  FOR ALL USING (
    auth.uid() = user_id 
    AND region = current_setting('app.region', true)
  );

-- Sheets: 通过 notebook_id 关联用户
CREATE POLICY user_sheets ON sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notebooks 
      WHERE id = sheets.notebook_id 
      AND user_id = auth.uid()
      AND region = current_setting('app.region', true)
    )
  );

-- Rows: 通过 sheet_id 关联用户
CREATE POLICY user_rows ON rows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sheets 
      JOIN notebooks ON notebooks.id = sheets.notebook_id 
      WHERE sheets.id = rows.sheet_id 
      AND notebooks.user_id = auth.uid()
      AND notebooks.region = current_setting('app.region', true)
    )
  );
  ---

## 5. 变格表结构（规则引擎参考数据）

> **说明**：以下表格是规则引擎（Morfeusz）的输入参考数据，描述不同词性需要生成哪些变格形式。AI 生成代码时应参考此结构。

---

### 5.1 名词（Rzeczownik）

名词变格包含 **7个格 × 单复数**，共14种形式：

| 格 | 单数 | 复数 |
|----|------|------|
| 主格 (Nominative) | 需要 | 需要 |
| 属格 (Genitive) | 需要 | 需要 |
| 与格 (Dative) | 需要 | 需要 |
| 宾格 (Accusative) | 需要 | 需要 |
| 工具格 (Instrumental) | 需要 | 需要 |
| 方位格 (Locative) | 需要 | 需要 |
| 呼格 (Vocative) | 需要 | 需要 |

**对应的 case_type 枚举值**：
nominative_singular, genitive_singular, dative_singular,
accusative_singular, instrumental_singular, locative_singular,
vocative_singular,
nominative_plural, genitive_plural, dative_plural,
accusative_plural, instrumental_plural, locative_plural,
vocative_plural

text

**示例**（名词 `kot` - 猫）：

| 格 | 单数 | 复数 |
|----|------|------|
| 主格 (Nominative) | kot | koty |
| 属格 (Genitive) | kota | kotów |
| 与格 (Dative) | kotu | kotom |
| 宾格 (Accusative) | kota | koty |
| 工具格 (Instrumental) | kotem | kotami |
| 方位格 (Locative) | kocie | kotach |
| 呼格 (Vocative) | kocie | koty |

---

### 5.2 形容词（Przymiotnik）

形容词变格包含 **3种性（阳性 m / 阴性 f / 中性 n）× 7个格 × 单复数**。

**表头说明**：
- `m` = 阳性 (masculine)
- `f` = 阴性 (feminine)
- `n` = 中性 (neuter)
- 每个格包含 3 个性，共 42 种形式

| 格 | 单数 (m / f / n) | 复数 (m / f / n) |
|----|------------------|------------------|
| 主格 (Nominative) | m / f / n | m / f / n |
| 属格 (Genitive) | m / f / n | m / f / n |
| 与格 (Dative) | m / f / n | m / f / n |
| 宾格 (Accusative) | m / f / n | m / f / n |
| 工具格 (Instrumental) | m / f / n | m / f / n |
| 方位格 (Locative) | m / f / n | m / f / n |
| 呼格 (Vocative) | m / f / n | m / f / n |

**示例**（形容词 `dobry` - 好的）：

| 格 | 阳性 (m) | 阴性 (f) | 中性 (n) |
|----|----------|----------|----------|
| 主格 (sg.) | dobry | dobra | dobre |
| 属格 (sg.) | dobrego | dobrej | dobrego |
| 与格 (sg.) | dobremu | dobrej | dobremu |
| 宾格 (sg.) | dobrego / dobry | dobrą | dobre |
| 工具格 (sg.) | dobrym | dobrą | dobrym |
| 方位格 (sg.) | dobrym | dobrej | dobrym |
| 呼格 (sg.) | dobry | dobra | dobre |
| 主格 (pl.) | dobrzy / dobre | dobre | dobre |
| 属格 (pl.) | dobrych | dobrych | dobrych |
| 与格 (pl.) | dobrym | dobrym | dobrym |
| 宾格 (pl.) | dobrych / dobre | dobre | dobre |
| 工具格 (pl.) | dobrymi | dobrymi | dobrymi |
| 方位格 (pl.) | dobrych | dobrych | dobrych |
| 呼格 (pl.) | dobrzy / dobre | dobre | dobre |

> **注**：阳性宾格单数根据名词动物性分为 `dobrego`（动物）和 `dobry`（非动物）。

---

### 5.3 动词（Czasownik）

动词变格包含**人称（1st/2nd/3rd）× 数（单/复）× 时态（现在/过去）**。

**表头说明**：
- `人称`：波兰语人称代词
  - `1st (ja - 我)` = 第一人称单数
  - `2nd (ty - 你)` = 第二人称单数
  - `3rd (on/ona/ono - 他/她/它)` = 第三人称单数
  - `1st (my - 我们)` = 第一人称复数
  - `2nd (wy - 你们)` = 第二人称复数
  - `3rd (oni/one - 他们/她们)` = 第三人称复数
- `现在时 (sg.)`：单数现在时形式
- `过去时 (sg.)`：单数过去时形式（`m / f / n` 表示三种性）
- `现在时 (pl.)`：复数现在时形式
- `过去时 (pl.)`：复数过去时形式（`m` 为阳性/混合，`f` 为阴性）

| 人称 | 现在时 (sg.) | 过去时 (sg.) | 现在时 (pl.) | 过去时 (pl.) |
|------|-------------|-------------|-------------|-------------|
| 1st (ja - 我) | -ę | -łem / -łam | -my | -liśmy / -łyśmy |
| 2nd (ty - 你) | -sz | -łeś / -łaś | -cie | -liście / -łyście |
| 3rd (on/ona/ono - 他/她/它) | - | -ł / -ła / -ło | -ą | -li / -ły |

**示例**（动词 `robić` - 做）：

| 人称 | 现在时 | 过去时 |
|------|--------|--------|
| ja (我) | robię | robiłem / robiłam |
| ty (你) | robisz | robiłeś / robiłaś |
| on (他) | robi | robił |
| ona (她) | robi | robiła |
| ono (它) | robi | robiło |
| my (我们) | robimy | robiliśmy / robiłyśmy |
| wy (你们) | robicie | robiliście / robiłyście |
| oni (他们/阳性混合) | robią | robili |
| one (她们/阴性) | robią | robiły |

---

### 5.4 代词（Zaimki）

代词变格规则同形容词（支持 m/f/n 三种性变格）。

| 代词类型 | 变格规则 |
|---------|---------|
| 人称代词 (ja, ty, on, ...) | 按名词变格，有独立的特殊形式 |
| 指示代词 (ten, ta, to - 这个) | 按形容词变格（m/f/n） |
| 物主代词 (mój, twój, ... - 我的，你的) | 按形容词变格（m/f/n） |

**示例**（指示代词 `ten` - 这个）：
| 格 | 阳性 (m) | 阴性 (f) | 中性 (n) |
|----|----------|----------|----------|
| 主格 (sg.) | ten | ta | to |
| 属格 (sg.) | tego | tej | tego |
| 与格 (sg.) | temu | tej | temu |
| 宾格 (sg.) | tego / ten | tę | to |
| 工具格 (sg.) | tym | tą | tym |
| 方位格 (sg.) | tym | tej | tym |
| 主格 (pl.) | ci / te | te | te |
| 属格 (pl.) | tych | tych | tych |
| 与格 (pl.) | tym | tym | tym |
| 宾格 (pl.) | tych / te | te | te |
| 工具格 (pl.) | tymi | tymi | tymi |
| 方位格 (pl.) | tych | tych | tych |

---

### 5.5 数词（Liczebniki）

| 数词类型 | 变格规则 | 性别支持 |
|---------|---------|---------|
| 数字 2, 3, 4 | 按形容词变格 | m / f / n |
| 数字 5 以上 | 按名词变格 | 无性别区分 |
| 其他数词 | 按形容词变格 | m / f / n |

**示例**（数字 2 - `dwa`）：

| 格 | 阳性 (m) | 阴性 (f) | 中性 (n) |
|----|----------|----------|----------|
| 主格 | dwa | dwie | dwa |
| 属格 | dwóch | dwóch | dwóch |
| 与格 | dwóm | dwóm | dwóm |
| 宾格 | dwóch / dwa | dwie | dwa |
| 工具格 | dwoma | dwiema | dwoma |
| 方位格 | dwóch | dwóch | dwóch |

**示例**（数字 5 - `pięć`，按名词变格）：

| 格 | 形式 |
|----|------|
| 主格 | pięć |
| 属格 | pięciu |
| 与格 | pięciu |
| 宾格 | pięć |
| 工具格 | pięcioma |
| 方位格 | pięciu |

---

### 5.6 副词 / 介词 / 连词

**不变格**（所有形式保持相同）。

| 词性 | 示例 | 变格 |
|------|------|------|
| 副词 | dobrze (好地) | 不变 |
| 介词 | w (在...里) | 不变 |
| 连词 | i (和) | 不变 |

---

### 5.7 规则引擎降级策略
用户输入单词
↓
规则引擎（Morfeusz）查询
↓
能找到？
├── 是 → 返回变格结果（confidence: high/medium）
└── 否 → 查询 irregular_forms JSONB 字段
↓
能找到？
├── 是 → 返回变格结果（confidence: medium）
└── 否 → 返回词根原形（confidence: low）

text

**irregular_forms 表结构**（可选，用于特殊变格词）：
```json
{
  "word": "być",
  "irregular_forms": {
    "present_1sg": "jestem",
    "present_2sg": "jesteś",
    "present_3sg": "jest",
    "present_1pl": "jesteśmy",
    "present_2pl": "jesteście",
    "present_3pl": "są",
    "past_1sg_m": "byłem",
    "past_1sg_f": "byłam"
  }
}
5.8 变格表快速索引（给 AI 编程用）
typescript
// 各词性需要生成的变格形式

const INFLECTION_RULES = {
  noun: {
    cases: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'locative', 'vocative'],
    numbers: ['sg', 'pl'],
    hasGender: false,
  },
  adjective: {
    cases: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'locative', 'vocative'],
    numbers: ['sg', 'pl'],
    hasGender: true,
    genders: ['m', 'f', 'n'],
  },
  verb: {
    tenses: ['present', 'past'],
    numbers: ['sg', 'pl'],
    persons: ['1st', '2nd', '3rd'],
    hasGender: true,  // 仅过去时
    genders: ['m', 'f', 'n'],
  },
  pronoun: {
    cases: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'locative', 'vocative'],
    numbers: ['sg', 'pl'],
    hasGender: true,
    genders: ['m', 'f', 'n'],
  },
  numeral: {
    // 数字 2,3,4 按形容词变格；5以上按名词变格
    hasGender: true,  // 仅 2,3,4
    genders: ['m', 'f', 'n'],
  },
  adverb: { isInvariable: true },
  preposition: { isInvariable: true },
  conjunction: { isInvariable: true },
};
text

---


