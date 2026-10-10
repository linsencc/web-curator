// Use the outer grid item so hidden content leaves no empty slot.
export const CARD_SELECTOR = '.bili-feed-card, .feed-card, .bili-video-card, .bili-live-card, .bili-video-card__wrap, .bili-live-card__wrap, .floor-single-card, .bili-special-card, .bili-video-card__skeleton';
export const KIND_LABELS = {ad:'广告',live:'直播',event:'赛事',bangumi:'番剧',guochuang:'国创',manga:'漫画',variety:'综艺',course:'课堂',shopping:'购物',video:'普通视频'};
const tags = {'赛事':'event','直播':'live','直播中':'live','番剧':'bangumi','国创':'guochuang','漫画':'manga','综艺':'variety','课堂':'course','购物':'shopping'};
export function parseCount(text) {
  const match = String(text || '').replace(/[,，\s]/g,'').match(/^(\d+(?:\.\d+)?)(万|亿)?$/);
  return match ? Number(match[1]) * (match[2] === '亿' ? 1e8 : match[2] === '万' ? 1e4 : 1) : undefined;
}
export function candidates(root = document) {
  const nodes = new Set(root.querySelectorAll(CARD_SELECTOR));
  for (const cover of root.querySelectorAll('.cover-shim')) {
    const item = cover.closest(CARD_SELECTOR) || cover.closest('a')?.parentElement;
    if (item && !['BODY','MAIN'].includes(item.tagName)) nodes.add(item);
  }
  return [...nodes].filter(node => {
    for (let parent=node.parentElement;parent;parent=parent.parentElement) if (nodes.has(parent)) return false;
    return true;
  });
}
export function readCard(node) {
  const links = [...node.querySelectorAll('a[href]')];
  const videoLink = links.find(a => /\/video\/BV[\w]+/.test(a.href));
  const liveLink = links.find(a => { try { const u = new URL(a.href); return u.hostname === 'live.bilibili.com' && /^\/\d+/.test(u.pathname); } catch { return false; } });
  const ad = node.querySelector('.bili-video-card__info--ad, .bili-video-card__stats--ad, .bili-video-card__ad, .ad-mark, [data-is-ad="true"]') || [...node.querySelectorAll('span,div,a,i,b')].some(e => e.textContent.trim() === '广告' && e.textContent.length < 10);
  // Match short badges, never words contained in ordinary video titles.
  const badgeKinds = [...node.querySelectorAll('.cover-shim span, .cover-shim div, [class*="badge"], [class*="tag"], [class*="label"]')].map(e => tags[e.textContent.trim()]).filter(Boolean);
  const special = badgeKinds.includes('event') ? 'event' : badgeKinds[0];
  const mediaLink = links.find(a => /\/bangumi\/play\//.test(a.href) || /^https:\/\/manga\.bilibili\.com\//.test(a.href));
  const kind = ad ? 'ad' : special || (liveLink ? 'live' : mediaLink ? (mediaLink.hostname === 'manga.bilibili.com' ? 'manga' : 'bangumi') : videoLink ? 'video' : null);
  if (!kind) return null;
  const anchor = kind === 'live' ? liveLink || links[0] : mediaLink || videoLink || links.find(a => a.querySelector('img, .cover-shim')) || links[0];
  const url = anchor?.href || '';
  if (!url && kind !== 'ad') return null;
  const bvid = videoLink?.href.match(/\/video\/(BV[0-9A-Za-z]{10})/)?.[1];
  const owner = links.find(a => /^https:\/\/space\.bilibili\.com\/\d+/.test(a.href));
  const titleNode = node.querySelector('.bili-video-card__info--tit, .bili-live-card__info--tit, h3, .title, [class*="title"], [title]');
  const title = titleNode?.getAttribute('title') || titleNode?.textContent?.trim() || anchor?.textContent?.trim() || `${KIND_LABELS[kind]}推荐`;
  let identity = url || node.textContent.trim().slice(0,180); try { const u = new URL(url); identity = u.origin + u.pathname; } catch { /* Keep original identity. */ }
  // First left statistic is plays; the next is danmaku, never likes.
  const view = kind === 'video' ? parseCount(node.querySelector('.bili-video-card__stats--left .bili-video-card__stats--text')?.textContent) : undefined;
  return {id:kind === 'video' ? bvid : `${kind}:${identity}`,kind,bvid,url,title:title.slice(0,200),stats:Number.isFinite(view) ? {view} : undefined,viewSource:Number.isFinite(view) ? 'cover' : undefined,mid:owner?.href.match(/\.com\/(\d+)/)?.[1],author:owner?.textContent?.trim() || '',image:node.querySelector('img')?.currentSrc || node.querySelector('img')?.src || ''};
}

