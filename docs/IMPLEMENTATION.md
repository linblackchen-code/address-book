# 实现思路与协作事实

本文件按仓库实际代码整理，可作为双方博客共同部分的资料。个人工作、经历和耗时另行填写。

## 架构与模块

浏览器（HTML/CSS/JavaScript）通过 fetch 调用 FastAPI；Pydantic 校验输入；sqlite3 保存数据；openpyxl 读写 Excel。Nginx 提供静态页面并转发 API，systemd 保持后端运行。

- frontend/app.js：页面状态、搜索、表单、收藏和导入导出交互。
- frontend/api.js：HTTP、JSON 错误、FormData 上传和 Blob 下载。
- backend/main.py：7 个接口、CORS、错误响应。
- backend/schemas.py：姓名、备注、联系方式和收藏布尔值校验。
- backend/database.py：事务、联系人及联系方式、重复导入判断。
- backend/excel.py：工作簿校验、导入解析及导出。
- deployment/ubuntu/：systemd 和限定路径的 Nginx 配置。

## 数据模型

contacts 保存 id、name、notes、is_favorite；contact_methods 保存 contact_id、position、type、value。
两表为一对多关系。position 保留联系方式顺序，同一类型可出现多次。删除联系人时级联删除其联系方式。SQLite 独立保存，更新源码不覆盖数据。

## 收藏和多联系方式

前端通过 PATCH 发送明确的 is_favorite 值，而非要求后端翻转状态。写入后重新查询列表；失败时提示，不将失败当成成功。
动态表单可以增删类型行；前后端均校验输入；后端按事务更新联系人及其有序联系方式。
GET 返回完整列表，前端执行搜索和特别关注筛选并计算统计。

## Excel

导出所有联系人，不受页面搜索或收藏筛选限制。姓名、备注、收藏、电话、邮箱、社交账号、地址、其他分别一列。
联系方式单元格用 JSON 字符串数组表示多值，文本写入保留前导零、+ 和中文。
导入先完成整批解析和校验，无效行整批拒绝；姓名、备注和每类联系方式值及顺序相同的记录跳过，保留已有收藏状态。
前端上传 .xlsx，字段名 file；后端独立验证实际内容及限制，返回 imported、skipped 和可读 message。

## 部署

计算器位于服务器根路径，后端 8000；通讯录位于 /address-book/，后端 8001，两者数据库和服务独立。
通讯录 API 使用 6m Nginx 请求体限制，后端文件上限仍为 5 MiB；计算器原限制保留。

## 本次实际遇到并处理的项目问题

- 后端分支带回了旧版前端文案及截图：整合时保留最新前端，再合并后端，避免已确认的界面修改被覆盖。
- Windows 虚拟环境解释器存在子进程：停止脚本同时识别本项目的父/子进程，验证停止后端口释放、再启动后数据保留。
- 计算器 Nginx 原本只有 16k 上传限制：通讯录在独立 API location 配置 6m，保留计算器原设置。
- 同服务器子目录部署：前端按页面路径生成同源 API，Nginx 将 /address-book/api/ 转发到独立后端。
- 自动浏览器不能直接访问公网 HTTP：通过 SSH 隧道连接同一云服务采集真实响应，材料中注明访问路径。

这些是项目技术记录，不代表任一成员单独完成全部工作；博客中须按实际参与情况描述。
