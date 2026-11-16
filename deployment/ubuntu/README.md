# 阿里云 Ubuntu 部署：与计算器共用一台服务器

2026-11-16 已实际部署。地址：

- 通讯录：http://47.114.63.69/address-book/
- 通讯录 API 文档：http://47.114.63.69/address-book/docs
- 计算器：http://47.114.63.69/

使用现有 Nginx 的 80 端口，以路径区分项目。服务器不需要开放新端口；通讯录后端只监听 127.0.0.1:8001，计算器仍使用 127.0.0.1:8000。

## 服务器布局

| 内容 | 路径/名称 |
| --- | --- |
| 通讯录源码及虚拟环境 | /home/ecs-user/address-book |
| 公开的前端静态文件 | /var/www/address-book |
| 独立 SQLite 数据库 | /var/lib/address-book/contacts.sqlite3 |
| systemd 服务 | address-book-api |
| 通讯录 Nginx 片段 | /etc/nginx/snippets/address-book.conf |
| 现有站点配置 | /etc/nginx/sites-available/default，server 内新增 include |

原计算器站点的 root 和 /api/ 转发保留。通讯录 /address-book/api/ 转发到 8001 的 /api/，前端 config.js 按网页路径构建同源 API 地址；本地运行仍连接 8000。
后端以 --root-path /address-book 启动，Swagger 的 schema 地址和公网前缀一致。

## 首次安装与更新

本机使用现有 SSH 连接，密钥保留在用户的 .ssh 目录，不上传仓库。将当前 main 的源码打包并上传，不能包含 .venv、真实数据库或密钥。

```sh
git archive --format=zip --output=address-book-deploy.zip main
scp -i YOUR_SSH_KEY address-book-deploy.zip ecs-user@47.114.63.69:/home/ecs-user/address-book-deploy.zip
ssh -i YOUR_SSH_KEY ecs-user@47.114.63.69
mkdir -p /home/ecs-user/address-book
unzip -oq /home/ecs-user/address-book-deploy.zip -d /home/ecs-user/address-book
bash /home/ecs-user/address-book/deployment/ubuntu/install.sh
```

脚本安装依赖、复制前端、重启通讯录服务，并备份现有 Nginx 站点配置后插入限定路径的片段。nginx -t 失败时恢复配置；验证成功后 reload，不停止计算器服务。数据库独立存放，更新源码不会覆盖。
脚本为当前 ecs-user 和路径编写；换服务器时先修改路径、用户和站点配置检查。
以后更新计算器时，如果其部署步骤会整体覆盖 Nginx default 文件，应保留通讯录的 include 行，否则通讯录路径会失效。

## 验证与维护

```sh
sudo systemctl is-active address-book-api calculator-api nginx
curl -f http://127.0.0.1/address-book/api/contacts
curl -f http://127.0.0.1/api/health
sudo journalctl -u address-book-api -n 50 --no-pager
sudo nginx -t
```

Excel API 单独设置 6m 请求体限制，后端仍限制文件 5 MiB；计算器原来的请求限制保留。
页面是共享通讯录，当前没有账号登录或按用户隔离。

## 回退本次站点挂载

从 /etc/nginx/sites-available/default 移除 `include /etc/nginx/snippets/address-book.conf;`，运行 nginx -t 后 reload，然后停用 address-book-api。不要删除数据库。
首次修改前的配置备份保存在 /etc/nginx/sites-available/default.address-book-backup-时间戳。若之后计算器配置有变化，不要直接用旧备份覆盖新配置。

公网接口验证结果见 [docs/cloud/VERIFICATION.md](../../docs/cloud/VERIFICATION.md)。博客需填写本次真实公网地址，最终 PSP 和贡献比例仍由双方如实补充。
