from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.crud import espacios as crud_espacios
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.espacio import EspacioCreate, EspacioOut, EspacioUpdate

router = APIRouter(prefix="/espacios", tags=["Espacios"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_espacio(
    data: EspacioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=["admin"]),
):
    if crud_espacios.get_by_nombre(db, data.nombre):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un espacio con ese nombre",
        )
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


@router.put("/{id_espacio}", response_model=EspacioOut)
def editar_espacio(
    id_espacio: int,
    data: EspacioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=["admin"]),
):
    espacio = crud_espacios.get_by_id(db, id_espacio)
    if not espacio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espacio no encontrado",
        )
    if data.nombre and data.nombre != espacio.nombre:
        existente = crud_espacios.get_by_nombre(db, data.nombre)
        if existente and existente.id_espacio != id_espacio:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un espacio con ese nombre",
            )
    return crud_espacios.update(db, espacio, data)
