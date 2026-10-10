# 使用 DeepSeek API 启动 GlobalLaunch AI v0.3

## 1. DeepSeek 网页版与 API 的区别

DeepSeek 网页/APP 聊天可能免费，但用于网页应用实时生成的 **API 按 Token 计费**，并非永久免费的通用服务。注册/充值/可能的赠送余额请以 [DeepSeek 开放平台](https://platform.deepseek.com/) 当前页面为准。不要承诺免费额度。

官方 API 价格与模型：[DeepSeek 模型和价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)；官方 Responses API [使用说明](https://api-docs.deepseek.com/zh-cn/guides/responses_api)。2026-10-10，`deepseek-flash` 闲时百万输入 tokens 1 元，输出 4 元，忙时约翻倍，均以官方后续价格为准。

## 2. 运行步骤（Windows）

1. 安装 Node.js 20 或更高版本。
2. 解压 ZIP，在项目文件夹地址栏输入 `powershell` 打开终端。
3. 执行 `Copy-Item .env.example .env`；执行 `notepad .env`。
4. 找到 `DEEPSEEK_API_KEY=` 并在 `=` 后面填入自己在 `https://platform.deepseek.com/api_keys` 创建的 Key。不要发给任何人。
5. 检查 `AI_PROVIDER=deepseek`、`DEEPSEEK_MODEL=deepseek-flash`、`DEEPSEEK_BASE_URL=https://api.deepseek.com`。
6. 执行 `npm start`，在浏览器打开 `http://127.0.0.1:3000`。
7. 输入虚构品牌，点击「生成30天市场启动策略」，确认右侧出现 `AI DRAFT READY`，而非 `DEMO MODE`。这一步成功才算调用真实 AI。

## 3. 配置和安全

- 不要将 `.env` 上传 GitHub；密钥永远放在服务器环境变量中。
- 免费网页版账号不等于有 API 余额。余额不足时会请求失败，不会伪装成实时 AI。
- `MAX_DAILY_LIVE_CALLS` 是服务进程内软限制，并非硬性消费上限；部署平台重启后会重置。务必在 API 平台设置充值或花费边界。
- 招聘人员如需要访问私有演示，单独告知 `APP_ACCESS_CODE`。它不是 API Key。
- 本项目生成的是营销草案，不包含在线市场数据检索。所有市场事实、预算和合规判断均须人工验证。

## 4. 如果改用 OpenAI

在 `.env` 设置：

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=YOUR_KEY
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

重启服务即可切换，不需要修改前端。
