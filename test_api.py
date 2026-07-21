import requests

# 这里直接粘贴你的 Key，并删除所有前后空格
API_KEY = "sk-ws-H.EDIXXDR.D7Zb.MEUCIQCHfFJwIS6cwvWidIETUpEuKJGZm70W-nGSAJO8P-N2BQIgc58cSK_iMW6bavz0Fe697dw7F5dBtk9WOd-ZdfLG5xM"  

url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}
data = {
    "model": "qwen-plus",
    "messages": [{"role": "user", "content": "翻译 'kot' 为中文"}]
}

try:
    response = requests.post(url, headers=headers, json=data)
    print("状态码:", response.status_code)
    print("响应:", response.text)
except Exception as e:
    print("错误:", e)