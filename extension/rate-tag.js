import { likeRate } from './core.js';

// Idempotent rendering keeps mutation observation from producing redraw loops.
export function renderRateTag(node,card,bands = []) {
  let tag = node.querySelector('.bf-rate-tag');
  if (card.kind !== 'video') { tag?.remove(); return; }
  if (!tag) { tag = document.createElement('span'); tag.className = 'bf-rate-tag'; }
  const target = node.querySelector('.bili-video-card__info--bottom') || node.querySelector('.bili-video-card__info') || node;
  const natives = [...target.querySelectorAll('.bili-video-card__info--icon-text')];
  const lastNative = natives.at(-1);
  // Reconcile order when native badges arrive after the recommendation data.
  if (lastNative) {
    if (lastNative.nextElementSibling !== tag) lastNative.after(tag);
  } else if (tag.parentElement !== target || target.firstElementChild !== tag) target.prepend(tag);
  const rate = likeRate(card.stats);
  const color = rate === null ? 'gray' : [...bands].reverse().find(b=>rate>=b.min)?.color || 'orange';
  if (tag.dataset.color !== color) tag.dataset.color = color;
  const native = target.querySelector('.bili-video-card__info--icon-text');
  if (native) {
    const style=getComputedStyle(native);
    for(const key of ['fontSize','lineHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius']) if(tag.style[key]!==style[key]) tag.style[key]=style[key];
  }
  const text = rate === null ? '点赞率 —' : `点赞率 ${rate.toFixed(2)}%`;
  if (tag.textContent !== text) tag.textContent = text;
  const title = rate === null ? '推荐数据缺少播放或点赞数，或播放量为零，无法计算点赞率。' : `${card.stats.like} 次点赞 / ${card.stats.view} 次播放`;
  if (tag.title !== title) tag.title = title;
}
