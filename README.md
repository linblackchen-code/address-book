# Address Book / 通讯录

Software Engineering (FZU–MU) 极限编程作业。

## 当前状态

前端已使用原生 HTML/CSS/JavaScript 和 fetch 实现，包含显式演示模式及 HTTP 接口桩验证。后端尚待成员实现和联调，接口建议稿需双方确认。

## 前端预览与协作材料

**后端成员从 [后端接入与材料交接](docs/BACKEND_HANDOFF.md) 开始。** 当前完整前端在 `feat/frontend` 分支，[PR #1](https://github.com/linblackchen-code/address-book/pull/1) 尚待合并；获取代码、分支协作、接口开发与材料提交均在该文档中说明。

在项目根目录运行 `python -m http.server 8080 --bind 127.0.0.1`，或双击 `start-frontend.cmd`。

- 真实接口模式：http://127.0.0.1:8080/frontend/
- 前端演示模式：http://127.0.0.1:8080/frontend/?demo=1
- [前端运行说明](frontend/README.md)
- [接口约定建议稿](docs/API_CONTRACT.md)
- [博客协作框架：每节注明前端/后端所需材料](docs/BLOG_COLLABORATION_TEMPLATE.md)
- [截图、视频与最终补交材料](docs/EVIDENCE.md)
- [前端验证记录](docs/FRONTEND_VERIFICATION.md)

演示数据为虚构样例，只有本次页面内存有效，不代表数据库持久化。Excel 的前端 HTTP 流程已检查，真实 Excel 处理、数据库和最终完整运行视频仍需后端完成后共同验收。

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

前端无需安装依赖或构建。后端安装、数据库初始化及运行命令待后端成员补充。

## 协作

两位成员分别负责前端和后端，各自使用关联本人 GitHub 账号的 Git 身份提交，通过分支和 Pull Request 合并。成员姓名、接口及贡献比例待实际开发时填写。

作业博客各人单独发布，分别记录个人 PSP 和实际贡献。
