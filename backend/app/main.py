from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.models import usuario, espacio, reserva  # noqa: F401  (registrar modelos)
from app.api import auth, usuarios, espacios, reservas

import os

app = FastAPI(
    title="Sistema de Reservas Institucionales",
    description=(
        "API para gestionar reservas de espacios institucionales con autenticación "
        "JWT, roles (admin / usuario) y reglas de negocio académicas."
    ),
    version="1.0.0",
)

# Orígenes permitidos (configurables por variable de entorno CORS_ORIGINS,
# separados por coma). Por defecto, solo el frontend de desarrollo local.
_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
allowed_origins = [o.strip() for o in _origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(espacios.router)
app.include_router(reservas.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "success": True,
        "message": "API Reservas Institucionales en funcionamiento",
        "docs": "/docs",
    }
