# 在 Ubuntu 上部署通讯录

Nginx 在 `/address-book/` 提供前端静态文件，并将 `/address-book/api/` 转发到监听 `127.0.0.1:8001` 的 FastAPI 服务。现有计算器沿用根路径、`/api/` 和本机 8000 端口。

## 服务和目录

| 用途 | 路径或服务名 |
| --- | --- |
| 源码与虚拟环境 | `/home/ecs-user/address-book` |
| 前端静态文件 | `/var/www/address-book` |
| SQLite 数据文件 | `/var/lib/address-book/contacts.sqlite3` |
| systemd 服务 | `address-book-api` |
| Nginx 路由片段 | `/etc/nginx/snippets/address-book.conf` |
| Nginx 站点配置 | `/etc/nginx/sites-available/default` |

`address-book-api.service` 通过 `--root-path /address-book` 设置 OpenAPI 的公网路径前缀。`address-book.nginx.conf` 为通讯录导入请求设置 `6m` 请求体上限，后端仍按 5 MiB 限制上传文件。

## 安装与更新

以下步骤适用于已有计算器站点的服务器。需要现有 SSH 访问、sudo 权限、Python 3.11 或更新版本及 `venv`、`unzip` 和 `curl`。迁移到其他服务器时，按实际用户、路径和站点配置修改 `install.sh` 及服务文件。

在本地仓库归档要部署的 `main`，再通过 SSH 上传。若需要指定密钥文件，给 `scp` 和 `ssh` 添加 `-i` 参数。

```sh
git archive --format=zip --output=address-book-deploy.zip main
scp address-book-deploy.zip ecs-user@47.114.63.69:/home/ecs-user/
ssh ecs-user@47.114.63.69
```

在服务器上执行以下命令。

```sh
mkdir -p /home/ecs-user/address-book
unzip -oq /home/ecs-user/address-book-deploy.zip -d /home/ecs-user/address-book
bash /home/ecs-user/address-book/deployment/ubuntu/install.sh
```

脚本安装依赖、更新静态文件并启动通讯录 API。它备份 Nginx 的站点文件，添加通讯录的 `include`，通过 `nginx -t` 后重载 Nginx。若配置校验失败，脚本会恢复备份。SQLite 数据位于源码目录之外，更新包不会覆盖数据库。

## 验证与排查

```sh
sudo systemctl is-active address-book-api calculator-api nginx
curl -f http://127.0.0.1/address-book/api/contacts
curl -f http://127.0.0.1/api/health
sudo journalctl -u address-book-api -n 50 --no-pager
sudo nginx -t
```

更新计算器站点配置时，保留现有 `include /etc/nginx/snippets/address-book.conf;` 以继续提供通讯录。要撤下通讯录，先从站点配置移除该行，运行 `sudo nginx -t`，通过后重载 Nginx，再停用 `address-book-api`。保留 SQLite 文件以便恢复。安装时创建的站点备份可用于对照对应时间的配置。
