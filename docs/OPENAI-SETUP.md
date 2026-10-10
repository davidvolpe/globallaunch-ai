# 用 OpenAI API 启动 GlobalLaunch AI — 操作指南

## Step 1 — 准备 API 项目

1. 登录 https://platform.openai.com/ （**不同于日常使用的ChatGPT网页**）。
2. 打开 https://platform.openai.com/api-keys ，创建项目专用的 **Secret API key**。
3. 根据 API 平台界面检查项目的 Billing / Usage 和模型权限；需要时添加付款方式或预付额度。
4. 用量收费与 ChatGPT Plus 分开。你不需要向别人透露自己的密钥。

## Step 2 — 本地配置（Windows）

确保已经安装 Node.js 20 或更新版本。在项目文件夹地址栏输入 `powershell`，执行：

```powershell
Copy-Item .env.example .env
notepad .env
```

把这行中的值换成你自己创建的密钥：

```dotenv
OPENAI_API_KEY=你的密钥，仅存本机
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

保存文件，启动：

```powershell
npm start
```

如果你已经启动过服务，先按 Ctrl+C 再重新执行。打开 `http://127.0.0.1:3000`。网页顶部 `API CONFIGURED` 意味着已读取密钥**但尚未验证密钥有效**。

## Step 3 — 验证真实 AI 输出

使用预置的虚构护肤品牌例子，点击「生成30天市场启动策略」。成功后应看到 `AI DRAFT READY`、详细的品牌定制化报告和 `AI草稿模式`。变化示例品牌目标市场再次生成，检查文案确实根据输入变化。

如果显示 `DEMO MODE`：可能你忘了创建 `.env`、没有填写值，或没重启 Node 服务。如果出现错误：

- `鉴权失败`：密钥未启用、粘贴错误或项目权限不足。
- `限额或计费问题`：到 API 后台检查余额和速率限制。
- `拒绝了请求`：模型名称、模型权限或结构化输出格式不支持。先尝试 `gpt-4.1-mini`。
- `超时`：检查网络，再次运行。

你可以本地检查状态，命令：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

该接口只返回模式与模型名称，不会返回密钥。

## Step 4 — 公开招聘演示

将所有代码推送到 GitHub（**必须排除 `.env`，仓库中不要放API key**），在 Render 等Node托管平台部署。

环境变量建议：

```dotenv
HOST=0.0.0.0
OPENAI_MODEL=gpt-4.1-mini
MAX_DAILY_LIVE_CALLS=60
OPENAI_API_KEY=在托管平台Secrets中设置
```

可以额外设置 `APP_ACCESS_CODE=独立的演示口令` 防止任意访客调用。若设口令，招聘人员访问时需要输入该口令，因此必须确保评审能够获得它。不限访问的公开演示应配置独立低额度项目并监视消费。应用中的每日计数器不是实际扣费的强制上限，多实例/重启都会重置。

## Step 5 — 交付材料

建议提交 HTTPS 公开网页链接、产品90秒视频、2页PDF功能说明，以及GitHub代码主页。必须说明 Demo / Live API 的真实状态；模型生成的推断并非已核验的调研结论。
