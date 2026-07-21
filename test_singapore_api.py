import os
import requests
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 从环境变量读取新加坡配置
API_KEY = os.getenv("QWEN_SINGAPORE_API_KEY")
BASE_URL = os.getenv("QWEN_SINGAPORE_BASE_URL")
WORKSPACE_ID = os.getenv("QWEN_SINGAPORE_WORKSPACE_ID")

print(f"WorkspaceId: {WORKSPACE_ID}")
print(f"Base URL: {BASE_URL}")
print(f"API Key 长度: {len(API_KEY) if API_KEY else 0}")

if not all([API_KEY, BASE_URL, WORKSPACE_ID]):
    print("❌ 配置不完整，请检查 .env 文件")
    exit(1)

# 测试 API 调用
url = f"{BASE_URL}/chat/completions"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}
data = {
      "model": "qwen-flash",  # 改成 qwen-flash
    "messages": [{"role": "user", "content": "翻译 'kot' 到中文"}]
}

try:
    response = requests.post(url, headers=headers, json=data, timeout=30)
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.text[:200]}")
except Exception as e:
    print(f"错误: {e}")