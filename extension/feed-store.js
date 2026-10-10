// Only the two counters used by filtering cross the page/extension boundary.
export class FeedStore {
  #items = new Map();
  update(items) {
    if (!Array.isArray(items)) return false;
    let changed = false;
    for (const item of items.slice(0,2000)) {
      if (!/^BV[0-9A-Za-z]{10}$/.test(item?.bvid)) continue;
      const stats = {};
      for (const key of ['view','like']) if (Number.isFinite(item.stats?.[key]) && item.stats[key] >= 0) stats[key] = item.stats[key];
      const mid = /^\d+$/.test(String(item.mid)) ? String(item.mid) : undefined;
      const stamp = JSON.stringify({stats,mid});
      if (this.#items.get(item.bvid)?.stamp === stamp) continue;
      this.#items.set(item.bvid,{stats,mid,stamp}); changed = true;
    }
    while (this.#items.size > 2000) this.#items.delete(this.#items.keys().next().value);
    return changed;
  }
  enrich(card) {
    const item = this.#items.get(card.bvid);
    return item ? {...card,stats:{...card.stats,...item.stats},mid:item.mid || card.mid} : card;
  }
}
