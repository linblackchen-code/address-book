// Collect real cloud evidence through an SSH tunnel; no intercepted API responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.ADDRESS_BOOK_EVIDENCE_URL || 'http://127.0.0.2:19080/address-book/';
const api = new URL('./api/contacts', base).href;
const out = path.join(root, '.runtime', 'submission-capture');
const temp = path.join(root, '.runtime');
fs.mkdirSync(out, { recursive: true });
const python = path.join(root, '.venv', 'Scripts', 'python.exe');
const token = `提交验收-${Date.now()}`;
const ids = new Set();
const list = async () => (await (await fetch(api)).json()).contacts;
async function create(contact) {
 const response = await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(contact)});
 assert.equal(response.status,201); const record=await response.json();ids.add(record.id);return record;
}
(async()=>{
 const browser=await chromium.launch({headless:true,slowMo:350,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:temp,size:{width:1440,height:1000}}});
 // Hide cards until the evidence-only search is applied, so recordings never expose existing contacts.
 await context.addInitScript(()=>{
  const attach=()=>{if(!document.documentElement)return false;const style=document.createElement('style');style.id='evidence-privacy-mask';style.textContent='#contact-list{visibility:hidden!important}';document.documentElement.append(style);return true;};
  if(!attach()){const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>document.querySelector('#contact-list')?.getAttribute('aria-busy')==='false');
 let complete=false;
 try {
  await create({name:'林知夏（示例）',notes:token+' · 项目协作',is_favorite:true,methods:[{type:'phone',value:'001234'},{type:'phone',value:'+86 555 0100'},{type:'email',value:'zhixia@example.com'}]});
  await create({name:'陈予安（示例）',notes:token+' · 同学',is_favorite:false,methods:[{type:'phone',value:'13800000002'},{type:'email',value:'yuan@example.com'}]});
  await create({name:'周以宁（示例）',notes:token+' · 合作伙伴',is_favorite:true,methods:[{type:'email',value:'yining@example.com'},{type:'social',value:'微信：demo_yining'},{type:'address',value:'福建省福州市 · 示例地址'}]});
  await page.goto(base);await ready();await page.locator('#search').fill(token);
  await page.evaluate(()=>document.querySelector('#evidence-privacy-mask')?.remove());
  assert.equal(await page.locator('.contact-card').count(),3);
  await page.screenshot({path:path.join(out,'01-cloud-desktop.png'),fullPage:true});await page.waitForTimeout(1800);
  await page.locator('#favorite-nav').click();assert.equal(await page.locator('.contact-card').count(),2);
  await page.screenshot({path:path.join(out,'02-cloud-favorites.png'),fullPage:true});await page.waitForTimeout(1800);
  await page.locator('#all-nav').click();
  await page.getByRole('button',{name:'编辑 林知夏（示例）',exact:true}).click();
  await page.screenshot({path:path.join(out,'03-multiple-methods.png'),fullPage:true});await page.waitForTimeout(1800);
  await page.locator('#contact-notes').fill(token+' · 已编辑');await page.locator('#save-contact').click();await ready();
  await page.locator('#add-contact').click();await page.locator('#contact-name').fill('许清和（示例）');
  await page.locator('#contact-notes').fill(token+' · 页面新建');await page.locator('.method-row input').fill('13800000009');
  await page.locator('#save-contact').click();await ready();await page.waitForFunction(()=>document.querySelectorAll('.contact-card').length===4);
  for(const c of await list())if(c.notes.startsWith(token))ids.add(c.id);
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();
  const downloaded=await downloadPromise;const source=path.join(temp,'submission-export.xlsx');await downloaded.saveAs(source);
  // Keep only fictional evidence rows in the public sample and preview.
  execFileSync(python,['-c',`from openpyxl import load_workbook,Workbook
from pathlib import Path
from html import escape
import sys,json
w=load_workbook(sys.argv[1]); rows=list(w.active.values); selected=[r for r in rows[1:] if str(r[1]).startswith(sys.argv[3])]
assert len(selected)==4
assert any(json.loads(r[3])==['001234','+86 555 0100'] for r in selected)
sample=Workbook();s=sample.active;s.title='联系人';s.append(rows[0])
for r in selected:s.append(r)
sample.save(Path(sys.argv[2])/'contacts-sample.xlsx')
selected=list(selected); row=list(selected[0]);row[0]='导入联系人（示例）';row[1]=sys.argv[3]+' · 导入样例';s.delete_rows(2,s.max_row);s.append(row);sample.save(sys.argv[4])
table='<tr>'+''.join('<th>'+escape(str(v))+'</th>' for v in rows[0])+'</tr>'
for r in selected:table+='<tr>'+''.join('<td>'+escape(str(v or ''))+'</td>' for v in r)+'</tr>'
html='<!doctype html><meta charset="utf-8"><title>Excel 导出内容预览</title><style>body{font-family:Segoe UI,Microsoft YaHei,sans-serif;padding:38px;color:#294236;background:#f7f8f5}h1{font-size:25px}p{color:#657768;font-size:13px}table{border-collapse:collapse;width:100%;background:white;font-size:13px;margin-top:24px}td,th{border:1px solid #d7e1d2;padding:16px 12px;overflow-wrap:anywhere;text-align:left}th{background:#225b4a;color:white}td{max-width:220px}</style><h1>Excel 导出内容预览</h1><p>从真实云端下载的工作簿提取虚构样例。每人一行，各类信息一列；此图为数据预览，并非 Excel 软件界面。</p><table>'+table+'</table>'
Path(sys.argv[2],'excel-preview.html').write_text(html,encoding='utf-8')
w.close()`,source,out,token,path.join(temp,'submission-import.xlsx')],{cwd:root});
  await page.locator('#import-file').setInputFiles(path.join(temp,'submission-import.xlsx'));
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('成功导入 1'));
  for(const c of await list())if(c.notes.startsWith(token))ids.add(c.id);
  await page.screenshot({path:path.join(out,'04-cloud-import.png'),fullPage:true});await page.waitForTimeout(1800);
  await page.locator('#import-file').setInputFiles(path.join(temp,'submission-import.xlsx'));
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('跳过 1'));
  await page.locator('#import-file').setInputFiles({name:'invalid.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid workbook')});
  await page.waitForFunction(()=>document.querySelector('#feedback').classList.contains('error'));
  await page.screenshot({path:path.join(out,'05-cloud-invalid-file.png'),fullPage:true});await page.waitForTimeout(1800);
  await page.getByRole('button',{name:'删除 许清和（示例）',exact:true}).click();await page.locator('#confirm-delete').click();await ready();
  await page.reload();await ready();await page.locator('#search').fill(token);
  await page.evaluate(()=>document.querySelector('#evidence-privacy-mask')?.remove());
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'06-cloud-mobile.png'),fullPage:true});await page.waitForTimeout(1800);
  assert.deepEqual(errors,[]);complete=true;
  const preview=await context.newPage();await preview.setViewportSize({width:1700,height:900});
  await preview.goto('file:///'+path.join(out,'excel-preview.html').replaceAll('\\','/'));
  await preview.screenshot({path:path.join(out,'07-excel-content.png'),fullPage:true});await preview.close();
  console.log('PASS real cloud UI, CRUD, favorites, multiple methods, XLSX import/export, duplicate/error handling, reload, mobile; screenshot and video collection');
 }finally{
  for(const id of ids)await fetch(`${api}/${id}`,{method:'DELETE'});
  const video=page.video();await context.close();if(complete)await video.saveAs(path.join(out,'cloud-walkthrough.webm'));fs.unlinkSync(await video.path());await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
