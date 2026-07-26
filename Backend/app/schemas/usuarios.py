"""Esquemas para operaciones relacionadas con usuarios."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UsuarioCatalogoItem(BaseModel):
    """Elemento simple para catálogos desplegables."""

    id: int
    nombre: str


class CatalogosUsuariosResponse(BaseModel):
    """Listas auxiliares usadas en la administración de usuarios."""

    roles: list[UsuarioCatalogoItem]
    supervisores: list[UsuarioCatalogoItem]


class UsuarioAdminBase(BaseModel):
    """Campos comunes al crear o actualizar usuarios como administrador."""

    nombre: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    rol_id: int
    supervisor_id: Optional[int] = Field(default=None, ge=1)
    activo: bool = True


class UsuarioAdminCreate(UsuarioAdminBase):
    """Datos necesarios para registrar un usuario desde la consola de admins."""

    password: str = Field(..., min_length=6, max_length=128)


class UsuarioAdminUpdate(BaseModel):
    """Campos opcionales que un admin puede ajustar."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    rol_id: Optional[int] = Field(default=None, ge=1)
    supervisor_id: Optional[int] = Field(default=None, ge=1)
    activo: Optional[bool] = None


class UsuarioAdminResponse(BaseModel):
    """Estructura devuelta al administrar usuarios."""

    id: int
    nombre: str
    email: EmailStr
    rol_id: int
    rol: str
    supervisor_id: int | None = None
    supervisor: str | None = None
    activo: bool
    creado_en: datetime

    class Config:
        from_attributes = True


class ResetPasswordRequest(BaseModel):
    """Solicitud para definir una nueva contraseña (sin exponer la actual)."""

    password: str = Field(..., min_length=6, max_length=128)


class UsuarioPerfilUpdateRequest(BaseModel):
    """Campos que el propio usuario puede ajustar en su perfil."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    nueva_contrasena: Optional[str] = Field(default=None, min_length=6, max_length=128)
