import { TAG_COLORS } from './palette.js';
export const DEFAULTS = Object.freeze({ loadBatch: 0, dynamicOptimize: false, ads: true, live: true, event: true, bangumi: true, guochuang: true, manga: true, variety: true, course: true, shopping: true, quality: true, whitelist: [], restored: [] });
const threshold=(value,legacy,fallback)=>Number.isFinite(value)&&value>=0 ? Math.min(value,1e10) : Number.isFinite(legacy)&&legacy>=0 ? Math.min(legacy,1e10) : fallback;
export function normalize(input = {}) {
  const out = { ...DEFAULTS };
  for (const key of Object.keys(out)) {
    if (typeof out[key] === 'boolean' && typeof input[key] === 'boolean') out[key] = input[key];
    if (typeof out[key] === 'number' && Number.isFinite(input[key]) && input[key] >= 0) out[key] = Math.min(input[key], 1e10);
  }
  out.whitelist = [...new Set((Array.isArray(input.whitelist) ? input.whitelist : []).map(String).filter(x => /^\d+$/.test(x)))].slice(-1000);
  out.restored = [...new Set((Array.isArray(input.restored) ? input.restored : []).filter(x => typeof x === 'string'))].slice(-1000);
  out.loadBatch = [12,24,36,48,60].includes(out.loadBatch) ? out.loadBatch : 0;
  // One-way conversion of the previous single-mode setting.
  const previousMode = ['combined','likes','views'].includes(input.qualityMode) ? input.qualityMode : 'combined';
  const ids = ['combined','likes','views'];
  const source = Array.isArray(input.rules) ? input.rules : ids.map(id=>({id,enabled:id===previousMode}));
  const order = [...new Set(source.map(r=>r?.id).filter(id=>ids.includes(id)))];
  out.rules = [...order,...ids.filter(id=>!order.includes(id))].map(id=>({id,enabled:source.find(r=>r?.id===id)?.enabled===true,minViews:threshold(source.find(r=>r?.id===id)?.minViews,input.minViews,5000),likeRate:threshold(source.find(r=>r?.id===id)?.likeRate,input.likeRate,3)}));
  out.rateBands = (Array.isArray(input.rateBands) ? input.rateBands : [{min:0,color:'orange'},{min:5,color:'green'},{min:10,color:'pink'}]).slice(0,8).filter(b=>Number.isFinite(b?.min)&&b.min>=0&&Object.hasOwn(TAG_COLORS,b.color)).map(b=>({min:b.min,color:b.color})).sort((a,b)=>a.min-b.min);
  out.whitelistNames = Object.fromEntries(out.whitelist.map(id=>[id,String(input.whitelistNames?.[id]||'').slice(0,100)]));
  return out;
}
