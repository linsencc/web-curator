let invalidated=false;
const listeners=new Set();
function invalidate(){if(invalidated)return;invalidated=true;for(const fn of listeners)fn();listeners.clear();}
export function onInvalidated(fn){if(invalidated)fn();else listeners.add(fn);}
export function isAlive(){try{if(!chrome.runtime?.id)invalidate();}catch{invalidate();}return !invalidated;}
export async function send(message) {
  if(!isAlive())throw new Error('Extension context invalidated.');
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error || '扩展连接失败');
    return response.data;
  }catch(error){if(/Extension context invalidated/i.test(error.message))invalidate();throw error;}
}
