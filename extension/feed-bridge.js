// Runs in MAIN world. Observe recommendations and reuse the native scroll loader.
(() => {
  let batch = 0;
  let installed = false;

  const snapshots = new Map();
  const recent = new Map();
  let burst = null;
  let burstTimer;
  let restoreAnchor = () => {};
  let activeRequests=0, fillAttempts=0, fillWaiting=false, fillStopped=false, fillTimer;
  let nextFillAt=performance.now()+1800;
  // Only fill the opening viewport. Once the user scrolls, native loading owns it.
  window.addEventListener('scroll',()=>{if(window.scrollY>0)fillStopped=true;},{passive:true});
  function requestNativeLoad() {
    const anchor=document.querySelector('.load-more-anchor');
    if (!anchor || location.pathname!=='/') return false;
    restoreAnchor();
    const style=anchor.getAttribute('style');
    let restored=false;
    const restore=()=>{if(restored)return;restored=true;style===null?anchor.removeAttribute('style'):anchor.setAttribute('style',style);};
    restoreAnchor=restore;
    anchor.style.cssText+=';position:fixed!important;bottom:80px!important;top:auto!important;height:1px!important;width:1px!important;visibility:hidden!important;pointer-events:none!important';
    window.dispatchEvent(new Event('scroll'));
    setTimeout(restore,400);
    return true;
  }
  function fillOpeningViewport() {
    if(fillStopped || !installed || burst || activeRequests || fillWaiting || fillAttempts>=3 || performance.now()<nextFillAt || location.pathname!=='/' || document.visibilityState==='hidden')return;
    const visibleSkeleton=[...document.querySelectorAll('.bili-video-card__skeleton')].some(node=>{
      const r=node.getBoundingClientRect();
      return r.width>0 && r.height>0 && r.top<innerHeight && r.bottom>0 && r.left<innerWidth && r.right>0 && node.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
    });
    if(!visibleSkeleton)return;
    fillAttempts++;fillWaiting=true;
    fillTimer=setTimeout(()=>{fillWaiting=false;fillStopped=true;restoreAnchor();},8000);
    if(!requestNativeLoad()){clearTimeout(fillTimer);fillWaiting=false;fillStopped=true;}
  }
  function stopBatch() { burst=null; clearTimeout(burstTimer); restoreAnchor(); }
  function continueBatch(body,url) {
    let type; try { type = new URL(url,location.href).searchParams.get('fresh_type'); } catch { return; }
    if (type !== '4') return;
    if (!batch || body?.code !== 0 || !body.data?.item?.length) { stopBatch(); return; }
    if (!burst) burst={remaining:batch,rounds:0};
    burst.remaining-=body.data.item.length; burst.rounds++;
    clearTimeout(burstTimer);
    if (burst.remaining<=0 || burst.rounds>=5) {stopBatch();return;}
    burstTimer=setTimeout(()=>{
      if (!requestNativeLoad()) {stopBatch();return;}
      burstTimer=setTimeout(stopBatch,8000);
    },800);
  }
  function publishItems(data) {
    const items = []; let budget = 4000;
    const visit = (value,depth=0) => {
      if (!value || typeof value !== 'object' || depth > 7 || --budget < 0) return;
      const stats = value.stat || value.stats;
      if (/^BV[0-9A-Za-z]{10}$/.test(value.bvid) && stats && typeof stats === 'object') {
        const clean = {};
        for (const key of ['view','like']) if (Number.isFinite(stats[key]) && stats[key] >= 0) clean[key] = stats[key];
        const mid = value.owner?.mid ?? value.author?.mid;
        const item = {bvid:value.bvid,stats:clean};
        if (/^\d+$/.test(String(mid))) item.mid = String(mid);
        recent.set(item.bvid,item);
        const signature = JSON.stringify(item);
        if (snapshots.get(item.bvid) !== signature) { snapshots.set(item.bvid,signature); items.push(item); }
        return;
      }
      for (const child of Object.values(value)) visit(child,depth+1);
    };
    visit(data);
    while (snapshots.size > 2000) snapshots.delete(snapshots.keys().next().value);
    while (recent.size > 2000) recent.delete(recent.keys().next().value);
    if (items.length) window.postMessage({source:'bili-filter-items',items},location.origin);
  }
  const isFeed = url => { try { const u = new URL(url,location.href); return location.pathname === '/' && u.hostname === 'api.bilibili.com' && /\/x\/web-interface\/(?:wbi\/)?index\/top\/feed\/rcmd$/.test(u.pathname); } catch { return false; } };
  const consume = (body,url) => {
    if(fillWaiting){clearTimeout(fillTimer);fillWaiting=false;nextFillAt=performance.now()+1500;}
    if(body?.code!==0 || !body.data?.item?.length)fillStopped=true;
    if (body?.code === 0) publishItems(body.data);
    continueBatch(body,url);
  };
  const nativeFetch = window.fetch;
  window.fetch = async function(...args) {
    const tracked=isFeed(args[0] instanceof Request ? args[0].url : args[0]);
    if(tracked)activeRequests++;
    let response;
    try { response = await nativeFetch.apply(this,args); }
    catch(error){if(tracked)fillStopped=true;throw error;}
    finally{if(tracked)activeRequests--;}
    if (isFeed(response.url || (args[0] instanceof Request ? args[0].url : args[0]))) {
      try { consume(await response.clone().json(),response.url || args[0]); } catch { /* Leave native response untouched. */ }
    }
    return response;
  };
  const nativeOpen = XMLHttpRequest.prototype.open;
  const urls = new WeakMap();
  XMLHttpRequest.prototype.open = function(method,url,...rest) {
    urls.set(this,String(url)); return nativeOpen.call(this,method,url,...rest);
  };
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    if (isFeed(urls.get(this))) {
      activeRequests++;
      this.addEventListener('loadend',()=>{activeRequests--;},{once:true});
      for(const event of ['error','abort','timeout'])this.addEventListener(event,()=>{fillStopped=true;},{once:true});
      this.addEventListener('load',() => {
      try { consume(this.responseType === 'json' ? this.response : JSON.parse(this.responseText),urls.get(this)); } catch { /* Unknown response is retained. */ }
    },{once:true});
    }
    return nativeSend.apply(this,args);
  };
  const publish = () => window.postMessage({source:'bili-filter-feed',installed,batch},location.origin);
  function install() {
    const app = document.querySelector('#app')?.__vue_app__;
    const stores = app?.config?.globalProperties?.$pinia?._s;
    const feed = stores?.get('feed');
    if (!feed || typeof feed.getPsParams !== 'function') { installed = false; return; }
    publishItems(feed.data);
    if (!installed) { installed = true; publish(); }
  }
  window.addEventListener('message',event => {
    if(event.source!==window || event.origin!==location.origin)return;
    if(event.data?.source==='bili-filter-dispose'){fillStopped=true;clearTimeout(fillTimer);clearInterval(installTimer);stopBatch();return;}
    if(event.data?.source!=='bili-filter-settings')return;
    batch = [12,24,36,48,60].includes(event.data.batch) ? event.data.batch : 0;
    stopBatch();
    snapshots.clear();
    if (recent.size) window.postMessage({source:'bili-filter-items',items:[...recent.values()]},location.origin);
    install(); publish();
  });
  const installTimer=setInterval(()=>{install();fillOpeningViewport();},1000);
  install();
})();


