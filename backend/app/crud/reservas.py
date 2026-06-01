from datetime import date, time

from sqlalchemy.orm import Session

from app.models.reserva import Reserva
from app.schemas.reserva import ReservaCreate


def get_by_id(db: Session, id_reserva: int) -> Reserva | None:
    return db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()


def list_all(db: Session) -> list[Reserva]:
    return db.query(Reserva).all()


def list_by_usuario(db: Session, id_usuario: int) -> list[Reserva]:
    return db.query(Reserva).filter(Reserva.id_usuario == id_usuario).all()


def existe_conflicto(
    db: Session,
    id_espacio: int,
    fecha: date,
    hora_inicio: time,
    hora_fin: time,
) -> bool:
    conflicto = (
        db.query(Reserva)
        .filter(
            Reserva.id_espacio == id_espacio,
            Reserva.fecha == fecha,
            Reserva.estado.in_(("esperando", "aprobada")),
            Reserva.hora_inicio < hora_fin,
            Reserva.hora_fin > hora_inicio,
        )
        .first()
    )
    return conflicto is not None


def create(db: Session, data: ReservaCreate, id_usuario: int, id_espacio: int) -> Reserva:
    reserva = Reserva(
        id_usuario=id_usuario,
        id_espacio=id_espacio,
        fecha=data.fecha,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        cantidad_asistentes=data.cantidad_asistentes,
        estado="esperando",
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    return reserva


def actualizar_estado(db: Session, reserva: Reserva, nuevo_estado: str) -> Reserva:
    reserva.estado = nuevo_estado
    db.commit()
    db.refresh(reserva)
    return reserva
