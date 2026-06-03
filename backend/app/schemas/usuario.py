from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    correo: EmailStr


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(..., min_length=6, max_length=128)
    rol: Literal["admin", "usuario"] = "usuario"


class UsuarioAdminCreate(UsuarioCreate):
    rol: Literal["admin", "usuario"] = "admin"


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    correo: Optional[EmailStr] = None
    contrasena: Optional[str] = Field(None, min_length=6, max_length=128)
    rol: Optional[Literal["admin", "usuario"]] = None
    estado: Optional[Literal["activo", "inactivo"]] = None


class UsuarioEstadoUpdate(BaseModel):
    estado: Literal["activo", "inactivo"]


class UsuarioOut(UsuarioBase):
    id_usuario: int
    rol: str
    estado: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    correo: Optional[str] = None
    id_usuario: Optional[int] = None
    rol: Optional[str] = None
    scopes: list[str] = []
