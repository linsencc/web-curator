import { TAG_COLORS } from './palette.js';
import { normalize } from './settings.js';
import {send} from './messaging.js';
import {renderRecords} from './records.js';
import { KIND_LABELS } from './cards.js';
const $ = id => document.getElementById(id);
const form = $('settings-form');
const dirtyLists = new Set();
form.addEventListener('input', event => { dirtyLists.add(event.target.name); updateSaveState(); });
function updateSaveState() {
  const dirty = dirtyLists.size > 0;
  $('save-state').textContent = dirty ? '有未保存的修改' : '已保存';
  $('save-state').classList.toggle('unsaved',dirty);
  $('save').disabled = !dirty; $('revert').disabled = !dirty;

}
let settings;
let ruleDraft = [];
let bandDraft = [];
const ruleNames = {combined:'低播放 + 低点赞率',likes:'低点赞率过滤',views:'低播放量过滤'};
function renderRules() {
  const root = $('quality-rules'); root.replaceChildren();
  ruleDraft.forEach((rule,index)=>{
    const row = document.createElement('div'); row.className='quality-rule'; row.dataset.rule=rule.id;
    const rank=document.createElement('span');rank.className='rule-rank';rank.textContent=String(index+1);
    const label=document.createElement('label');label.className='inline-toggle';const input=document.createElement('input');input.type='checkbox';input.checked=rule.enabled;input.name='rule-'+rule.id;
    input.onchange=()=>{rule.enabled=input.checked;dirtyLists.add('rules');updateSaveState();};label.append(input,document.createTextNode(ruleNames[rule.id]));row.append(rank,label);
    for(const [text,delta] of [['上移',-1],['下移',1]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',ruleNames[rule.id]+text);b.disabled=index+delta<0||index+delta>=ruleDraft.length;b.onclick=()=>{[ruleDraft[index],ruleDraft[index+delta]]=[ruleDraft[index+delta],ruleDraft[index]];dirtyLists.add('rules');renderRules();updateSaveState();};row.append(b);}
    const fields=document.createElement('div');fields.className='rule-fields';
    for (const [key,title,step] of [['minViews','播放量低于',1],['likeRate','点赞率低于（%）',0.01]]) {
      if ((rule.id==='likes' && key==='minViews') || (rule.id==='views' && key==='likeRate')) continue;
      const field=document.createElement('label');field.dataset.field=key;const number=document.createElement('input');Object.assign(number,{type:'number',name:rule.id+'-'+key,min:'0',max:'10000000000',step:String(step),required:true,value:String(rule[key])});
      number.setAttribute('aria-label',ruleNames[rule.id]+'：'+title);number.oninput=()=>{rule[key]=Number(number.value);};field.append(number);fields.append(field);
    }
    row.append(fields);root.append(row);
  });
}
let statusTimer;
const status = text => { $('status').textContent = text; clearTimeout(statusTimer); statusTimer = setTimeout(() => { $('status').textContent = ''; }, 5000); };
const toggles = { dynamicOptimize:'动态页面优化', quality:'启用检查', ads:'广告', live:'直播', event:'赛事', bangumi:'番剧', guochuang:'国创', manga:'漫画', variety:'综艺', course:'课堂', shopping:'购物' };
for (const [key, title] of Object.entries(toggles)) {
  if (key === 'quality' || key === 'dynamicOptimize') continue;
  const label = document.createElement('label'); label.className = 'toggle-card';
  const text = document.createElement('span'); const strong = document.createElement('strong'); strong.textContent = title; text.append(strong);
  const input = document.createElement('input'); input.type = 'checkbox'; input.name = key;
  label.append(text,input); $('categories').append(label);
}
for (const [kind,title] of Object.entries(KIND_LABELS)) { const option = document.createElement('option'); option.value = kind; option.textContent = title; $('kind').append(option); }
async function load() { settings = normalize((await chrome.storage.local.get('settings')).settings); for (const key of Object.keys(toggles)) form.elements[key].checked = settings[key]; form.elements.loadBatch.value = settings.loadBatch; ruleDraft = settings.rules.map(r=>({...r})); renderRules(); bandDraft=settings.rateBands.map(b=>({...b})); renderBands(); dirtyLists.clear(); updateSaveState(); }
$('revert').onclick = () => { void load(); };
window.addEventListener('beforeunload', event => { if (dirtyLists.size) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (dirtyLists.size) form.requestSubmit(); } });
form.onsubmit = async event => { event.preventDefault(); try {
  const patch = {};
  patch.loadBatch = Number(form.elements.loadBatch.value);
  patch.rules = ruleDraft;
  patch.rateBands = bandDraft;
  for (const key of Object.keys(toggles)) patch[key] = form.elements[key].checked;
  settings = await send({ type:'settings',patch }); dirtyLists.clear(); updateSaveState(); status('已保存，已同步到打开的页面');
} catch (error) { status(error.message); } };
for (const name of ['settings','records','whitelist']) $(`${name}-tab`).onclick = () => { for (const n of ['settings','records','whitelist']) { $(`${n}-panel`).hidden = n !== name; $(`${n}-tab`).setAttribute('aria-pressed',String(n === name)); } document.querySelector('h1').textContent = name === 'records' ? '过滤记录' : name === 'whitelist' ? 'UP 白名单' : '筛选规则'; document.querySelector('.header-actions').hidden = name !== 'settings'; document.body.classList.toggle('records-view', name === 'records'); if (name === 'records') void renderRecords(); if(name === 'whitelist') void renderWhitelist(); };
const tooltip = $('tooltip');
for (const help of document.querySelectorAll('.help')) {
  const show = () => { tooltip.textContent = help.dataset.help; tooltip.hidden = false; const rect = help.getBoundingClientRect(); tooltip.style.left = `${Math.min(rect.left,innerWidth - 380)}px`; tooltip.style.top = `${Math.min(rect.bottom + 8,innerHeight - tooltip.offsetHeight - 12)}px`; };
  help.onmouseenter = show; help.onfocus = show; help.onmouseleave = () => { tooltip.hidden = true; }; help.onblur = help.onmouseleave;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') tooltip.hidden = true; });
chrome.storage.onChanged.addListener((changes,area) => {
  if (area !== 'local') return;
  if(changes.settings && !$('whitelist-panel').hidden) void renderWhitelist();
  if (changes.records && !$('records-panel').hidden) void renderRecords();

});
function renderBands() {
  $('rate-bands').replaceChildren();
  bandDraft.forEach((band,index)=>{
    const row=document.createElement('div');row.className='band-row';
    const label=document.createElement('label');label.textContent='';const n=document.createElement('input');Object.assign(n,{type:'number',min:'0',step:'0.01',required:true,value:band.min,name:'band-'+index});n.setAttribute('aria-label','第 '+(index+1)+' 档点赞率下限（%）');n.oninput=()=>{band.min=Number(n.value);row.querySelector('.band-preview').textContent='点赞率 '+band.min+'%';};label.append(n);
    const select=document.createElement('select');select.setAttribute('aria-label','第 '+(index+1)+' 档颜色');for(const [value,text] of Object.entries(TAG_COLORS)){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}select.value=band.color;
    const preview=document.createElement('span');preview.className='band-preview';preview.textContent='点赞率 '+band.min+'%';preview.dataset.color=band.color;select.onchange=()=>{band.color=select.value;preview.dataset.color=band.color;dirtyLists.add('rateBands');updateSaveState();};
    const remove=document.createElement('button');remove.type='button';remove.textContent='删除';remove.onclick=()=>{bandDraft.splice(index,1);dirtyLists.add('rateBands');renderBands();updateSaveState();};row.append(label,select,preview,remove);$('rate-bands').append(row);
  });$('add-band').disabled=bandDraft.length>=8;
}
$('add-band').onclick=()=>{bandDraft.push({min:15,color:'pink'});dirtyLists.add('rateBands');renderBands();updateSaveState();};
async function renderWhitelist() {
  const data=await chrome.storage.local.get(['settings','records']);const current=normalize(data.settings);const root=$('whitelist-list');root.replaceChildren();
  if(!current.whitelist.length){root.textContent='暂无 UP 白名单，可从过滤记录中加入。';return;}
  for(const id of current.whitelist){const row=document.createElement('div');row.className='white-row';const a=document.createElement('a');a.href='https://space.bilibili.com/'+id;a.target='_blank';a.rel='noopener';a.textContent=(current.whitelistNames[id]||(data.records||[]).find(r=>String(r.mid)===id)?.author||'UP 主')+' · UID '+id;const b=document.createElement('button');b.textContent='移除';b.onclick=async()=>{await send({type:'settings',removeWhitelist:id});await renderWhitelist();};row.append(a,b);root.append(row);}
}
await load();
function batchStatus(value) { $('batch-status').textContent = value?.installed ? '首页已接入' : '等待支持的首页'; }
batchStatus((await chrome.storage.session.get('feedBridge')).feedBridge);
chrome.storage.onChanged.addListener((changes,area) => { if (area === 'session' && changes.feedBridge) batchStatus(changes.feedBridge.newValue); });
