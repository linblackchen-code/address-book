from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from io import BytesIO
import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

from fastapi.testclient import TestClient
from openpyxl import Workbook, load_workbook

from backend.excel import HEADERS, MAX_DATA_ROWS, MAX_UPLOAD_BYTES, XLSX_MIME
from backend.main import create_app


BASE = "/api/contacts"
FIXTURE = Path(__file__).resolve().parents[2] / "docs" / "fixtures" / "contacts-template.xlsx"


def workbook(*rows) -> bytes:
    book = Workbook()
    for row in rows:
        book.active.append(row)
    output = BytesIO()
    book.save(output)
    return output.getvalue()


class ContactApiTest(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(TemporaryDirectory())
        self.path = Path(directory) / "store" / "contacts.sqlite3"
        self.client = self.enterContext(TestClient(create_app(self.path)))

    def contacts(self):
        response = self.client.get(BASE)
        self.assertEqual(response.status_code, 200)
        return response.json()["contacts"]

    def upload(self, data, filename="contacts.xlsx", client=None):
        return (client or self.client).post(f"{BASE}/import", files={"file": (filename, data, XLSX_MIME)})

    def test_crud_favorite_and_storage_across_restart(self):
        self.assertEqual(self.contacts(), [])
        methods = [
            {"type": "phone", "value": "001234"},
            {"type": "email", "value": "test@example.com"},
            {"type": "phone", "value": "+86 555 0100"},
        ]
        created = self.client.post(BASE, json={"name": "  测试联系人  ", "methods": methods})
        self.assertEqual(created.status_code, 201)
        record = created.json()
        self.assertEqual(record, {"id": record["id"], "name": "测试联系人", "notes": "", "is_favorite": False, "methods": methods})
        url = f'{BASE}/{record["id"]}'
        edited = self.client.put(url, json={"name": "新姓名", "notes": "备注", "methods": methods[1:]})
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(edited.json()["methods"], methods[1:])
        for _ in range(2):
            response = self.client.patch(f"{url}/favorite", json={"is_favorite": True})
            self.assertEqual(response.status_code, 200)
            self.assertIs(response.json()["is_favorite"], True)
        with TestClient(create_app(self.path)) as restarted:
            self.assertEqual(restarted.get(BASE).json()["contacts"], [response.json()])
            unmarked = restarted.patch(f"{url}/favorite", json={"is_favorite": False})
            self.assertIs(unmarked.json()["is_favorite"], False)
            deleted = restarted.delete(url)
            self.assertEqual((deleted.status_code, deleted.content), (204, b""))
            self.assertEqual(restarted.delete(url).status_code, 404)
            self.assertEqual(restarted.put(url, json={"name": "Nobody"}).status_code, 404)
            self.assertEqual(restarted.patch(f"{url}/favorite", json={"is_favorite": True}).status_code, 404)
        self.assertEqual(self.contacts(), [])
        with closing(sqlite3.connect(self.path)) as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM contact_methods").fetchone()[0], 0)

    def test_validation_and_cors(self):
        for data in (
            {"name": "  "}, {"name": "A" * 81}, {"name": "A", "notes": "a" * 1001},
            {"name": "A", "is_favorite": "true"}, {"name": "A", "notes": "text\u0000here"},
            {"name": "A", "methods": [{"type": "fax", "value": "1"}]},
            {"name": "A", "methods": [{"type": "phone", "value": "  "}]},
            {"name": "A", "methods": [{"type": "email", "value": "invalid"}]},
            {"name": "A", "methods": [{"type": "phone", "value": "1"}] * 31},
        ):
            with self.subTest(data=data):
                self.assertEqual(self.client.post(BASE, json=data).status_code, 422)
        self.assertEqual(self.client.delete(f"{BASE}/{2**63}").status_code, 422)
        self.assertEqual(self.contacts(), [])
        preflight = self.client.options(f"{BASE}/1/favorite", headers={
            "Origin": "http://127.0.0.1:8080",
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "Content-Type",
        })
        self.assertEqual(preflight.status_code, 200)
        self.assertEqual(preflight.headers["Access-Control-Allow-Origin"], "http://127.0.0.1:8080")

    def test_team_template_and_repeated_import_preserve_favorite(self):
        data = FIXTURE.read_bytes()
        first = self.upload(data)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["imported"], 1)
        contact, = self.contacts()
        self.assertEqual([method["value"] for method in contact["methods"][:2]], ["001234", "13800000001"])
        self.client.patch(f'{BASE}/{contact["id"]}/favorite', json={"is_favorite": False})
        duplicate = self.upload(data)
        self.assertEqual(duplicate.status_code, 200)
        self.assertEqual((duplicate.json()["imported"], duplicate.json()["skipped"]), (0, 1))
        self.assertIs(self.contacts()[0]["is_favorite"], False)

    def test_xlsx_round_trip_with_chinese_values_and_formula_like_text(self):
        fields = {
            "name": "=2+3", "notes": "=备注\n第二行", "is_favorite": True,
            "methods": [
                {"type": "phone", "value": "001234"},
                {"type": "phone", "value": "+86 555 0100"},
                {"type": "email", "value": "test@example.com"},
                {"type": "social", "value": "@test"},
                {"type": "address", "value": "福州, 示例路\n二楼"},
                {"type": "other", "value": "=extra"},
            ],
        }
        self.assertEqual(self.client.post(BASE, json=fields).status_code, 201)
        exported = self.client.get(f"{BASE}/export")
        self.assertEqual(exported.status_code, 200)
        self.assertEqual(exported.headers["Content-Type"], XLSX_MIME)
        self.assertEqual(exported.headers["Content-Disposition"], 'attachment; filename="contacts.xlsx"')
        book = load_workbook(BytesIO(exported.content))
        self.addCleanup(book.close)
        sheet = book["联系人"]
        self.assertEqual(tuple(cell.value for cell in sheet[1]), HEADERS)
        self.assertEqual(sheet.max_row, 2)
        self.assertEqual((sheet["A2"].data_type, sheet["A2"].value), ("s", "=2+3"))
        self.assertEqual(sheet["B2"].data_type, "s")
        self.assertEqual(json.loads(sheet["D2"].value), ["001234", "+86 555 0100"])
        with TestClient(create_app(self.path.with_name("round-trip.sqlite3"))) as fresh:
            result = self.upload(exported.content, client=fresh)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["imported"], 1)
            record, = fresh.get(BASE).json()["contacts"]
            del record["id"]
            self.assertEqual(record, fields)

    def test_import_limits_and_invalid_batch(self):
        data = workbook(("姓名", "电话"), ("Valid", '["123"]'), ("Invalid", "123"))
        invalid = self.upload(data)
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("第 3 行", invalid.json()["detail"])
        for payload, name in (
            (b"", "empty.xlsx"), (b"bad zip", "bad.xlsx"), (data, "fake.xls"),
            (workbook(("姓名", "姓名"), ("Sample", "Sample")), "duplicate.xlsx"),
            (workbook(("姓名",), ("=1+1",)), "formula.xlsx"),
            (workbook(("姓名",), *[("Sample",)] * (MAX_DATA_ROWS + 1)), "rows.xlsx"),
        ):
            with self.subTest(name=name):
                self.assertEqual(self.upload(payload, name).status_code, 400)
        oversized = self.upload(b"x" * (MAX_UPLOAD_BYTES + 1))
        self.assertEqual(oversized.status_code, 413)
        archive = BytesIO()
        with ZipFile(archive, "w") as zip_file:
            for item in range(257):
                zip_file.writestr(str(item), "")
        self.assertEqual(self.upload(archive.getvalue()).status_code, 400)
        self.assertEqual(self.contacts(), [])

    def test_concurrent_imports_add_only_one_copy(self):
        data = FIXTURE.read_bytes()
        with ThreadPoolExecutor(max_workers=2) as executor:
            replies = list(executor.map(self.upload, (data, data)))
        self.assertEqual([reply.status_code for reply in replies], [200, 200])
        self.assertEqual(sorted(reply.json()["imported"] for reply in replies), [0, 1])
        self.assertEqual(len(self.contacts()), 1)
