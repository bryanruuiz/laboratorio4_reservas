# Sistema de Reservas de Espacios Institucionales

Aplicación web full-stack para la **gestión y reserva de espacios institucionales** (salas, laboratorios, auditorios y aulas). Permite a los usuarios solicitar reservas en franjas horarias disponibles y a los administradores aprobarlas, rechazarlas y gestionar el catálogo de espacios y usuarios.

## Objetivo

Automatizar y centralizar la reserva de espacios físicos de una institución educativa, eliminando conflictos de horario, garantizando el cumplimiento de las políticas institucionales (anticipación mínima, horarios permitidos, capacidad de aforo) y diferenciando las capacidades según el rol del usuario (`admin` / `usuario`).

---

## 👥 Integrantes del equipo

| Nombre | Rol |
|---|---|
| Santiago Arenas Herrera | [Rol del integrante 1] |
| Bryan Alejandro Ruiz Restrepo | [Rol del integrante 2] |
| Juan Manuel Gallego Rojas | [Rol del integrante 3] |

---

## ¿Qué hace la aplicación y qué problema resuelve?

### Problema que resuelve

En entornos institucionales, la asignación manual de espacios genera frecuentes **conflictos de horario**, reservas duplicadas, uso ineficiente de instalaciones y falta de visibilidad sobre la disponibilidad real. Este sistema centraliza y automatiza ese proceso.

### Funcionalidades principales

| Funcionalidad | Rol requerido |
|---|---|
| Registro e inicio de sesión | Todos |
| Consultar espacios disponibles (con filtros de fecha, hora y aforo) | Autenticado |
| Crear una solicitud de reserva | Autenticado |
| Consultar el historial de reservas propias | Autenticado (`usuario`) |
| Cancelar una reserva propia | Autenticado |
| Ver todas las reservas del sistema | Admin |
| Aprobar o rechazar solicitudes de reserva | Admin |
| Crear, editar y cambiar el estado de espacios | Admin |
| Gestionar usuarios (editar, activar/inactivar) | Admin |

### Reglas de negocio aplicadas automáticamente

- ⏰ **Anticipación mínima:** no se aceptan reservas con menos de 24 horas de anticipación.
- 🗓️ **Horario institucional:** lunes a viernes de 7:00 a 20:00; sábados de 8:00 a 12:00; domingos no disponibles.
- 🚫 **Sin solapamiento:** el sistema detecta y rechaza reservas que se crucen en fecha y franja horaria para el mismo espacio.
- 👥 **Capacidad:** la cantidad de asistentes no puede superar la capacidad del espacio.
- 🏢 **Estado del espacio:** no se pueden reservar espacios inactivos, en mantenimiento o no disponibles.
- 🔄 **Flujo de estados:** toda reserva nace en `esperando`; solo un administrador puede pasarla a `aprobada` o `rechazada`.

---

## 🏗️ Arquitectura general y tecnologías utilizadas

### Diagrama de arquitectura

```
┌──────────────────┐     HTTP + JWT      ┌──────────────────┐     ORM      ┌──────────────┐
│   Frontend SPA   │ ──────────────────► │   Backend API    │ ───────────► │  SQL Server  │
│  React + Vite    │ ◄────────────────── │     FastAPI      │ ◄─────────── │  (pymssql)   │
└──────────────────┘    JSON / REST      └──────────────────┘   SQLAlchemy └──────────────┘
```

- **Frontend:** SPA en React que consume la API REST y gestiona la sesión con JWT almacenado en `localStorage`.
- **Backend:** API REST en FastAPI con arquitectura modular por capas (routers → schemas → crud → models).
- **Base de datos:** SQL Server 2022, accedida mediante el ORM SQLAlchemy con el driver `pymssql`.
- **Autenticación:** JWT (HS256) emitido por el backend; el frontend lo adjunta en cada petición vía interceptor de Axios.

### Tecnologías utilizadas

#### Backend
| Tecnología | Uso |
|---|---|
| **Python 3.11+** | Lenguaje base |
| **FastAPI** | Framework web / API REST + Swagger automático |
| **Uvicorn** | Servidor ASGI |
| **SQLAlchemy** | ORM |
| **SQL Server** (`pymssql`) | Base de datos relacional |
| **Pydantic** | Validación y serialización (schemas) |
| **python-jose** | Tokens JWT |
| **passlib + bcrypt** | Hash seguro de contraseñas |
| **python-dotenv** | Variables de entorno |

#### Frontend
| Tecnología | Uso |
|---|---|
| **React 19** | UI basada en componentes |
| **Vite** | Bundler / servidor de desarrollo |
| **React Router DOM 7** | Enrutamiento SPA |
| **Axios** | Cliente HTTP con interceptores JWT |
| **jwt-decode** | Decodificación del token (rol, expiración) |
| **Tailwind CSS 3** | Sistema de estilos y diseño |
| **lucide-react** | Biblioteca de iconos |

### Modelo de datos (Entidad-Relación)

```
┌─────────────────────┐          ┌─────────────────────┐
│      usuarios       │          │      espacios        │
├─────────────────────┤          ├─────────────────────┤
│ PK id_usuario       │          │ PK id_espacio        │
│    nombre           │          │    nombre            │
│    correo (único)   │          │    ubicacion         │
│    contrasena (hash)│          │    capacidad         │
│    rol              │          │    estado            │
│    estado           │          └──────────┬──────────┘
└──────────┬──────────┘                     │
           │ 1:N                          1:N│
           │         ┌─────────────────────┐│
           └────────►│      reservas       │◄┘
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

---

## 🚀 Despliegue con Docker Compose

El proyecto incluye un archivo `docker-compose.yml` que levanta los tres servicios necesarios con un solo comando.

### Servicios y puertos

| Servicio | Contenedor | Puerto expuesto | Descripción |
|---|---|---|---|
| `db` | `sqlserver_lab4` | `1433` | SQL Server 2022 (Developer Edition) |
| `db-init` | `sqlserver_init` | — | Inicializa el esquema SQL al arrancar |
| `backend` | `fastapi_lab4` | `8000` | API FastAPI (Uvicorn) |
| `frontend` | `react_lab4` | `5173` | Aplicación React (build de producción) |

### Variables de entorno requeridas

Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```env
DB_PASSWORD=TuPasswordSeguro123!
DATABASE_URL=mssql+pymssql://sa:TuPasswordSeguro123!@db:1433/lab4_reservas
SECRET_KEY=cambia-esto-por-una-clave-larga-y-aleatoria
```

### Comandos de despliegue

```bash
# Linux / WSL — desde la raíz del proyecto
docker compose up --build -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

> **Rama de operaciones:** el archivo `docker-compose.yml` y la configuración de contenedores se encuentra en la rama **`[nombre-rama-ops]`** del repositorio.

### Acceso a la aplicación

- **Frontend:** http://localhost:5173
- **Backend (API):** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs

---

## 📖 Tutorial de uso

### Credenciales del administrador inicial

| Campo | Valor |
|---|---|
| Correo | `admin@institucion.edu` |
| Contraseña | `Admin123!` |

---

### 1. Inicio de sesión

Accede a http://localhost:5173 e ingresa tus credenciales en el formulario de inicio de sesión.

> [Imagen: pantalla de inicio de sesión]

---

### 2. Dashboard

Tras iniciar sesión, el sistema te redirige al **Dashboard** donde puedes ver un resumen de tus reservas activas.

> [Imagen: pantalla del dashboard]

---

### 3. Crear una reserva

1. Haz clic en **Nueva Reserva** en la barra de navegación.
2. Selecciona la **fecha**, la **hora de inicio** y la **hora de fin**.
3. Ingresa la **cantidad de asistentes**.
4. El sistema filtrará automáticamente los espacios disponibles para esa franja horaria.
5. Selecciona un espacio y confirma la reserva.
6. La reserva quedará en estado **`esperando`** hasta que un administrador la apruebe.

> [Imagen: formulario de creación de reserva]

> [Imagen: lista de espacios disponibles filtrada]

---

### 4. Consultar reservas

En la sección **Mis Reservas** puedes ver el historial completo de tus solicitudes y su estado actual (`esperando`, `aprobada`, `rechazada`, `cancelada`).

> [Imagen: lista de reservas del usuario]

---

### 5. Cancelar una reserva

Desde **Mis Reservas**, haz clic en el botón **Cancelar** en cualquier reserva con estado `esperando` o `aprobada`.

> [Imagen: botón de cancelación y confirmación]

---

### 6. Gestión de espacios (solo Admin)

En la sección **Espacios** el administrador puede:
- **Crear** nuevos espacios con nombre, ubicación, capacidad y estado.
- **Editar** la información de un espacio existente.
- **Cambiar el estado** de un espacio (`activo`, `inactivo`, `en mantenimiento`, `no disponible`).

> [Imagen: formulario de creación/edición de espacio]

> [Imagen: listado de espacios con opciones de gestión]

---

### 7. Gestión de reservas (solo Admin)

En **Reservas**, el administrador visualiza todas las solicitudes del sistema y puede **aprobar** o **rechazar** las que estén en estado `esperando`.

> [Imagen: panel de reservas con opciones de aprobación/rechazo]

---

### 8. Gestión de usuarios (solo Admin)

En **Usuarios**, el administrador puede:
- Ver el listado completo de usuarios registrados.
- Editar los datos de un usuario (nombre, correo, rol, contraseña).
- Activar o inactivar una cuenta.

> [Imagen: listado de usuarios con opciones de gestión]

---

### 9. Mensajes de error

El sistema muestra mensajes claros cuando una acción no es válida. Ejemplos:

| Situación | Mensaje mostrado |
|---|---|
| Reserva con menos de 24 h de anticipación | `"La reserva debe hacerse con al menos 24 horas de anticipación."` |
| Horario fuera del rango institucional | `"El horario debe estar dentro del rango permitido."` |
| Conflicto de horario con otra reserva | `"Ya existe una reserva para este espacio en ese horario."` |
| Asistentes superan la capacidad | `"La cantidad de asistentes supera la capacidad del espacio."` |
| Credenciales incorrectas | `"Correo o contraseña incorrectos."` |
| Usuario inactivo | `"Tu cuenta está inactiva. Contacta al administrador."` |

> [Imagen: ejemplo de mensaje de error en el formulario]

---

### 10. Cierre de sesión

Haz clic en el botón **Cerrar sesión** en la barra de navegación. El token JWT se elimina del almacenamiento local y se te redirige al formulario de inicio de sesión.

> [Imagen: opción de cierre de sesión en la barra de navegación]

---

## 🎓 Conclusiones, dificultades, aprendizajes y mejoras futuras

### Conclusiones

[Escribe aquí las conclusiones del equipo sobre el proyecto.]

### Dificultades encontradas

[Describe las principales dificultades técnicas u organizativas que el equipo enfrentó durante el desarrollo.]

### Aprendizajes

[Detalla los aprendizajes más importantes obtenidos durante el laboratorio: tecnologías, patrones de diseño, trabajo en equipo, etc.]

### Mejoras futuras

- [ ] Implementar notificaciones por correo electrónico al aprobar/rechazar una reserva.
- [ ] Agregar una vista de calendario para visualizar la disponibilidad de espacios de forma gráfica.
- [ ] Permitir reservas recurrentes (semanal, mensual).
- [ ] Implementar un sistema de reportes y estadísticas de uso por espacio.
- [ ] Migrar la autenticación a un proveedor externo (OAuth 2.0 institucional).
- [ ] Añadir soporte para adjuntar documentos justificativos a la solicitud de reserva.
- [ ] [Otras mejoras que el equipo proponga]

---

> **Documentación técnica completa:** ver [READMEDev.md](READMEDev.md)  
> **Guía de instalación paso a paso:** ver [INSTALACION.md](INSTALACION.md)
