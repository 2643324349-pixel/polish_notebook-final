# Inflection Server (Morfeusz)

本地 FastAPI 服务，为 Polish Notebook 前端提供形态学分析。

## 前置条件

系统 Python 已安装 `morfeusz2`（推荐，已验证可用）：

```bash
python -c "import morfeusz2; print('ok')"
```

## 安装依赖

```bash
cd inflection-server
pip install -r requirements.txt
```

可选：使用虚拟环境

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## 启动

```bash
# 在 inflection-server 目录下
uvicorn main:app --reload --port 8000
```

或在项目根目录：

```bash
pnpm run inflection:dev
```

## 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/inflect/analyze` | 分析单词，返回变格信息 |

### 示例

```bash
curl -X POST http://localhost:8000/api/inflect/analyze \
  -H "Content-Type: application/json" \
  -d "{\"word\": \"kot\"}"
```

```json
{
  "lemma": "kot",
  "pos": "noun",
  "grammemes": { "gender": ["m"], "number": "sg", "case": "nom" },
  "inflection": { "default": "kot" },
  "has_gender": false,
  "confidence": "high"
}
```

## 前端联调

Vite 开发服务器已将 `/api/inflect` 代理到 `http://localhost:8000`。

1. 启动 inflection-server（端口 8000）
2. 启动前端：`pnpm dev`
3. 在表格性别列点击 Generate 测试

API 不可用时，前端会静默降级到 Mock 词典（`console.warn`）。
