import {send} from './messaging.js';
export function createToolbar() {
const host = document.createElement('div');
host.id = 'bilibili-filter-toolbar';
const shadow = host.attachShadow({ mode: 'open' });
shadow.innerHTML = `<style>:host{position:fixed;right:16px;bottom:160px;z-index:9999;display:block;width:40px}:host([docked]){position:static;margin:6px 0;clear:both}:host([hidden]){display:none}button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:40px;height:40px;box-sizing:border-box;border:1px solid var(--line_regular,#e3e5e7);border-radius:8px;padding:5px 2px;background:var(--bg1,#fff);color:var(--text1,#18191c);font:12px "Microsoft YaHei",sans-serif;cursor:pointer}button:hover{background:var(--bg2,#f1f2f3);color:var(--brand_blue,#00aeec)}button:focus-visible{outline:2px solid var(--brand_blue,#00aeec);outline-offset:2px}.summary{font-size:10px;color:var(--text3,#9499a0);font-variant-numeric:tabular-nums}</style><button type="button" aria-label="首页清选：打开设置和过滤记录"><span>清选</span><span class="summary">0</span></button>`;
document.body.append(host);
shadow.querySelector('button').onclick = () => send({ type: 'open' }).catch(() => {});
return {remove(){host.remove();},update(filtered,unknown) {
  const dock=document.querySelector('.palette-button-inner .palette-button-wrap');
  const parent=dock || document.body;
  const first = dock?.querySelector(':scope > .watchlater-pip-button');
  if (first) {
    if (first.nextElementSibling !== host) first.after(host);
  } else if (host.parentElement !== parent) parent.append(host);
  host.toggleAttribute('docked',Boolean(dock));
  host.hidden=location.pathname !== '/';
  const label=String(filtered);
  const summary=shadow.querySelector('.summary');if(summary.textContent!==label)summary.textContent=label;
  shadow.querySelector('button').setAttribute('aria-label',`首页清选：${filtered} 条命中，${unknown} 条数据不足，打开设置和过滤记录`);
}};
}
