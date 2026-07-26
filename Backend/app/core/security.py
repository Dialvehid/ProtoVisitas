"""Utilidades para almacenar contraseñas mediante PBKDF2-SHA256."""
from base64 import urlsafe_b64decode, urlsafe_b64encode
from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_bytes


ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 600_000
SALT_BYTES = 16


def get_password_hash(password: str) -> str:
    """Genera un hash con salt aleatorio y un factor de trabajo elevado."""
    salt = token_bytes(SALT_BYTES)
    digest = pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        ITERATIONS,
    )
    encoded_salt = urlsafe_b64encode(salt).decode("ascii")
    encoded_digest = urlsafe_b64encode(digest).decode("ascii")
    return f"{ALGORITHM}${ITERATIONS}${encoded_salt}${encoded_digest}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Valida una contraseña sin exponer el valor almacenado."""
    try:
        algorithm, iterations, encoded_salt, encoded_digest = hashed_password.split("$", 3)
        if algorithm != ALGORITHM:
            return False
        salt = urlsafe_b64decode(encoded_salt.encode("ascii"))
        expected_digest = urlsafe_b64decode(encoded_digest.encode("ascii"))
        candidate_digest = pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            int(iterations),
        )
    except (ValueError, TypeError):
        return False

    return compare_digest(candidate_digest, expected_digest)
