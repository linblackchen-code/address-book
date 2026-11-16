// Real HTTP/browser integration. Creates unique fictional records and removes only those records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const baseUrl = process.env.ADDRESS_BOOK_BASE_URL || 'http://127.0.0.1:8080/frontend/';
const cloud = Boolean(process.env.ADDRESS_BOOK_BASE_URL);
const output = path.join(root, 'docs', cloud ? 'cloud' : 'integration');
const runtime = path.join(root, '.runtime');
fs.mkdirSync(output, { recursive: true });
const python = path.join(root, '.venv', 'Scripts', 'python.exe');
const prefix = `联调验证-${Date.now()}`;
const fixture = path.join(runtime, 'integration-import.xlsx');
execFileSync(python, ['-c', 'import sys,json;from openpyxl import Workbook;w=Workbook();s=w.active;s.title="联系人";s.append(["姓名","备注","收藏","电话","邮箱","社交账号","地址","其他"]);s.append([sys.argv[2],"虚构联调记录","否",json.dumps(["000123","+86 555 0100"]),"[]","[]","[]","[]"]);w.save(sys.argv[1])', fixture, `${prefix}-导入`], { cwd: root });
const results = [];
const pass = text => { results.push(text); console.log('PASS', text); };
const api = cloud ? new URL('./api/contacts', baseUrl).href : 'http://127.0.0.1:8000/api/contacts';
async function contacts() { const response = await fetch(api); assert.ok(response.ok); return (await response.json()).contacts; }
(async () => {
 const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH}:{})});
 const context = await browser.newContext({viewport:{width:1280,height:900}, recordVideo:{dir:runtime,size:{width:1280,height:900}}});
 const page = await context.newPage();
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 let verified = false;
 const ready = () => page.waitForFunction(() => document.querySelector('#contact-list')?.getAttribute('aria-busy') === 'false');
 try {
  await page.goto(baseUrl);await ready();
  assert.ok(await page.locator('#demo-banner').isHidden());
  await page.locator('#add-contact').click();
  await page.locator('#contact-name').fill(prefix);
  await page.locator('#contact-notes').fill('虚构数据 · 真实前后端联调');
  await page.locator('.method-row input').fill('001234');
  await page.locator('#add-method').click();
  await page.locator('.method-row input').nth(1).fill('+86 555 0100');
  await page.locator('#add-method').click();
  await page.locator('.method-row select').nth(2).selectOption('email');
  await page.locator('.method-row input').nth(2).fill('integration@example.com');
  await page.locator('#save-contact').click(); await ready();
  await page.getByRole('heading',{name:prefix,exact:true}).waitFor();
  await page.locator('#search').fill(prefix);
  const record = (await contacts()).find(c=>c.name===prefix);assert.ok(record);
  assert.deepEqual(record.methods.map(m=>m.value),['001234','+86 555 0100','integration@example.com']);
  await page.locator(`[data-id="${record.id}"]`).getByRole('button',{name:`编辑 ${prefix}`,exact:true}).click();
  await page.locator('#contact-notes').fill('编辑后备注 · 真实联调');
  await page.locator('#save-contact').click();await ready();
  await page.waitForFunction(()=>document.querySelector('.contact-card .notes').textContent.includes('编辑后'));
  await page.locator(`[data-id="${record.id}"] .icon-button`).click();
  await page.waitForFunction(()=>document.querySelector('.contact-card .icon-button').getAttribute('aria-pressed')==='true');
  await page.locator('#favorite-nav').click();
  await page.screenshot({path:path.join(output,'01-live-contacts.png'),fullPage:true});
  pass('Browser create/edit/favorite and multiple methods match real HTTP API');
  if (cloud) {
   assert.ok(process.env.ADDRESS_BOOK_SSH_KEY, 'Cloud restart verification requires ADDRESS_BOOK_SSH_KEY');
   execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=12','-o','IdentitiesOnly=yes','-i',process.env.ADDRESS_BOOK_SSH_KEY,process.env.ADDRESS_BOOK_SSH_HOST || 'ecs-user@47.114.63.69','sudo -n systemctl restart address-book-api'],{stdio:'ignore',timeout:30000});
   for(let attempt=0;attempt<30;attempt++) {
    try { await contacts();break; } catch(error) { if(attempt===29)throw error;await new Promise(resolve=>setTimeout(resolve,500)); }
   }
  } else {
   execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'stop-local.ps1')],{cwd:root,stdio:'ignore',timeout:30000});
   execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'start-local.ps1'),'-NoBrowser'],{cwd:root,stdio:'ignore',timeout:60000});
  }
  await page.reload();await ready();await page.locator('#search').fill(prefix);
  const persisted=(await contacts()).find(c=>c.id===record.id);
  assert.equal(persisted.is_favorite,true);assert.equal(persisted.notes,'编辑后备注 · 真实联调');assert.equal(persisted.methods[0].value,'001234');
  pass('Actual service stop/start and browser reload retain SQLite data');
  await page.locator('#import-file').setInputFiles(fixture);
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('成功导入 1'));
  assert.ok((await contacts()).some(c=>c.name===`${prefix}-导入`));
  await page.locator('#import-file').setInputFiles(fixture);
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('跳过 1'));
  await page.screenshot({path:path.join(output,'02-live-import.png'),fullPage:true});
  pass('Real XLSX import and duplicate-skip feedback');
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();
  const download=await downloadPromise;const exportPath=path.join(output,'contacts-export.xlsx');await download.saveAs(exportPath);
  execFileSync(python,['-c','import sys,json;from openpyxl import load_workbook;w=load_workbook(sys.argv[1]);r={row[0]:row for row in list(w.active.values)[1:]};a=r[sys.argv[2]];b=r[sys.argv[2]+"-导入"];assert json.loads(a[3])==["001234","+86 555 0100"];assert a[2]=="是";assert json.loads(b[3])==["000123","+86 555 0100"];assert json.loads(a[4])==["integration@example.com"];w.close()',exportPath,prefix],{cwd:root});
  pass('Real downloaded XLSX preserves all contacts, multiple phones, +, leading zeros, email and favorites');
  await page.locator('#import-file').setInputFiles({name:'broken.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('not-an-excel')});
  await page.waitForFunction(()=>document.querySelector('#feedback').classList.contains('error'));
  assert.equal((await contacts()).filter(c=>c.name.startsWith(prefix)).length,2);
  await page.screenshot({path:path.join(output,'03-live-invalid-file.png'),fullPage:true});
  await page.locator(`[data-id="${record.id}"]`).getByRole('button',{name:`删除 ${prefix}`,exact:true}).click();
  await page.locator('#confirm-delete').click();await ready();
  await page.waitForFunction(id=>!document.querySelector(`[data-id="${id}"]`),record.id);
  assert.ok(!(await contacts()).some(c=>c.id===record.id));
  pass('Corrupt file rejected without partial writes; UI delete removes real database record');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'04-live-mobile.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  pass('Live mobile layout and no browser JavaScript errors');
  verified = true;
  fs.writeFileSync(path.join(output,'VERIFICATION.md'),`# ${cloud ? '云端部署验证' : '整合验证'}\n\n日期：2026-11-16。${cloud ? '公网地址：'+baseUrl+'，Nginx 反向代理。' : ''}真实 Uvicorn + SQLite + 浏览器 fetch，无 HTTP 拦截桩。全部使用唯一命名的虚构记录，完成后仅清理自身创建的数据。\n\n${results.map(t=>'- PASS: '+t).join('\n')}\n\n截图及 contacts-export.xlsx 来自本次真实服务；full-stack-demo.webm 是本次浏览器操作录像，包含实际服务重启等待过程，无配音。个人 PSP 和最终博客仍需按实际补充。\n`);
 } finally {
  try{for(const c of await contacts()){if(c.name.startsWith(prefix))await fetch(`${api}/${c.id}`,{method:'DELETE'});}}finally{
   const video=page.video();await context.close();if(verified)await video.saveAs(path.join(output,'full-stack-demo.webm'));fs.unlinkSync(await video.path());await browser.close();
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
