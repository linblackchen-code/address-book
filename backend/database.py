from collections.abc import Iterator
from contextlib import closing, contextmanager
from pathlib import Path
import sqlite3

from .schemas import METHOD_TYPES, Contact, ContactInput, ContactMethod


SCHEMA = """
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1))
);

CREATE TABLE IF NOT EXISTS contact_methods (
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('phone', 'email', 'social', 'address', 'other')),
    value TEXT NOT NULL,
    PRIMARY KEY (contact_id, position)
);
"""


class ContactNotFound(Exception):
    pass


class AddressBook:
    def __init__(self, path: Path):
        self.path = path

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as connection:
            connection.executescript(SCHEMA)

    @contextmanager
    def _write(self) -> Iterator[sqlite3.Connection]:
        with closing(self._connect()) as connection, connection:
            # Serialize duplicate detection and writes across concurrent requests.
            connection.execute("BEGIN IMMEDIATE")
            yield connection

    @staticmethod
    def _read(connection: sqlite3.Connection, contact_id: int | None = None) -> list[Contact]:
        query = """
            SELECT c.id, c.name, c.notes, c.is_favorite, m.type, m.value
            FROM contacts AS c
            LEFT JOIN contact_methods AS m ON m.contact_id = c.id
        """
        params = ()
        if contact_id is not None:
            query += " WHERE c.id = ?"
            params = (contact_id,)
        records: dict[int, Contact] = {}
        for row in connection.execute(query + " ORDER BY c.id, m.position", params):
            if row["id"] not in records:
                records[row["id"]] = Contact(
                    id=row["id"], name=row["name"], notes=row["notes"],
                    is_favorite=bool(row["is_favorite"]),
                )
            if row["type"] is not None:
                records[row["id"]].methods.append(ContactMethod(type=row["type"], value=row["value"]))
        return list(records.values())

    def list_contacts(self) -> list[Contact]:
        with closing(self._connect()) as connection:
            return self._read(connection)

    @staticmethod
    def _insert_methods(connection: sqlite3.Connection, contact_id: int, methods: list[ContactMethod]) -> None:
        connection.executemany(
            "INSERT INTO contact_methods (contact_id, position, type, value) VALUES (?, ?, ?, ?)",
            ((contact_id, position, method.type, method.value) for position, method in enumerate(methods)),
        )

    def _insert(self, connection: sqlite3.Connection, contact: ContactInput) -> Contact:
        cursor = connection.execute(
            "INSERT INTO contacts (name, notes, is_favorite) VALUES (?, ?, ?)",
            (contact.name, contact.notes, contact.is_favorite),
        )
        contact_id = cursor.lastrowid
        self._insert_methods(connection, contact_id, contact.methods)
        return Contact(id=contact_id, **contact.model_dump())

    def create(self, contact: ContactInput) -> Contact:
        with self._write() as connection:
            return self._insert(connection, contact)

    def update(self, contact_id: int, contact: ContactInput) -> Contact:
        with self._write() as connection:
            cursor = connection.execute(
                "UPDATE contacts SET name = ?, notes = ?, is_favorite = ? WHERE id = ?",
                (contact.name, contact.notes, contact.is_favorite, contact_id),
            )
            if cursor.rowcount == 0:
                raise ContactNotFound
            connection.execute("DELETE FROM contact_methods WHERE contact_id = ?", (contact_id,))
            self._insert_methods(connection, contact_id, contact.methods)
            return Contact(id=contact_id, **contact.model_dump())

    def set_favorite(self, contact_id: int, favorite: bool) -> Contact:
        with self._write() as connection:
            cursor = connection.execute("UPDATE contacts SET is_favorite = ? WHERE id = ?", (favorite, contact_id))
            if cursor.rowcount == 0:
                raise ContactNotFound
            return self._read(connection, contact_id)[0]

    def delete(self, contact_id: int) -> None:
        with self._write() as connection:
            cursor = connection.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
            if cursor.rowcount == 0:
                raise ContactNotFound

    @staticmethod
    def _import_key(contact: ContactInput) -> tuple:
        methods = tuple(
            tuple(method.value for method in contact.methods if method.type == kind)
            for kind in METHOD_TYPES
        )
        return contact.name, contact.notes, methods

    def import_contacts(self, contacts: list[ContactInput]) -> int:
        with self._write() as connection:
            existing = {self._import_key(contact) for contact in self._read(connection)}
            imported = 0
            for contact in contacts:
                key = self._import_key(contact)
                if key in existing:
                    continue
                self._insert(connection, contact)
                existing.add(key)
                imported += 1
            return imported
