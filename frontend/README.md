# 通讯录前端

原生 HTML/CSS/JavaScript ES Modules + fetch，无 npm 构建依赖。

## 启动

在项目根目录运行：

```sh
python -m http.server 8080 --bind 127.0.0.1
```

- 真实接口：http://127.0.0.1:8080/frontend/
- 显式演示：http://127.0.0.1:8080/frontend/?demo=1
- Windows 可双击 start-frontend.cmd。

使用现代浏览器，不要直接以 file:// 打开。演示数据仅存在本次页面内存，刷新后恢复；演示模式不解析或生成 Excel。真实接口不可用时显示错误，不会自动切换为模拟成功。

## 已完成

联系人卡片与统计；新增/编辑/删除确认；收藏和特别关注筛选；姓名、备注及联系方式搜索；动态增删多类型、同类型多项联系方式；表单校验；Excel 上传/下载与结果反馈；加载、空白和失败状态；桌面和手机布局。用户内容通过 textContent 展示。

数据存储和实际 Excel 处理由后端实现。已完成本地真实联调和云端运行验证，最终材料见 ../docs/submission/README.md。HTTP 拦截桩检查仅作为开发阶段回归。

## 配置与文件

[最终接口约定](../docs/API_CONTRACT.md)与实际后端一致。config.js 本地默认连接同主机 8000 端口 /api，生产环境按页面路径使用同源 API，例如 /address-book/api。分开部署时调整 API_BASE 和后端 CORS。

- index.html / styles.css：页面与响应式布局。
- app.js：状态、DOM 渲染、表单及交互。
- api.js：HTTP、错误响应、FormData 上传、Blob 下载。
- config.js：后端地址和显式演示开关。
- demo-api.js：虚构样例及内存操作。

导入限制 .xlsx、5 MiB，字段名 file；下载全部联系人，不受当前搜索影响。详见接口文档。

## 验证

[验证记录](../docs/FRONTEND_VERIFICATION.md)；[证据索引](../docs/EVIDENCE.md)；[博客框架](../docs/BLOG_COLLABORATION_TEMPLATE.md)。

自动检查需要 Node.js、Playwright、浏览器和录屏依赖，不是网页运行依赖。在项目根目录另开终端：

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium ffmpeg
node tools/frontend-check.cjs
```

静态服务器应保持运行。已有依赖可用 PLAYWRIGHT_MODULE 指定 playwright 包路径，BROWSER_PATH 指定 Edge/Chrome。
测试覆盖并重新生成前端演示截图、测试桩证据、验证记录及前端阶段录像；不能替代真实后端验收。
