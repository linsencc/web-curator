import { normalize } from './settings.js';
export { normalize, DEFAULTS } from './settings.js';
export function likeRate(stats) { return Number.isFinite(stats?.view) && stats.view > 0 && Number.isFinite(stats?.like) && stats.like >= 0 ? stats.like / stats.view * 100 : null; }
const valid = x => Number.isFinite(x) && x >= 0;
export function decide(video, settings) {
  const s = normalize(settings);
  const result = (filter, reason, extra = {}) => ({ filter, reason, ...extra });
  if (s.restored.includes(video.id)) return result(false, '手动恢复');
  if (video.kind === 'ad') return result(s.ads, '广告卡片');
  if (video.kind === 'live') return result(s.live, '直播推荐');
  const categories = {event:'赛事',bangumi:'番剧',guochuang:'国创',manga:'漫画',variety:'综艺',course:'课堂',shopping:'购物'};
  if (categories[video.kind]) return result(s[video.kind], `${categories[video.kind]}推荐卡片`);
  if (!s.quality) return result(false, '视频筛选未开启');
  if (s.whitelist.includes(String(video.mid))) return result(false, 'UP 主白名单');
  const v = video.stats || {};
  if (!valid(v.view)) return result(false, '播放数据不足，暂时保留');
  let missing = false;
  for (const rule of s.rules) {
    if (!rule.enabled) continue;
    const extra = {rule:rule.id};
    if (rule.id === 'views') {
      if (v.view < rule.minViews) return result(true, `播放量 ${v.view} < ${rule.minViews}`,extra);
      continue;
    }
    if (rule.id === 'combined' && v.view >= rule.minViews) continue;
    if (v.view === 0 || !valid(v.like)) { missing = true; continue; }
    const rates = {like:likeRate(v)};
    if (rates.like < rule.likeRate) return result(true, `${rule.id === 'combined' ? `播放量 ${v.view} < ${rule.minViews}；` : ''}点赞率 ${rates.like.toFixed(2)}% < ${rule.likeRate}%`,{...extra,rates});

  }
  return result(false,missing ? '点赞数据不足，暂时保留' : '未命中过滤规则');
}

// Historical reasons use their saved snapshot, never today's thresholds.
export function recordReason(record) {
  if (!record.reason?.startsWith('低播放；')) return record.reason;
  const view = record.stats?.view;
  if (!valid(view)) return record.reason;
  const threshold = record.thresholds?.find(r => r.id === 'combined')?.minViews;
  return record.reason.replace('低播放；', valid(threshold) ? `播放量 ${view} < ${threshold}；` : `播放量 ${view}（当时阈值未记录）；`);
}
