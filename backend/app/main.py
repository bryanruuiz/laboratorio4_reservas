from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.models import usuario, espacio, reserva  # noqa: F401  (registrar modelos)
from app.api import auth, usuarios, espacios, reservas

app = FastAPI(
    title="Sistema de Reservas Institucionales",
    description=(
        "API para gestionar reservas de espacios institucionales con autenticación "
        "JWT, roles (admin / usuario) y reglas de negocio académicas."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
