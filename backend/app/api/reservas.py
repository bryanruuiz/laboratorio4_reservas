from datetime import datetime, timedelta, time

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.crud import espacios as crud_espacios
from app.crud import reservas as crud_reservas
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.reserva import ReservaCreate, ReservaEstadoUpdate, ReservaOut

router = APIRouter(prefix="/reservas", tags=["Reservas"])

ESTADOS_ESPACIO_NO_RESERVABLES = {"inactivo", "en mantenimiento", "no disponible"}


def _validar_horario_institucional(fecha, hora_inicio: time, hora_fin: time) -> None:
    if hora_inicio >= hora_fin:
        raise HTTPException(
            status_code=400,
            detail="La hora de inicio debe ser estrictamente menor que la hora de fin",
        )

    weekday = fecha.weekday()  # 0=lunes ... 6=domingo
    if weekday == 6:
        raise HTTPException(
            status_code=400,
            detail="No se permiten reservas los domingos",
        )
    if 0 <= weekday <= 4:
        apertura, cierre = time(7, 0), time(20, 0)
    else:  # sábado
        apertura, cierre = time(8, 0), time(12, 0)

    if hora_inicio < apertura or hora_fin > cierre:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Horario fuera del rango permitido "
                f"({apertura.strftime('%H:%M')} - {cierre.strftime('%H:%M')})"
            ),
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_reserva(
    data: ReservaCreate,
    db: Session = Depends(get_db),
    current: Usuario = Security(get_current_user, scopes=[]),
):
    # Anticipación mínima 24 horas
    inicio_dt = datetime.combine(data.fecha, data.hora_inicio)
    if inicio_dt < datetime.now() + timedelta(hours=24):
        raise HTTPException(
            status_code=400,
            detail="La reserva debe crearse con mínimo 24 horas de anticipación",
        )

    _validar_horario_institucional(data.fecha, data.hora_inicio, data.hora_fin)

    espacio = crud_espacios.get_by_nombre(db, data.nombre_espacio)
    if not espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")

    if espacio.estado in ESTADOS_ESPACIO_NO_RESERVABLES:
        raise HTTPException(
            status_code=400,
            detail=f"El espacio se encuentra en estado '{espacio.estado}' y no es reservable",
        )

    if data.cantidad_asistentes > espacio.capacidad:
        raise HTTPException(
            status_code=400,
            detail="La cantidad de asistentes supera la capacidad del espacio",
        )

    if crud_reservas.existe_conflicto(
        db, espacio.id_espacio, data.fecha, data.hora_inicio, data.hora_fin
    ):
        raise HTTPException(
            status_code=409,
            detail="El espacio ya tiene una reserva en ese horario",
        )

    reserva = crud_reservas.create(
        db, data, id_usuario=current.id_usuario, id_espacio=espacio.id_espacio
    )
    return {
        "success": True,
        "message": "Reserva creada correctamente en estado esperando",
        "data": ReservaOut.model_validate(reserva).model_dump(),
    }


@router.get("/", response_model=list[ReservaOut])
def listar_reservas(
    db: Session = Depends(get_db),
    current: Usuario = Security(get_current_user, scopes=[]),
):
    if current.rol == "admin":
        return crud_reservas.list_all(db)
    return crud_reservas.list_by_usuario(db, current.id_usuario)


@router.put("/{id_reserva}/estado")
def actualizar_estado_reserva(
    id_reserva: int,
    data: ReservaEstadoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=["admin"]),
):
    reserva = crud_reservas.get_by_id(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reserva.estado != "esperando":
        raise HTTPException(
            status_code=409,
            detail=(
                f"Solo se puede aprobar o rechazar una reserva en estado "
                f"'esperando' (estado actual: '{reserva.estado}')"
            ),
        )
    reserva = crud_reservas.actualizar_estado(db, reserva, data.estado)
    return {
        "success": True,
        "message": f"Reserva actualizada al estado '{reserva.estado}'",
        "data": ReservaOut.model_validate(reserva).model_dump(),
    }


@router.delete("/{id_reserva}")
def cancelar_reserva(
    id_reserva: int,
    db: Session = Depends(get_db),
    current: Usuario = Security(get_current_user, scopes=[]),
):
    reserva = crud_reservas.get_by_id(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if current.rol != "admin" and reserva.id_usuario != current.id_usuario:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para cancelar esta reserva",
        )

    if reserva.estado not in ("esperando", "aprobada"):
        raise HTTPException(
            status_code=409,
            detail=(
                f"No se puede cancelar una reserva en estado '{reserva.estado}'"
            ),
        )

    reserva = crud_reservas.actualizar_estado(db, reserva, "cancelada")
    return {
        "success": True,
        "message": "Reserva cancelada correctamente",
        "data": ReservaOut.model_validate(reserva).model_dump(),
    }
