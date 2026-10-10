import {recordReason} from './core.js';
import {normalize} from './settings.js';
import {KIND_LABELS} from './cards.js';
import {send} from './messaging.js';
const $=id=>document.getElementById(id);
const status=text=>{document.getElementById('status').textContent=text;};
const safeUrl = (value, image = false) => { try { const u = new URL(value); return u.protocol === 'https:' && (image ? /(^|\.)hdslb\.com$/.test(u.hostname) : /(^|\.)bilibili\.com$/.test(u.hostname)) ? u.href : ''; } catch { return ''; } };
function button(label, fn) { const b = document.createElement('button'); b.textContent = label; b.onclick = async () => { try { await fn(); } catch (e) { status(e.message); } }; return b; }
const pageSize = 12;
let recordPage = 1;
let renderVersion = 0;
function pagination(total,count) {
  const nav = $('pagination'); nav.replaceChildren(); nav.hidden = count === 0;
  const go = async page => { recordPage = page; await renderRecords(); $('records-panel').scrollIntoView({block:'start'}); };
  const previous = button('上一页', () => go(recordPage - 1)); previous.disabled = recordPage === 1; nav.append(previous);
  const pages = [...new Set([1,...Array.from({length:5},(_,i) => recordPage - 2 + i),total])].filter(n => n >= 1 && n <= total).sort((a,b) => a-b);
  let last = 0;
  for (const page of pages) {
    if (last && page - last > 1) { const dots = document.createElement('span'); dots.textContent = '…'; nav.append(dots); }
    const b = button(String(page), () => go(page)); b.setAttribute('aria-label',`第 ${page} 页`); if (page === recordPage) b.setAttribute('aria-current','page'); nav.append(b); last = page;
  }
  const next = button('下一页',() => go(recordPage + 1)); next.disabled = recordPage === total; nav.append(next);
}
export async function renderRecords() {
  const version = ++renderVersion;
  const data = await chrome.storage.local.get(['records','settings']);
  if (version !== renderVersion) return;
  const current = normalize(data.settings);
  const records = (data.records || []).filter(r => ($('kind').value === 'all' || r.kind === $('kind').value) && `${r.title} ${r.author}`.toLowerCase().includes($('search').value.toLowerCase()));
  $('records').replaceChildren();
  $('records-count').textContent = `${records.length} 条匹配记录`;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  recordPage = Math.min(recordPage,pageCount);
  pagination(pageCount,records.length);
  if (!records.length) { $('records').textContent = '暂无匹配记录。浏览 B 站首页后，命中的内容会显示在这里。'; return; }
  for (const r of records.slice((recordPage - 1) * pageSize,recordPage * pageSize)) {
    const row = document.createElement('div'); row.className = 'record';
    const image = safeUrl(r.image,true); if (image) { const img = document.createElement('img'); img.src = image; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; row.append(img); } else { const placeholder = document.createElement('div'); placeholder.className = 'record-placeholder'; placeholder.textContent = KIND_LABELS[r.kind] || '推荐'; row.append(placeholder); }
    const details = document.createElement('div'); details.className = 'details';
    const a = document.createElement('a'); a.textContent = r.title; const url = safeUrl(r.url); if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } details.append(a);
    for (const text of [`${r.author || KIND_LABELS[r.kind]} · ${new Date(r.at).toLocaleString()} · 已过滤${current.restored.includes(r.id) ? ' · 已恢复' : ''}${current.whitelist.includes(String(r.mid)) ? ' · UP 已在白名单' : ''}`, recordReason(r)]) { const p = document.createElement('p'); p.textContent = text; details.append(p); }
    const actions = document.createElement('div'); actions.className = 'actions';
    const restored = current.restored.includes(r.id);
    const restoreButton = button(restored ? '已恢复' : '恢复这一条', async () => { await send({ type:'settings',restore:r.id }); status('已恢复，将同步到首页'); await renderRecords(); }); restoreButton.disabled = restored; actions.append(restoreButton);
    if (r.mid && r.kind === 'video') { const listed = current.whitelist.includes(String(r.mid)); const whiteButton = button(listed ? '已在白名单' : '加入 UP 白名单', async () => { await send({type:'settings',whitelist:r.mid,author:r.author}); await renderRecords(); status('已加入白名单'); }); whiteButton.disabled = listed; actions.append(whiteButton); }
    details.append(actions); row.append(details); $('records').append(row);
  }
}
$('kind').onchange = $('search').oninput = () => { recordPage = 1; void renderRecords(); };
$('clear').onclick = async () => { await send({type:'clear'}); await renderRecords(); status('已清空记录'); };
