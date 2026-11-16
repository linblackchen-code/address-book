from contextlib import asynccontextmanager
from os import getenv
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi import Path as PathParameter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import AddressBook, ContactNotFound
from .excel import MAX_UPLOAD_BYTES, XLSX_MIME, WorkbookError, read_contacts, write_contacts
from .schemas import Contact, ContactInput, ContactList, FavoriteInput, ImportResult


DEFAULT_DB = Path(__file__).resolve().parent / "data" / "contacts.sqlite3"
DEFAULT_ORIGINS = "http://127.0.0.1:8080,http://localhost:8080,http://[::1]:8080"


def get_book(request: Request) -> AddressBook:
    return request.app.state.address_book


Book = Annotated[AddressBook, Depends(get_book)]
ContactId = Annotated[int, PathParameter(ge=1, le=2**63 - 1)]


def create_app(db_path: Path | None = None) -> FastAPI:
    database = AddressBook(db_path or Path(getenv("ADDRESS_BOOK_DB_PATH", str(DEFAULT_DB))))

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database.initialize()
        app.state.address_book = database
        yield

    app = FastAPI(title="通讯录 API", lifespan=lifespan)
    origins = getenv("ADDRESS_BOOK_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in origins if origin.strip()],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.exception_handler(ContactNotFound)
    async def contact_not_found(_request: Request, _error: ContactNotFound):
        return JSONResponse(status_code=404, content={"detail": "联系人不存在"})

    @app.get("/api/contacts", response_model=ContactList)
    def list_contacts(book: Book):
        return ContactList(contacts=book.list_contacts())

    @app.post("/api/contacts", response_model=Contact, status_code=201)
    def create_contact(contact: ContactInput, book: Book):
        return book.create(contact)

    @app.post("/api/contacts/import", response_model=ImportResult)
    def import_excel(book: Book, file: Annotated[UploadFile, File()]):
        if not (file.filename or "").lower().endswith(".xlsx"):
            raise HTTPException(status_code=400, detail="请选择 .xlsx 文件")
        data = file.file.read(MAX_UPLOAD_BYTES + 1)
        if not data:
            raise HTTPException(status_code=400, detail="Excel 文件不能为空")
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Excel 文件不能超过 5 MiB")
        try:
            contacts = read_contacts(data)
        except WorkbookError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        imported = book.import_contacts(contacts)
        skipped = len(contacts) - imported
        message = f"成功导入 {imported} 位联系人"
        if skipped:
            message += f"，跳过 {skipped} 条重复记录"
        return ImportResult(imported=imported, skipped=skipped, message=message)

    @app.get(
        "/api/contacts/export",
        response_class=Response,
        responses={200: {"content": {XLSX_MIME: {"schema": {"type": "string", "format": "binary"}}}}},
    )
    def export_excel(book: Book):
        return Response(
            content=write_contacts(book.list_contacts()),
            media_type=XLSX_MIME,
            headers={"Content-Disposition": 'attachment; filename="contacts.xlsx"'},
        )

    @app.put("/api/contacts/{contact_id}", response_model=Contact)
    def update_contact(contact_id: ContactId, contact: ContactInput, book: Book):
        return book.update(contact_id, contact)

    @app.delete("/api/contacts/{contact_id}", status_code=204)
    def delete_contact(contact_id: ContactId, book: Book):
        book.delete(contact_id)
        return Response(status_code=204)

    @app.patch("/api/contacts/{contact_id}/favorite", response_model=Contact)
    def set_favorite(contact_id: ContactId, favorite: FavoriteInput, book: Book):
        return book.set_favorite(contact_id, favorite.is_favorite)

    return app


app = create_app()
