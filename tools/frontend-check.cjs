/* Browser checks use intercepted HTTP fixtures, never a real backend.
   Set PLAYWRIGHT_MODULE and BROWSER_PATH when packages/browser are not on PATH. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'docs', 'screenshots');
const recordings = path.join(root, 'docs', 'videos');
const base = process.env.FRONTEND_URL || 'http://127.0.0.1:8080/frontend/';
fs.mkdirSync(evidence, { recursive: true });
fs.mkdirSync(recordings, { recursive: true });
const results = [];
function pass(message) { results.push(message); console.log(`PASS ${message}`); }

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const ready = () => page.waitForFunction(() => document.querySelector('#contact-list')?.getAttribute('aria-busy') === 'false');
  try {
    await page.goto(`${base}?demo=1`); await ready();
    assert.equal(await page.locator('.contact-card').count(), 6);
    await page.screenshot({ path: path.join(evidence, '01-demo-desktop.png'), fullPage: true });
    await page.locator('#favorite-nav').click();
    assert.equal(await page.locator('.contact-card').count(), 3);
    await page.screenshot({ path: path.join(evidence, '02-demo-favorites.png'), fullPage: true });
    await page.locator('#all-nav').click();
    await page.locator('#search').fill('0591');
    assert.equal(await page.locator('.contact-card').count(), 1);
    await page.locator('#search').fill('不存在的示例姓名');
    assert.equal(await page.locator('#empty-state').isVisible(), true);
    await page.screenshot({ path: path.join(evidence, '03-demo-search-empty.png'), fullPage: true });
    await page.locator('#search').fill('');
    await page.locator('#add-contact').click();
    await page.locator('#contact-name').fill('新朋友（示例）');
    await page.locator('#contact-notes').fill('动态联系方式表单 · 前端演示');
    await page.locator('.method-row input').fill('13800000009');
    await page.locator('#add-method').click();
    await page.locator('.method-row select').nth(1).selectOption('email');
    await page.locator('.method-row input').nth(1).fill('friend@example.com');
    await page.locator('#add-method').click();
    await page.locator('.method-row input').nth(2).fill('0591-00000009');
    await page.locator('#contact-favorite').check();
    await page.screenshot({ path: path.join(evidence, '04-demo-multiple-methods.png'), fullPage: true });
    await page.locator('#save-contact').click(); await ready();
    assert.equal(await page.locator('.contact-card').count(), 7);
    await page.locator('.contact-card').last().getByRole('button', { name: '编辑 新朋友（示例）' }).click();
    await page.locator('#contact-name').fill('新朋友（已编辑）');
    await page.locator('#save-contact').click(); await ready();
    assert.equal(await page.getByRole('heading', { name: '新朋友（已编辑）' }).count(), 1);
    await page.locator('.contact-card').last().getByRole('button', { name: '删除 新朋友（已编辑）' }).click();
    await page.locator('#cancel-delete').click();
    assert.equal(await page.locator('.contact-card').count(), 7);
    await page.locator('.contact-card').last().getByRole('button', { name: '删除 新朋友（已编辑）' }).click();
    await page.locator('#confirm-delete').click(); await ready();
    assert.equal(await page.locator('.contact-card').count(), 6);
    await page.locator('#export-button').click();
    await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('演示模式不生成'));
    await page.screenshot({ path: path.join(evidence, '05-demo-excel-boundary.png'), fullPage: true });
    pass('Explicit demo: list, search, favorites, multiple methods, create/edit/delete and honest Excel boundary');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}?demo=1`); await ready();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(evidence, '06-demo-mobile.png'), fullPage: true });
    await page.locator('#add-contact').click();
    assert.equal(await page.evaluate(() => document.querySelector('dialog').getBoundingClientRect().right <= innerWidth), true);
    await page.screenshot({ path: path.join(evidence, '07-demo-mobile-form.png'), fullPage: true });
    pass('390px mobile layout and contact dialog have no horizontal overflow');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route('**/api/**', route => route.abort('connectionrefused'));
    await page.goto(base); await ready();
    assert.equal(await page.locator('#error-state').isVisible(), true);
    assert.equal(await page.locator('.contact-card').count(), 0);
    assert.equal(await page.locator('#export-button').isDisabled(), true);
    await page.screenshot({ path: path.join(evidence, '08-api-unavailable.png'), fullPage: true });
    pass('Unavailable API shows error, never silently substitutes demo contacts');
    await page.unroute('**/api/**');

    let contacts = [{ id: 10, name: '接口测试联系人', notes: 'HTTP 拦截桩，非真实后端', is_favorite: false, methods: [{ type: 'phone', value: '001234' }] }];
    let failSave = false, failFavorite = false, invalidSchema = false, rejectImport = false, invalidDownload = false;
    let importCalls = 0;
    const requests = [];
    await page.route('**/api/**', async route => {
      const request = route.request();
      const method = request.method();
      const pathname = new URL(request.url()).pathname;
      requests.push({ method, pathname });
      const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (method === 'OPTIONS') return route.fulfill({ status: 204 });
      if (pathname.endsWith('/export')) {
        if (invalidDownload) return json({ error: 'wrong file' });
        return route.fulfill({ status: 200, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: fs.readFileSync(path.join(root, 'docs', 'fixtures', 'contacts-template.xlsx')) });
      }
      if (pathname.endsWith('/import')) {
        importCalls++;
        assert.ok(request.headers()['content-type'].includes('multipart/form-data'));
        assert.ok(request.postDataBuffer().includes(Buffer.from('name="file"')));
        if (rejectImport) return json({ message: '第 2 行格式不正确（测试桩）' }, 400);
        contacts.push({ id: 12, name: '导入联系人（测试桩）', notes: '', is_favorite: false, methods: [] });
        return json({ imported: 1 });
      }
      if (method === 'GET') return json(invalidSchema ? { wrong: [] } : { contacts });
      if (method === 'POST') {
        if (failSave) return json({ detail: [{ msg: '姓名不符合要求（测试桩）' }] }, 422);
        const item = { id: 11, ...request.postDataJSON() }; contacts.push(item); return json(item, 201);
      }
      const id = Number(pathname.split('/')[3]);
      const contact = contacts.find(item => item.id === id);
      if (method === 'PATCH') {
        if (failFavorite) return json({ message: '收藏保存失败（测试桩）' }, 500);
        contact.is_favorite = request.postDataJSON().is_favorite; return json(contact);
      }
      if (method === 'PUT') { Object.assign(contact, request.postDataJSON()); return json(contact); }
      if (method === 'DELETE') { contacts = contacts.filter(item => item.id !== id); return route.fulfill({ status: 204 }); }
      return json({ message: 'unexpected request' }, 404);
    });
    await page.goto(base); await ready();
    failFavorite = true;
    await page.locator('.contact-card .icon-button').click();
    await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('收藏保存失败'));
    assert.equal(await page.locator('.contact-card .icon-button').getAttribute('aria-pressed'), 'false');
    failFavorite = false;
    await page.locator('.contact-card .icon-button').click();
    await page.waitForFunction(() => document.querySelector('#stat-favorite').textContent === '1');
    await page.reload(); await ready();
    assert.equal(await page.locator('.contact-card .icon-button').getAttribute('aria-pressed'), 'true');
    pass('HTTP contract: explicit favorite state, error recovery and reload using test fixture state');

    await page.locator('#add-contact').click();
    await page.locator('#contact-name').fill('   ');
    await page.locator('.method-row input').fill('001122');
    await page.locator('#save-contact').click();
    assert.equal(await page.locator('#form-error').isVisible(), true);
    await page.locator('#contact-name').fill('<img src=x onerror=alert(1)>');
    failSave = true;
    await page.locator('#save-contact').click();
    await page.waitForFunction(() => document.querySelector('#form-error').textContent.includes('姓名不符合'));
    assert.equal(await page.locator('#contact-dialog').isVisible(), true);
    assert.equal(await page.locator('#save-contact').isEnabled(), true);
    failSave = false;
    await page.locator('#save-contact').click(); await ready();
    await page.waitForSelector('.contact-card:nth-child(2)');
    assert.equal(await page.locator('.contact-card img').count(), 0);
    assert.equal(await page.locator('.contact-card').last().locator('h3').textContent(), '<img src=x onerror=alert(1)>');
    await page.locator('.contact-card').last().getByRole('button', { name: /编辑/ }).click();
    await page.locator('#contact-name').fill('已编辑（接口桩）');
    await page.locator('#save-contact').click(); await ready();
    await page.getByRole('heading', { name: '已编辑（接口桩）' }).waitFor();
    await page.locator('.contact-card').last().getByRole('button', { name: /删除/ }).click();
    await page.locator('#confirm-delete').click(); await ready();
    await page.waitForFunction(() => document.querySelectorAll('.contact-card').length === 1);
    assert.ok(requests.some(item => item.method === 'PUT'));
    assert.ok(requests.some(item => item.method === 'DELETE'));
    pass('HTTP create/update/delete, form validation, server validation messages and safe text rendering');

    await page.locator('#import-file').setInputFiles({ name: 'wrong.csv', mimeType: 'text/csv', buffer: Buffer.from('a') });
    assert.equal(importCalls, 0);
    await page.locator('#import-file').setInputFiles({ name: 'large.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    assert.equal(importCalls, 0);
    rejectImport = true;
    await page.locator('#import-file').setInputFiles(path.join(root, 'docs', 'fixtures', 'contacts-template.xlsx'));
    await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('第 2 行'));
    rejectImport = false;
    await page.locator('#import-file').setInputFiles(path.join(root, 'docs', 'fixtures', 'contacts-template.xlsx'));
    await page.waitForFunction(() => document.querySelectorAll('.contact-card').length === 2);
    await page.evaluate(() => {
      const banner = document.querySelector('#demo-banner'); banner.hidden = false;
      banner.textContent = '接口契约测试 · 请求由浏览器测试桩拦截；不是后端联调或真实 Excel 解析结果。';
      document.querySelector('#connection-label').textContent = 'HTTP 测试桩 · 非真实后端';
    });
    await page.screenshot({ path: path.join(evidence, '09-contract-import-feedback.png'), fullPage: true });
    await page.locator('#search').fill('接口测试');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-button').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'contacts.xlsx');
    const downloadPath = await download.path();
    assert.deepEqual(fs.readFileSync(downloadPath), fs.readFileSync(path.join(root, 'docs', 'fixtures', 'contacts-template.xlsx')));
    invalidDownload = true;
    await page.locator('#export-button').click();
    await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('未返回有效'));
    pass('HTTP Excel: multipart file upload, type/size checks, repeated file choice, rejected import, success refresh, fixture-byte download and invalid MIME rejection');
    invalidSchema = true;
    await page.reload(); await ready();
    assert.equal(await page.locator('#error-state').isVisible(), true);
    pass('Malformed API list fails visibly instead of displaying false data');
    assert.deepEqual(errors, []);
    pass('No browser JavaScript errors');

    const videoContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, recordVideo: { dir: recordings, size: { width: 1280, height: 900 } } });
    const videoPage = await videoContext.newPage();
    await videoPage.goto(`${base}?demo=1`);
    await videoPage.waitForSelector('.contact-card'); await videoPage.waitForTimeout(1500);
    await videoPage.locator('#favorite-nav').click(); await videoPage.waitForTimeout(1100);
    await videoPage.locator('#all-nav').click();
    await videoPage.locator('#search').fill('周以宁'); await videoPage.waitForTimeout(1100);
    await videoPage.locator('#search').fill('');
    await videoPage.locator('#add-contact').click();
    await videoPage.locator('#contact-name').fill('新朋友（演示）');
    await videoPage.locator('#contact-notes').fill('仅演示前端交互，不代表真实后端');
    await videoPage.locator('.method-row input').fill('13800000009');
    await videoPage.locator('#add-method').click();
    await videoPage.locator('.method-row select').nth(1).selectOption('email');
    await videoPage.locator('.method-row input').nth(1).fill('friend@example.com');
    await videoPage.locator('#contact-favorite').check(); await videoPage.waitForTimeout(1400);
    await videoPage.locator('#save-contact').click();
    await videoPage.waitForSelector('.contact-card:nth-child(7)');
    await videoPage.locator('.contact-card').last().scrollIntoViewIfNeeded(); await videoPage.waitForTimeout(1200);
    await videoPage.locator('.contact-card').last().getByRole('button', { name: /编辑/ }).click();
    await videoPage.locator('#contact-notes').fill('编辑完成 · 本次演示仅保存在页面内存');
    await videoPage.locator('#save-contact').click(); await videoPage.waitForTimeout(1100);
    await videoPage.locator('.contact-card').last().getByRole('button', { name: /删除/ }).click(); await videoPage.waitForTimeout(1100);
    await videoPage.locator('#confirm-delete').click();
    await videoPage.locator('#export-button').click(); await videoPage.waitForTimeout(1400);
    const video = videoPage.video();
    await videoContext.close();
    await video.saveAs(path.join(recordings, 'frontend-demo.webm'));
    const rawPath = await video.path();
    if (rawPath !== path.join(recordings, 'frontend-demo.webm')) fs.unlinkSync(rawPath);
    pass('Recorded labeled frontend-only demo (not the required final full-stack video)');
    fs.writeFileSync(path.join(root, 'docs', 'FRONTEND_VERIFICATION.md'), `# 前端验证记录\n\n验证日期：2026-11-15。浏览器：本机 Chromium / Edge，桌面 1440×1000、手机 390×844。\n\n范围：显式前端演示和浏览器 HTTP 拦截桩；未启动或实现后端。测试桩不解析 Excel，导出返回预先生成的有效工作簿夹具，因此不能证明后端解析、数据库持久化或真实端到端正确性。\n\n${results.map(item => '- PASS: ' + item).join('\n')}\n\n真实后端接入后必须重新验证：接口一致性、CORS、数据库重启后持久化、Excel 多值与前导零往返、无效文件事务处理，并替换接口桩截图，录制完整运行视频。\n`);
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
