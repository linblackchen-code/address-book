# 前后端接口约定

当前后端沿用前端定义的接口和字段。联调命令见[后端运行说明](../backend/README.md)。

## 通用规则

- 本地前端 http://127.0.0.1:8080，后端 http://127.0.0.1:8000/api。CORS 也支持 `localhost:8080`。
- JSON 使用 UTF-8。联系人 `id` 由 SQLite 分配为正整数。
- GET /contacts 返回完整列表，前端在本地搜索和筛选。后续如改分页，须同时修改统计、搜索实现。
- 联系人必须包含 methods 数组、is_favorite 布尔值。无备注返回空字符串。
- 无登录模块；当前约定是共享通讯录，不是按用户隔离的数据。
- 请求失败时返回 FastAPI 的 `detail`。联系人不存在时返回 404，请求字段校验失败时返回 422，Excel 格式错误时返回 400，超过上传大小限制时返回 413。
- 本地分端口开发时，后端放行准确的前端 origin 和 GET/POST/PUT/PATCH/DELETE/OPTIONS。
- /contacts/import、/contacts/export 静态路径应在 /contacts/{id} 动态路径之前注册。

## 联系人对象

```json
{
  "id": 1,
  "name": "林知夏（示例）",
  "notes": "设计协作伙伴",
  "is_favorite": true,
  "methods": [
    {"type": "phone", "value": "13800000001"},
    {"type": "email", "value": "lin@example.com"},
    {"type": "phone", "value": "0591-00000001"}
  ]
}
```

类型允许 phone、email、social、address、other；同一种类型可出现多次。姓名去首尾空白后 1–80 字，备注最多 1000 字，每项内容 1–300 字，最多 30 项联系方式。
前端对邮箱做基本格式校验，后端独立验证所有字段。联系方式允许为空数组。

## 接口清单

| 方法 | 路径（相对于 /api） | 请求 | 成功响应 |
| --- | --- | --- | --- |
| GET | /contacts | 无 | 200 {"contacts":[联系人对象]} |
| POST | /contacts | 联系人字段，不含 id | 201 联系人对象 |
| PUT | /contacts/{id} | 全量联系人字段，不含 id | 200 联系人对象 |
| DELETE | /contacts/{id} | 无 | 204，无响应体 |
| PATCH | /contacts/{id}/favorite | {"is_favorite":true} 或 false | 200 联系人对象 |
| POST | /contacts/import | multipart/form-data，字段名 file | 200 {"imported":2,"skipped":1,"message":"成功导入 2 位联系人，跳过 1 条重复记录"} |
| GET | /contacts/export | 无 | 200 二进制 .xlsx，导出全部联系人，不受当前搜索和收藏筛选限制 |

收藏接口应设置指定状态，而不是每调用一次翻转状态。写入成功后前端重新查询列表，数据由后端持久化。
`POST` 和 `PUT` 的 `notes`、`is_favorite` 和 `methods` 缺省值分别为空字符串、`false` 和空数组。`PUT` 用提交的字段整体替换联系人。
导出 Content-Type 为 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet，建议 Content-Disposition: attachment; filename="contacts.xlsx"。
前端固定保存文件名 contacts.xlsx，不依赖跨域读取 Content-Disposition。

## Excel 格式

仅支持 `.xlsx`。上传文件最大 5 MiB，工作簿解压后最大 64 MiB、最多 256 个内部文件，所选工作表最多 2,000 个数据行和 8 列。优先读取 `联系人` 工作表，否则读取第一张普通工作表。首行必须包含 `姓名`，其余模板列可省略或调整顺序。

| 姓名 | 备注 | 收藏 | 电话 | 邮箱 | 社交账号 | 地址 | 其他 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 林知夏（示例） | 设计协作伙伴 | 是 | ["13800000001","0591-00000001"] | ["lin@example.com"] | [] | [] | [] |

每个联系人一行，每种联系方式独立一列；各联系方式单元格使用 JSON 字符串数组，避免内容自身含逗号或换行时被错误拆分。空类型填 []，导入导出应保留同类型多个值及顺序。电话作为文本保存，保留前导零和 +。
空的联系方式单元格也可读取。收藏列接受 `是/否`、`Yes/No`、`True/False`、`1/0`，留空按未收藏处理。

导入追加联系人。任一行校验失败时整批拒绝，并指出出错行。姓名、备注及每类联系方式的值和顺序相同的行视为重复，跳过并保留已有联系人和收藏状态。导出中的文本按文本类型写入，保留前导零、`+`、中文和公式样文本。Excel 中的真实公式及错误值须先转成文本才能导入。

[下载 Excel 模板](fixtures/contacts-template.xlsx)
