# 后端接入与材料交接：从这里开始

本文件供后端成员直接接手。前端代码和协作材料已在 GitHub 的 **feat/frontend** 分支，PR 为 [#1](https://github.com/linblackchen-code/address-book/pull/1)。当前 main 仍是初始化版本；只下载 main 看不到完整前端和本说明。

## 1. 获取代码与建立自己的开发分支

先接受仓库协作者邀请，使用自己的 GitHub 账号和 Git 身份：

```sh
git clone --branch feat/frontend https://github.com/linblackchen-code/address-book.git
cd address-book
git switch -c feat/backend
git config user.name
git config user.email
```

检查身份输出，必要时将本仓库 user.name/user.email 设置为本人姓名及关联本人 GitHub 的邮箱，不要复制前端成员身份。

如果已经 Clone 过仓库，先保存或提交自己的修改，再执行：

```sh
git fetch origin
git switch -c feat/backend origin/feat/frontend
```

以上建分支命令仅适用于本地尚无 feat/backend；若已存在，直接切换自己的分支，按实际情况同步远端，不重复创建。

feat/backend 从前端分支起步，能够直接使用现成页面联调。先合并前端 PR，再合并后端 PR 到 main，就能让后端 PR 主要展示后端变化。最终合并使用 Create a merge commit 可保留各次提交。不要把前端历史算成自己的贡献。

## 2. 阅读顺序

| 文件 | 要解决的问题 |
| --- | --- |
| [API_CONTRACT.md](API_CONTRACT.md) | 实现哪些接口，参数、JSON、错误与 Excel 格式是什么 |
| [前端 README](../frontend/README.md) | 页面如何启动，后端地址在哪里配置 |
| [EVIDENCE.md](EVIDENCE.md) | 哪些截图已准备，后端和双方还要补什么 |
| [BLOG_COLLABORATION_TEMPLATE.md](BLOG_COLLABORATION_TEMPLATE.md) | 博客每一节分别需要前端还是后端提供什么 |
| [DELIVERY_CHECKLIST.md](DELIVERY_CHECKLIST.md) | 最终作业提交清单 |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | 代码和 Git 提交约定 |

## 3. 后端开发清单

推荐延续 Python + FastAPI + SQLite，使用 openpyxl 处理 Excel；这只是技术建议，不是已完成的后端。

- 在 backend/ 实现数据模型、接口、数据库初始化及持久化。
- 按 API_CONTRACT.md 实现联系人查询、创建、全量更新、删除、收藏、Excel 导入导出，共 7 个接口。
- 列表返回完整的 {"contacts":[...]}，不是裸数组，也不是分页对象。前端依赖完整列表进行统计、搜索和收藏筛选。
- 字段必须匹配 name、notes、is_favorite、methods，以及 methods 内的 type/value；同类型允许多项。
- 收藏是设置指定布尔状态，不是每次请求翻转。写入成功后前端会重新查询。
- 导入字段名为 file，使用 multipart/form-data；导出返回实际 .xlsx 二进制，不是 CSV 或 JSON。
- 后端独立验证字段、文件大小和实际文件内容，不依赖前端检查。
- 编写依赖清单和可复现启动说明，不上传 .venv、实际数据库、密码及真实联系人信息。

接口和 Excel 规则目前是前端建议稿。先确认；若需调整，同步修改 API_CONTRACT.md 和 frontend/api.js，不能双方各用一种格式。导入重复处理和整文件事务规则也要在实现前确认并记入文档。

建议阶段提交：数据模型与基础接口 → 收藏与多联系方式 → Excel 与验证。按实际进度提交，不为了次数拆空提交；每位成员都必须实际编码。

## 4. 本地联调

### 启动页面

在项目根目录开一个终端：

```sh
python -m http.server 8080 --bind 127.0.0.1
```

先看页面交互可打开 http://127.0.0.1:8080/frontend/?demo=1，但这个模式不调用后端。

### 启动你实现的后端

在另一个终端启动后端，监听 127.0.0.1:8000，API 前缀为 /api。具体启动命令取决于你实现的文件结构，完成后必须写进 backend/README.md。

开发时放行下列 origin 及 GET/POST/PUT/PATCH/DELETE/OPTIONS：

- http://127.0.0.1:8080
- http://localhost:8080

### 切换真实接口

打开 **http://127.0.0.1:8080/frontend/**，不带 ?demo=1。frontend/config.js 默认连接 http://127.0.0.1:8000/api。所有数据应来自你的服务；报错时检查浏览器 Network 和后端日志。

若在不同电脑上联调，前端 config.js 要使用后端电脑可访问的 IP，后端也要监听可访问地址并放行实际前端 origin。每台电脑的 127.0.0.1 都只表示它自己；首次联调推荐两人在各自机器同时运行前后端。

### 验收顺序

1. 空数据库启动，页面显示空列表。
2. 新建一个有两个电话和一个邮箱的联系人，编辑、刷新验证数据。
3. 收藏/取消收藏，切换特别关注，刷新后状态正确。
4. 搜索姓名及联系方式，删除确认后数据库同步删除。
5. 实际导出 Excel，打开检查每人一行、各类信息一列及完整信息。
6. 导入正确文件，检查多值、前导零、+ 和中文均保留；验证无效文件错误及重复处理政策。
7. 重启后端，确认已有数据仍存在，记录实际验证结果。

tools/frontend-check.cjs 使用浏览器 HTTP 拦截桩；运行它不能证明你的后端正确。后端需自行验证真实服务，再和前端共同验收。

## 5. 后端需要提交到共同仓库的成果

| 成果 | 放在哪里 | 内容 |
| --- | --- | --- |
| 后端源代码 | backend/ | 数据模型、API、数据库、Excel 处理等 |
| 依赖和运行配置示例 | backend/ | 实际依赖清单、环境变量示例（无密钥）、初始化方法 |
| 后端运行说明 | backend/README.md | 环境、安装、启动、端口、数据库位置、配置和验证命令 |
| 最终接口及 Excel 规则 | docs/API_CONTRACT.md | 与实际代码一致；标明已确认的规则 |
| 实现思路与验证记录 | 建议 docs/backend/IMPLEMENTATION.md、VERIFICATION.md | 数据模型、各功能方案、实际验证步骤、结果和限制 |
| 实际 Excel 样例及证据 | 建议 docs/backend/ | 虚构数据的实际导出文件、模板、Excel 打开及导入结果截图 |
| Git 历史和 PR | 本人分支与 GitHub | 分阶段代码提交、PR、个人提交次数及真实页面截图 |

docs/fixtures/contacts-template.xlsx 是前端预制的格式协作夹具，不是你的后端导出成果；确认规则后可复用为模板，但仍需提交实际服务验证证据。

## 6. 交给整理博客的前端成员的材料

可集中写在 docs/backend/BLOG_MATERIALS.md，再把图片、文件和视频链接列清楚。

- 实际采用的技术栈及版本、后端模块划分和数据表关系。
- 联系人、收藏、多联系方式、Excel 导入导出的实现思路。
- 实际验证结果，尤其是数据库重启后持久化、Excel 多值往返与错误处理。
- 本人的 GitHub 提交次数、代表提交链接和提交历史截图。
- 本人实际完成工作、遇到的合作问题及解决办法、个人总结。
- 本人 PSP 表，预计与实际耗时如实记录；没有事前预计不要编造。
- 实际参考资料；选做部署时提供公网地址及部署说明。

## 7. 双方共同收尾

- 补拍真实 API 页面和实际 Excel 结果，录制前后端完整运行视频；现有前端阶段视频不能替代。
- 共同确认分工及贡献比例，合计 100%。
- 合并 PR、发布最终 Release，检查项目可复现运行。
- 每个人各自发布和提交博客；可以共享项目主体，但个人 PSP、工作和总结分别填写。
- 最终更新双方 GitHub 提交次数与截图；核实课程 Fork 要求；2026-11-17 23:59 前提交，提前发布博客预留审核时间。
