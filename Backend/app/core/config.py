"""Configuracion central de la aplicacion."""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Lee variables de entorno necesarias para la aplicacion."""

    database_url: str = Field()
    db_echo: bool = Field(default=False) # Sin logs

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PROTOVISITAS_",
        case_sensitive=False,
    )


settings = Settings()
