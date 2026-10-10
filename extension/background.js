import { normalize } from './settings.js';
let tail = Promise.resolve();
function serial(fn) { const next = tail.then(fn); tail = next.catch(() => {}); return next; }
async function handle(message) {
  if (message.type === 'feed-status') return chrome.storage.session.set({feedBridge:{installed:message.installed === true,batch:[12,24,36,48,60].includes(message.batch) ? message.batch : 0,at:Date.now()}});
  if (message.type === 'open') return chrome.runtime.openOptionsPage();
  if (message.type === 'settings') return serial(async () => {
    const current = normalize((await chrome.storage.local.get('settings')).settings);
    const updated = normalize({ ...current, ...message.patch });
    if (message.restore) updated.restored = [...new Set([...current.restored, String(message.restore)])].slice(-1000);
    if (message.whitelist && /^\d+$/.test(String(message.whitelist))) updated.whitelist = [...new Set([...current.whitelist, String(message.whitelist)])].slice(-1000);
    if(message.removeWhitelist) updated.whitelist=updated.whitelist.filter(id=>id!==String(message.removeWhitelist));
    if(message.whitelist && updated.whitelist.includes(String(message.whitelist))) updated.whitelistNames[String(message.whitelist)]=String(message.author||'').slice(0,100);
    await chrome.storage.local.set({ settings: updated });
    return updated;
  });
  if (message.type === 'record') return serial(async () => {
    const r = message.record;
    if (!r || typeof r.id !== 'string' || !['video', 'ad', 'live', 'event', 'bangumi', 'guochuang', 'manga', 'variety', 'course', 'shopping'].includes(r.kind)) throw new Error('无效记录');
    const { records = [] } = await chrome.storage.local.get('records');
    await chrome.storage.local.set({ records: [r, ...records.filter(x => x.id !== r.id)].slice(0, 500) });
    return true;
  });
  if (message.type === 'clear') return serial(() => chrome.storage.local.set({ records: [] }));
  throw new Error('未知请求');
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  handle(message).then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error.message }));
  return true;
});
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

