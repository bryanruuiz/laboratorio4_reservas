# Guía de Instalación y Ejecución

Sistema de Reservas de Espacios Institucionales (FastAPI + React). Esta guía explica, paso a paso, cómo poner en marcha el proyecto en **otro computador** desde cero: clonar el repositorio, instalar dependencias, configurar la base de datos y ejecutar backend y frontend.

> Para detalles técnicos (arquitectura, endpoints, reglas de negocio) consulta [READMEDev.md](READMEDev.md), [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

---

## 1. Requisitos previos

Instala estas herramientas antes de empezar:

| Herramienta | Versión mínima | Para qué | Descarga |
|---|---|---|---|
| **Git** | 2.x | Clonar el repositorio | <https://git-scm.com/downloads> |
| **Python** | 3.11+ | Ejecutar el backend | <https://www.python.org/downloads/> |
| **Node.js** | 18+ (incluye npm) | Ejecutar el frontend | <https://nodejs.org/> |
| **SQL Server** | 2019+ o Express | Base de datos | <https://www.microsoft.com/sql-server/sql-server-downloads> |

Verifica que todo está instalado:

```powershell
git --version
python --version
node --version
npm --version
```

> En Windows, durante la instalación de Python marca la casilla **"Add Python to PATH"**.

---

## 2. Clonar el repositorio

```powershell
# Ubícate donde quieras guardar el proyecto, por ejemplo:
cd C:\Users\TuUsuario\Documents

# Clona el repositorio
git clone <URL_DEL_REPOSITORIO> laboratorio4_reservas

# Entra a la carpeta
cd laboratorio4_reservas
```

La estructura principal es:

```
laboratorio4_reservas/
├── backend/    # API FastAPI
└── frontend/   # Aplicación React
```

---

## 3. Preparar la base de datos

1. Asegúrate de que el servicio de **SQL Server** esté en ejecución.
2. Crea una base de datos vacía para el proyecto, por ejemplo `lab4_reservas`:

```sql
CREATE DATABASE lab4_reservas;
```

3. Anota los datos de conexión (los necesitarás en el `.env`):
   - Usuario (p. ej. `sa`)
   - Contraseña
   - Host y puerto (p. ej. `localhost:1433`)
   - Nombre de la base de datos (`lab4_reservas`)

> Las **tablas se crean automáticamente** al iniciar el backend (no hace falta crearlas a mano).

---

## 4. Configurar y ejecutar el Backend

### 4.1 Crear el entorno virtual e instalar dependencias

```powershell
cd backend

# Crear el entorno virtual
python -m venv venv

# Activar el entorno virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Instalar las dependencias
pip install -r requirements.txt
```

> **Nota (PowerShell):** si al activar el entorno aparece un error de permisos, ejecuta una vez:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
>
> En **macOS / Linux** la activación es: `source venv/bin/activate`

### 4.2 Crear el archivo de variables de entorno

El archivo `.env` **no viene en el repositorio** (contiene credenciales). Créalo dentro de `backend/`:

**`backend/.env`**
```env
# Conexión a SQL Server (ajusta usuario, contraseña, host y BD)
DATABASE_URL=mssql+pymssql://sa:TuPassword123!@localhost:1433/lab4_reservas

# Seguridad JWT (usa una clave larga y aleatoria)
SECRET_KEY=cambia-esto-por-una-clave-secreta-larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Orígenes permitidos del frontend (CORS)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 4.3 Crear el administrador inicial

Ejecuta una sola vez (crea las tablas y el primer usuario admin):

```powershell
python seed_admin.py
```

Credenciales del admin creado:
- **Correo:** `admin@institucion.edu`
- **Contraseña:** `Admin123!`

### 4.4 Iniciar el servidor

```powershell
uvicorn app.main:app --reload
```

El backend queda disponible en:
- API: <http://localhost:8000>
- Documentación Swagger: <http://localhost:8000/docs>

> Deja esta terminal abierta. Abre **otra terminal** para el frontend.

---

## 5. Configurar y ejecutar el Frontend

```powershell
# Desde la raíz del proyecto, en una NUEVA terminal
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend queda disponible en <http://localhost:5173>.

> Si tu backend no corre en `http://localhost:8000`, edita la constante `baseURL` en
> [frontend/src/api/axios.js](frontend/src/api/axios.js) y el valor `CORS_ORIGINS` del `.env` del backend.

---

## 6. Probar que todo funciona

1. Abre <http://localhost:5173> en el navegador.
2. Inicia sesión con el admin inicial (`admin@institucion.edu` / `Admin123!`).
3. Como admin: crea un espacio en **Espacios**.
4. Regístrate como usuario nuevo (o usa la cuenta admin) y crea una reserva en **Nueva reserva**.
5. Vuelve como admin a **Reservas** y aprueba/rechaza la solicitud.

---

## 7. Resumen de comandos (TL;DR)

```powershell
# 1. Clonar
git clone <URL_DEL_REPOSITORIO> laboratorio4_reservas
cd laboratorio4_reservas

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
#   → crear backend/.env (ver sección 4.2)
python seed_admin.py
uvicorn app.main:app --reload

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## 8. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | El entorno virtual no está activo | Activa `venv` (`.\venv\Scripts\Activate.ps1`) y reinstala dependencias |
| `Activate.ps1 cannot be loaded` | Política de ejecución de PowerShell | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| El backend no conecta a la BD | `DATABASE_URL` incorrecta o SQL Server apagado | Verifica credenciales, host/puerto y que el servicio esté corriendo |
| El frontend muestra errores de red / CORS | Backend apagado o `CORS_ORIGINS` mal configurado | Levanta el backend y añade el origen del frontend a `CORS_ORIGINS` |
| `npm: command not found` | Node.js no instalado o no en PATH | Instala Node.js y reinicia la terminal |
| No puedo iniciar sesión | No se creó el admin | Ejecuta `python seed_admin.py` |
| El puerto 8000 / 5173 está ocupado | Otro proceso usa el puerto | Cierra el proceso o cambia el puerto (`uvicorn ... --port 8001`) |

---

## 9. Notas para producción

- **Nunca** subas el archivo `.env` al repositorio (ya está en `.gitignore`).
- Cambia `SECRET_KEY` por una clave larga y aleatoria, y la contraseña del admin inicial.
- Restringe `CORS_ORIGINS` al dominio real del frontend.
- Compila el frontend con `npm run build` y sirve la carpeta `dist/` desde un servidor estático.
