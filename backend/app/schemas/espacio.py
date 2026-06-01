from typing import Literal, Optional
from datetime import date, time
from pydantic import BaseModel, Field

EstadoEspacio = Literal["activo", "inactivo", "en mantenimiento", "no disponible"]


class EspacioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    ubicacion: str = Field(..., min_length=1, max_length=200)
    capacidad: int = Field(..., gt=0)
    estado: EstadoEspacio = "activo"


class EspacioCreate(EspacioBase):
    pass


class EspacioOut(EspacioBase):
    id_espacio: int

    model_config = {"from_attributes": True}


class EspacioDisponibleFiltro(BaseModel):
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    cantidad_asistentes: Optional[int] = None
