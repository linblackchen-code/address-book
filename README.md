# 通讯录 · Address Book

Software Engineering (FZU–MU) 极限编程作业。团队 **BLGNB**：林俊晨（前端，50%）、陈子元（后端，50%）。前后端已合并到 `main`，本地联调与阿里云部署均已完成。

## 在线体验

- [通讯录](http://47.114.63.69/address-book/)
- [API 文档](http://47.114.63.69/address-book/docs)
- [代码规范](docs/CODING_STANDARDS.md)

## 作业提交入口

**先看 [林俊晨前端博客草稿](docs/BLOG_FRONTEND_LIN_JUNCHEN.md)**。姓名、团队、分工、前端工作、个人总结和明确标注的回顾估算 PSP 已补齐。

[最终提交指南](docs/SUBMISSION_GUIDE.md) · [陈子元需要补充的材料](docs/TEAMMATE_MATERIALS.md) · [通用博客框架](docs/BLOG_COLLABORATION_TEMPLATE.md)。

| 材料 | 入口 |
| --- | --- |
| 最终截图、云端录像、Excel 样例 | [材料索引](docs/submission/README.md) |
| 实现思路与数据模型 | [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) |
| Git 提交统计与合并记录 | [GIT_CONTRIBUTIONS.md](docs/GIT_CONTRIBUTIONS.md) |
| 发布版本说明草稿 | [RELEASE_NOTES.md](docs/RELEASE_NOTES.md) |
| 交付逐项检查 | [DELIVERY_CHECKLIST.md](docs/DELIVERY_CHECKLIST.md) |

## 已实现功能

联系人新建、编辑、删除与搜索；收藏及特别关注筛选；一个联系人多种、同类型多项联系方式；Excel 导入导出及重复记录跳过；手机布局和错误反馈。数据保存在后端 SQLite，刷新或重启后保留。

前端使用 HTML/CSS/JavaScript + fetch；后端使用 FastAPI、Pydantic、Uvicorn、SQLite 和 openpyxl。当前为共享通讯录，没有账号登录及用户数据隔离。

## Windows 本地运行

安装 Python 3.11+，Clone 本仓库后双击 `start-local.cmd`。首次会安装依赖并启动前后端。双击 `stop-local.cmd` 停止，数据保留。

- 页面：http://127.0.0.1:8080/frontend/
- API 文档：http://127.0.0.1:8000/docs
- 数据库：backend/data/contacts.sqlite3
- 日志：.runtime/；这些本地文件不提交 Git。

手动启动及配置见 [前端说明](frontend/README.md)、[后端说明](backend/README.md)。仅预览前端时可打开 `?demo=1`，演示数据不代表真实后端结果。

## 项目结构

```text
frontend/             页面、样式、交互及 HTTP 通信
backend/              API、数据库、Excel 处理及测试
deployment/ubuntu/    与计算器共用服务器的部署配置
docs/submission/      本次整理的提交截图、云端录像与样例
docs/integration/     本地真实联调证据
docs/cloud/           公网 HTTP 验收及样例
docs/screenshots/     早期前端演示/接口桩截图，保留开发记录
tools/                浏览器验证、材料采集脚本
start-local.*         Windows 启动入口
stop-local.*          Windows 停止入口
```

接口规则见 [API_CONTRACT.md](docs/API_CONTRACT.md)，服务器更新见 [部署说明](deployment/ubuntu/README.md)。开发阶段的截图和录像保持原路径，最终博客优先使用 docs/submission/，避免混用旧界面或模拟数据。

## 验证

[后端验证](docs/backend/VERIFICATION.md) · [本地真实联调](docs/integration/VERIFICATION.md) · [公网验收](docs/cloud/VERIFICATION.md) · [最终材料说明](docs/submission/README.md)。

原生前端无需 npm 构建；浏览器采集脚本需要 Playwright，但不是用户运行应用的依赖。
