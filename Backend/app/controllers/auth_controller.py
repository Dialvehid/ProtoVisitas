from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.core.database import get_session
from app.core.security import verify_password
from app.models import Usuario
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo

router = APIRouter(prefix="/auth")

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, session: AsyncSession = Depends(get_session)):
    stmt = select(Usuario).options(joinedload(Usuario.rol)).where(
        Usuario.email == credentials.user
    )
    user = (await session.execute(stmt)).scalar_one_or_none()

    if not user or not user.activo or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
        )

    return LoginResponse(
        success=True,
        user=UserInfo(
            id=user.id,
            nombre=user.nombre,
            email=user.email,
            rol=user.rol.nombre if user.rol else "",
            supervisor_id=user.supervisor_id,
        ),
    )
