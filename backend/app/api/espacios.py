from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.crud import espacios as crud_espacios
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.espacio import EspacioCreate, EspacioOut

router = APIRouter(prefix="/espacios", tags=["Espacios"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_espacio(
    data: EspacioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=["admin"]),
):
    espacio = crud_espacios.create(db, data)
    return {
        "success": True,
        "message": "Espacio creado correctamente",
        "data": EspacioOut.model_validate(espacio).model_dump(),
    }


@router.get("/", response_model=list[EspacioOut])
def listar_espacios(
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=[]),
):
    return crud_espacios.list_all(db)


@router.get("/disponibles", response_model=list[EspacioOut])
def listar_espacios_disponibles(
    fecha: Optional[date] = Query(None),
    hora_inicio: Optional[time] = Query(None),
    hora_fin: Optional[time] = Query(None),
    cantidad_asistentes: Optional[int] = Query(None, gt=0),
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=[]),
):
    return crud_espacios.list_disponibles(
        db, fecha, hora_inicio, hora_fin, cantidad_asistentes
    )
