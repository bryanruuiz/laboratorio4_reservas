from datetime import date, time
from typing import Optional

from sqlalchemy.orm import Session

from app.models.espacio import Espacio
from app.models.reserva import Reserva
from app.schemas.espacio import EspacioCreate, EspacioUpdate

ESTADOS_NO_RESERVABLES = ("inactivo", "en mantenimiento", "no disponible")


def get_by_id(db: Session, id_espacio: int) -> Espacio | None:
    return db.query(Espacio).filter(Espacio.id_espacio == id_espacio).first()


def get_by_nombre(db: Session, nombre: str) -> Espacio | None:
    return db.query(Espacio).filter(Espacio.nombre == nombre).first()


def list_all(db: Session) -> list[Espacio]:
    return db.query(Espacio).all()


def create(db: Session, data: EspacioCreate) -> Espacio:
    espacio = Espacio(**data.model_dump())
    db.add(espacio)
    db.commit()
    db.refresh(espacio)
    return espacio


def update(db: Session, espacio: Espacio, data: EspacioUpdate) -> Espacio:
    cambios = data.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(espacio, campo, valor)
    db.commit()
    db.refresh(espacio)
    return espacio


def list_disponibles(
    db: Session,
    fecha: Optional[date] = None,
    hora_inicio: Optional[time] = None,
    hora_fin: Optional[time] = None,
    cantidad_asistentes: Optional[int] = None,
) -> list[Espacio]:
    q = db.query(Espacio).filter(Espacio.estado == "activo")
    if cantidad_asistentes is not None:
        q = q.filter(Espacio.capacidad >= cantidad_asistentes)
    espacios = q.all()

    if fecha is None or hora_inicio is None or hora_fin is None:
        return espacios

    disponibles: list[Espacio] = []
    for esp in espacios:
        conflicto = (
            db.query(Reserva)
            .filter(
                Reserva.id_espacio == esp.id_espacio,
                Reserva.fecha == fecha,
                Reserva.estado.in_(("esperando", "aprobada")),
                Reserva.hora_inicio < hora_fin,
                Reserva.hora_fin > hora_inicio,
            )
            .first()
        )
        if conflicto is None:
            disponibles.append(esp)
    return disponibles
