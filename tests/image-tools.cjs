const {chromium, firefox}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const express=require('express');
let baseUrl;
async function run(kind){
 const options={headless:true};
 if(process.env.TEST_BROWSER_CHANNEL) options.channel=process.env.TEST_BROWSER_CHANNEL;
 if(process.env.TEST_BROWSER_EXECUTABLE) options.executablePath=process.env.TEST_BROWSER_EXECUTABLE;
 const browser=await (kind==='firefox'?firefox:chromium).launch(options);
 try {
  const page=await browser.newPage({serviceWorkers:'block',acceptDownloads:true});page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${baseUrl}/dashboard.html#img-compress`,{waitUntil:'domcontentloaded'});
  await page.locator('#imgFileInput').waitFor({state:'attached'});
  const base64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=96;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#6655cc';ctx.fillRect(0,0,96,64);return c.toDataURL('image/png').split(',')[1]});
  const fixture={name:'sample.png',mimeType:'image/png',buffer:Buffer.from(base64,'base64')};
  const route=async(id,selector)=>{await page.evaluate(id=>window.navigateTo(id),id);await page.locator(selector).waitFor({state:'attached'})};
  const compress=async()=>{await page.locator('#imgCompressRun').click();await page.locator('#imgCompressResult [data-download]').waitFor()};
  const getDownload=async selector=>{const [d]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);assert.equal(await d.failure(),null);return fs.readFileSync(await d.path())};
  // The visible button must activate a real file chooser, including keyboard activation.
  await page.locator('#imgDropZone').focus();
  const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#imgDropZone').press('Enter')]);
  await chooser.setFiles(fixture);await compress();
  assert.equal((await getDownload('[data-download]')).subarray(0,2).toString('hex'),'ffd8');
  assert.equal((await getDownload('[data-download]')).subarray(0,2).toString('hex'),'ffd8');
  await page.locator('#imgFileInput').setInputFiles(fixture);assert.equal(await page.locator('#imgCompressResult').isVisible(),false);await compress();
  await page.locator('#imgFileInput').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await page.locator('#imgCompressRun').click();await page.waitForFunction(()=>document.querySelector('#imgCompressStatus').textContent.includes('无法解码'));
  await page.locator('#imgFileInput').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
  assert.match(await page.locator('#imgCompressStatus').textContent(),/请选择/);
  await route('img-base64','#imgFile');
  await page.locator('#imgFile').setInputFiles({...fixture,name:'<img onerror=alert(1)>.png'});
  await page.locator('#imgResultPanel').waitFor();
  assert.equal(await page.locator('#imgInfo img').count(),0);
  assert.equal((await page.locator('#imgB64Output').inputValue()).split(',')[1],base64);
  await page.locator('#b64ToImgInput').fill('data:image/png;base64,abc" onerror="alert(1)');await page.locator('#imgB64PreviewRun').click();
  assert.equal(await page.locator('#b64ImgPreview img').count(),0);
  await page.locator('#b64ToImgInput').fill(base64);await page.locator('#imgB64PreviewRun').click();
  await page.waitForFunction(()=>document.querySelector('#b64ImgPreview img')?.naturalWidth===96);
  await route('img-compress','#imgFileInput');
  await page.evaluate(({base64})=>{const b=Uint8Array.from(atob(base64),x=>x.charCodeAt(0));const dt=new DataTransfer();dt.items.add(new File([b],'dropped.png',{type:'image/png'}));document.querySelector('#imgDropZone').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));},{base64});
  await compress();assert.match(await page.locator('#imgSelectedName').textContent(),/dropped.png/);
  await route('img-webp','#iwFile');
  const [batchChooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#iwDrop').click()]);
  await batchChooser.setFiles([fixture,{...fixture,name:'second.png'}]);
  await page.waitForFunction(()=>document.querySelectorAll('#iwList button:not([hidden])').length===2);
  assert.equal(await page.locator('#iwList > div').count(),2);
  const webp=await getDownload('#iwList > div:first-child button');assert.equal(webp.subarray(8,12).toString(),'WEBP');
  assert.equal((await getDownload('#iwList > div:first-child button')).subarray(8,12).toString(),'WEBP');
  await page.locator('#iwFile').setInputFiles({name:'corrupt.png',mimeType:'image/png',buffer:Buffer.from('broken')});
  await page.waitForFunction(()=>[...document.querySelectorAll('#iwList [data-info]')].some(el=>el.textContent.includes('无法解码')));
  await route('img-base64','#imgFile');await page.locator('#imgFile').setInputFiles(fixture);await page.locator('#imgResultPanel').waitFor();
  await route('img-compress','#imgFileInput');await page.locator('#imgFileInput').setInputFiles(fixture);await compress();
  for (const width of [375,768]) {await page.setViewportSize({width,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`horizontal overflow at ${width}`)}
  if(process.env.TEST_SCREENSHOT) await page.screenshot({path:process.env.TEST_SCREENSHOT,fullPage:true});
  await page.evaluate(()=>setLang('en'));await page.locator('#imgCompressRun').waitFor();assert.equal(await page.locator('#imgCompressRun').textContent(),'Compress / convert');
  // Dispose while encoding: delayed results must not write into the next page.
  await page.locator('#imgFileInput').setInputFiles(fixture);
  await page.evaluate(()=>{const original=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(...args){setTimeout(()=>original.apply(this,args),120)}});
  await page.locator('#imgCompressRun').click();await route('img-base64','#imgFile');
  await page.waitForTimeout(250);
  assert.deepEqual(errors,[]);
  console.log(kind+': PASS chooser, keyboard, round-trip navigation, drag/drop, multi-file WebP, repeat download, corrupt/invalid files, literal filenames, safe preview, 375/768 layouts, English, disposal');
 }finally{await browser.close()}
}
(async()=>{
 const root=path.resolve(__dirname,'..');
 let temp=null, server=null;
 try {
  let source=path.join(root,'public');
  if(process.env.TEST_BUILD==='1') {
   temp=fs.mkdtempSync(path.join(os.tmpdir(),'k-toolkit-image-test-'));
   fs.cpSync(source,path.join(temp,'public'),{recursive:true});
   fs.cpSync(path.join(root,'scripts'),path.join(temp,'scripts'),{recursive:true});
   execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe'});
   source=path.join(temp,'dist');
  }
  const app=express();app.use('/k-toolkit',express.static(source));
  server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance))});
  baseUrl=`http://127.0.0.1:${server.address().port}/k-toolkit`;
  await run(process.env.TEST_BROWSER || 'chromium');
 }finally{
  if(server) await new Promise(resolve=>server.close(resolve));
  if(temp) fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
