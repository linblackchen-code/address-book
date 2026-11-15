# 前后端接口约定（前端建议稿，待后端确认）

这是前端实现所依据的接口格式，不代表后端已经实现。队友确认或调整后同步修改本文和 frontend/api.js。

## 通用规则

- 本地前端 http://localhost:8080，后端 http://localhost:8000/api。
- JSON 使用 UTF-8。联系人 id 为整数或非空字符串，同一项目内保持一致。
- GET /contacts 返回完整列表，前端在本地搜索和筛选。后续如改分页，须同时修改统计、搜索实现。
- 联系人必须包含 methods 数组、is_favorite 布尔值。无备注返回空字符串。
- 无登录模块；当前约定是共享通讯录，不是按用户隔离的数据。
- 失败使用非 2xx 状态码，建议响应 {"message":"可读错误说明"}；前端也支持 FastAPI detail。
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
| POST | /contacts/import | multipart/form-data，字段名 file | 200 {"imported":2,"message":"成功导入 2 位联系人"} |
| GET | /contacts/export | 无 | 200 二进制 .xlsx，导出全部联系人，不受当前搜索和收藏筛选限制 |

收藏接口应设置指定状态，而不是每调用一次翻转状态。写入成功后前端重新查询列表，数据由后端持久化。
导出 Content-Type 为 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet，建议 Content-Disposition: attachment; filename="contacts.xlsx"。
前端固定保存文件名 contacts.xlsx，不依赖跨域读取 Content-Disposition。

## Excel 格式建议（待后端确认）

仅支持 .xlsx，前端限制 5 MiB，后端也必须独立限制文件体积及解析规模。

| 姓名 | 备注 | 收藏 | 电话 | 邮箱 | 社交账号 | 地址 | 其他 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 林知夏（示例） | 设计协作伙伴 | 是 | ["13800000001","0591-00000001"] | ["lin@example.com"] | [] | [] | [] |

每个联系人一行，每种联系方式独立一列；各联系方式单元格使用 JSON 字符串数组，避免内容自身含逗号或换行时被错误拆分。空类型填 []，导入导出应保留同类型多个值及顺序。电话作为文本保存，保留前导零和 +。
建议导入追加联系人、按整文件事务处理：存在无效数据则整批拒绝并报告行号，不静默丢失。重复数据处理政策由两人确认并写入最终文档。
后端导出时应将用户值写为文本，防止被 Excel 当作公式。提供模板和导出再导入的验证结果。
