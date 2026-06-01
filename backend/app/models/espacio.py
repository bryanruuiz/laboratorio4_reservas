from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class Espacio(Base):
    __tablename__ = "espacios"

    id_espacio = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    ubicacion = Column(String(200), nullable=False)
    capacidad = Column(Integer, nullable=False)
    estado = Column(String(30), nullable=False, default="activo")

    reservas = relationship("Reserva", back_populates="espacio")
