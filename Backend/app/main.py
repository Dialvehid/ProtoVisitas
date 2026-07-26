from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core import database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Conexion a la base de datos."""
    await database.connect()
    try:
        yield
    finally:
        await database.disconnect()


app = FastAPI(
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Endpoint para validar que el API Funciona"""
    return {"status": "ok"}
