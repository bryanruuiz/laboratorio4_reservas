from typing import Literal
from datetime import date, time
from pydantic import BaseModel, Field

EstadoReserva = Literal["esperando", "aprobada", "rechazada", "cancelada"]


class ReservaBase(BaseModel):
    fecha: date
    hora_inicio: time
    hora_fin: time
    cantidad_asistentes: int = Field(..., gt=0)


class ReservaCreate(ReservaBase):
    nombre_espacio: str = Field(..., min_length=1, max_length=150)


class ReservaOut(ReservaBase):
    id_reserva: int
    id_usuario: int
    id_espacio: int
    estado: str

    model_config = {"from_attributes": True}


class ReservaEstadoUpdate(BaseModel):
    estado: Literal["aprobada", "rechazada"]
