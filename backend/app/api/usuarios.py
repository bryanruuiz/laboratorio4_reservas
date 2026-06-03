from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.crud import usuarios as crud_usuarios
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioEstadoUpdate,
    UsuarioOut,
    UsuarioUpdate,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def registrar_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
):
    if crud_usuarios.get_by_correo(db, data.correo):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )
    # Registro público: se fuerza el rol "usuario", ignorando cualquier rol recibido.
    # Nunca se permite crear un administrador desde este endpoint.
    usuario = crud_usuarios.create(db, data, rol="usuario")
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


@router.put("/{id_usuario}", response_model=UsuarioOut)
def editar_usuario(
    id_usuario: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    actual: Usuario = Security(get_current_user, scopes=["admin"]),
):
    usuario = crud_usuarios.get_by_id(db, id_usuario)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if usuario.id_usuario == actual.id_usuario:
        if data.estado == "inactivo":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes inactivar tu propia cuenta",
            )
        if data.rol is not None and data.rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes quitarte el rol de administrador desde tu propia cuenta",
            )
    if data.correo and data.correo != usuario.correo:
        existente = crud_usuarios.get_by_correo(db, data.correo)
        if existente and existente.id_usuario != id_usuario:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo ya está registrado",
            )
    return crud_usuarios.update(db, usuario, data)


@router.patch("/{id_usuario}/estado", response_model=UsuarioOut)
def cambiar_estado_usuario(
    id_usuario: int,
    data: UsuarioEstadoUpdate,
    db: Session = Depends(get_db),
    actual: Usuario = Security(get_current_user, scopes=["admin"]),
):
    usuario = crud_usuarios.get_by_id(db, id_usuario)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if usuario.id_usuario == actual.id_usuario and data.estado == "inactivo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes inactivar tu propia cuenta",
        )
    return crud_usuarios.update_estado(db, usuario, data.estado)


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
