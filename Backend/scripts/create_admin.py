"""Crea o actualiza el administrador inicial sin guardar claves en el repositorio."""
from __future__ import annotations

import argparse
import asyncio
from getpass import getpass

from sqlalchemy import select

from app.core import database
from app.core.security import get_password_hash
from app.models import Rol, Usuario


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True, help="Nombre visible del administrador")
    parser.add_argument("--email", required=True, help="Correo usado para iniciar sesión")
    return parser.parse_args()


async def create_admin(name: str, email: str, password: str) -> None:
    await database.connect()
    try:
        async for session in database.get_session():
            role = (
                await session.execute(
                    select(Rol).where(Rol.nombre == "Administrador")
                )
            ).scalar_one()
            user = (
                await session.execute(
                    select(Usuario).where(Usuario.email == email)
                )
            ).scalar_one_or_none()

            if user is None:
                user = Usuario(
                    nombre=name,
                    email=email,
                    password_hash=get_password_hash(password),
                    rol_id=role.id,
                    activo=True,
                )
                session.add(user)
            else:
                user.nombre = name
                user.password_hash = get_password_hash(password)
                user.rol_id = role.id
                user.activo = True

            await session.commit()
            break
    finally:
        await database.disconnect()


def main() -> None:
    args = parse_args()
    password = getpass("Contraseña: ")
    confirmation = getpass("Confirma la contraseña: ")
    if password != confirmation:
        raise SystemExit("Las contraseñas no coinciden.")
    if len(password) < 12:
        raise SystemExit("Usa una contraseña de al menos 12 caracteres.")
    asyncio.run(create_admin(args.name, args.email, password))
    print("Administrador creado o actualizado.")


if __name__ == "__main__":
    main()
