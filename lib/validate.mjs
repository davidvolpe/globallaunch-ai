export const REGIONS = {
  AU: { name: 'Australia', currency: 'AUD', culture: 'Clear, practical, evidence-led copy; avoid unsubstantiated superiority claims.' },
  SG: { name: 'Singapore', currency: 'SGD', culture: 'Multilingual audience; avoid treating all communities as a single segment.' },
  UK: { name: 'United Kingdom', currency: 'GBP', culture: 'Plain-English value propositions; review sector-specific advertising rules.' },
  US: { name: 'United States', currency: 'USD', culture: 'Specify the state and segment when making jurisdiction-dependent assertions.' }
};
export const INDUSTRIES = ['Beauty & personal care', 'Consumer electronics', 'Food & beverage', 'Professional services', 'Fashion & lifestyle', 'Other'];
export const GOALS = ['Awareness', 'Lead generation', 'First purchases', 'Market validation'];
export const CHANNELS = ['Instagram', 'TikTok', 'Google Search', 'LinkedIn', 'Email'];

export function normalizeBrief(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw error('请输入有效的品牌信息。');
  const str = (name, max, required = true) => {
    const value = raw[name];
    if (typeof value !== 'string') { if (!required && value === undefined) return ''; throw error(`${name} 格式无效。`); }
    const clean = value.trim().replace(/\s+/g, ' ');
    if (required && !clean) throw error(`请填写 ${name}。`);
    if (clean.length > max) throw error(`${name} 不能超过 ${max} 个字符。`);
    return clean;
  };
  const brand = str('brand', 80);
  const description = str('description', 600);
  const audience = str('audience', 180);
  const valueProp = str('valueProp', 300);
  const region = str('region', 2);
  const industry = str('industry', 60);
  const goal = str('goal', 40);
  const tone = str('tone', 40, false) || 'Trustworthy & clear';
  if (!REGIONS[region]) throw error('不支持所选目标市场。');
  if (!INDUSTRIES.includes(industry)) throw error('请选择支持的行业。');
  if (!GOALS.includes(goal)) throw error('请选择支持的营销目标。');
  const budget = Number(raw.budget);
  if (!Number.isFinite(budget) || budget < 100 || budget > 10_000_000 || !Number.isInteger(budget)) throw error('预算须为100至10,000,000之间的整数。');
  const channels = Array.isArray(raw.channels) ? [...new Set(raw.channels)] : [];
  if (channels.length === 0 || channels.length > 5 || channels.some(c => !CHANNELS.includes(c))) throw error('请选择1至5个营销渠道。');
  return { brand, description, audience, valueProp, region, industry, goal, budget, channels, tone, currency: REGIONS[region].currency };
}

function error(message) { const e = new Error(message); e.status = 400; return e; }

export function assertReportShape(r) {
  if (!r || typeof r !== 'object') throw new Error('AI返回了无效的报告。');
  for (const k of ['strategy', 'localisation', 'execution', 'risk', 'evidence']) if (!r[k] || typeof r[k] !== 'object') throw new Error(`AI报告缺少 ${k}。`);
  if (typeof r.strategy.headline !== 'string' || typeof r.strategy.summary !== 'string') throw new Error('AI策略报告字段不完整。');
  const arrays = [r.strategy.assumptions,r.strategy.nextValidation,r.localisation.channels,r.localisation.culturalNotes,r.execution.allocation,r.execution.timeline,r.execution.kpis,r.execution.experiments,r.risk.flags,r.risk.checklist,r.evidence.claims];
  if (arrays.some(a => !Array.isArray(a))) throw new Error('AI报告数据结构不完整。');
  return r;
}
