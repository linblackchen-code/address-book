# 最终提交指南

整理日期：2026-11-16。截止：**2026-11-17 23:59**，博客需提前发布，预留审核时间。

## 当前完成情况

| 内容 | 状态 | 证据 |
| --- | --- | --- |
| 页面、收藏、多联系方式 | 已实现并真实联调 | [当前截图](submission/README.md) |
| Excel 导入、导出 | 已实现；实际工作簿与错误处理验证通过 | [Excel 内容预览与样例](submission/README.md) |
| 前后端整合 | main 已包含双方代码 | PR [#1](https://github.com/linblackchen-code/address-book/pull/1)、[#2](https://github.com/linblackchen-code/address-book/pull/2) 已合并 |
| 提交次数 | 仓库已超过 3 次，双方均有代码提交 | [统计口径和快照](GIT_CONTRIBUTIONS.md) |
| 运行截图和视频 | 已有真实云服务截图、录像及本地联调录像 | [材料入口](submission/README.md) |
| 云部署 | 已完成 | [公网](http://47.114.63.69/address-book/)、[部署说明](../deployment/ubuntu/README.md) |
| GitHub Release | 尚未发布，版本说明已准备 | [发布说明](RELEASE_NOTES.md) |
| 个人博客、PSP、贡献比例 | 需本人和队友补充，不能代填经历及耗时 | [博客框架](BLOG_COLLABORATION_TEMPLATE.md) |
| 课程原始仓库 Fork | PDF 未给出地址，本仓库是新建 | 核实老师是否另行指定起始仓库 |

## 你和队友还要完成的工作

1. 填写课程作业说明表中的团队名称、两人姓名等个人信息。
2. 分别填写本人 PSP（预计/实际时间）、实际工作、个人收获。未事先记录预计值时如实说明。
3. 两人共同确认分工与贡献比例，合计 100%；提交次数不能直接当作贡献比例。
4. 结合自己的经历补充合作困难。技术事实可引用 IMPLEMENTATION.md，不能把未经历的事情写成个人经历。
5. 发布 GitHub Release：建议标签 v1.0.0，目标 main，版本说明复制 RELEASE_NOTES.md。发布前核对当前 main。
6. 将所选截图上传博客图床，视频上传到能访问的附件或视频平台，替换仓库相对链接。观看完整视频，确认展示流程和可读性适合提交；可另录带解说版本。
7. 各自发布一篇博客，检查链接、图片和视频；各自在课程作业页面完成提交。
8. 核实老师是否提供指定 Fork 仓库。当前仓库不是 Fork，不能写成已完成 Fork。

## 推荐的提交材料组合

- 项目链接：https://github.com/linblackchen-code/address-book
- 公网链接：http://47.114.63.69/address-book/
- 代码规范：docs/CODING_STANDARDS.md
- 截图：submission/01–10，按博客内容选用。
- 录像：submission/cloud-walkthrough.webm；integration/full-stack-demo.webm 可补充实际重启验证。
- Excel：submission/contacts-sample.xlsx（从真实导出中仅提取虚构样例）。
- 提交统计：GIT_CONTRIBUTIONS.md；说明统计快照及后续文档提交。
- 每人自己的博客链接、PSP 和个人部分。

作业说明没有要求另外交 Word/PDF、PPT 或 ZIP。ZIP 是本地材料备份，不能替代 GitHub 仓库和个人博客。
