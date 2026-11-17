# 材料索引

## 正式成果

[docs/submission/](submission/README.md) 是截图、运行视频和 Excel 样例的唯一提交入口，包括新版真实后端页面、真实 Excel 截图、Git/PR 配图、最终 MP4 和样例工作簿。

## 验证记录

| 记录 | 范围 |
| --- | --- |
| [前端验证](FRONTEND_VERIFICATION.md) | 前端交互及接口桩检查的历史结果 |
| [后端验证](backend/VERIFICATION.md) | 真实 API、SQLite 和 Excel 回归 |
| [本地联调](integration/VERIFICATION.md) | 真实浏览器操作和重启后持久化 |
| [公网验收](cloud/VERIFICATION.md) | 阿里云接口、部署隔离和持久化 |
| [测试模板](fixtures/contacts-template.xlsx) | 自动验证继续使用的虚构工作簿夹具 |

前端演示和接口桩仅证明对应交互，完整项目以真实联调和最终运行材料为准。自动检查产生的截图、录像及工作簿写入 .runtime/，不覆盖正式材料。
