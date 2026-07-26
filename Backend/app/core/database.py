"""Utilidades para gestionar la conexion con MySQL a traves de SQLAlchemy async."""
from collections.abc import AsyncIterator
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


async def connect() -> None:
    """Inicializa el engine y el session factory si no existen."""
    global _engine, _session_factory
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.db_echo,
        )
        _session_factory = async_sessionmaker(
            _engine,
            expire_on_commit=False,
        )


async def disconnect() -> None:
    """Cierra la db y limpia referencias."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


def get_engine() -> AsyncEngine:
    """Devuelve el engine inicializado o lanza un error si no existe."""
    if _engine is None:
        msg = "La conexion a DB no esta inicializada."
        raise RuntimeError(msg)
    return _engine


async def get_session() -> AsyncIterator[AsyncSession]:
    """Dependencia de FastAPI para obtener una sesion asincrona."""
    if _session_factory is None:
        msg = "Sesion no creada."
        raise RuntimeError(msg)
    async with _session_factory() as session:
        yield session
