import { normalize } from './settings.js';
import { decide } from './core.js';
import { candidates, readCard } from './cards.js';
import { FeedStore } from './feed-store.js';
import { renderRateTag } from './rate-tag.js';
import { compactLayout, syncLoadingAnchors } from './layout.js';
import { createToolbar } from './toolbar.js';
import { send, isAlive, onInvalidated } from './messaging.js';

let settings = normalize((await chrome.storage.local.get('settings')).settings);
const feed = new FeedStore();
const states = new Map();
const waiting = new WeakMap();
const toolbar = createToolbar();
let revision = 0;
let stopped=false;
const events=new AbortController();
function clearNode(node) {
  node.classList.remove('bf-hidden','bf-pending');
  node.querySelector('.bf-rate-tag')?.remove();
  compactLayout(node);
}
function process(node) {
  const specialSkeleton = node.matches('.floor-single-card,.bili-special-card') ? node.querySelector('.floor-skeleton') : node.querySelector('.floor-single-card .floor-skeleton');
  // Unsupported feed types can leave a comment-only outer grid cell.
  // Keep media, controls and ordinary loading skeletons; re-evaluate when children arrive.
  const emptySlot = node.matches('.bili-feed-card,.feed-card') && !node.textContent.trim() && !node.querySelector('img,picture,video,canvas,iframe,a,button,input,.bili-video-card__skeleton,.floor-skeleton,[class*="skeleton"],[role]');
  if (specialSkeleton || emptySlot) { states.set(node,{filter:false,unknown:false}); node.classList.add('bf-hidden'); compactLayout(node); return; }
  const raw = readCard(node);
  if (!raw?.id) { clearNode(node); states.delete(node); return; }
  const card = feed.enrich(raw);
  const result = decide(card,settings);
  // A numerical rate is shown including whitelisted videos and videos outside quality rules.
  renderRateTag(node,card,settings.rateBands);
  if (/不足/.test(result.reason)) {
    let pending = waiting.get(node);
    if (!pending || pending.id !== card.id) {
      pending = {id:card.id,until:performance.now()+480}; waiting.set(node,pending); setTimeout(scan,500);
    }
    if (performance.now()<pending.until) { node.classList.add('bf-pending'); return; }
  }
  node.classList.remove('bf-pending');
  node.classList.toggle('bf-hidden',result.filter);
  compactLayout(node);
  const signature=JSON.stringify([revision,card.id,card.mid,card.stats,result]);
  const previous=states.get(node);
  states.set(node,{signature,filter:result.filter,unknown:/不足/.test(result.reason)});
  if (result.filter && previous?.signature!==signature) {
    void send({type:'record',record:{...card,...result,at:Date.now(),thresholds:settings.rules}}).catch(error=>isAlive() && console.warn('首页清选记录保存失败',error.message));
  }
}
function scan() {
  if(stopped || !isAlive())return;
  if (location.pathname !== '/') {
    for (const node of states.keys()) clearNode(node);
    states.clear(); syncLoadingAnchors(); toolbar.update(0,0); return;
  }
  const current = new Set(candidates());
  for (const node of states.keys()) if (!current.has(node)) { clearNode(node); states.delete(node); }
  for (const node of current) process(node);
  syncLoadingAnchors();
  let filtered=0,unknown=0;
  for (const state of states.values()) { if(state.filter)filtered++;if(state.unknown)unknown++; }
  toolbar.update(filtered,unknown);
}
function publishSettings() {
  window.postMessage({source:'bili-filter-settings',batch:settings.loadBatch},location.origin);
}
window.addEventListener('message',event=>{
  if (!isAlive() || event.source!==window || event.origin!==location.origin) return;
  if (event.data?.source==='bili-filter-items' && feed.update(event.data.items)) scan();
  if (event.data?.source==='bili-filter-feed') void send({type:'feed-status',installed:event.data.installed===true,batch:event.data.batch}).catch(()=>{});
},{signal:events.signal});
// Handle insertions before the next paint. Rendering is idempotent.
const observer=new MutationObserver(scan);
observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','src']});
function settingsChanged(changes,area){
  if(area==='local' && changes.settings) {settings=normalize(changes.settings.newValue);revision++;publishSettings();scan();}
}
chrome.storage.onChanged.addListener(settingsChanged);
const timer=setInterval(scan,15000);
onInvalidated(()=>{
  stopped=true;observer.disconnect();events.abort();clearInterval(timer);
  try{chrome.storage.onChanged.removeListener(settingsChanged);}catch{}
  for(const node of states.keys())clearNode(node);
  states.clear();syncLoadingAnchors();toolbar.remove();
  window.postMessage({source:'bili-filter-dispose'},location.origin);
});
publishSettings();
scan();


