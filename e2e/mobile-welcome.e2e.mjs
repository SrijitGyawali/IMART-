// Production browser regression: no orders or WhatsApp messages are sent.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const BASE=process.env.BASE_URL??'http://localhost:3112';
const OUT='e2e/.artifacts/welcome';fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
let checks=0;
const errors=[];
function check(label,value){assert.ok(value,label);console.log('PASS '+label);checks++;}
const ready=p=>p.waitForSelector('main[data-phone="ready"]',{timeout:45000});
const filmScroll=(p,f)=>p.evaluate(f=>{const el=document.querySelector('.landing-film');scrollTo(0,el.getBoundingClientRect().top+scrollY+f*(el.offsetHeight-innerHeight));},f);
try {
 for(const [width,height] of [[390,844],[360,740],[320,568],[1440,900]]){
  const mobile=width<761;
  const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(BASE+'/?tier='+(mobile?'mid':'high'),{waitUntil:'networkidle'});await ready(p);await p.waitForTimeout(1800);
  const bounds=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom};};return{headline:box('.hero-title'),phone:box('.hero-device-slot'),finishes:box('.finish-picker'),purchase:box('.hero-purchase'),shop:box('.hero-ctas .landing-cta'),chat:box('.hero-whatsapp'),overflow:document.documentElement.scrollWidth>innerWidth,boot:document.documentElement.dataset.boot};});
  check(width+': no horizontal overflow',!bounds.overflow);
  check(width+': shop and WhatsApp fit the opening screen',bounds.shop.bottom<=height&&bounds.chat.bottom<=height);
  if(mobile){check(width+': headline above phone above finishes',bounds.headline.bottom<=bounds.phone.top+1&&bounds.phone.bottom<=bounds.finishes.top+1);check(width+': boot never hides mobile content',bounds.boot==='skip');}
  check(width+': new fallback available',await p.locator('.hero-poster').evaluate(e=>e.complete&&e.naturalWidth>0&&e.src.includes('v2')));
  const href=await p.locator('.hero-whatsapp').getAttribute('href');const url=new URL(href);
  check(width+': WhatsApp uses real contact and product enquiry',url.hostname==='wa.me'&&/^\/977\d+$/.test(url.pathname)&&url.searchParams.get('text')?.includes('iPhone'));
  await p.screenshot({path:OUT+'/hero-'+width+'.png'});
  if(!mobile){
   for(const reducedMotion of ['reduce','no-preference']){
    await p.emulateMedia({reducedMotion});await p.waitForTimeout(600);
    check('motion preference '+reducedMotion+' keeps desktop controls visible',await p.evaluate(()=>['.hero-purchase','.finish-picker'].every(s=>getComputedStyle(document.querySelector(s)).opacity==='1')));
   }
  }
  if(width===390){
   const cdp=await ctx.newCDPSession(p);const y=(bounds.phone.top+bounds.phone.bottom)/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:270,y}]});
   for(const x of [240,210,180,150,120]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await p.waitForTimeout(35);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(700);
   check('touch swipe selects Deep Blue',(await p.getByRole('radio',{name:'Deep Blue'}).getAttribute('aria-checked'))==='true');
   await p.getByRole('radio',{name:'Deep Blue'}).focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(700);
   check('keyboard selects Silver and updates poster',(await p.getByRole('radio',{name:'Silver'}).getAttribute('aria-checked'))==='true'&&(await p.locator('.hero-poster').getAttribute('src')).includes('silver'));
   // Blur without scrolling the mobile hero again.
   await p.evaluate(()=>document.activeElement?.blur());await p.screenshot({path:OUT+'/hero-silver.png'});
   await p.evaluate(()=>scrollTo(0,innerHeight*.35));await p.waitForTimeout(1000);await p.screenshot({path:OUT+'/handoff.png'});
   check('handoff clears purchase controls before phone crosses them',await p.locator('.hero-purchase').evaluate(e=>getComputedStyle(e).visibility==='hidden'));
   for(const [f,act] of [[.15,1],[.36,2],[.47,2],[.70,3],[.88,4]]){await filmScroll(p,f);await p.waitForTimeout(1100);check('film act '+act+' at '+f,(await p.locator('.landing-film').getAttribute('data-act'))===String(act));await p.screenshot({path:OUT+'/film-'+Math.round(f*100)+'.png'});}
   await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(1000);
   const search=p.locator('.store-search input');await search.fill('iphone');await p.waitForSelector('.search-result');check('search suggestions available',(await p.locator('.search-result').count())>0);await search.press('Escape');
  }
  await ctx.close();
 }
 check('normal paths have no browser errors',errors.length===0);
 {
  const ctx=await browser.newContext({viewport:{width:568,height:320},isMobile:true,hasTouch:true});
  const p=await ctx.newPage();await p.goto(BASE+'/?tier=mid',{waitUntil:'networkidle'});await ready(p);
  await p.locator('.hero-purchase').evaluate(e=>e.scrollIntoView({block:'end'}));await p.waitForTimeout(1000);
  check('short landscape keeps below-fold buying controls reachable',await p.locator('.hero-purchase').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.bottom<=innerHeight+1&&r.top>0&&s.visibility==='visible'&&Number(s.opacity)>.99;}));
  await ctx.close();
 }
 for(const mode of ['reduced','storage-failure','context-loss']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(mode==='storage-failure')await ctx.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imart-tier-cap')throw new DOMException('Storage unavailable','SecurityError');return set.call(this,k,v);};});
  const p=await ctx.newPage();await p.goto(BASE,{waitUntil:'networkidle'});
  if(mode!=='reduced'){await ready(p);await filmScroll(p,.43);await p.waitForTimeout(1000);await p.evaluate(()=>document.querySelector('.phone-layer canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());}
  await p.waitForSelector('main[data-tier="low"]');await p.waitForTimeout(800);
  check(mode+': no canvas or pin',await p.evaluate(()=>!document.querySelector('.phone-layer canvas')&&!document.querySelector('main').hasAttribute('data-film')));
  check(mode+': opaque new poster',await p.locator('.hero-poster').evaluate(e=>getComputedStyle(e).opacity==='1'&&e.complete&&e.src.includes('v2')));
  if(mode==='reduced')await p.screenshot({path:OUT+'/hero-reduced.png'});
  await ctx.close();
 }
 console.log(checks+' checks passed.');
}finally{await browser.close();if(errors.length)console.log(errors);}
