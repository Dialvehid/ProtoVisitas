# ProtoVisitas

Prototipo académico para gestionar clientes, usuarios y visitas técnicas. La
aplicación separa el frontend en React/Vite, una API en FastAPI y una base de
datos MariaDB, con ejecución local mediante Docker Compose.

## Funcionalidades

- Gestión de clientes y sus ubicaciones.
- Programación y seguimiento de visitas.
- Roles de administrador, supervisor y técnico.
- Selección de ubicaciones con Google Maps.
- API asíncrona con FastAPI y SQLAlchemy.

## Arquitectura

- `Frontend/`: React 19, Vite y módulos SCSS.
- `Backend/`: FastAPI, SQLAlchemy asíncrono y validación con Pydantic.
- `DB/`: esquema e inicialización de MariaDB.
- `docker-compose.yml`: entorno local reproducible.

## Configuración local

1. Copia `.env.example` como `.env`.
2. Define `PROTOVISITAS_DATABASE_URL` con una URL SQLAlchemy para `asyncmy`.
3. Reemplaza las contraseñas de ejemplo por valores fuertes y únicos.
4. Opcionalmente, agrega una clave de Google Maps restringida por dominio y API.
5. Inicia los servicios:

   ```bash
   docker compose up --build
   ```

El frontend queda disponible en `http://localhost` y la API en
`http://localhost:8000`.

## Primer administrador

La base de datos pública no incluye usuarios, contraseñas, clientes ni visitas.
Después de iniciar MariaDB y el backend, crea el administrador localmente:

```bash
docker compose exec backend \
  python -m scripts.create_admin --name "Administrador local" --email "admin@example.test"
```

La contraseña se solicita de forma interactiva y se almacena con PBKDF2-SHA256,
salt aleatorio y 600 000 iteraciones.

## Seguridad y privacidad

- Los archivos `.env` están ignorados; solo se publica `.env.example`.
- No se incluyen documentos académicos, datos personales ni credenciales.
- La clave de Google Maps usada en el navegador debe restringirse en Google Cloud.
- El SQL público crea únicamente el esquema y catálogos indispensables.

Este proyecto es un prototipo demostrativo. Antes de usarlo en producción se
deben implementar sesiones o tokens de acceso, autorización independiente del
cliente, migraciones de base de datos, pruebas automatizadas y una política CORS
limitada a dominios conocidos.
