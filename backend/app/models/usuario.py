from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, nullable=False, index=True)
    contrasena = Column("contrasena", String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="usuario")
    estado = Column(String(20), nullable=False, default="activo", server_default="activo")

    reservas = relationship("Reserva", back_populates="usuario")
