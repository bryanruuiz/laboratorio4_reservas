# READMEDev — Documentación Técnica

Sistema de Reservas de Espacios Institucionales. Documentación técnica para desarrolladores: arquitectura, modelo de datos, endpoints, autenticación, reglas de negocio y ejecución en modo desarrollo.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
   - [Backend](#21-arquitectura-del-backend)
   - [Frontend](#22-arquitectura-del-frontend)
3. [Diseño de base de datos y modelo entidad-relación](#3-diseño-de-base-de-datos-y-modelo-entidad-relación)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Tecnologías y librerías](#5-tecnologías-y-librerías)
6. [Endpoints desarrollados](#6-endpoints-desarrollados)
7. [Modelo de autenticación JWT y roles](#7-modelo-de-autenticación-jwt-y-roles)
8. [Reglas de negocio y validación de reservas](#8-reglas-de-negocio-y-validación-de-reservas)
9. [Ejecución en modo desarrollo](#9-ejecución-en-modo-desarrollo)

---

## 1. Visión general

Aplicación web full-stack para administrar la reserva de espacios institucionales (salas, laboratorios, auditorios, aulas). Evita conflictos de horarios, reservas fuera del horario permitido o con poca anticipación, y diferencia las capacidades según el rol del usuario (`admin` / `usuario`).

```
┌──────────────────┐     HTTP + JWT      ┌──────────────────┐     ORM      ┌──────────────┐
│   Frontend SPA   │ ──────────────────► │   Backend API    │ ───────────► │  SQL Server  │
│  React + Vite    │ ◄────────────────── │     FastAPI      │ ◄─────────── │   (pymssql)  │
└──────────────────┘    JSON / REST      └──────────────────┘   SQLAlchemy └──────────────┘
```

- **Frontend:** SPA en React que consume la API REST y gestiona la sesión con JWT.
- **Backend:** API REST en FastAPI con arquitectura modular por capas.
- **Base de datos:** SQL Server, accedida mediante el ORM SQLAlchemy.

---

## 2. Arquitectura del sistema

### 2.1 Arquitectura del Backend

Arquitectura **modular por capas**; cada capa tiene una única responsabilidad:

```
┌─────────────────────────────────────────────────────────┐
│                     Cliente (Frontend)                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + JWT (Bearer)
┌───────────────────────────▼─────────────────────────────┐
│  api/        Routers FastAPI (endpoints HTTP).           │
│              Reciben la petición, validan permisos       │
│              (Security/scopes) y orquestan la respuesta. │
├──────────────────────────────────────────────────────────┤
│  schemas/    Modelos Pydantic. Validan el formato de     │
│              entrada y dan forma a la salida (sin datos   │
│              sensibles como el hash de contraseña).       │
├──────────────────────────────────────────────────────────┤
│  crud/       Lógica de acceso a datos. Encapsula todas    │
│              las consultas SQLAlchemy.                    │
├──────────────────────────────────────────────────────────┤
│  models/     Entidades SQLAlchemy (estructura de tablas). │
├──────────────────────────────────────────────────────────┤
│  auth/       Seguridad: hash bcrypt, emisión/validación  │
│              de JWT y dependencias de autorización.       │
├──────────────────────────────────────────────────────────┤
│  db.py       Conexión a la base de datos y sesión.        │
└──────────────────────────────────────────────────────────┘
```

**Principios:**
- Los routers (`api/`) **no** acceden directamente a la BD: delegan en `crud/`.
- Los `schemas/` definen el contrato público (entrada/salida).
- La seguridad está centralizada en `auth/` y se inyecta vía dependencias de FastAPI.
- El backend es el **responsable final** de validar reglas de negocio e integridad.

### 2.2 Arquitectura del Frontend

SPA por capas con estado de sesión global:

```
┌─────────────────────────────────────────────────────────┐
│  pages/        Vistas completas (una por ruta).          │
├──────────────────────────────────────────────────────────┤
│  components/   Piezas reutilizables (Navbar, Alert,       │
│                ProtectedRoute).                          │
├──────────────────────────────────────────────────────────┤
│  context/      AuthContext: estado global de sesión       │
│                expuesto con el hook useAuth().            │
├──────────────────────────────────────────────────────────┤
│  api/          Capa de acceso a la API (Axios).           │
│                Centraliza TODAS las llamadas HTTP.       │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + JWT
                            ▼   Backend (FastAPI)
```

**Principios:**
- Toda comunicación con el backend pasa por `api/` (los componentes no usan Axios directamente).
- La sesión vive en un único contexto (`AuthContext`).
- Las páginas orquestan datos y estado local; los componentes son presentacionales.

---

## 3. Diseño de base de datos y modelo entidad-relación

### Modelo Entidad-Relación

```
┌─────────────────────┐          ┌─────────────────────┐
│      usuarios       │          │      espacios       │
├─────────────────────┤          ├─────────────────────┤
│ PK id_usuario       │          │ PK id_espacio       │
│    nombre           │          │    nombre           │
│    correo (único)   │          │    ubicacion        │
│    contrasena (hash)│          │    capacidad        │
│    rol              │          │    estado           │
│    estado           │          └──────────┬──────────┘
└──────────┬──────────┘                     │
           │ 1                             1 │
           │                                 │
           │ N        ┌─────────────────────┐│ N
           └─────────►│      reservas       │◄┘
                      ├─────────────────────┤
                      │ PK id_reserva       │
                      │ FK id_usuario       │
                      │ FK id_espacio       │
                      │    fecha            │
                      │    hora_inicio      │
                      │    hora_fin         │
                      │    cantidad_asist.  │
                      │    estado           │
                      └─────────────────────┘
```

**Cardinalidad:**
- Un `usuario` puede tener **muchas** `reservas` (1:N).
- Un `espacio` puede tener **muchas** `reservas` (1:N).
- Una `reserva` pertenece a **un** usuario y **un** espacio.

### Tabla `usuarios`
| Campo | Tipo | Restricciones |
|---|---|---|
| `id_usuario` | INT, PK | Autoincremental |
| `nombre` | VARCHAR(150) | NOT NULL |
| `correo` | VARCHAR(150) | NOT NULL, UNIQUE |
| `contrasena` | VARCHAR(255) | NOT NULL — **hash bcrypt** |
| `rol` | VARCHAR(20) | `admin` / `usuario` (default `usuario`) |
| `estado` | VARCHAR(20) | `activo` / `inactivo` (default `activo`, CHECK) |

### Tabla `espacios`
| Campo | Tipo | Restricciones |
|---|---|---|
| `id_espacio` | INT, PK | Autoincremental |
| `nombre` | VARCHAR(150) | NOT NULL, único (validado en API) |
| `ubicacion` | VARCHAR(200) | NOT NULL |
| `capacidad` | INT | NOT NULL, > 0 |
| `estado` | VARCHAR(30) | `activo`, `inactivo`, `en mantenimiento`, `no disponible` |

### Tabla `reservas`
| Campo | Tipo | Restricciones |
|---|---|---|
| `id_reserva` | INT, PK | Autoincremental |
| `id_usuario` | INT, FK → usuarios | NOT NULL |
| `id_espacio` | INT, FK → espacios | NOT NULL |
| `fecha` | DATE | NOT NULL |
| `hora_inicio` | TIME | NOT NULL |
| `hora_fin` | TIME | NOT NULL |
| `cantidad_asistentes` | INT | NOT NULL, > 0 |
| `estado` | VARCHAR(20) | `esperando`, `aprobada`, `rechazada`, `cancelada` |

> Las tablas se crean automáticamente al iniciar la app vía `Base.metadata.create_all()`. La columna `estado` de `usuarios` se añadió con una migración SQL (`ALTER TABLE ... ADD estado ... CHECK`).

---

## 4. Estructura de carpetas

```
laboratorio4_reservas/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # Entrada: app FastAPI, CORS, registro de routers
│   │   ├── db.py                # Conexión SQLAlchemy, SessionLocal, get_db()
│   │   ├── api/                 # Endpoints HTTP
│   │   │   ├── auth.py          # login, me
│   │   │   ├── usuarios.py      # registro, listado, edición, estado
│   │   │   ├── espacios.py      # CRUD espacios + disponibles
│   │   │   └── reservas.py      # crear, listar, estado, cancelar
│   │   ├── auth/                # Seguridad
│   │   │   ├── security.py      # hash bcrypt + creación de JWT
│   │   │   └── dependencies.py  # get_current_user (token, rol, estado)
│   │   ├── crud/                # Acceso a datos
│   │   │   ├── usuarios.py
│   │   │   ├── espacios.py
│   │   │   └── reservas.py
│   │   ├── models/              # Entidades SQLAlchemy
│   │   │   ├── usuario.py
│   │   │   ├── espacio.py
│   │   │   └── reserva.py
│   │   └── schemas/             # Modelos Pydantic (validación I/O)
│   │       ├── usuario.py
│   │       ├── espacio.py
│   │       └── reserva.py
│   ├── seed_admin.py            # Crea el administrador inicial
│   ├── requirements.txt         # Dependencias Python
│   └── README.md                # Documentación del backend
│
├── frontend/
│   ├── index.html               # HTML raíz
│   ├── vite.config.js           # Config de Vite
│   ├── tailwind.config.js       # Tema de Tailwind
│   ├── postcss.config.js        # PostCSS (Tailwind + Autoprefixer)
│   ├── eslint.config.js         # Reglas ESLint
│   ├── package.json             # Dependencias y scripts
│   └── src/
│       ├── main.jsx             # Monta React + Router + AuthProvider
│       ├── App.jsx              # Rutas y layout
│       ├── index.css            # Estilos base + sistema de diseño
│       ├── api/                 # Acceso a la API (Axios)
│       │   ├── axios.js         # Instancia + interceptores (token, 401)
│       │   ├── auth.js
│       │   ├── espacios.js
│       │   ├── reservas.js
│       │   └── usuarios.js
│       ├── context/
│       │   └── AuthContext.jsx  # Sesión global + useAuth()
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── Alert.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── Espacios.jsx
│           ├── Reservas.jsx
│           ├── CrearReserva.jsx
│           └── Usuarios.jsx
│
├── READMEDev.md                 # Este documento
└── README.md
```

---

## 5. Tecnologías y librerías

### Backend
| Tecnología | Uso |
|---|---|
| **Python 3.11+** | Lenguaje base |
| **FastAPI** | Framework web / API REST + Swagger automático |
| **Uvicorn** | Servidor ASGI |
| **SQLAlchemy** | ORM |
| **SQL Server** (`pymssql`) | Base de datos |
| **Pydantic** | Validación y serialización (schemas) |
| **python-jose** | Tokens JWT |
| **passlib + bcrypt** | Hash de contraseñas |
| **python-multipart** | Formularios OAuth2 (login) |
| **python-dotenv** | Variables de entorno |

### Frontend
| Tecnología | Uso |
|---|---|
| **React 19** | UI basada en componentes |
| **Vite** | Bundler / dev server |
| **React Router DOM 7** | Enrutamiento SPA |
| **Axios** | Cliente HTTP |
| **jwt-decode** | Decodifica el JWT (rol, expiración) |
| **Tailwind CSS 3** | Estilos + sistema de diseño |
| **lucide-react** | Iconos |
| **ESLint** | Análisis estático |

---

## 6. Endpoints desarrollados

Documentación interactiva: `http://localhost:8000/docs` (Swagger) y `/redoc`.

### Autenticación
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Devuelve el `access_token` (JWT). |
| `GET` | `/auth/me` | Autenticado | Datos del usuario autenticado. |

### Usuarios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/usuarios/` | Público | Registro de usuario estándar (rol forzado a `usuario`). |
| `GET` | `/usuarios/` | Admin | Lista todos los usuarios. |
| `PUT` | `/usuarios/{id_usuario}` | Admin | Edita nombre, correo, contraseña, rol y estado. |
| `PATCH` | `/usuarios/{id_usuario}/estado` | Admin | Activa / inactiva un usuario. |
| `POST` | `/usuarios/admin-inicial` | Público* | Crea el primer admin (solo si no existe). |

### Espacios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/espacios/` | Admin | Crea un espacio (nombre único). |
| `GET` | `/espacios/` | Autenticado | Lista todos los espacios. |
| `GET` | `/espacios/disponibles` | Autenticado | Espacios disponibles (filtros: fecha, hora, asistentes). |
| `PUT` | `/espacios/{id_espacio}` | Admin | Edita un espacio. |

### Reservas
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/reservas/` | Autenticado | Crea una reserva aplicando todas las reglas de negocio. |
| `GET` | `/reservas/` | Autenticado | Admin: todas. Usuario: solo las suyas. |
| `PUT` | `/reservas/{id_reserva}/estado` | Admin | Aprueba o rechaza una reserva `esperando`. |
| `DELETE` | `/reservas/{id_reserva}` | Autenticado | Cancela una reserva (propia o cualquiera si es admin). |

### Formato de respuesta (operaciones de escritura)
```json
{
  "success": true,
  "message": "Reserva creada correctamente en estado esperando",
  "data": { "id_reserva": 1, "estado": "esperando", "...": "..." }
}
```
Los errores devuelven el código HTTP adecuado (`400`, `401`, `403`, `404`, `409`) con un campo `detail`.

---

## 7. Modelo de autenticación JWT y roles

### Flujo de autenticación
1. El usuario envía credenciales a `POST /auth/login` (formato OAuth2 `x-www-form-urlencoded`).
2. El backend verifica el correo y la contraseña (`verify_password` con bcrypt) y que el usuario **no esté inactivo**.
3. Se firma un **JWT** (`python-jose`, algoritmo HS256) con el payload:
   ```json
   {
     "sub": "correo@institucion.edu",
     "id_usuario": 1,
     "rol": "admin",
     "scopes": ["admin"],
     "exp": 1730000000
   }
   ```
4. El frontend guarda el token en `localStorage` y lo decodifica con `jwt-decode`.
5. En cada petición, un **interceptor de Axios** añade la cabecera `Authorization: Bearer <token>`.
6. Si el backend responde `401`, el interceptor limpia el token y cierra la sesión.

### Roles y autorización
La autorización usa el sistema de **scopes** de FastAPI mediante la dependencia `get_current_user`:

| Protección | Significado |
|---|---|
| `Security(get_current_user, scopes=[])` | Cualquier usuario autenticado. |
| `Security(get_current_user, scopes=["admin"])` | Solo administradores. |

`get_current_user` realiza estas verificaciones en cada petición protegida:
1. Decodifica y valida la firma y expiración del JWT.
2. Comprueba que el usuario exista en la BD.
3. Rechaza (403) si el usuario está **inactivo** (aunque el token aún sea válido).
4. Verifica que el token contenga los scopes requeridos por el endpoint.

### Roles implementados
- **`usuario`**: consultar espacios, crear reservas, consultar y cancelar sus propias reservas.
- **`admin`**: además, gestionar espacios, ver todas las reservas, aprobar/rechazar reservas y gestionar usuarios (editar, activar/inactivar).

### Protección de rutas en el frontend
El componente `ProtectedRoute` redirige a `/login` si no hay sesión y a `/dashboard` si el rol no está autorizado. La ruta `/usuarios` solo es accesible para administradores.

---

## 8. Reglas de negocio y validación de reservas

Todas las reglas se validan en el **backend** (responsable final de la integridad). El frontend añade validación en cliente para feedback inmediato, pero nunca sustituye la del servidor.

| # | Regla | Dónde se valida |
|---|---|---|
| A | Solo un usuario autenticado puede crear reservas. | `get_current_user` |
| B | Solo un `admin` puede aprobar o rechazar reservas. | scope `admin` en `/reservas/{id}/estado` |
| C | **No solapamiento:** sin reservas cruzadas en fecha/horario. | `crud_reservas.existe_conflicto` |
| D | **Anticipación mínima 24 h.** | `api/reservas.py` (cálculo `datetime`) |
| E | **Horario permitido:** L–V 7:00–20:00 · Sáb 8:00–12:00 · Dom: no. | `_validar_horario_institucional` |
| F | `hora_inicio` estrictamente menor que `hora_fin`. | `_validar_horario_institucional` |
| G | No reservar espacios `inactivo` / `en mantenimiento` / `no disponible`. | `api/reservas.py` |
| H | Asistentes ≤ capacidad del espacio. | `api/reservas.py` |
| I | Estado inicial `esperando`; solo admin pasa a `aprobada`/`rechazada`. | `crud` + control de transición |

### Proceso de validación al crear una reserva (`POST /reservas/`)

```
1. Pydantic valida el cuerpo (ReservaCreate): tipos y campos requeridos.
2. get_current_user valida el JWT, el rol y que el usuario esté activo.
3. Anticipación: inicio >= ahora + 24 h.                     → 400 si falla
4. Horario institucional: día permitido y dentro del rango,
   con hora_inicio < hora_fin.                               → 400 si falla
5. Existencia del espacio (búsqueda por nombre).             → 404 si no existe
6. Estado del espacio reservable (no inactivo/manten./n.d.). → 400 si falla
7. Capacidad: cantidad_asistentes <= capacidad.              → 400 si falla
8. Conflicto de horario: no existe reserva esperando/aprobada
   que se cruce en ese espacio, fecha y franja.              → 409 si falla
9. Se crea la reserva en estado "esperando".
10. Respuesta { success, message, data }.
```

### Control de transiciones de estado
- **Aprobar / rechazar:** solo permitido si la reserva está en `esperando` (de lo contrario `409`).
- **Cancelar:** solo permitido si la reserva está en `esperando` o `aprobada`.
- Las reservas `esperando` y `aprobada` **bloquean** el horario; las `rechazada` y `cancelada` lo liberan.

---

## 9. Ejecución en modo desarrollo

### Requisitos previos
- Python 3.11+
- Node.js 18+
- SQL Server accesible (local o remoto)

### Backend

```powershell
cd backend

# 1. Entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Dependencias
pip install -r requirements.txt

# 3. Variables de entorno: crear backend/.env
#    (ver plantilla abajo)

# 4. Crear el administrador inicial (una sola vez)
python seed_admin.py

# 5. Servidor de desarrollo
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000` · Swagger en `http://localhost:8000/docs`.

**Plantilla `backend/.env`:**
```env
DATABASE_URL=mssql+pymssql://usuario:password@localhost:1433/lab4_reservas
SECRET_KEY=cambia-esto-por-una-clave-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Credenciales del admin inicial** (definidas en `seed_admin.py`):
- Correo: `admin@institucion.edu`
- Contraseña: `Admin123!`

### Frontend

```powershell
cd frontend

# 1. Dependencias
npm install

# 2. Servidor de desarrollo (http://localhost:5173)
npm run dev
```

> Si la URL del backend cambia, ajústala en `frontend/src/api/axios.js` (constante `baseURL`).

### Otros scripts útiles del frontend
```powershell
npm run build     # Compilación de producción
npm run preview   # Previsualizar el build
npm run lint      # Análisis estático con ESLint
```

### Orden de arranque recomendado
1. Levantar la base de datos (SQL Server).
2. Iniciar el backend (`uvicorn app.main:app --reload`).
3. Ejecutar `seed_admin.py` la primera vez.
4. Iniciar el frontend (`npm run dev`).
5. Abrir `http://localhost:5173` e iniciar sesión con el admin inicial.
