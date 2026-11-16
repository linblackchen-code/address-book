# 证据材料总索引

## 最终博客优先使用

**[docs/submission/ 材料索引](submission/README.md)**：真实云端截图、完整操作录像、实际 Excel 导出内容预览、GitHub 历史与双方 PR 页面截图。

功能截图通过 SSH 隧道访问真实云服务，未拦截或伪造响应；截图的浏览器连接地址为隧道地址，公网地址为 http://47.114.63.69/address-book/。两者通往同一 Nginx 和后端。导出内容预览不是 Excel 软件界面。

## 其他保留的材料

| 目录/文件 | 范围 | 使用方式 |
| --- | --- | --- |
| integration/ | 本地真实前后端联调，含服务重启、截图和录像 | 可作为补充验证材料 |
| cloud/ | 公网 HTTP 验收与实际导出样例 | 说明部署和持久化 |
| backend/ | 后端成员原始验证和样例 | 保留队友开发证据 |
| screenshots/ | 早期前端演示和接口测试桩 | 开发历史，最终成果展示不优先用 |
| videos/frontend-demo.webm | 前端阶段录像，不含真实后端 | 不能替代完整项目录像 |
| fixtures/contacts-template.xlsx | 已确认格式的虚构模板 | 可用于测试导入 |

早期材料不删除、不改写其原始含义，避免把模拟响应当成真实后端结果。最终材料和仍缺的个人内容见 [SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md)。
