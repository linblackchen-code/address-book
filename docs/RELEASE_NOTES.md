# v1.0.0 — 通讯录

以下内容可复制到 GitHub Releases 的说明框。建议 target 为 main。当前仅准备说明，尚未发布 Release。

## 功能

- 联系人新增、编辑、删除和搜索。
- 收藏及特别关注筛选。
- 多种及同类型多项联系方式。
- Excel 导入导出、重复记录跳过和无效数据反馈。
- SQLite 持久化，桌面和手机布局。
- 阿里云部署：http://47.114.63.69/address-book/

## 运行及材料

- Windows 双击 start-local.cmd 启动，stop-local.cmd 停止，数据保留。
- 后端使用 Python 3.11+，前端无需构建。
- 运行、部署和最终提交材料见 README、docs/SUBMISSION_GUIDE.md。
- 已验证后端回归、本地真实联调、公网接口和真实云服务浏览器流程。

本版本为共享通讯录，没有账号登录及按用户隔离。开发演示模式需显式使用 ?demo=1。
