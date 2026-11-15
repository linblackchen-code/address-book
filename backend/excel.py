from contextlib import closing
from io import BytesIO
import json
from xml.etree.ElementTree import ParseError
from zipfile import BadZipFile, ZipFile
from zlib import error as CompressionError

from defusedxml.common import DefusedXmlException
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.utils.exceptions import InvalidFileException
from pydantic import ValidationError

from .schemas import Contact, ContactInput


METHOD_COLUMNS = {"电话": "phone", "邮箱": "email", "社交账号": "social", "地址": "address", "其他": "other"}
HEADERS = ("姓名", "备注", "收藏", *METHOD_COLUMNS)
SHEET_NAME = "联系人"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_UNPACKED_BYTES = 64 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 256
MAX_DATA_ROWS = 2000


class WorkbookError(ValueError):
    pass


def _check_archive(data: bytes) -> None:
    with ZipFile(BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) > MAX_ARCHIVE_ENTRIES or sum(entry.file_size for entry in entries) > MAX_UNPACKED_BYTES:
            raise WorkbookError("Excel 解压后超出大小限制")
        if "[Content_Types].xml" not in archive.namelist() or "xl/vbaProject.bin" in archive.namelist():
            raise WorkbookError("请上传有效的 .xlsx 工作簿")


def _values(row: tuple) -> list:
    values = []
    for cell in row:
        if cell.data_type in {"f", "e"}:
            raise WorkbookError(f"单元格 {cell.coordinate} 含有公式或 Excel 错误，请改为文本或数值")
        values.append(cell.value.strip() if isinstance(cell.value, str) else cell.value)
    return values


def _columns(row: tuple) -> dict[str, int]:
    columns = {}
    for index, header in enumerate(_values(row)):
        if header in (None, ""):
            continue
        if header not in HEADERS:
            raise WorkbookError(f"第 1 行第 {index + 1} 列的标题无效，请使用模板中的标题")
        if header in columns:
            raise WorkbookError(f"第 1 行存在重复列标题：{header}")
        columns[header] = index
    if "姓名" not in columns:
        raise WorkbookError("第 1 行必须包含姓名列")
    return columns


def _favorite(value: object) -> bool:
    if value is None:
        return False
    flag = str(value).casefold()
    if flag in {"是", "true", "yes", "1"}:
        return True
    if flag in {"", "否", "false", "no", "0"}:
        return False
    raise WorkbookError("收藏列请填写是或否")


def _method_values(value: object, label: str) -> list[str]:
    if value in (None, ""):
        return []
    if isinstance(value, str):
        try:
            items = json.loads(value)
        except (ValueError, RecursionError):
            items = None
        if isinstance(items, list) and all(isinstance(item, str) for item in items):
            return items
    raise WorkbookError(f'{label}列必须是 JSON 字符串数组，例如 ["值1","值2"]')


def _read_contact(row: tuple, columns: dict[str, int]) -> ContactInput | None:
    values = _values(row)
    if not any(value not in (None, "") for value in values):
        return None
    if any(value not in (None, "") and index not in columns.values() for index, value in enumerate(values)):
        raise WorkbookError("有内容的列必须有标题")

    def field(label: str):
        index = columns.get(label, len(values))
        return values[index] if index < len(values) else None

    methods = [
        {"type": kind, "value": value}
        for label, kind in METHOD_COLUMNS.items()
        for value in _method_values(field(label), label)
    ]
    name = field("姓名")
    notes = field("备注")
    if not name:
        raise WorkbookError("姓名不能为空")
    if not isinstance(name, str) or (notes is not None and not isinstance(notes, str)):
        raise WorkbookError("姓名和备注必须使用文本格式")
    return ContactInput(name=name, notes=notes or "", is_favorite=_favorite(field("收藏")), methods=methods)


def read_contacts(data: bytes) -> list[ContactInput]:
    try:
        _check_archive(data)
        with closing(load_workbook(BytesIO(data), read_only=True, keep_links=False)) as workbook:
            if not workbook.worksheets:
                raise WorkbookError("工作簿没有可用工作表")
            sheet = next((sheet for sheet in workbook.worksheets if sheet.title == SHEET_NAME), workbook.worksheets[0])
            # Inspect actual rows even if a producer wrote an incorrect worksheet dimension.
            sheet.reset_dimensions()
            rows = sheet.iter_rows()
            header = next(rows, ())
            if len(header) > len(HEADERS):
                raise WorkbookError("工作表最多使用 8 列")
            columns = _columns(header)
            contacts = []
            for number, row in enumerate(rows, start=2):
                if number > MAX_DATA_ROWS + 1 or len(row) > len(HEADERS):
                    raise WorkbookError("工作表最多使用 2,000 个数据行和 8 列")
                try:
                    contact = _read_contact(row, columns)
                except WorkbookError as error:
                    raise WorkbookError(f"第 {number} 行：{error}") from error
                except ValidationError as error:
                    problem = error.errors(include_context=False, include_input=False)[0]
                    field = ".".join(str(location) for location in problem["loc"])
                    raise WorkbookError(f'第 {number} 行：{field} — {problem["msg"]}') from error
                if contact is not None:
                    contacts.append(contact)
    except WorkbookError:
        raise
    except (
        BadZipFile, CompressionError, DefusedXmlException, InvalidFileException, ParseError,
        OSError, ValueError, KeyError, TypeError, IndexError, RuntimeError, EOFError,
    ) as error:
        raise WorkbookError("无法读取 Excel，请检查文件是否为有效的 .xlsx 工作簿") from error
    return contacts


def write_contacts(contacts: list[Contact]) -> bytes:
    with closing(Workbook()) as workbook:
        sheet = workbook.active
        sheet.title = SHEET_NAME
        sheet.append(HEADERS)
        sheet.freeze_panes = "A2"
        for index, width in enumerate((20, 36, 10, 30, 30, 24, 36, 24), start=1):
            sheet.column_dimensions[get_column_letter(index)].width = width

        for number, contact in enumerate(contacts, start=2):
            methods = {kind: [] for kind in METHOD_COLUMNS.values()}
            for method in contact.methods:
                methods[method.type].append(method.value)
            values = (
                contact.name, contact.notes, "是" if contact.is_favorite else "否",
                *(json.dumps(values, ensure_ascii=False) for values in methods.values()),
            )
            for column, value in enumerate(values, start=1):
                cell = sheet.cell(number, column, value)
                # openpyxl treats a leading '=' as a formula unless the type is explicit.
                cell.data_type = "s"
                cell.number_format = "@"
        sheet.auto_filter.ref = sheet.dimensions
        output = BytesIO()
        workbook.save(output)
        return output.getvalue()
