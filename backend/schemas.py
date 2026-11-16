import re
from typing import Annotated, Literal, get_args

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StrictBool, StringConstraints
from pydantic import model_validator

MethodType = Literal["phone", "email", "social", "address", "other"]
METHOD_TYPES = get_args(MethodType)
MAX_METHODS = 30
INVALID_XML_TEXT = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff\ufffe\uffff]")
EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+")


def excel_text(value: str) -> str:
    if INVALID_XML_TEXT.search(value):
        raise ValueError("文本含有 Excel 不支持的字符")
    return value


class ContactMethod(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: MethodType
    value: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300), AfterValidator(excel_text)]

    @model_validator(mode="after")
    def validate_email(self) -> "ContactMethod":
        if self.type == "email" and not EMAIL_PATTERN.fullmatch(self.value):
            raise ValueError("邮箱格式不正确")
        return self


class ContactInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80), AfterValidator(excel_text)]
    notes: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000), AfterValidator(excel_text)] = ""
    is_favorite: StrictBool = False
    methods: list[ContactMethod] = Field(default_factory=list, max_length=MAX_METHODS)


class Contact(ContactInput):
    id: int


class ContactList(BaseModel):
    contacts: list[Contact]


class FavoriteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_favorite: StrictBool


class ImportResult(BaseModel):
    imported: int
    skipped: int
    message: str
