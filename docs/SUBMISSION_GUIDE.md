# 最终提交指南

整理日期：2026-11-16。截止：**2026-11-17 23:59**，博客需提前发布，预留审核时间。

## 当前完成情况

| 内容 | 状态 | 证据 |
| --- | --- | --- |
| 页面、收藏、多联系方式 | 已实现并真实联调 | [当前截图](submission/README.md) |
| Excel 导入、导出 | 已实现；实际工作簿与错误处理验证通过 | [Excel 内容预览与样例](submission/README.md) |
| 前后端整合 | main 已包含双方代码 | PR [#1](https://github.com/linblackchen-code/address-book/pull/1)、[#2](https://github.com/linblackchen-code/address-book/pull/2) 已合并 |
| 提交次数 | 仓库已超过 3 次，双方均有代码提交 | [统计口径和快照](GIT_CONTRIBUTIONS.md) |
| 运行截图和视频 | 已有新版界面截图、云端实录及本地联调录像 | [材料入口](submission/README.md) |
| 云部署 | 已完成 | [公网](http://47.114.63.69/address-book/)、[部署说明](../deployment/ubuntu/README.md) |
| GitHub Release | 尚未发布，版本说明已准备 | [发布说明](RELEASE_NOTES.md) |
| 姓名、团队、贡献比例 | 已填：BLGNB，林俊晨前端 50%、陈子元后端 50% | [前端博客](BLOG_FRONTEND_LIN_JUNCHEN.md) |
| 前端博客和 PSP | 工作及总结已成稿，PSP 明确标注回顾估算（未逐项计时） | [林俊晨个人稿](BLOG_FRONTEND_LIN_JUNCHEN.md) |
| 后端博客和 PSP | 工作记录、合作问题、总结及回顾估算 PSP 已成稿 | [陈子元个人稿](BLOG_BACKEND_CHEN_ZIYUAN.md) |
| 课程原始仓库 Fork | PDF 未给出地址，本仓库是新建 | 核实老师是否另行指定起始仓库 |

## 你和队友还要完成的工作

1. 林俊晨阅读 [前端博客草稿](BLOG_FRONTEND_LIN_JUNCHEN.md)，核对第一人称表述；PSP 已按已有计算器基础和任务规模填入回顾估算，不能改称计时数据。
2. 陈子元发布[后端博客](BLOG_BACKEND_CHEN_ZIYUAN.md)前核对工作记录、PSP 和个人总结。
3. 分工和比例已按用户确认填写：前端林俊晨 50%，后端陈子元 50%，共同联调和共同博客内容包含在各自比例中。
4. 发布 GitHub Release：建议 v1.0.0，目标 main，说明复制 RELEASE_NOTES.md，发布后补进博客。
5. 上传截图和视频，替换博客相对链接并检查可访问性。观看完整视频，按需要补录解说。
6. 两人分别发布博客，并各自在课程页面提交。截止 2026-11-17 23:59，提前发布预留审核时间。
7. 核实是否另有指定 Fork 起始仓库。当前仓库为新建，不能描述为已 Fork。

## 推荐的提交材料组合

- 项目链接：https://github.com/linblackchen-code/address-book
- 公网链接：http://47.114.63.69/address-book/
- 代码规范：docs/CODING_STANDARDS.md
- 截图按博客内容选用。 [配图索引](submission/README.md)
- 录像使用[新版通讯录运行演示](submission/address-book-demo.mp4)，可附上[本地联调录像](integration/full-stack-demo.webm)展示重启后的数据保留。
- Excel：submission/contacts-sample.xlsx（从真实导出中仅提取虚构样例）。
- 提交统计：GIT_CONTRIBUTIONS.md；说明统计快照及后续文档提交。
- 每人自己的博客链接、PSP 和个人部分。

作业说明没有要求另外交 Word/PDF、PPT 或 ZIP。ZIP 是本地材料备份，不能替代 GitHub 仓库和个人博客。
