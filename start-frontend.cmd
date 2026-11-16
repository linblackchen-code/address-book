@echo off
cd /d "%~dp0"
echo Live API: http://127.0.0.1:8080/frontend/
echo UI demo:  http://127.0.0.1:8080/frontend/?demo=1
python -m http.server 8080 --bind 127.0.0.1
