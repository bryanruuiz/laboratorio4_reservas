from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.crud import usuarios as crud_usuarios
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def registrar_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Security(get_current_user, scopes=[]),
):
    if crud_usuarios.get_by_correo(db, data.correo):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )
    if data.rol == "admin" and current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un administrador puede registrar otro administrador",
        )
    usuario = crud_usuarios.create(db, data, rol=data.rol)
    return {
        "success": True,
        "message": "Usuario registrado correctamente",
        "data": UsuarioOut.model_validate(usuario).model_dump(),
    }


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Security(get_current_user, scopes=["admin"]),
):
    return crud_usuarios.list_all(db)


@router.post("/admin-inicial", status_code=status.HTTP_201_CREATED)
def crear_admin_inicial(data: UsuarioCreate, db: Session = Depends(get_db)):
    if crud_usuarios.existe_admin(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ya existe un administrador en el sistema",
        )
    if crud_usuarios.get_by_correo(db, data.correo):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )
    usuario = crud_usuarios.create(db, data, rol="admin")
    return {
        "success": True,
        "message": "Administrador inicial creado correctamente",
        "data": UsuarioOut.model_validate(usuario).model_dump(),
    }
