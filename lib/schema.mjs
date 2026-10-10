// A strict schema for the Responses API: every object lists all required keys
// and disallows extra properties.  This makes UI rendering predictable.
const s = { type: 'string' };
const n = { type: 'integer' };
const arr = items => ({ type: 'array', items });
const obj = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const REPORT_SCHEMA = obj({
  strategy: obj({
    headline:s, summary:s,
    persona:obj({name:s,need:s,friction:s,trigger:s}),
    positioning:s, keyMessage:s, assumptions:arr(s), nextValidation:arr(s)
  }),
  localisation:obj({
    sourceCopy:s, heroCopy:s, altCopy:s, rationale:s,
    channels:arr(obj({channel:s,angle:s,idea:s,sample:s})), culturalNotes:arr(s)
  }),
  execution:obj({
    allocation:arr(obj({channel:s,percent:n,amount:n,why:s})),
    timeline:arr(obj({week:s,title:s,actions:arr(s)})),
    kpis:arr(obj({name:s,target:s,note:s})),
    experiments:arr(obj({name:s,a:s,b:s,metric:s}))
  }),
  risk:obj({
    flags:arr(obj({level:{type:'string',enum:['high','medium','low']},label:s,issue:s,fix:s})),
    checklist:arr(s), disclaimer:s
  }),
  evidence:obj({
    claims:arr(obj({claim:s,status:{type:'string',enum:['Unverified','Hypothesis','Needs evidence']},verification:s})),
    safeguards:arr(s)
  })
});
