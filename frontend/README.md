# Frontend — Sistema de Reservas Institucionales

Aplicación web **SPA** (Single Page Application) construida con **React + Vite** que consume la API de reservas. Ofrece una interfaz diferenciada por rol (`admin` / `usuario`), gestión de sesión con **JWT** y validación de formularios en cliente.

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Gestión de autenticación (JWT)](#gestión-de-autenticación-jwt)
- [Conexión con el backend](#conexión-con-el-backend)
- [Rutas y vistas](#rutas-y-vistas)
- [Interfaz diferenciada por rol](#interfaz-diferenciada-por-rol)
- [Sistema de diseño](#sistema-de-diseño)
- [Puesta en marcha](#puesta-en-marcha)

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| **React 19** | Librería de UI basada en componentes |
| **Vite** | Bundler y servidor de desarrollo ultrarrápido |
| **React Router DOM 7** | Enrutamiento del lado del cliente (SPA) |
| **Axios** | Cliente HTTP para consumir la API |
| **jwt-decode** | Decodifica el JWT para leer rol y expiración |
| **Tailwind CSS 3** | Estilos utilitarios + sistema de diseño |
| **lucide-react** | Iconografía |
| **ESLint** | Análisis estático de código |

---

## Arquitectura

La aplicación separa responsabilidades en capas claras:

```
┌─────────────────────────────────────────────────────────┐
│  pages/        → Vistas completas (una por ruta)         │
├──────────────────────────────────────────────────────────┤
│  components/   → Piezas reutilizables (Navbar, Alert...) │
├──────────────────────────────────────────────────────────┤
│  context/      → Estado global de sesión (AuthContext)   │
├──────────────────────────────────────────────────────────┤
│  api/          → Capa de acceso a la API (Axios)         │
│                  Centraliza todas las llamadas HTTP.     │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + JWT
                            ▼
                   Backend (FastAPI)
```

**Principios:**

- **Toda** comunicación con el backend pasa por la carpeta `api/`; los componentes nunca llaman a Axios directamente.
- La **sesión** vive en un único contexto global (`AuthContext`), accesible vía el hook `useAuth()`.
- Las **páginas** orquestan datos y estado local; los **componentes** son presentacionales y reutilizables.

---

## Estructura de carpetas

```
frontend/
├── index.html               # HTML raíz donde se monta React
├── vite.config.js           # Configuración de Vite + plugin de React
├── tailwind.config.js       # Tema de Tailwind (paleta, fuentes, animaciones)
├── postcss.config.js        # Pipeline de PostCSS (Tailwind + Autoprefixer)
├── eslint.config.js         # Reglas de ESLint
├── package.json             # Dependencias y scripts
│
└── src/
    ├── main.jsx             # Punto de entrada: monta React, Router y AuthProvider
    ├── App.jsx              # Definición de rutas y layout general
    ├── index.css            # Estilos base + clases del sistema de diseño
    │
    ├── api/                 # Capa de acceso a la API (Axios)
    │   ├── axios.js         # Instancia de Axios + interceptores (token, 401)
    │   ├── auth.js          # login, register, getMe
    │   ├── espacios.js      # listar, disponibles, crear, editar
    │   ├── reservas.js      # listar, crear, actualizar estado, cancelar
    │   └── usuarios.js      # listar, editar, cambiar estado (admin)
    │
    ├── context/
    │   └── AuthContext.jsx  # Estado global de sesión + hook useAuth()
    │
    ├── components/          # Componentes reutilizables
    │   ├── Navbar.jsx       # Barra de navegación (enlaces según rol)
    │   ├── ProtectedRoute.jsx # Guarda de rutas (autenticación / rol)
    │   └── Alert.jsx        # Avisos de éxito/error con auto-cierre
    │
    └── pages/               # Vistas (una por ruta)
        ├── Login.jsx        # Inicio de sesión
        ├── Register.jsx     # Registro de usuario
        ├── Dashboard.jsx    # Panel con métricas y accesos rápidos
        ├── Espacios.jsx     # Listado de espacios (+ alta/edición para admin)
        ├── Reservas.jsx     # Listado y gestión de reservas
        ├── CrearReserva.jsx # Formulario de nueva reserva (validación en vivo)
        └── Usuarios.jsx     # Gestión de usuarios (solo admin)
```

### ¿Qué hace cada archivo?

#### Núcleo

| Archivo | Responsabilidad |
|---|---|
| `main.jsx` | Monta la app en el DOM y la envuelve con `BrowserRouter` (rutas) y `AuthProvider` (sesión). |
| `App.jsx` | Declara todas las rutas, separa públicas de protegidas y aplica el layout con `Navbar`. |
| `index.css` | Importa Tailwind y define las clases del sistema de diseño (`.btn-primary`, `.card`, `.input`, etc.). |

#### Capa `api/`

| Archivo | Responsabilidad |
|---|---|
| `axios.js` | Crea la instancia de Axios con `baseURL`. **Interceptor de request:** inyecta el `Authorization: Bearer <token>` automáticamente. **Interceptor de response:** ante un `401`, limpia el token. |
| `auth.js` | `login()` (envía credenciales en formato OAuth2), `register()` y `getMe()`. |
| `espacios.js` | `listarEspacios`, `listarDisponibles`, `crearEspacio`, `editarEspacio`. |
| `reservas.js` | `listarReservas`, `crearReserva`, `actualizarEstadoReserva`, `cancelarReserva`. |
| `usuarios.js` | `listarUsuarios`, `editarUsuario`, `cambiarEstadoUsuario` (operaciones de admin). |

#### Contexto y componentes

| Archivo | Responsabilidad |
|---|---|
| `AuthContext.jsx` | Guarda el token en `localStorage`, lo decodifica para obtener `rol`/`correo`/`id`, y expone `login`, `logout`, `register`, `isAuthenticated`, `isAdmin` y `user` mediante el hook `useAuth()`. |
| `ProtectedRoute.jsx` | Redirige a `/login` si no hay sesión y a `/dashboard` si el rol no está autorizado. |
| `Navbar.jsx` | Navegación superior; muestra el enlace "Usuarios" solo a administradores y permite cerrar sesión. |
| `Alert.jsx` | Aviso reutilizable de éxito/error. Se **auto-cierra** tras unos segundos (configurable con `duration`); reaparece si el mensaje cambia. |

#### Páginas

| Archivo | Responsabilidad |
|---|---|
| `Login.jsx` | Formulario de acceso; en éxito guarda el token y redirige al dashboard. |
| `Register.jsx` | Alta de usuario estándar con validación en cliente. |
| `Dashboard.jsx` | Métricas (reservas, pendientes, espacios) y accesos rápidos. |
| `Espacios.jsx` | Lista espacios; el admin puede crear y editar mediante un modal. |
| `Reservas.jsx` | Tabla de reservas; el admin aprueba/rechaza, el usuario cancela las suyas. |
| `CrearReserva.jsx` | Formulario de reserva con **validación en vivo** de las reglas de negocio antes de enviar. |
| `Usuarios.jsx` | Solo admin: listar, editar y activar/inactivar usuarios. |

---

## Gestión de autenticación (JWT)

1. El usuario inicia sesión en `Login.jsx`, que llama a `auth.login()`.
2. El backend devuelve un `access_token` (JWT) que se guarda en **`localStorage`**.
3. `AuthContext` decodifica el token con `jwt-decode` para extraer `rol`, `correo`, `id_usuario` y `exp`. Si el token expiró, la sesión se considera inválida.
4. En cada petición, el **interceptor de Axios** añade la cabecera `Authorization: Bearer <token>`.
5. Si el backend responde `401`, el interceptor limpia el token y la sesión se cierra.
6. `logout()` elimina el token de `localStorage` y del estado.

El estado de sesión está disponible en cualquier componente mediante:

```jsx
const { user, isAuthenticated, isAdmin, login, logout } = useAuth()
```

---

## Conexión con el backend

- La URL base se define en `src/api/axios.js` (`http://localhost:8000` por defecto).
- Cada módulo de `api/` corresponde a un grupo de endpoints del backend:

| Módulo frontend | Endpoints backend |
|---|---|
| `auth.js` | `POST /auth/login`, `GET /auth/me`, `POST /usuarios/` (registro) |
| `usuarios.js` | `GET /usuarios/`, `PUT /usuarios/{id}`, `PATCH /usuarios/{id}/estado` |
| `espacios.js` | `GET /espacios/`, `GET /espacios/disponibles`, `POST /espacios/`, `PUT /espacios/{id}` |
| `reservas.js` | `GET /reservas/`, `POST /reservas/`, `PUT /reservas/{id}/estado`, `DELETE /reservas/{id}` |

> El backend debe incluir el origen del frontend en su variable `CORS_ORIGINS`.

---

## Rutas y vistas

Definidas en `App.jsx`:

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | `Login` | Público (redirige si ya hay sesión) |
| `/register` | `Register` | Público |
| `/dashboard` | `Dashboard` | Autenticado |
| `/espacios` | `Espacios` | Autenticado (admin ve acciones de gestión) |
| `/reservas` | `Reservas` | Autenticado |
| `/reservas/nueva` | `CrearReserva` | Autenticado |
| `/usuarios` | `Usuarios` | Solo admin |
| `*` | Redirige a `/dashboard` | — |

Las rutas protegidas se envuelven con `ProtectedRoute`, que verifica sesión y rol.

---

## Interfaz diferenciada por rol

**Usuario estándar:**
- Consultar espacios disponibles.
- Crear reservas.
- Consultar y cancelar sus propias reservas.

**Administrador:**
- Todo lo anterior, más:
- Gestionar espacios (crear / editar).
- Ver todas las reservas y aprobarlas o rechazarlas.
- Gestionar usuarios (editar, activar / inactivar).

La diferenciación se aplica con el flag `isAdmin` del contexto, tanto en la navegación (`Navbar`) como dentro de cada página.

---

## Sistema de diseño

- **Tailwind CSS** con un tema personalizado en `tailwind.config.js`: paleta `brand` (índigo/violeta), fuente **Inter**, sombras suaves y animaciones.
- Clases de componentes reutilizables definidas en `index.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.card`, `.input`, `.label`, `.badge`.
- Fondo con malla de gradientes, tarjetas tipo *glassmorphism* y micro-interacciones en botones y tarjetas.

---

## Puesta en marcha

```powershell
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo (http://localhost:5173)
npm run dev

# 3. Compilar para producción
npm run build

# 4. Previsualizar el build
npm run preview

# 5. Linter
npm run lint
```

> Requisito: el backend debe estar corriendo en `http://localhost:8000`. Si cambia la URL, ajústala en `src/api/axios.js`.
