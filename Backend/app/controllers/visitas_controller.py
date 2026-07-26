from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.core.database import get_session
from app.models import Cliente, EstadoVisita, Usuario, Visita
from app.schemas.visitas import (
    OpcionBasica,
    VisitaCreateRequest,
    VisitaFinalizacionRequest,
    VisitaGestionItem,
    VisitaInicioRequest,
    VisitaItem,
    VisitasDiaResponse,
    VisitasGestionResponse,
)

router = APIRouter(prefix="/visitas", tags=["visitas"])

_VISITA_REL = (
    joinedload(Visita.cliente),
    joinedload(Visita.estado),
    joinedload(Visita.supervisor),
    joinedload(Visita.tecnico),
)


async def _fetch_user(session: AsyncSession, user_id: int):
    stmt = select(Usuario).options(joinedload(Usuario.rol)).where(Usuario.id == user_id)
    user = (await session.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuario no encontrado.")
    if not user.rol:
        raise HTTPException(500, "El usuario no tiene un rol asociado.")
    return user


async def _fetch_estado(session: AsyncSession, nombre: str):
    stmt = select(EstadoVisita).where(func.lower(EstadoVisita.nombre) == nombre.lower())
    estado = (await session.execute(stmt)).scalar_one_or_none()
    if not estado:
        raise HTTPException(500, f"No se encontró el estado '{nombre}'.")
    return estado


async def _fetch_visita(session: AsyncSession, visita_id: int):
    stmt = select(Visita).options(*_VISITA_REL).where(Visita.id == visita_id)
    return (await session.execute(stmt)).scalar_one_or_none()


def _visita_stmt(fecha: date):
    return select(Visita).options(*_VISITA_REL).where(
        Visita.fecha_programada == fecha
    ).order_by(Visita.hora_inicio)

def _visita_stmt_all():
    return select(Visita).options(*_VISITA_REL).order_by(Visita.hora_inicio)

def _resp_simple(v: Visita):
    return VisitaItem(
        id=v.id,
        cliente=v.cliente.nombre if v.cliente else "",
        supervisor=v.supervisor.nombre if v.supervisor else "",
        tecnico=v.tecnico.nombre if v.tecnico else "",
        estado=v.estado.nombre if v.estado else "",
        fecha_programada=v.fecha_programada,
        hora_inicio=v.hora_inicio,
        hora_fin=v.hora_fin,
        notas=v.notas,
    )


def _resp_gestion(v: Visita):
    c, s, t, e = v.cliente, v.supervisor, v.tecnico, v.estado
    return VisitaGestionItem(
        id=v.id,
        cliente_id=c.id if c else 0,
        cliente=c.nombre if c else "",
        cliente_direccion=c.direccion if c else None,
        cliente_latitud=c.latitud if c else None,
        cliente_longitud=c.longitud if c else None,
        supervisor_id=s.id if s else 0,
        supervisor=s.nombre if s else "",
        tecnico_id=t.id if t else 0,
        tecnico=t.nombre if t else "",
        estado=e.nombre if e else "",
        fecha_programada=v.fecha_programada,
        hora_inicio=v.hora_inicio,
        hora_fin=v.hora_fin,
        notas=v.notas,
        latitud_inicio=v.latitud_inicio,
        longitud_inicio=v.longitud_inicio,
        latitud_fin=v.latitud_fin,
        longitud_fin=v.longitud_fin,
    )


def _hora():
    return datetime.utcnow().time().replace(microsecond=0)


@router.get("/dia", response_model=VisitasDiaResponse)
async def visitas_del_dia(
    usuario_id: int = Query(..., ge=1),
    fecha: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    fecha = fecha or date.today()
    usr = await _fetch_user(session, usuario_id)
    rol = usr.rol.nombre.lower()

    stmt = _visita_stmt(fecha)
    if rol == "supervisor":
        stmt = stmt.where(Visita.supervisor_id == usr.id)
    elif rol == "tecnico":
        stmt = stmt.where(Visita.tecnico_id == usr.id)

    visitas = (await session.execute(stmt)).scalars().all()

    return VisitasDiaResponse(
        fecha=fecha,
        rol=usr.rol.nombre,
        visitas=[_resp_simple(v) for v in visitas],
    )


@router.get("/gestion", response_model=VisitasGestionResponse)
async def visitas_para_gestion(
    usuario_id: int = Query(..., ge=1),
    fecha: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    fecha = fecha or date.today()
    usr = await _fetch_user(session, usuario_id)
    rol = usr.rol.nombre.lower()

    stmt = _visita_stmt(fecha)
    if rol == "supervisor":
        stmt = stmt.where(Visita.supervisor_id == usr.id)
    elif rol == "tecnico":
        stmt = stmt.where(Visita.tecnico_id == usr.id)

    visitas = (await session.execute(stmt)).scalars().all()

    clientes = [
        OpcionBasica(id=c.id, nombre=c.nombre)
        for c in (await session.execute(select(Cliente).order_by(Cliente.nombre))).scalars().all()
    ]

    tecnicos = []
    if rol == "supervisor":
        usuarios = await session.execute(
            select(Usuario)
            .options(joinedload(Usuario.rol))
            .where(Usuario.supervisor_id == usr.id)
        )
        tecnicos = [
            OpcionBasica(id=t.id, nombre=t.nombre)
            for t in usuarios.scalars().all()
            if t.rol and t.rol.nombre.lower() == "tecnico"
        ]

    return VisitasGestionResponse(
        fecha=fecha,
        rol=usr.rol.nombre,
        visitas=[_resp_gestion(v) for v in visitas],
        clientes=clientes,
        tecnicos=tecnicos,
    )


@router.post("/", response_model=VisitaGestionItem, status_code=201)
async def crear_visita(
    payload: VisitaCreateRequest,
    usuario_id: int = Query(..., ge=1),
    session: AsyncSession = Depends(get_session),
):
    usr = await _fetch_user(session, usuario_id)
    if usr.rol.nombre.lower() != "supervisor":
        raise HTTPException(403, "Solo los supervisores pueden crear visitas.")

    cliente = await session.get(Cliente, payload.cliente_id)
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado.")

    tech = await _fetch_user(session, payload.tecnico_id)
    if tech.supervisor_id != usr.id:
        raise HTTPException(403, "Solo puedes asignar técnicos bajo tu supervisión.")
    if tech.rol.nombre.lower() != "tecnico":
        raise HTTPException(400, "El usuario seleccionado no es un técnico.")

    st = await _fetch_estado(session, "PLANIFICADA")
    visita = Visita(
        cliente_id=cliente.id,
        supervisor_id=usr.id,
        tecnico_id=tech.id,
        estado_id=st.id,
        fecha_programada=payload.fecha_programada,
        notas=payload.notas,
    )
    session.add(visita)
    await session.commit()

    v = await _fetch_visita(session, visita.id)
    if not v:
        raise HTTPException(500, "No se pudo recuperar la visita creada.")
    return _resp_gestion(v)


async def _validar_permisos_tecnico(session, usuario_id, visita_id):
    user = await _fetch_user(session, usuario_id)
    if user.rol.nombre.lower() != "tecnico":
        raise HTTPException(403, "Solo los técnicos pueden operar visitas.")
    visita = await _fetch_visita(session, visita_id)
    if not visita:
        raise HTTPException(404, "Visita no encontrada.")
    if visita.tecnico_id != user.id:
        raise HTTPException(403, "No estás asignado a esta visita.")
    return visita


@router.post("/{visita_id}/iniciar", response_model=VisitaGestionItem)
async def iniciar_visita(
    visita_id: int,
    payload: VisitaInicioRequest,
    usuario_id: int = Query(..., ge=1),
    session: AsyncSession = Depends(get_session),
):
    visita = await _validar_permisos_tecnico(session, usuario_id, visita_id)
    if visita.hora_inicio:
        raise HTTPException(400, "La visita ya fue iniciada.")

    st = await _fetch_estado(session, "EN_PROGRESO")
    visita.hora_inicio = _hora()
    visita.latitud_inicio = payload.latitud
    visita.longitud_inicio = payload.longitud
    visita.estado_id = st.id
    await session.commit()

    return _resp_gestion((await _fetch_visita(session, visita_id)))


@router.post("/{visita_id}/finalizar", response_model=VisitaGestionItem)
async def finalizar_visita(
    visita_id: int,
    payload: VisitaFinalizacionRequest,
    usuario_id: int = Query(..., ge=1),
    session: AsyncSession = Depends(get_session),
):
    visita = await _validar_permisos_tecnico(session, usuario_id, visita_id)
    if not visita.hora_inicio:
        raise HTTPException(400, "La visita debe iniciarse antes.")
    if visita.hora_fin:
        raise HTTPException(400, "La visita ya fue finalizada.")

    st = await _fetch_estado(session, "COMPLETADA")
    visita.hora_fin = _hora()
    visita.latitud_fin = payload.latitud
    visita.longitud_fin = payload.longitud
    if payload.notas:
        visita.notas = payload.notas
    visita.estado_id = st.id
    await session.commit()

    return _resp_gestion((await _fetch_visita(session, visita_id)))

@router.get("/all", response_model=VisitasGestionResponse)
async def obtener_visitas(
    usuario_id: int = Query(..., ge=1),
    session: AsyncSession = Depends(get_session),
):
    usr = await _fetch_user(session, usuario_id)
    rol = usr.rol.nombre.lower()
    stmt = _visita_stmt_all()
    visitas = (await session.execute(stmt)).scalars().all()

    clientes = [
        OpcionBasica(id=c.id, nombre=c.nombre)
        for c in (await session.execute(select(Cliente).order_by(Cliente.nombre))).scalars().all()
    ]

    tecnicos = []


    return VisitasGestionResponse(
        fecha=str(datetime.utcnow().date()), #prueba de fecha fallida jaja
        rol=rol,
        visitas=[_resp_gestion(v) for v in visitas],
        clientes=clientes,
        tecnicos=tecnicos,
    )