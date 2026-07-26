"""Esquemas Pydantic para operaciones de clientes."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ClienteBase(BaseModel):
    """Campos compartidos entre creacion y actualizacion."""

    nombre: str = Field(..., min_length=1, max_length=100)
    direccion: Optional[str] = Field(default=None, max_length=200)
    departamento: Optional[str] = Field(default=None, max_length=80)
    municipio: Optional[str] = Field(default=None, max_length=80)
    telefono: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    latitud: Optional[float] = Field(default=None, ge=-90, le=90)
    longitud: Optional[float] = Field(default=None, ge=-180, le=180)


class ClienteCreate(ClienteBase):
    """Datos requeridos para registrar un cliente."""

    pass


class ClienteUpdate(BaseModel):
    """Datos opcionales para actualizar un cliente."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    direccion: Optional[str] = Field(default=None, max_length=200)
    departamento: Optional[str] = Field(default=None, max_length=80)
    municipio: Optional[str] = Field(default=None, max_length=80)
    telefono: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    latitud: Optional[float] = Field(default=None, ge=-90, le=90)
    longitud: Optional[float] = Field(default=None, ge=-180, le=180)


class ClienteResponse(ClienteBase):
    """Respuesta estandar con metadatos del cliente."""

    id: int
    creado_en: datetime

    class Config:
        from_attributes = True
