"""Esquemas para representar visitas."""
from datetime import date, time

from pydantic import BaseModel


class VisitaItem(BaseModel):
    """Representa una visita individual simplificada."""

    id: int
    cliente: str
    supervisor: str
    tecnico: str
    estado: str
    fecha_programada: date
    hora_inicio: time | None = None
    hora_fin: time | None = None
    notas: str | None = None


class VisitasDiaResponse(BaseModel):
    """Visitas correspondientes a un usuario para una fecha especifica."""

    fecha: date
    rol: str
    visitas: list[VisitaItem]


class OpcionBasica(BaseModel):
    """Elemento de catalogo simple (id/nombre)."""

    id: int
    nombre: str


class VisitaGestionItem(BaseModel):
    """Detalle extendido de una visita para propositos de gestion."""

    id: int
    cliente_id: int
    cliente: str
    cliente_direccion: str | None = None
    cliente_latitud: float | None = None
    cliente_longitud: float | None = None
    supervisor_id: int
    supervisor: str
    tecnico_id: int
    tecnico: str
    estado: str
    fecha_programada: date
    hora_inicio: time | None = None
    hora_fin: time | None = None
    notas: str | None = None
    latitud_inicio: float | None = None
    longitud_inicio: float | None = None
    latitud_fin: float | None = None
    longitud_fin: float | None = None


class VisitasGestionResponse(BaseModel):
    """Respuesta con visitas y catálogos auxiliares para la vista de gestión."""

    fecha: date
    rol: str
    visitas: list[VisitaGestionItem]
    clientes: list[OpcionBasica]
    tecnicos: list[OpcionBasica]


class VisitaCreateRequest(BaseModel):
    """Datos requeridos para agendar una nueva visita."""

    cliente_id: int
    tecnico_id: int
    fecha_programada: date
    notas: str | None = None


class VisitaInicioRequest(BaseModel):
    """Datos necesarios para marcar el inicio de una visita."""

    latitud: float
    longitud: float


class VisitaFinalizacionRequest(BaseModel):
    """Datos necesarios para cerrar una visita en campo."""

    latitud: float
    longitud: float
    notas: str | None = None
