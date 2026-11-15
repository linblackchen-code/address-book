# 通讯录后端

后端使用 Python、FastAPI、Pydantic 和 Uvicorn，使用标准库 `sqlite3` 持久化联系人，通过 openpyxl 读写 `.xlsx`。前端沿用已有的 `fetch` 和 [接口约定](../docs/API_CONTRACT.md)。

## 本地启动

使用 Python 3.11 或更新版本。在**仓库根目录**执行以下命令。Windows 上若 `python` 指向较旧版本，可以把首行替换为 `py -3.12 -m venv .venv`。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

macOS 或 Linux 使用 `.venv/bin/python` 执行后两行。首次启动会创建空的 SQLite 数据库和表。

- [Swagger API 文档](http://127.0.0.1:8000/docs)
- [联系人列表接口](http://127.0.0.1:8000/api/contacts)
- 在另一个终端运行 `python -m http.server 8080 --bind 127.0.0.1`。打开 [通讯录页面](http://127.0.0.1:8080/frontend/)，使用真实后端模式。
- 用 [团队 Excel 模板](../docs/fixtures/contacts-template.xlsx) 试验导入，或先通过页面创建联系人再导出。

## 配置

| 环境变量 | 默认值 | 用途 |
| --- | --- | --- |
| `ADDRESS_BOOK_DB_PATH` | `backend/data/contacts.sqlite3` | SQLite 文件路径。相对路径以启动目录为基准。 |
| `ADDRESS_BOOK_CORS_ORIGINS` | `http://127.0.0.1:8080,http://localhost:8080,http://[::1]:8080` | 以逗号分隔的前端 origin。 |

例如在运行 Uvicorn 前用 `$env:ADDRESS_BOOK_DB_PATH = 'backend/data/contacts-test.sqlite3'` 指定联调数据库，便于和日常数据分开。

## 实现

- `main.py` 定义接口、CORS 和 HTTP 错误响应。
- `schemas.py` 校验联系人、收藏状态和各类联系方式。
- `database.py` 将联系人和有序联系方式存进两张 SQLite 表。新增、编辑、删除和批量导入通过事务写入。
- `excel.py` 验证工作簿、列标题和各行内容，并将全部联系人导出为 Excel 文本单元格。每类联系方式中的多个值保持输入顺序。

## 回归测试

在仓库根目录执行以下命令。测试使用临时数据库。

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```
