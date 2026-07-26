from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.models import Cliente
from app.schemas.clientes import ClienteCreate, ClienteResponse, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("/", response_model=list[ClienteResponse])
async def listar_clientes(q: str | None = Query(None), session: AsyncSession = Depends(get_session)):
    stmt = select(Cliente).order_by(Cliente.nombre.asc())
    if q:
        term = f"%{q.lower()}%"
        stmt = stmt.where(or_(
            func.lower(func.coalesce(Cliente.nombre, "")).like(term),
            func.lower(func.coalesce(Cliente.direccion, "")).like(term),
            func.lower(func.coalesce(Cliente.departamento, "")).like(term),
            func.lower(func.coalesce(Cliente.municipio, "")).like(term),
            func.lower(func.coalesce(Cliente.telefono, "")).like(term),
            func.lower(func.coalesce(Cliente.email, "")).like(term),
        ))
    return (await session.execute(stmt)).scalars().all()


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obtener_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    cliente = (await session.execute(select(Cliente).where(Cliente.id == cliente_id))).scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")
    return cliente


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def crear_cliente(payload: ClienteCreate, session: AsyncSession = Depends(get_session)):
    cliente = Cliente(**payload.model_dump())
    session.add(cliente)
    await session.commit()
    await session.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def actualizar_cliente(cliente_id: int, payload: ClienteUpdate, session: AsyncSession = Depends(get_session)):
    cliente = (await session.execute(select(Cliente).where(Cliente.id == cliente_id))).scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cliente, k, v)

    await session.commit()
    await session.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    cliente = (await session.execute(select(Cliente).where(Cliente.id == cliente_id))).scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")

    await session.delete(cliente)
    await session.commit()
