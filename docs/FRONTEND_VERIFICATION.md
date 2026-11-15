# 前端验证记录

验证日期：2026-11-15。浏览器：本机 Chromium / Edge，桌面 1440×1000、手机 390×844。

范围：显式前端演示和浏览器 HTTP 拦截桩；未启动或实现后端。测试桩不解析 Excel，导出返回预先生成的有效工作簿夹具，因此不能证明后端解析、数据库持久化或真实端到端正确性。

- PASS: Explicit demo: list, search, favorites, multiple methods, create/edit/delete and honest Excel boundary
- PASS: 390px mobile layout and contact dialog have no horizontal overflow
- PASS: Unavailable API shows error, never silently substitutes demo contacts
- PASS: HTTP contract: explicit favorite state, error recovery and reload using test fixture state
- PASS: HTTP create/update/delete, form validation, server validation messages and safe text rendering
- PASS: HTTP Excel: multipart file upload, type/size checks, repeated file choice, rejected import, success refresh, fixture-byte download and invalid MIME rejection
- PASS: Malformed API list fails visibly instead of displaying false data
- PASS: No browser JavaScript errors
- PASS: Recorded labeled frontend-only demo (not the required final full-stack video)

真实后端接入后必须重新验证：接口一致性、CORS、数据库重启后持久化、Excel 多值与前导零往返、无效文件事务处理，并替换接口桩截图，录制完整运行视频。
