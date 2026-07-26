from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Datos necesarios para intentar iniciar sesion."""

    user: EmailStr
    password: str


class UserInfo(BaseModel):
    """Datos basicos del usuario autenticado."""

    id: int
    nombre: str
    email: EmailStr
    rol: str
    supervisor_id: int | None = None


class LoginResponse(BaseModel):
    """Respuesta de autenticacion."""

    success: bool
    user: UserInfo

