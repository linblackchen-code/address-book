# Address Book / 通讯录

Software Engineering (FZU–MU) 极限编程作业。

## 当前状态

前端使用原生 HTML/CSS/JavaScript 和 `fetch`。后端使用 FastAPI、Pydantic、Uvicorn、SQLite 和 openpyxl，提供联系人、收藏及 `.xlsx` 导入导出接口。

## Windows 一键运行

安装 Python 3.11+ 后，双击 `start-local.cmd`，首次自动创建虚拟环境并安装依赖，后台启动真实前后端并打开页面。双击 `stop-local.cmd` 停止本项目服务，数据库保留。

- 页面：http://127.0.0.1:8080/frontend/
- API 文档：http://127.0.0.1:8000/docs
- 数据库：backend/data/contacts.sqlite3（不提交到 Git）
- 日志：.runtime/；端口 8000/8080 被其他程序占用时会提示，不会停止其他程序。
- [真实整合验证、截图及完整操作录像](docs/integration/VERIFICATION.md)

## 前端预览与协作材料

先按[后端运行说明](backend/README.md)在 `127.0.0.1:8000` 启动 API。前端分支及提交材料见[协作交接记录](docs/BACKEND_HANDOFF.md)。

在项目根目录运行 `python -m http.server 8080 --bind 127.0.0.1`，或双击 `start-frontend.cmd`。

- 真实接口模式：http://127.0.0.1:8080/frontend/
- 前端演示模式：http://127.0.0.1:8080/frontend/?demo=1
- [前端运行说明](frontend/README.md)
- [前后端接口约定](docs/API_CONTRACT.md)
- [博客协作框架：每节注明前端/后端所需材料](docs/BLOG_COLLABORATION_TEMPLATE.md)
- [截图、视频与最终补交材料](docs/EVIDENCE.md)
- [前端验证记录](docs/FRONTEND_VERIFICATION.md)

真实接口模式使用 SQLite 持久化联系人。演示模式使用预置的虚构联系人，适合单独预览前端页面。

## 目录

- `frontend/`：前端页面与交互。
- `backend/`：后端接口、数据存储及 Excel 处理。
- [代码规范](docs/CODING_STANDARDS.md)
- [协作流程与分工](docs/COLLABORATION.md)
- [交付检查清单](docs/DELIVERY_CHECKLIST.md)

## 功能目标

- 清晰、可用的通讯录界面。
- 收藏联系人并方便访问。
- 同一联系人支持多项联系方式。
- Excel 导入与导出：每个联系人一行，每类信息一列，保留全部关联信息。
- 可选：部署到云服务器并提供访问地址。

## 获取项目

```sh
git clone https://github.com/linblackchen-code/address-book.git
cd address-book
```

前端无需安装依赖或构建。后端依赖、数据库初始化和本地启动命令见[后端运行说明](backend/README.md)。

## 协作

两位成员分别负责前端和后端，各自使用关联本人 GitHub 账号的 Git 身份提交，通过分支和 Pull Request 合并。成员姓名、接口及贡献比例待实际开发时填写。

作业博客各人单独发布，分别记录个人 PSP 和实际贡献。
