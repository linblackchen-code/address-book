# 阿里云公网部署验收

日期：2026-11-16。

- 通讯录：http://47.114.63.69/address-book/
- API 文档：http://47.114.63.69/address-book/docs
- 原计算器：http://47.114.63.69/

## 已实际通过

- 外部 HTTP 客户端访问通讯录页面、静态配置、API 均返回 200；子目录下的同源接口路径正确。
- 公网创建虚构联系人，保存两个电话、邮箱和收藏状态。
- 下载真正的 .xlsx 并用 openpyxl 读取，多个电话、前导零、+、邮箱及收藏状态均保留。contacts-export.xlsx 为实际云服务导出的虚构验收样例。
- 将实际导出工作簿经公网 multipart 上传，重复记录跳过，未新增重复数据。
- 通过 SSH 重启 address-book-api，再从公网读取，数据和联系方式完整保留。
- 清理自身创建的验收记录后，通讯录为空；没有导入本地个人联系人。
- nginx -t 通过，address-book-api、calculator-api、nginx 均 active，通讯录服务已 enable 开机自启。
- 计算器原网页返回 200，标题为“计算器”，原 /api/health 返回 status=ok。计算器代码、数据库及 /api/ 转发未修改。

## 浏览器材料补充（本次整理）

直接公网 HTTP 自动浏览器访问受限，但已通过 SSH 隧道连接同一真实云服务，采集联系人、收藏、多联系方式、实际导入、错误反馈和手机布局截图及操作录像。没有使用 HTTP 测试桩；虚构验收样例在完成后按创建 ID 清理，服务器原有联系人保留。

图片、录像、实际导出内容预览及其范围见 [最终材料索引](../submission/README.md)。隧道地址与真实公网地址不同，不能将隧道截图说成带公网地址栏的截图。

## 部署位置

Nginx 80 端口按 /address-book/ 分流，后端监听 127.0.0.1:8001，SQLite 位于 /var/lib/address-book/contacts.sqlite3。原计算器仍在根路径、后端 8000。部署脚本和更新方法见 ../../deployment/ubuntu/README.md。
