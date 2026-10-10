# 蓝色光标2027届AI作品提交准备指南

## 截止提醒

招聘邀请邮件在2026年10月10日发出，要求收到链接后**3天内**完成。建议在2026年10月12日之前完成作品提交和线上测评，为网络问题预留缓冲，最终截止时刻以招聘系统为准。

## 对照飞书表单（以你提供的截图为准）

- `Work Samples → URL`：填入**公开部署并验证能访问的产品链接**，而不是 `localhost`。
- `AI应用能力作品（0–300MB）`：上传展示PDF、产品说明或录制演示视频（以系统接受的文件格式为准）。
- `GitHub或其他主页链接`：公开GitHub代码库URL。请注意检查绝无API密钥或私人客户数据。
- `Self statement *`：描述个人职责、解决的问题、AI能力、实现与限制；此字段明确带星号。

从截图看，URL、AI文件、GitHub字段**没有显示必填星号**，不代表无需提供有价值的材料。建议尽量提供网页 + 说明文件 + GitHub。

## 建议录制90秒演示

1. 0–10秒：介绍一个痛点：传统模板文案没有跨文化适配与事实核验。
2. 10–30秒：填写虚构品牌和澳洲市场输入，点击生成。
3. 30–65秒：演示策略、英文广告本地化与预算分配。
4. 65–80秒：展示证据缺口与风险标签，说明不虚构数据。
5. 80–90秒：说明技术架构、是否配置实时AI，以及真实场景下一步迭代。

**诚信要求**：如果录制时页面显示 `DEMO MODE`，明确告知这是本地模板演示，绝不可宣称已经接入或调用模型。真正接通密钥、验证模型后才可以说AI实时生成。

## Self statement 参考草稿

我围绕中小企业出海营销场景设计并开发了 GlobalLaunch AI，一个将品牌简报转换为市场进入策略、本地化创意、30日投放试验计划及宣传主张风险清单的网页应用。我负责产品定义、用户流程、前端交互、Node.js API架构及模型提示词设计。与仅生成广告文案的工具相比，本项目把策略建议、未经验证的假设与人工复核项分开呈现，避免将AI输出误当作事实。当前MVP已实现可运行的演示引擎、报告导出和可选的模型API接入；真实商业应用仍需用户研究、可核验的数据源、人工审核及持续测试。

*实际提交时应按自己真正完成的工作修改，尤其是AI实时接入与测试结果。*

## 3天节奏

- Day 1：运行项目、检查输入流程、根据岗位修改示例与文案。
- Day 2：接入模型并完成至少3种品牌输入测试；修复明显幻觉和技术问题。
- Day 3：部署网站、公开GitHub、录制视频、整理PDF或项目说明、填写表单并确认提交。


## v0.4 submission addition: Decision Dashboard + PDF

- Publish the full live web application on an HTTPS endpoint, not just the static `public/` folder. Server-side environment variables are required for live DeepSeek inference.
- Demonstrate the new Decision Dashboard and use **↗ 导出PDF** to save a complete report (Chrome/Edge: Destination → Save as PDF).
- Include only a **real AI-generated case** if presenting live-model capability; label demo-template reports explicitly as DEMO. Never claim market-validation results before actually running research or campaigns.
- Optional attachments: screenshot of the dashboard, generated client-style PDF, short screen recording, README/GitHub repo.
- Public deployment requires access/spend protections; in-process `MAX_DAILY_LIVE_CALLS` is not a hard billing limit.
