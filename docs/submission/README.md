# 演示、截图与样例

## 运行演示

演示在阿里云页面录制，共 2 分 30 秒，依次展示联系人管理、多项联系方式、收藏筛选和 Excel 导入导出。

https://github.com/user-attachments/assets/916eb75a-4956-4b7d-a4cb-8b9b8fc34519

[下载原始 MP4](address-book-demo.mp4)

示例工作簿包含虚构联系人，可直接用于批量导入。[下载 Excel 示例工作簿](contacts-sample.xlsx)

## 界面截图

以下截图使用本地真实后端和虚构联系人。手机布局图来自浏览器的 390 像素宽度预览。

### 桌面与手机布局

![桌面首页上的联系人卡片、统计和常用操作](01-new-desktop.jpg)

![手机宽度下的顶部导航和单列联系人卡片](06-new-mobile.jpg)

### 收藏与多项联系方式

![特别关注列表仅显示已收藏的联系人](02-new-favorites.jpg)

![编辑表单中同一联系人有两个电话和一个邮箱](03-new-multiple-methods.jpg)

### Excel 导入与导出

![成功导入时的页面提示与新增联系人](04-new-import-success.jpg)

![工作簿无法读取时的错误提示](05-new-invalid-workbook.jpg)

![在 Microsoft Excel 打开的导出工作簿中，多项联系方式和电话号码前导零均保留](07-excel-export-screenshot.png)

### 后端接口

![Swagger 文档中的联系人、收藏和 Excel 接口](11-swagger-api.jpg)

<details>
<summary>Git 提交与合并截图</summary>

主分支提交记录截图对应 `main` 快照 `ce0bdcf`。

![GitHub 主分支提交历史](08-github-main-commits-latest.jpg)

![前端 PR #1 合并记录](09-github-frontend-pr.png)

![后端 PR #2 合并记录](10-github-backend-pr-latest.jpg)

</details>

## 验证记录

| 记录 | 验证范围 |
| --- | --- |
| [前端检查](../FRONTEND_VERIFICATION.md) | 界面交互和 HTTP 测试桩 |
| [后端回归](../backend/VERIFICATION.md) | 真实 API、SQLite 和 Excel |
| [本地联调](../integration/VERIFICATION.md) | 浏览器操作和服务重启后的持久化 |
| [公网验收](../cloud/VERIFICATION.md) | 阿里云接口、部署隔离和持久化 |

自动检查使用 `docs/fixtures/contacts-template.xlsx` 作为测试工作簿，生成的文件存放在 `.runtime/`。
