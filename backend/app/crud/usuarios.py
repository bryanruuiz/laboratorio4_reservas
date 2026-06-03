from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
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
        estado="activo",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def update(db: Session, usuario: Usuario, data: UsuarioUpdate) -> Usuario:
    if data.nombre is not None:
        usuario.nombre = data.nombre
    if data.correo is not None:
        usuario.correo = data.correo
    if data.contrasena is not None:
        usuario.contrasena = hash_password(data.contrasena)
    if data.rol is not None:
        usuario.rol = data.rol
    if data.estado is not None:
        usuario.estado = data.estado
    db.commit()
    db.refresh(usuario)
    return usuario


def update_estado(db: Session, usuario: Usuario, estado: str) -> Usuario:
    usuario.estado = estado
    db.commit()
    db.refresh(usuario)
    return usuario
