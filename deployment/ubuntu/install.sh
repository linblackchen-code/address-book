#!/usr/bin/env bash
set -euo pipefail
cd /home/ecs-user/address-book
python3 -m venv .venv
.venv/bin/python -m pip install -i https://mirrors.aliyun.com/pypi/simple/ -r backend/requirements.txt
sudo install -d -o ecs-user -g ecs-user /var/lib/address-book
sudo install -d /var/www/address-book
sudo install -m 644 frontend/*.html frontend/*.css frontend/*.js /var/www/address-book/
sudo install -m 644 deployment/ubuntu/address-book-api.service /etc/systemd/system/address-book-api.service
sudo install -m 644 deployment/ubuntu/address-book.nginx.conf /etc/nginx/snippets/address-book.conf
sudo systemctl daemon-reload
sudo systemctl enable address-book-api
sudo systemctl restart address-book-api
for attempt in $(seq 1 20); do
    if curl -fsS http://127.0.0.1:8001/api/contacts >/dev/null; then break; fi
    sleep 1
done
curl -fsS http://127.0.0.1:8001/api/contacts >/dev/null
backup="/etc/nginx/sites-available/default.address-book-backup-$(date +%Y%m%d%H%M%S)"
sudo cp -p /etc/nginx/sites-available/default "$backup"
sudo python3 - <<'PY'
from pathlib import Path
p=Path('/etc/nginx/sites-available/default')
s=p.read_text()
include='    include /etc/nginx/snippets/address-book.conf;'
if include not in s:
    if s.count('server {') != 1 or 'root /var/www/calculator;' not in s:
        raise SystemExit('Unexpected nginx configuration; no changes applied.')
    s=s.replace('    root /var/www/calculator;', '    root /var/www/calculator;\n'+include,1)
    p.write_text(s)
PY
if ! sudo nginx -t; then
    sudo cp -p "$backup" /etc/nginx/sites-available/default
    echo 'Nginx check failed; previous configuration restored.' >&2
    exit 1
fi
sudo systemctl reload nginx
curl --retry 5 --retry-all-errors --retry-delay 1 -fsS http://127.0.0.1/address-book/api/contacts
curl -fsS http://127.0.0.1/api/health
sudo systemctl is-active address-book-api calculator-api nginx
echo "Calculator config backup: $backup"
