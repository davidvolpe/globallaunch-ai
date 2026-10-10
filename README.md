# GlobalLaunch AI v0.6 — Evidence & Iteration Workspace

**AI跨境营销策略 + 持续证据驱动修订**。基于 v0.5，新增独立的修订工作台、按章节的变更保护、修订审核、浏览器本地多项目版本历史、已保存版本差异对比、JSON备份与恢复、报告新增证据附录。保留 DeepSeek/OpenAI Responses API、全宽决策仪表盘、预算图表、4周执行计划、Markdown和PDF导出。

> 产品状态：演示用MVP，不代表完成实际市场调研。所有用户输入的新证据均为「未独立核验」；本地保存不等于云端账户同步。

**Windows升级操作说明：** [docs/UPGRADE-V0.6-WINDOWS.md](docs/UPGRADE-V0.6-WINDOWS.md)

## 快速运行

1. 安装 Node.js 20+。
2. 将 `.env.example` 复制为 `.env`，在 `.env` 里配置 `DEEPSEEK_API_KEY`（不要向他人发送密钥）。
3. 在项目文件夹运行 `npm.cmd start`（Windows PowerShell）或 `npm start`（其他终端）。
4. 打开 `http://127.0.0.1:3000`。
5. 点击「生成30天市场启动策略」，然后进入侧栏「证据与迭代」。

## v0.6 工作流

**v1原始报告 → 新增材料（含来源） → 选择章节 → AI修订草案 → 前后对比 → 人工确认采用 → v2不可覆盖版本 → PDF/Markdown导出**。

- `/api/generate`：生成初版报告。
- `/api/revise`：对当前报告做定向修订，返回结构化草稿，*不*自动保存。
- 浏览器 `localStorage`：保存多项目和多版本；导出/导入 JSON 备份。
- 未选择的章节由服务器从原版恢复，模型的越权修改不能进入新报告；预算金额与渠道始终由原始简报约束。
- 服务端 API Key 不会进入网页代码或浏览器本地项目历史。

## 测试

```bash
npm test
```

自动化测试包含 API生成、模拟 DeepSeek 调用、修订接口、章节锁定、预算核算、用户来源验证和版本历史。浏览器端另对模拟数据做了桌面/手机交互与PDF检查。

## 重要限制

项目历史只保存在**当前浏览器本地**，并不自动同步给招聘人员或其他设备；JSON备份包含用户输入的品牌信息，请保管好。当前只支持手工文字记录，不处理上传文档，也不独立搜索/确认来源。AI修订消耗新的API调用额度，且内容需要人工审核。公网部署时要设置访问限制、调用预算和数据保护措施。

---

## v0.4.1 — Browser cache hotfix

This patch fixes a mixed-version screen where the sidebar displayed v0.4 but the report area still used v0.3 JavaScript (two old buttons and no dashboard). Static assets now use `Cache-Control: no-store`, and the HTML links to versioned JS/CSS URLs. No AI provider, API key, prompt, or report schema changes. Keep the existing private `.env` and restart the server after upgrading.

# GlobalLaunch AI — Launch Studio (v0.4)

**A portfolio-ready, DeepSeek/OpenAI-powered cross-border marketing MVP.** Enter a brand brief and obtain a **provisional** target-market positioning plan, localised English ad copy, 30-day budget/experiment roadmap, and a claims/evidence review.

> Without an API key the website runs an explicitly labelled **DEMO MODE** using local authored templates. With a DeepSeek or OpenAI API key it uses the **Responses API with strict JSON Schema**. A successful request is necessary to verify actual model connectivity.

## What's new in v0.4

- A polished **Decision Dashboard** with marketing objective, segment, budget chart, four-week timeline, KPIs and risk status.
- An expanded Execution view with native CSS donut chart, channel spend legend, weekly cards, KPI definitions and A/B experiments.
- A readable, complete **PDF-ready A4 report**. Click **↗ 导出PDF**, choose **Save as PDF / 另存为PDF** in Chrome/Edge's print dialogue, then save. This does not depend on a third-party PDF service or an API request.
- Existing API client, model/schema, budget repair, access code and `.env.example` stay unchanged from v0.3. Model connectivity must still be checked on your own local machine with your private key.
- No PDF design-data discrepancies: dashboard, printed PDF and Markdown are all rendered from the **same API JSON response**.

**Upgrading from v0.3 with a working DeepSeek API?** Keep the old project as backup, unzip the new project to a separate location, **copy your private `.env` from the old folder to the new folder**, stop the old server, and run `npm.cmd start` in the new folder. See the [illustrated-by-steps Windows guide](docs/UPGRADE-V0.4-WINDOWS.md). **Never share or upload `.env`.**

## Quick start on Windows

1. Install [Node.js 20+](https://nodejs.org/). (Node.js 22 LTS is a good choice.)
2. Download and unzip the project. In Windows File Explorer open the `globallaunch-ai` folder.
3. Click the address bar, type `powershell`, press Enter.
4. Run `npm.cmd start` in Windows PowerShell (or `npm start` if script execution is enabled).
5. Open **http://127.0.0.1:3000** in your browser and click **生成30天市场启动策略** to test Demo Mode.

No `npm install` needed: this project has no third-party runtime dependencies.

## Connect DeepSeek (recommended for low-cost demo) or OpenAI

Create a DeepSeek API key at https://platform.deepseek.com/ and check your API balance. DeepSeek website chat being free does **not** mean API is free.

**PowerShell:**

```powershell
Copy-Item .env.example .env
notepad .env
```

Set the following inside `.env`:

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
DEEPSEEK_MODEL=deepseek-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

DeepSeek's official Responses API supports `text.format` structured outputs. With this configuration it sends requests to `https://api.deepseek.com/responses`. To use OpenAI instead, change `AI_PROVIDER=openai` and set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL`.

Restart the Node server (Ctrl+C, then `npm.cmd start`), refresh the browser. Header should now say **API CONFIGURED** (not yet a verified connection). Submit an example to verify a successful AI response labelled **AI DRAFT READY**. Do not send the actual key or upload `.env` to GitHub.

**IMPORTANT:** If the provider returns `401`, check API Key. For `429`, check API balance, quota, limits, and/or the project's own daily limit. For `400`, confirm the selected model supports JSON Schema structured output. A `DEMO MODE` result **never counts as proof of AI connectivity**.

More detailed steps: [DeepSeek setup guide](docs/DEEPSEEK-SETUP.md).

## Safety and public demo

- DeepSeek and OpenAI tokens incur usage charges; neither API is included in ChatGPT Plus.
- A basic per-IP throttle (5/minute in AI mode) and `MAX_DAILY_LIVE_CALLS=30` in-process limit are provided. The counter is **not** a billing hard cap and resets after server restart / scale-out.
- Set `APP_ACCESS_CODE` to a random private code if the public demo should be restricted; an access-code field appears on the website when needed. The reviewer needs this code separately. Do not reuse your AI API key as the access code.
- Use the API project's spend controls/alerts and avoid feeding sensitive customer data into public demos. Server does not keep a database but sends inputs to the selected AI provider for live generation.
- Report claims are working assumptions; no live competitive research, verifiable citations, legal compliance guarantees or reliable ROI estimates are produced in v0.4.

## Features

- Brand brief with four markets (AU / SG / UK / US), industry, goal, channels, budget.
- 6 output views: Executive Dashboard, Strategy, Localisation, Execution, Risk Review, Evidence Ledger.
- Exact percentage and currency budget reconciliation across selected channels.
- Colour-coded budget donut, 4-week roadmap, KPI cards, risk severity and experiment design.
- **Full A4 PDF export** via the browser native Print → Save as PDF dialogue (six report chapters, regardless of active tab); Markdown export and copy-to-clipboard summary remain available.
- Secure server-side DeepSeek/OpenAI key, strict output schema, refusal/time-out/API error handling.
- Mobile-responsive website with a local rule-based fallback **only if no API key is configured**.

## Test

```bash
npm test
```

Tests cover validation, Demo Mode, mock Responses API integration, input/budget reconciliation, error messaging, access code, and per-day quota. Network tests use an **in-process simulated provider endpoint** and do not incur API charges.

## Deploy for recruitment review

This is a Node.js server, not a static-only site. Push the folder (without `.env`) to GitHub and deploy via Render/Railway/VPS:

- **Build command**: `echo No dependencies`
- **Start command**: `npm start`
- **HOST**: `0.0.0.0`
- **AI_PROVIDER**: `deepseek`
- **DEEPSEEK_API_KEY**: add using host Secret/Environment settings
- **DEEPSEEK_MODEL**: `deepseek-flash`
- **MAX_DAILY_LIVE_CALLS**: `30` (adjust after measuring usage)
- **APP_ACCESS_CODE**: optional; omit to allow reviewers to interact without extra instructions, but keep strict spend limits

A sample `render.yaml` and `Dockerfile` are included. After deploy, test on a separate browser/phone via the public HTTPS URL, including dynamic generation and report export. A deployment is **not** included in this deliverable; you must connect your own hosting account and API key.

## API routes

- `GET /api/health` → `mode` (`demo`/`live`), `model` and `accessRequired` (never the key)
- `POST /api/generate` → validated brief → structured five-part report, tagged by origin

## Technical design and recruitment docs

- [WINDOWS v0.3 → v0.4 UPGRADE](docs/UPGRADE-V0.4-WINDOWS.md)
- [MVP SPEC](docs/MVP-SPEC.md)
- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [DEEPSEEK SETUP](docs/DEEPSEEK-SETUP.md) · [OPENAI SETUP](docs/OPENAI-SETUP.md)
- [RECRUITMENT SUBMISSION](docs/SUBMISSION-GUIDE.md)

**Project scope note**: This is a time-boxed portfolio MVP. It is not connected to live advertising platforms, official market databases, or a live compliance engine. Reports remain drafts for human review.


## v0.5 Layout & Navigation Upgrade

- Removed the decorative workspace switcher and non-functional gear.
- Sidebar now includes: Campaign builder, View report (enabled after generation), New brief, Method & evidence, and Help.
- Added collapse/expand on desktop and a mobile navigation drawer.
- Changed the desktop report to full width beneath the brief to eliminate long-column whitespace.
- After generation the brief becomes a compact, editable summary; PDF and Markdown exports work as before.
- `.env` remains private: copy it locally from your existing v0.4.1 project when upgrading.
