# GlobalLaunch AI — MVP 需求规格说明 v0.2

## 1. 产品定位

**一句话**：一个面向中国出海品牌和中小企业的跨境营销策划工作台，把简报转化为**可验证**的市场定位、本地化广告文案、30日试验计划和营销风险清单。

**核心用户**：准备初次进入英语市场、预算有限、缺少本地化营销团队的品牌负责人、增长经理与策略顾问。

**Jobs to be Done**：当一个品牌打算尝试新海外市场时，帮助其在真正投入广告预算前形成可讨论、可测试、可复查的第一版计划。

**与普通文案生成器的差异**：不仅生成内容，还维护“假设—验证—风险”链路；绝不把AI幻觉伪装成市场调研。

## 2. 本阶段 MVP 范围（已实现）

| 编号 | 功能 | 验收标准 | 状态 |
|---|---|---|---|
| F01 | 品牌简报 | 品牌、行业、受众、价值主张、目标市场、目标、预算与渠道可输入和校验 | 已实现 |
| F02 | 区域选择 | AU/SG/UK/US自动匹配AUD/SGD/GBP/USD | 已实现 |
| F03 | 策略简报 | 返回定位、画像假设、关键讯息和验证计划 | 已实现 |
| F04 | 本地化文案 | 两个当地英语版本、渠道角度与文化提醒 | 已实现 |
| F05 | 投放计划 | 精确分配预算、四周执行步骤、KPI和A/B实验 | 已实现 |
| F06 | 审查与证据 | 风险清单、验证项目、声明可信度边界 | 已实现 |
| F07 | 演示模式 | 无密钥也可演示，**明确标注本地模板、非AI生成** | 已实现 |
| F08 | 模型接入 | 服务器端通过兼容Chat Completions协议的接口生成结构化方案 | 已实现接口；需用户提供API Key验证真实调用 |
| F09 | 报告导出 | 将所有内容导出Markdown格式 | 已实现 |
| F10 | 手机端适配 | 在移动端调整为单列布局 | 已实现 |

## 3. 页面信息架构

1. **Campaign builder**：品牌简报输入区、自动生成按钮、报告预览。
2. **Strategy**：一句话定位、受众假设、待验证事项。
3. **Localisation**：英文主视觉文案、第二版本、渠道内容创意和文化审查。
4. **Execution**：分渠道预算、四周时间线、衡量指标与A/B测试。
5. **Risk**：人工审核建议与宣传主张风险。
6. **Evidence**：证据缺口和下一步验证清单。
7. **Export**：一键保存为可继续编辑的Markdown报告。

## 4. 关键路径 / 用户旅程

用户进入产品 → 加载示例或填写品牌 → 选择市场/行业/营销目标/渠道 → 点击生成 → 查看标注来源模式的报告 → 切换5个报告标签 → 复制摘要或下载全报告 → 验证假设 → 人工审核 → 决策。

## 5. 本阶段非目标

- 不进行实时联网搜集竞品、市场份额或法规条款。
- 不代替付费投放平台执行广告。
- 不对ROI、转化率或消费者购买意愿做虚构预测。
- 不提供用户登录、项目数据库、协作权限或收费功能。
- 不提供法律合规认证。

## 6. 商业价值与验证指标

**为谁省什么**：减少新市场探索时制作第一版营销框架、广告草案和验证计划的重复劳动。是否真正节省时间仍需实验。

**产品验证**：邀请至少3名真实从业者做5–10分钟可用性测试；记录完成首份方案所需时间、最有用模块、对建议可信度的评分；输出不满意点并迭代。不能预先声称已通过验证。

**未来商业模式（未验证）**：Freemium生成基础方案，按项目收费的高级顾问审查，或面向咨询团队的SaaS订阅。


## 第二阶段补充：OpenAI Responses API（v0.2）

- 实时调用方式：`/v1/responses` + `text.format.json_schema`（`strict:true`）。
- 服务端安全：密钥仅在 `.env` 或托管平台Secrets保存；不能在客户端脚本中配置。
- 模型失败不降级成伪 AI 结果；没有密钥时始终清晰标识演示模板模式。
- 严格输出JSON Schema：策略、营销本地化、执行、广告风险、证据清单。
- 报告预算占比和金额由服务端重新计算，精确合计到用户指定预算。
- 公开部署的最简保护：单IP限流、进程内每日上限、可选访问口令。

**上线状态**：OpenAI 兼容端到端测试使用本地模拟接口通过；尚需项目拥有者自行配置真实API Key并执行生产环境调用验证。


## v0.3 provider update — DeepSeek / OpenAI

Environment variable `AI_PROVIDER` chooses `deepseek` or `openai`. With `deepseek`, the backend calls DeepSeek Responses API using `DEEPSEEK_API_KEY` and `deepseek-flash`; with `openai`, it retains OpenAI Responses API compatibility. Both return the same application report schema. DeepSeek model requests use `reasoning.effort=none` to make short reports quicker; both require an API balance, and both are mocked in automated tests rather than live-charged. See `docs/DEEPSEEK-SETUP.md`.
