# 最终截图与录像材料

采集日期：2026-11-16。优先使用本目录，早期演示图片保留在 docs/screenshots/ 作为历史。

## 来源与范围

01–06 是真实云服务的浏览器界面，使用虚构验收联系人。因为本机自动浏览器直接访问公网 HTTP 受限，浏览器通过 SSH 隧道 http://127.0.0.2:19080/address-book/ 访问服务器同一 Nginx 和 API，未使用测试桩或模拟响应。公网地址为 http://47.114.63.69/address-book/。
采集时仅筛选自身创建的样例；完成后仅清理这些记录，保留服务器已有联系人。

07 从实际下载的 .xlsx 提取虚构样例并预览，不是 Excel 软件窗口截图。08–10 是真实 GitHub 页面截图，没有重绘。

## 图片清单

| 文件 | 展示内容 | 博客位置 |
| --- | --- | --- |
| [01-cloud-desktop.png](01-cloud-desktop.png) | 云端联系人、统计、电话/邮箱/社交/地址 | 项目概览和页面设计 |
| [02-cloud-favorites.png](02-cloud-favorites.png) | 特别关注筛选 | 收藏功能 |
| [03-multiple-methods.png](03-multiple-methods.png) | 两个电话和一个邮箱的编辑表单 | 多联系方式 |
| [04-cloud-import.png](04-cloud-import.png) | 实际 Excel 导入成功反馈 | 导入功能 |
| [05-cloud-invalid-file.png](05-cloud-invalid-file.png) | 损坏工作簿的后端错误反馈 | 异常处理 |
| [06-cloud-mobile.png](06-cloud-mobile.png) | 真实云服务手机布局 | 响应式设计 |
| [07-excel-content.png](07-excel-content.png) | 实际导出内容的虚构样例预览 | 每人一行、每类信息一列、多值和前导零 |
| [08-github-main-commits.png](08-github-main-commits.png) | main 分支提交历史快照 | Git 协作 |
| [09-github-frontend-pr.png](09-github-frontend-pr.png) | 前端 PR #1 已合并 | 前端贡献与协作 |
| [10-github-backend-pr.png](10-github-backend-pr.png) | 后端 PR #2 已合并 | 后端贡献与协作 |

![云端桌面](01-cloud-desktop.png)

## 视频和文件

- [cloud-walkthrough.webm](cloud-walkthrough.webm)：真实云服务操作，包含收藏筛选、编辑、多联系方式、页面新建、实际导出/导入、重复处理、损坏文件、删除及手机布局。无配音，通过 SSH 隧道操作；发布前自行观看，可按课程展示需求重录带解说版本。
- [本地真实联调录像](../integration/full-stack-demo.webm)：补充实际服务重启后的持久化过程。
- [contacts-sample.xlsx](contacts-sample.xlsx)：从本次真实导出中仅提取虚构样例，排除服务器其他联系人；并非完整数据库备份。
- [excel-preview.html](excel-preview.html)：07 的预览来源，仅为样例工作簿内容展示。
- [Git 贡献快照](../GIT_CONTRIBUTIONS.md)：截图对应的提交统计。材料整理本身会新增提交，最终发布前按当前 main 更新次数。

截图上传到 CSDN 时须重新上传图片，视频也须上传可访问的附件或视频平台；不要直接粘贴本机路径。
