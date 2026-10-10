import {normalize} from './settings.js';
import {isAlive,onInvalidated} from './messaging.js';

let enabled=false, stopped=false, scheduled=false;
const panels=new Map();
function clear() {
  document.documentElement.classList.remove('bf-dynamic');
  for(const [panel,tools] of panels){tools.remove();}
  panels.clear();
}
function update() {
  scheduled=false;
  if(stopped || !isAlive())return;
  if(!enabled || location.pathname!=='/'){clear();return;}
  document.documentElement.classList.add('bf-dynamic');
  for(const [panel,tools] of panels)if(!panel.isConnected){tools.remove();panels.delete(panel);}
  for(const panel of document.querySelectorAll('.bili-dyn-home--member .bili-dyn-up-list')){
    let tools=panels.get(panel);
    if(!tools){
      tools=document.createElement('div');tools.className='bf-up-heading';tools.textContent='关注动态';
      panel.prepend(tools);panels.set(panel,tools);
    }

  }
}
const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(update);}});
function changed(changes,area){if(area==='local' && changes.settings){enabled=normalize(changes.settings.newValue).dynamicOptimize;update();}}
onInvalidated(()=>{stopped=true;observer.disconnect();clear();clearInterval(timer);try{chrome.storage.onChanged.removeListener(changed);}catch{}});
const timer=setInterval(()=>{if(isAlive())update();},3000);
try{
  enabled=normalize((await chrome.storage.local.get('settings')).settings).dynamicOptimize;
  if(isAlive()){
    chrome.storage.onChanged.addListener(changed);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    update();
  }
}catch{isAlive();}
