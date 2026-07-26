"""Registro de Controladores para enrutar en la API."""
from fastapi import APIRouter

from app.controllers import (
    auth_controller,
    clientes_controller,
    usuarios_controller,
    visitas_controller,
)

api_router = APIRouter()

api_router.include_router(auth_controller.router)
api_router.include_router(clientes_controller.router)
api_router.include_router(usuarios_controller.router)
api_router.include_router(visitas_controller.router)
