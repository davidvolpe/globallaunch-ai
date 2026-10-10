import { REGIONS } from './validate.mjs';

const CULTURE = {
  AU: { angle: '直白、实用、注重明确的购买信息与真实证明', tag: 'Made for real routines, not perfect ones.', note: '澳洲英语通常偏好自然、直接的沟通；有关环保、功效及“最佳”等主张需有证据。', lang: 'Australian English' },
  SG: { angle: '兼顾便利性、价值和多文化群体需求', tag: 'Less friction. More everyday value.', note: '不要将新加坡受众视为单一语言或文化群体；需要进一步做语言与客群细分。', lang: 'Singapore English' },
  UK: { angle: '清晰说明价值、减少夸张营销话术', tag: 'A smarter fit for your everyday.', note: '英国文案要核查价格、折扣、对比与功效声明；平台和行业规则可能不同。', lang: 'British English' },
  US: { angle: '利益点前置，针对细分市场测试不同表达', tag: 'Better starts with one clear choice.', note: '美国各州和各行业对营销及数据使用的要求可能不同。', lang: 'US English' }
};
const GOAL_PHRASE = { Awareness: '建立初始品牌认知', 'Lead generation': '获得高意向潜在客户', 'First purchases': '推动第一批可验证订单', 'Market validation': '验证消费者需求和渠道匹配' };
const CHANNEL_INFO = {
  Instagram: ['Visual storytelling', '突出真实使用场景和清楚的产品价值'],
  TikTok: ['Creator-led short video', '用自然的短视频展示问题、解决思路和真实场景'],
  'Google Search': ['High-intent search', '面向有明确需求的关键词，使用精确的落地页信息'],
  LinkedIn: ['Professional credibility', '用专业洞察与客户场景建立信任'],
  Email: ['Lifecycle nurture', '通过用户许可后的邮件持续解释价值与提供更新']
};
const ALLOCATION = { Instagram: 26, TikTok: 26, 'Google Search': 30, LinkedIn: 28, Email: 12 };

export function buildDemoReport(b) {
  const locale = CULTURE[b.region];
  const region = REGIONS[b.region];
  const totalWeight = b.channels.reduce((s, c) => s + ALLOCATION[c], 0);
  const roundedShares = b.channels.map((c, i) => i === b.channels.length - 1 ? 0 : Math.round(ALLOCATION[c] / totalWeight * 100));
  roundedShares[roundedShares.length - 1] = 100 - roundedShares.slice(0, -1).reduce((x,y)=>x+y,0);
  const amounts = roundedShares.map((share, i) => i === roundedShares.length - 1 ? b.budget - roundedShares.slice(0,-1).reduce((s,p)=>s+Math.round(b.budget*p/100),0) : Math.round(b.budget*share/100));
  const primary = b.channels[0];
  const purpose = GOAL_PHRASE[b.goal];
  const hook = locale.tag;
  const value = b.valueProp.replace(/[。.!！]+$/,'');
  return {
    strategy: {
      headline: `${b.brand} · ${region.name} 30日市场启动计划`,
      summary: `围绕「${purpose}」，向${b.audience}说明核心价值：“${value}”。建议先进行小规模渠道实验，再根据实际转化数据分配后续预算。这是基于简报的规划假设，不是对市场需求的实证结论。`,
      persona: { name: '假设受众画像 / Working persona', need: `希望在${b.industry}领域更快找到适合自己需求的选择`, friction: '对新品牌的产品价值、可信度和购买流程缺少足够信息', trigger: `看到与日常场景相关、且能核实的明确利益点` },
      positioning: `面向${b.audience}，${b.brand}以「${value}」为核心主张，通过透明的说明、实际场景和可验证的承诺建立市场认知。`,
      keyMessage: `${b.brand}: ${hook}`,
      assumptions: ['目标人群、需求和渠道偏好来自用户输入，尚未进行真实受众调查。', '预算分配是实验性建议，不代表平台历史表现。', '示例营销文案不能替代当地语言母语审校或法律审核。'],
      nextValidation: ['采访5–8位符合条件的当地消费者，验证痛点与表达是否成立。', `在${primary}与第二渠道（如有）运行小额A/B实验，收集真实点击和咨询。`, '检查产品功效、价格、供应链及当地广告法规的真实证明材料。']
    },
    localisation: {
      sourceCopy: `${b.brand}，为${b.audience}提供${value}。立即了解。`,
      heroCopy: `${hook} Discover ${b.brand} — a considered option for your everyday needs.`,
      altCopy: `Looking for a better fit? See what ${b.brand} offers, how it works, and whether it's right for you.`,
      rationale: `目标为${locale.lang}风格，采用“具体场景 + 清楚的价值解释 + 轻量行动”结构，而非逐字翻译。正式上线前应由当地用户进行语义和文化测试。`,
      channels: b.channels.map(c => ({channel:c, angle:CHANNEL_INFO[c][0], idea:`${CHANNEL_INFO[c][1]}；围绕“${value}”制作首轮内容。`, sample:`${b.brand} — ${hook} Explore the details before you decide.`})),
      culturalNotes: [locale.note, `建议对${b.audience}进一步按动机和媒介使用习惯细分。`, '避免没有证据支持的绝对化、健康功效或价格优势表述。']
    },
    execution: {
      allocation: b.channels.map((c,i)=>({channel:c,percent:roundedShares[i],amount:amounts[i],why: CHANNEL_INFO[c][1]})),
      timeline: [
        {week:'Week 1', title:'Research & setup', actions:['完成竞争信息核查、受众访谈与价值主张修订', '配置落地页、事件追踪和隐私告知']},
        {week:'Week 2', title:'Creative pilot', actions:['制作两种当地语气的广告素材与落地页', '按低风险小预算同时测试两个内容方向']},
        {week:'Week 3', title:'Optimise', actions:['核查点击率、有效咨询和转化路径', '停止明显低效创意，更新用户反馈假设']},
        {week:'Week 4', title:'Review & decide', actions:['汇总渠道与素材指标并分析受众反馈', '确定放大、修改或停止的下阶段决策标准']}
      ],
      kpis:[
        {name: b.goal==='Lead generation'?'Qualified leads':b.goal==='First purchases'?'Verified orders':b.goal==='Market validation'?'Validated interviews':'Relevant reach', target:'先建立基线', note:'核心结果指标：先用首周真实数据设置可行目标'},
        {name:'Landing-page conversion', target:'跟踪，不预设行业基准', note:'以有效行为数/独立访客数计算'},
        {name:'Cost per outcome', target:'预算÷实际成果数', note:'用真实支出和合格成果计算，不提供伪造预测'}
      ],
      experiments:[{name:'Value proposition A/B', a:'突出使用场景和明确痛点', b:'突出产品差异点和透明证明', metric:'有效咨询/点击、真实反馈'},{name:'Creative format A/B',a:'15秒短视频（场景演示）',b:'静态轮播（价值分解）',metric:'有效转化率与单次有效成果成本'}]
    },
    risk: {
      flags:[
        {level:'high', label:'功效/优势主张', issue:'原始价值主张可能包含未经验证的结果承诺。', fix:'只保留能通过产品测试、公开数据或第三方材料支持的陈述。'},
        {level:'medium', label:'消费者与隐私', issue:'追踪像素、邮件名单及重定向广告可能涉及当地隐私规则。', fix:'在上线前检查同意、告知、数据保留和平台规则。'},
        {level:'medium', label:'文化适配', issue:'按国家推断受众偏好容易产生过度概括。', fix:'使用当地访谈和小规模测试校正语言、图像和渠道选择。'}
      ],
      checklist:['所有数字与“最优”“第一”等对比词均有可核实证据','创作者合作和赞助内容按当地规则披露','价格、退款、运输及售后信息准确透明','广告素材已通过当地语言与品牌人工复核'],
      disclaimer:'该模块为初步营销风险清单，不构成法律建议，也不保证符合当地法规。'
    },
    evidence: {
      claims:[{claim:'消费者愿意购买',status:'Unverified',verification:'通过访谈、预售意愿或付费测试验证'},{claim:'渠道表现与预算回报',status:'Hypothesis',verification:'通过真实投放数据核验，不使用虚构ROAS'},{claim:'产品具体功效和差异',status:'Needs evidence',verification:'要求品牌提供性能测试、产品规格及有效证明'}],
      safeguards:['不声称已进行实时联网市场调研','不编造市场规模、ROI、引用来源和转化率','将假设、建议与已验证事实分开呈现','所有面向公众的广告发布前需要人工审核']
    }
  };
}
