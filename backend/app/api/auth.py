from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, verify_password
from app.crud import usuarios as crud_usuarios
from app.db import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    usuario = crud_usuarios.get_by_correo(db, form_data.username)
    if not usuario or not verify_password(form_data.password, usuario.contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scopes = ["admin"] if usuario.rol == "admin" else ["usuario"]
    token = create_access_token(
        {
            "sub": usuario.correo,
            "id_usuario": usuario.id_usuario,
            "rol": usuario.rol,
            "scopes": scopes,
        }
    )
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UsuarioOut)
def me(current: Usuario = Security(get_current_user, scopes=[])):
    return current
