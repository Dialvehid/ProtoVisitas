"""Modelos de dominio basados en la estructura de base de datos declarada en Creacion.sql."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Rol(Base):
    """Rol asignado a los usuarios."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol")


class Usuario(Base):
    """Usuario de la plataforma."""

    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    supervisor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rol: Mapped[Rol] = relationship(back_populates="usuarios")
    supervisor: Mapped[Optional["Usuario"]] = relationship(
        remote_side="Usuario.id", back_populates="subordinados"
    )
    subordinados: Mapped[list["Usuario"]] = relationship(
        back_populates="supervisor",
    )
    visitas_supervisadas: Mapped[list["Visita"]] = relationship(
        back_populates="supervisor",
        foreign_keys="Visita.supervisor_id",
    )
    visitas_programadas: Mapped[list["Visita"]] = relationship(
        back_populates="tecnico",
        foreign_keys="Visita.tecnico_id",
    )


class Cliente(Base):
    """Cliente visitado por los técnicos."""

    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    direccion: Mapped[Optional[str]] = mapped_column(String(200))
    departamento: Mapped[Optional[str]] = mapped_column(String(80))
    municipio: Mapped[Optional[str]] = mapped_column(String(80))
    latitud: Mapped[Optional[float]] = mapped_column(Float)
    longitud: Mapped[Optional[float]] = mapped_column(Float)
    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    visitas: Mapped[list["Visita"]] = relationship(back_populates="cliente")


class EstadoVisita(Base):
    """Estado de una visita."""

    __tablename__ = "estados_visita"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    visitas: Mapped[list["Visita"]] = relationship(back_populates="estado")


class Visita(Base):
    """Registro de visitas planificadas o ejecutadas."""

    __tablename__ = "visitas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    supervisor_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False
    )
    tecnico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados_visita.id"), nullable=False)
    fecha_programada: Mapped[date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[Optional[time]] = mapped_column(Time)
    hora_fin: Mapped[Optional[time]] = mapped_column(Time)
    notas: Mapped[Optional[str]] = mapped_column(Text)
    latitud_inicio: Mapped[Optional[float]] = mapped_column(Float)
    longitud_inicio: Mapped[Optional[float]] = mapped_column(Float)
    latitud_fin: Mapped[Optional[float]] = mapped_column(Float)
    longitud_fin: Mapped[Optional[float]] = mapped_column(Float)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cliente: Mapped[Cliente] = relationship(back_populates="visitas")
    supervisor: Mapped[Usuario] = relationship(
        back_populates="visitas_supervisadas", foreign_keys=[supervisor_id]
    )
    tecnico: Mapped[Usuario] = relationship(
        back_populates="visitas_programadas", foreign_keys=[tecnico_id]
    )
    estado: Mapped[EstadoVisita] = relationship(back_populates="visitas")
