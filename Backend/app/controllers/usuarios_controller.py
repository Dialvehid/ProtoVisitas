from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.core.database import get_session
from app.core.security import get_password_hash
from app.models import Rol, Usuario
from app.schemas.auth import UserInfo
from app.schemas.usuarios import (
    CatalogosUsuariosResponse,
    ResetPasswordRequest,
    UsuarioAdminCreate,
    UsuarioAdminResponse,
    UsuarioAdminUpdate,
    UsuarioCatalogoItem,
    UsuarioPerfilUpdateRequest,
)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


async def _get_usuario(session: AsyncSession, usuario_id: int, with_relations=False):
    stmt = select(Usuario).where(Usuario.id == usuario_id)
    if with_relations:
        stmt = stmt.options(joinedload(Usuario.rol), joinedload(Usuario.supervisor))
    usuario = (await session.execute(stmt)).scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado.")
    if with_relations and not usuario.rol:
        raise HTTPException(500, "El usuario no tiene un rol asociado.")
    return usuario


async def _require_admin(session: AsyncSession, usuario_id: int):
    usuario = await _get_usuario(session, usuario_id, True)
    if (usuario.rol.nombre or "").lower() != "administrador":
        raise HTTPException(403, "Se requiere rol Administrador para esta operación.")
    return usuario


def _usuario_admin_response(u: Usuario):
    return UsuarioAdminResponse(
        id=u.id,
        nombre=u.nombre,
        email=u.email,
        rol_id=u.rol_id,
        rol=u.rol.nombre if u.rol else "",
        supervisor_id=u.supervisor_id,
        supervisor=u.supervisor.nombre if u.supervisor else None,
        activo=u.activo,
        creado_en=u.creado_en,
    )


async def _ensure_rol(session: AsyncSession, rol_id: int):
    rol = await session.get(Rol, rol_id)
    if not rol:
        raise HTTPException(404, "Rol no encontrado.")
    return rol


async def _ensure_supervisor(session: AsyncSession, supervisor_id: int | None):
    if supervisor_id is None:
        return None
    s = await _get_usuario(session, supervisor_id, True)
    if (s.rol.nombre or "").lower() != "supervisor":
        raise HTTPException(400, "Solo se pueden asignar supervisores válidos.")
    return s


@router.get("/", response_model=list[UsuarioAdminResponse])
async def listar_usuarios(usuario_id: int = Query(..., ge=1), session: AsyncSession = Depends(get_session)):
    await _require_admin(session, usuario_id)
    stmt = select(Usuario).options(joinedload(Usuario.rol), joinedload(Usuario.supervisor)).order_by(Usuario.nombre.asc())
    usuarios = (await session.execute(stmt)).scalars().all()
    return [_usuario_admin_response(u) for u in usuarios]


@router.get("/catalogos", response_model=CatalogosUsuariosResponse)
async def catalogos_usuarios(usuario_id: int = Query(..., ge=1), session: AsyncSession = Depends(get_session)):
    await _require_admin(session, usuario_id)

    roles = [
        UsuarioCatalogoItem(id=r.id, nombre=r.nombre)
        for r in (await session.execute(select(Rol).order_by(Rol.nombre.asc()))).scalars().all()
    ]

    supervisores = [
        UsuarioCatalogoItem(id=u.id, nombre=u.nombre)
        for u in (await session.execute(select(Usuario).options(joinedload(Usuario.rol)).order_by(Usuario.nombre.asc()))).scalars().all()
        if u.rol and u.rol.nombre.lower() == "supervisor"
    ]

    return CatalogosUsuariosResponse(roles=roles, supervisores=supervisores)


@router.post("/", response_model=UsuarioAdminResponse, status_code=201)
async def crear_usuario(payload: UsuarioAdminCreate, usuario_id: int = Query(..., ge=1), session: AsyncSession = Depends(get_session)):
    await _require_admin(session, usuario_id)
    await _ensure_rol(session, payload.rol_id)
    await _ensure_supervisor(session, payload.supervisor_id)

    u = Usuario(
        nombre=payload.nombre,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        rol_id=payload.rol_id,
        supervisor_id=payload.supervisor_id,
        activo=payload.activo,
    )
    session.add(u)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "El correo ya está en uso.")

    return _usuario_admin_response(await _get_usuario(session, u.id, True))


@router.put("/perfil", response_model=UserInfo)
async def actualizar_perfil(
    payload: UsuarioPerfilUpdateRequest,
    usuario_id: int = Query(..., ge=1),
    session: AsyncSession = Depends(get_session),
):
    u = await _get_usuario(session, usuario_id, True)
    cambios = payload.model_dump(exclude_unset=True)

    if "nombre" in cambios:
        u.nombre = cambios["nombre"]
    if "email" in cambios:
        u.email = cambios["email"]
    if cambios.get("nueva_contrasena"):
        u.password_hash = get_password_hash(cambios["nueva_contrasena"])

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "El correo ya está en uso.")

    await session.refresh(u)
    return UserInfo(
        id=u.id,
        nombre=u.nombre,
        email=u.email,
        rol=u.rol.nombre if u.rol else "",
        supervisor_id=u.supervisor_id,
    )


@router.put("/{target_usuario_id}", response_model=UsuarioAdminResponse)
async def actualizar_usuario(
    target_usuario_id: int, payload: UsuarioAdminUpdate,
    usuario_id: int = Query(..., ge=1), session: AsyncSession = Depends(get_session)
):
    await _require_admin(session, usuario_id)
    u = await _get_usuario(session, target_usuario_id, True)

    cambios = payload.model_dump(exclude_unset=True)

    if "rol_id" in cambios:
        await _ensure_rol(session, cambios["rol_id"])
        u.rol_id = cambios["rol_id"]

    if "supervisor_id" in cambios:
        sid = cambios["supervisor_id"]
        if sid and sid == u.id:
            raise HTTPException(400, "Un usuario no puede ser su propio supervisor.")
        s = await _ensure_supervisor(session, sid)
        u.supervisor_id = s.id if s else None

    for field in ["nombre", "email", "activo"]:
        if field in cambios:
            setattr(u, field, cambios[field])

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "El correo ya está en uso.")

    return _usuario_admin_response(
        await _get_usuario(session, target_usuario_id, True)
    )


@router.post("/{target_usuario_id}/reset-password", response_model=UsuarioAdminResponse)
async def reiniciar_contrasena(
    target_usuario_id: int, payload: ResetPasswordRequest,
    usuario_id: int = Query(..., ge=1), session: AsyncSession = Depends(get_session)
):
    await _require_admin(session, usuario_id)
    u = await _get_usuario(session, target_usuario_id, True)
    u.password_hash = get_password_hash(payload.password)
    await session.commit()
    return _usuario_admin_response(u)
