import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try {
 await Promise.all(['success','error','limit','scrolled','no-skeleton'].map(async mode=>{
  const page=await browser.newPage();
  await page.route('https://www.bilibili.com/',r=>r.fulfill({contentType:'text/html',body:'<div id="app"></div><div class="bili-video-card__skeleton" style="height:100px;width:200px"></div><div style="height:2000px"></div><div class="load-more-anchor" style="height:1px"></div>'}));
  await page.route('https://api.bilibili.com/**',async r=>{await new Promise(resolve=>setTimeout(resolve,300));await r.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(mode==='error'?{code:-400}:{code:0,data:{item:[{bvid:'BV0000000001',stat:{view:1000,like:50}}]}})});});
  await page.goto('https://www.bilibili.com/');
  await page.evaluate(mode=>{
   window.calls=0;window.loading=false;
   document.querySelector('#app').__vue_app__={config:{globalProperties:{$pinia:{_s:new Map([['feed',{data:{},getPsParams:()=>({ps:12})}]])}}}};
   if(mode==='no-skeleton')document.querySelector('.bili-video-card__skeleton').remove();
   window.addEventListener('scroll',async()=>{
    if(window.loading||document.querySelector('.load-more-anchor').getBoundingClientRect().bottom>=innerHeight)return;
    window.calls++;window.loading=true;
    try{await(await fetch('https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?fresh_type=4&ps=12')).json();if(mode==='success')document.querySelector('.bili-video-card__skeleton').remove();}finally{window.loading=false;}
   });
  },mode);
  await page.addScriptTag({path:path.join(path.dirname(fileURLToPath(import.meta.url)),'../extension/feed-bridge.js')});
  if(mode==='scrolled')await page.evaluate(()=>scrollTo(0,100));
  await page.waitForTimeout(8500);
  assert.equal(await page.evaluate(()=>window.calls),mode==='limit'?3:['success','error'].includes(mode)?1:0,mode);
  if(mode!=='scrolled')assert.equal(await page.evaluate(()=>scrollY),0);
  assert.equal(await page.locator('.load-more-anchor').getAttribute('style'),'height:1px');
  await page.close();
 }));
 console.log('PASS opening viewport: fills without scrolling, stops when filled, error stop, three-attempt cap, user-scroll handoff, no unnecessary loads, sentinel restored');
}finally{await browser.close();}
