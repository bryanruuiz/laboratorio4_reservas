# Backend — Sistema de Reservas Institucionales

API REST desarrollada con **FastAPI** para administrar la reserva de espacios institucionales (salas, laboratorios, auditorios, aulas). Implementa autenticación **JWT**, control de acceso por **roles** (`admin` / `usuario`) y todas las **reglas de negocio** del dominio (anticipación mínima, horarios permitidos, no solapamiento, capacidad, estados de reserva, etc.).

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Modelo de datos](#modelo-de-datos)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Reglas de negocio](#reglas-de-negocio)
- [Endpoints de la API](#endpoints-de-la-api)
- [Flujo de una petición](#flujo-de-una-petición)
- [Variables de entorno](#variables-de-entorno)
- [Puesta en marcha](#puesta-en-marcha)
- [Seguridad](#seguridad)

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| **Python 3.11+** | Lenguaje base |
| **FastAPI** | Framework web / API REST + documentación automática (Swagger / ReDoc) |
| **Uvicorn** | Servidor ASGI |
| **SQLAlchemy** | ORM para el acceso a base de datos |
| **SQL Server** (`pymssql`) | Motor de base de datos |
| **Pydantic** | Validación y serialización de datos (schemas) |
| **python-jose** | Generación y verificación de tokens JWT |
| **passlib + bcrypt** | Hash seguro de contraseñas |
| **python-multipart** | Soporte de formularios (login OAuth2) |
| **python-dotenv** | Carga de variables de entorno desde `.env` |

---

## Arquitectura

El proyecto sigue una **arquitectura modular por capas**, donde cada capa tiene una única responsabilidad. Esto facilita el mantenimiento, las pruebas y el cumplimiento del requisito obligatorio de organización en carpetas.

```
┌─────────────────────────────────────────────────────────┐
│                     Cliente (Frontend)                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + JWT
┌───────────────────────────▼─────────────────────────────┐
│  api/        → Routers FastAPI (endpoints HTTP)          │
│               Reciben la petición, validan permisos y    │
│               orquestan la respuesta.                    │
├──────────────────────────────────────────────────────────┤
│  schemas/    → Modelos Pydantic (entrada/salida)         │
│               Validan el formato de los datos.           │
├──────────────────────────────────────────────────────────┤
│  crud/       → Lógica de acceso a datos                  │
│               Consultas y operaciones sobre la BD.       │
├──────────────────────────────────────────────────────────┤
│  models/     → Entidades SQLAlchemy (tablas)             │
├──────────────────────────────────────────────────────────┤
│  auth/       → Seguridad: hash, JWT y dependencias       │
├──────────────────────────────────────────────────────────┤
│  db.py       → Conexión a la base de datos               │
└──────────────────────────────────────────────────────────┘
```

**Separación de responsabilidades:**

- Los **routers** (`api/`) nunca acceden directamente a la base de datos: delegan en `crud/`.
- Los **schemas** (`schemas/`) definen el contrato público (lo que entra y sale de la API) y nunca exponen datos sensibles (p. ej. el hash de la contraseña).
- Los **models** (`models/`) representan la estructura física de las tablas.
- La **seguridad** (`auth/`) está centralizada y se inyecta vía dependencias de FastAPI.

---

## Estructura de carpetas

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Punto de entrada: crea la app, CORS y registra routers
│   ├── db.py                # Conexión SQLAlchemy, sesión y dependencia get_db()
│   │
│   ├── api/                 # Capa de presentación (endpoints HTTP)
│   │   ├── auth.py          # Login y datos del usuario autenticado
│   │   ├── usuarios.py      # Registro, listado y gestión de usuarios
│   │   ├── espacios.py      # CRUD de espacios y consulta de disponibles
│   │   └── reservas.py      # Crear, listar, aprobar/rechazar y cancelar reservas
│   │
│   ├── auth/                # Seguridad
│   │   ├── security.py      # Hash de contraseñas (bcrypt) y creación de JWT
│   │   └── dependencies.py  # get_current_user: valida token, rol y estado
│   │
│   ├── crud/                # Lógica de acceso a datos
│   │   ├── usuarios.py      # Operaciones de BD sobre usuarios
│   │   ├── espacios.py      # Operaciones de BD sobre espacios + disponibilidad
│   │   └── reservas.py      # Operaciones de BD sobre reservas + conflictos
│   │
│   ├── models/              # Entidades SQLAlchemy (tablas)
│   │   ├── usuario.py       # Tabla usuarios
│   │   ├── espacio.py       # Tabla espacios
│   │   └── reserva.py       # Tabla reservas
│   │
│   └── schemas/             # Modelos Pydantic (validación I/O)
│       ├── usuario.py       # UsuarioCreate, UsuarioUpdate, UsuarioOut, Token...
│       ├── espacio.py       # EspacioCreate, EspacioUpdate, EspacioOut...
│       └── reserva.py       # ReservaCreate, ReservaOut, ReservaEstadoUpdate...
│
├── seed_admin.py            # Script para crear el administrador inicial
├── requirements.txt         # Dependencias de Python
└── .env                     # Variables de entorno (no versionar)
```

### ¿Qué hace cada archivo?

#### `app/main.py`
Punto de entrada de la aplicación. Crea la instancia de `FastAPI`, configura el middleware **CORS** (orígenes permitidos), invoca `Base.metadata.create_all()` para crear las tablas si no existen y registra todos los routers (`auth`, `usuarios`, `espacios`, `reservas`).

#### `app/db.py`
Configura la conexión a SQL Server mediante `create_engine`, define `SessionLocal` (fábrica de sesiones) y la `Base` declarativa de la que heredan los modelos. Expone la dependencia **`get_db()`**, que abre una sesión por petición y la cierra al terminar.

#### Capa `api/` (routers)
| Archivo | Responsabilidad |
|---|---|
| `auth.py` | `POST /auth/login` (emite el JWT) y `GET /auth/me` (perfil del usuario actual). Bloquea el login de usuarios inactivos. |
| `usuarios.py` | Registro público, listado (admin), edición y cambio de estado de usuarios, y creación del admin inicial. |
| `espacios.py` | Crear, listar, editar espacios y listar los **disponibles** según filtros de fecha/hora/capacidad. |
| `reservas.py` | Crear reservas (aplica todas las reglas de negocio), listar (filtrado por rol), aprobar/rechazar (admin) y cancelar. |

#### Capa `auth/` (seguridad)
| Archivo | Responsabilidad |
|---|---|
| `security.py` | `hash_password` / `verify_password` con bcrypt y `create_access_token` para firmar el JWT. |
| `dependencies.py` | `get_current_user`: decodifica el token, valida los **scopes** (roles), verifica que el usuario exista y que **no esté inactivo**. Es la dependencia que protege los endpoints. |

#### Capa `crud/` (acceso a datos)
Funciones puras que reciben una sesión de BD y devuelven/escriben entidades. Aíslan todas las consultas SQLAlchemy:
- `usuarios.py`: `get_by_correo`, `get_by_id`, `list_all`, `create`, `update`, `update_estado`, `existe_admin`.
- `espacios.py`: `get_by_id`, `get_by_nombre`, `list_all`, `create`, `update`, `list_disponibles` (calcula disponibilidad evitando solapamientos).
- `reservas.py`: `get_by_id`, `list_all`, `list_by_usuario`, `existe_conflicto`, `create`, `actualizar_estado`.

#### Capa `models/` (entidades)
Definen las tablas y sus relaciones (`relationship`) entre usuarios, espacios y reservas.

#### Capa `schemas/` (validación)
Modelos Pydantic que validan datos de entrada y dan forma a las respuestas. `UsuarioOut` nunca incluye la contraseña.

#### `seed_admin.py`
Script ejecutable (`python seed_admin.py`) que crea el primer administrador si aún no existe ninguno.

---

## Modelo de datos

### Tabla `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| `id_usuario` | PK, int | Autoincremental |
| `nombre` | varchar(150) | |
| `correo` | varchar(150) | Único |
| `contrasena` | varchar(255) | **Hash bcrypt** (nunca texto plano) |
| `rol` | varchar(20) | `admin` / `usuario` |
| `estado` | varchar(20) | `activo` / `inactivo` |

### Tabla `espacios`
| Campo | Tipo | Notas |
|---|---|---|
| `id_espacio` | PK, int | Autoincremental |
| `nombre` | varchar(150) | Único (validado en API) |
| `ubicacion` | varchar(200) | |
| `capacidad` | int | > 0 |
| `estado` | varchar(30) | `activo`, `inactivo`, `en mantenimiento`, `no disponible` |

### Tabla `reservas`
| Campo | Tipo | Notas |
|---|---|---|
| `id_reserva` | PK, int | Autoincremental |
| `id_usuario` | FK → usuarios | |
| `id_espacio` | FK → espacios | |
| `fecha` | date | |
| `hora_inicio` | time | |
| `hora_fin` | time | |
| `cantidad_asistentes` | int | > 0 |
| `estado` | varchar(20) | `esperando`, `aprobada`, `rechazada`, `cancelada` |

**Relaciones:** un `usuario` tiene muchas `reservas`; un `espacio` tiene muchas `reservas`.

---

## Autenticación y autorización

- El login usa el flujo **OAuth2 Password** (`application/x-www-form-urlencoded`).
- Tras autenticar, se firma un **JWT** que incluye: `sub` (correo), `id_usuario`, `rol`, `scopes` y `exp`.
- Los endpoints protegidos usan `Security(get_current_user, scopes=[...])`:
  - `scopes=[]` → cualquier usuario autenticado.
  - `scopes=["admin"]` → solo administradores.
- El token se envía en cada petición con la cabecera `Authorization: Bearer <token>`.
- Un usuario marcado como **`inactivo`** no puede iniciar sesión ni usar un token previamente emitido.

---

## Reglas de negocio

Validadas en el backend (responsable final de la integridad), principalmente en `api/reservas.py`:

| # | Regla |
|---|---|
| A | Solo un usuario autenticado puede crear reservas. |
| B | Solo un `admin` puede aprobar o rechazar reservas. |
| C | **No solapamiento:** no se permite reservar si ya existe una reserva `esperando`/`aprobada` que se cruce en fecha y horario. |
| D | **Anticipación mínima 24 h** respecto a la hora de inicio. |
| E | **Horario permitido:** L–V 7:00–20:00 · Sábado 8:00–12:00 · Domingo: no se permite. |
| F | `hora_inicio` debe ser **estrictamente menor** que `hora_fin`. |
| G | No se reservan espacios en estado `inactivo`, `en mantenimiento` o `no disponible`. |
| H | La cantidad de asistentes **no puede superar** la capacidad del espacio. |
| I | Estado inicial `esperando`; solo un `admin` lo cambia a `aprobada`/`rechazada`. Solo se puede aprobar/rechazar una reserva que esté `esperando`. Solo se cancela una reserva `esperando` o `aprobada`. |

---

## Endpoints de la API

Documentación interactiva disponible en `http://localhost:8000/docs` (Swagger) y `/redoc`.

### Autenticación
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Devuelve el `access_token` (JWT). |
| `GET` | `/auth/me` | Autenticado | Datos del usuario autenticado. |

### Usuarios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/usuarios/` | Público | Registro de un usuario estándar (rol forzado a `usuario`). |
| `GET` | `/usuarios/` | Admin | Lista todos los usuarios. |
| `PUT` | `/usuarios/{id_usuario}` | Admin | Edita un usuario (nombre, correo, contraseña, rol, estado). |
| `PATCH` | `/usuarios/{id_usuario}/estado` | Admin | Activa/inactiva un usuario. |
| `POST` | `/usuarios/admin-inicial` | Público* | Crea el primer admin (solo si no existe ninguno). |

### Espacios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/espacios/` | Admin | Crea un espacio (nombre único). |
| `GET` | `/espacios/` | Autenticado | Lista todos los espacios. |
| `GET` | `/espacios/disponibles` | Autenticado | Lista espacios disponibles (filtros: fecha, hora, asistentes). |
| `PUT` | `/espacios/{id_espacio}` | Admin | Edita un espacio. |

### Reservas
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/reservas/` | Autenticado | Crea una reserva aplicando todas las reglas de negocio. |
| `GET` | `/reservas/` | Autenticado | Admin: todas las reservas. Usuario: solo las suyas. |
| `PUT` | `/reservas/{id_reserva}/estado` | Admin | Aprueba o rechaza una reserva `esperando`. |
| `DELETE` | `/reservas/{id_reserva}` | Autenticado | Cancela una reserva (propia o, si es admin, cualquiera). |

### Formato de respuesta
Las operaciones de escritura devuelven respuestas estructuradas:

```json
{
  "success": true,
  "message": "Reserva creada correctamente en estado esperando",
  "data": { "id_reserva": 1, "estado": "esperando", ... }
}
```

Los errores devuelven el código HTTP adecuado (`400`, `401`, `403`, `404`, `409`) con un campo `detail` descriptivo.

---

## Flujo de una petición

Ejemplo: **crear una reserva** (`POST /reservas/`)

```
1. El cliente envía el JSON + cabecera Authorization: Bearer <jwt>.
2. FastAPI valida el cuerpo con el schema ReservaCreate (Pydantic).
3. La dependencia get_current_user decodifica el JWT, comprueba el rol
   y que el usuario esté activo.
4. El router aplica las reglas de negocio:
   anticipación 24h → horario → existencia/estado del espacio →
   capacidad → conflicto de horario.
5. Si todo es válido, crud_reservas.create() inserta la reserva (estado "esperando").
6. Se devuelve una respuesta estructurada { success, message, data }.
```

---

## Variables de entorno

Crear un archivo `.env` en `backend/` (no versionar):

```env
# Base de datos (SQL Server)
DATABASE_URL=mssql+pymssql://usuario:password@localhost:1433/lab4_reservas

# Seguridad JWT
SECRET_KEY=cambia-esto-por-una-clave-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (orígenes del frontend, separados por coma)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> Si no se define `.env`, se usan valores por defecto **solo aptos para desarrollo**. En producción, define siempre `SECRET_KEY` y `DATABASE_URL`.

---

## Puesta en marcha

```powershell
# 1. Crear y activar el entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Crear el administrador inicial (una sola vez)
python seed_admin.py

# 4. Levantar el servidor de desarrollo
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000` y la documentación en `http://localhost:8000/docs`.

Credenciales del admin inicial (definidas en `seed_admin.py`):
- **Correo:** `admin@institucion.edu`
- **Contraseña:** `Admin123!`

---

## Seguridad

- **Contraseñas hasheadas** con bcrypt; nunca se almacenan ni se devuelven en texto plano.
- **JWT firmado** con expiración configurable; los tokens de usuarios inactivos se rechazan.
- **Autorización por roles** mediante scopes en cada endpoint sensible.
- **Registro público restringido**: nunca permite crear un administrador.
- **CORS restringido** a los orígenes definidos (sin comodín `*` con credenciales).
- **Validación de integridad** centralizada en el backend (reglas de negocio y estados).
- **Nombres de espacio únicos** para evitar ambigüedad en las reservas.
