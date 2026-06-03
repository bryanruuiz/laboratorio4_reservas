"""Script para crear el administrador inicial."""
from app.db import Base, SessionLocal, engine
from app.models import usuario, espacio, reserva  # noqa: F401
from app.crud import usuarios as crud_usuarios
from app.schemas.usuario import UsuarioCreate

ADMIN_NOMBRE = "Administrador"
ADMIN_CORREO = "admin@institucion.edu"
ADMIN_PASSWORD = "Admin123!"


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if crud_usuarios.existe_admin(db):
            print("Ya existe al menos un administrador. No se crea uno nuevo.")
            return
        data = UsuarioCreate(
            nombre=ADMIN_NOMBRE,
            correo=ADMIN_CORREO,
            contrasena=ADMIN_PASSWORD,
        )
        admin = crud_usuarios.create(db, data, rol="admin")
        print(f"Administrador creado: {admin.correo} (id={admin.id_usuario})")
        print(f"Contraseña: {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
