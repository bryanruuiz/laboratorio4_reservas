from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.auth.security import hash_password


def get_by_correo(db: Session, correo: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.correo == correo).first()


def get_by_id(db: Session, id_usuario: int) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()


def list_all(db: Session) -> list[Usuario]:
    return db.query(Usuario).all()


def existe_admin(db: Session) -> bool:
    return db.query(Usuario).filter(Usuario.rol == "admin").first() is not None


def create(db: Session, data: UsuarioCreate, rol: str = "usuario") -> Usuario:
    usuario = Usuario(
        nombre=data.nombre,
        correo=data.correo,
        contrasena=hash_password(data.contrasena),
        rol=rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario
