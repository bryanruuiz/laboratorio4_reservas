# READMEops — Documentación de Despliegue

Sistema de Reservas de Espacios Institucionales. Guía de operaciones y despliegue con Docker Compose: configuración de entorno, construcción de imágenes, red, persistencia, ejecución y solución de problemas.

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonación del repositorio y configuración de .env](#2-clonación-del-repositorio-y-configuración-de-env)
3. [Explicación de variables de entorno](#3-explicación-de-variables-de-entorno)
4. [Dockerfile del backend](#4-dockerfile-del-backend)
5. [Dockerfile del frontend](#5-dockerfile-del-frontend)
6. [Archivo docker-compose.yml](#6-archivo-docker-composeyml)
7. [Configuración de red y persistencia](#7-configuración-de-red-y-persistencia)
8. [Puertos utilizados](#8-puertos-utilizados)
9. [Construcción, ejecución y verificación del sistema](#9-construcción-ejecución-y-verificación-del-sistema)
10. [Apagado, reinicio y actualización](#10-apagado-reinicio-y-actualización)
11. [Solución de errores comunes](#11-solución-de-errores-comunes)

---

## 1. Requisitos previos

Antes de desplegar el sistema, asegúrate de tener instaladas las siguientes herramientas:

### Docker y Docker Compose

| Herramienta | Versión mínima | Descarga |
| --- | --- | --- |
| **Docker Engine** | 24.x | <https://docs.docker.com/engine/install/> |
| **Docker Compose** | v2.x (plugin integrado) | Incluido con Docker Desktop / Engine |

Verifica la instalación:

```bash
docker --version
docker compose version
```

> A partir de Docker Engine 23+, `docker compose` (sin guion) es el comando estándar. Si tu sistema usa la versión antigua, reemplaza `docker compose` por `docker-compose` en todos los comandos de esta guía.

### En Linux (nativo)

Docker Engine se instala directamente sobre el sistema. No se requiere WSL.

```bash
# Ejemplo para Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar tu usuario al grupo docker para no usar sudo
sudo usermod -aG docker $USER
newgrp docker
```

### En Windows con WSL 2

Si corres el proyecto desde Windows, se recomienda usar **WSL 2** con Ubuntu como distribución:

1. Activa WSL 2: `wsl --install` (requiere reinicio).
2. Instala **Docker Desktop** y habilita la integración con WSL 2 en *Settings → Resources → WSL Integration*.
3. Abre una terminal de Ubuntu (WSL) y usa los comandos de esta guía desde allí.

> **Importante:** clona el repositorio y coloca el `.env` dentro del sistema de archivos de Linux (`~/...`), **no** en `/mnt/c/...`. El rendimiento de I/O y la compatibilidad de permisos son significativamente mejores dentro del sistema de archivos nativo de WSL.

### Git

```bash
git --version   # 2.x o superior
```

---

## 2. Clonación del repositorio y configuración de .env

### Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO> laboratorio4_reservas
cd laboratorio4_reservas
```

### Crear el archivo `.env`

El archivo `.env` **no se incluye en el repositorio** (está en `.gitignore`) porque contiene credenciales. Cópialo a partir de la plantilla e introduce tus valores:

```bash
cp .env.example .env
```

Edita `.env` con un editor de texto:

```bash
nano .env
# o
code .env
```

Contenido mínimo requerido:

```env
DB_PASSWORD="tu_password_seguro_aqui"
DATABASE_URL="mssql+pymssql://sa:tu_password_seguro_aqui@db:1433/lab4_reservas"
SECRET_KEY="cambia_esta_clave_por_una_muy_segura"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **Nota:** el valor de `DB_PASSWORD` dentro de `DATABASE_URL` debe ser **idéntico** al valor de `DB_PASSWORD`. Si los cambias, actualiza ambos al mismo tiempo.

---

## 3. Explicación de variables de entorno

Estas variables se leen desde el archivo `.env` en la raíz del proyecto y son inyectadas automáticamente por Docker Compose en los contenedores que las necesitan.

| Variable | Ejemplo de valor | Contenedor que la usa | Descripción |
| --- | --- | --- | --- |
| `DB_PASSWORD` | `MiPassword123!` | `db`, `db-init` | Contraseña del usuario administrador (`sa`) de SQL Server. Debe cumplir la política de complejidad: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo. |
| `DATABASE_URL` | `mssql+pymssql://sa:MiPassword123!@db:1433/lab4_reservas` | `backend` | Cadena de conexión SQLAlchemy. El host es `db` (nombre del servicio en la red Docker), **no** `localhost`. |
| `SECRET_KEY` | `una-cadena-larga-aleatoria` | `backend` | Clave secreta para firmar los tokens JWT. Genera una con `openssl rand -hex 32`. |
| `ALGORITHM` | `HS256` | `backend` | Algoritmo de firma JWT. No cambiar salvo necesidad explícita. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | `backend` | Tiempo de vida del token JWT en minutos. |

### Generar una SECRET_KEY segura

```bash
openssl rand -hex 32
```

---

## 4. Dockerfile del backend

Ubicación: `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Explicación paso a paso

| Instrucción | Propósito |
| --- | --- |
| `FROM python:3.12-slim` | Imagen base ligera de Python 3.12 (sin herramientas de desarrollo innecesarias). |
| `WORKDIR /app` | Establece el directorio de trabajo dentro del contenedor. |
| `COPY requirements.txt .` | Copia primero solo el archivo de dependencias para aprovechar la caché de capas de Docker. |
| `RUN pip install --no-cache-dir -r requirements.txt` | Instala las dependencias Python sin guardar caché (`--no-cache-dir` reduce el tamaño de la imagen). |
| `COPY . .` | Copia el código fuente del backend al contenedor. |
| `EXPOSE 8000` | Documenta que el contenedor escucha en el puerto 8000 (no abre el puerto; eso lo hace `docker-compose.yml`). |
| `CMD [...]` | Comando por defecto: inicia Uvicorn escuchando en todas las interfaces (`0.0.0.0`). |

### Dependencias instaladas (`requirements.txt`)

```
fastapi
uvicorn[standard]
sqlalchemy
pymssql
python-jose[cryptography]
passlib[bcrypt]
bcrypt==4.0.1
python-multipart
python-dotenv
pydantic[email]
```

---

## 5. Dockerfile del frontend

Ubicación: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

### Explicación paso a paso

| Instrucción | Propósito |
| --- | --- |
| `FROM node:20-alpine` | Imagen base de Node.js 20 sobre Alpine Linux (imagen muy ligera). |
| `WORKDIR /app` | Directorio de trabajo dentro del contenedor. |
| `COPY package*.json ./` | Copia `package.json` y `package-lock.json` para instalar dependencias antes de copiar el código (optimiza caché). |
| `RUN npm install` | Instala las dependencias de Node.js. |
| `COPY . .` | Copia el código fuente del frontend. |
| `RUN npm run build` | Compila la aplicación React con Vite y genera la carpeta `dist/`. |
| `EXPOSE 4173` | Puerto interno que usa `vite preview` por defecto. |
| `CMD [...]` | Sirve el build de producción con `vite preview` en todas las interfaces. |

> **Nota sobre puertos:** el frontend en el contenedor escucha internamente en el puerto `4173`. El `docker-compose.yml` lo mapea al puerto `5173` del host (`5173:4173`), manteniendo la convención habitual de Vite.

---

## 6. Archivo docker-compose.yml

```yaml
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sqlserver_lab4
    restart: always
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=${DB_PASSWORD}
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
    networks:
      - app_network

  db-init:
    image: mcr.microsoft.com/mssql-tools
    container_name: sqlserver_init
    depends_on:
      - db
    volumes:
      - ./init.sql:/init.sql
    networks:
      - app_network
    command: /bin/bash -c "sleep 15 && /opt/mssql-tools/bin/sqlcmd -S db -U sa -P '${DB_PASSWORD}' -i /init.sql"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fastapi_lab4
    restart: always
    depends_on:
      - db
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    ports:
      - "8000:8000"
    networks:
      - app_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: react_lab4
    restart: always
    depends_on:
      - backend
    ports:
      - "5173:4173"
    networks:
      - app_network

volumes:
  sqlserver_data:

networks:
  app_network:
    driver: bridge
```

### Descripción de cada servicio

#### `db` — SQL Server 2022

- **Imagen:** `mcr.microsoft.com/mssql/server:2022-latest` (imagen oficial de Microsoft).
- **`MSSQL_PID=Developer`:** activa la edición Developer de SQL Server (sin costo, para uso no productivo).
- **`restart: always`:** el contenedor se reinicia automáticamente si falla o si el sistema se reinicia.
- **Volumen `sqlserver_data`:** persiste los datos de la base de datos entre reinicios del contenedor.

#### `db-init` — Inicializador del esquema

- **Imagen:** `mcr.microsoft.com/mssql-tools` (contiene `sqlcmd`).
- Espera 15 segundos para que SQL Server termine de arrancar, luego ejecuta `init.sql` que crea la base de datos `lab4_reservas` y las tres tablas (`usuarios`, `espacios`, `reservas`).
- **Este contenedor termina y no se reinicia** (es un trabajo de inicialización de una sola vez).

#### `backend` — API FastAPI

- **Build:** construye la imagen desde `backend/Dockerfile`.
- **`depends_on: db`:** espera a que el contenedor `db` esté creado antes de iniciar (no garantiza que SQL Server esté listo; por eso `db-init` usa `sleep 15`).
- Recibe `DATABASE_URL` y `SECRET_KEY` como variables de entorno.

#### `frontend` — React (producción)

- **Build:** construye la imagen desde `frontend/Dockerfile`.
- **`depends_on: backend`:** se inicia después del backend.
- Sirve el build de producción de Vite en el puerto `4173` del contenedor, mapeado al `5173` del host.

### Orden de arranque

```
db  →  db-init (crea tablas)
db  →  backend (API FastAPI)
backend  →  frontend (React)
```

---

## 7. Configuración de red y persistencia

### Red — `app_network`

Todos los servicios comparten la red interna `app_network` de tipo `bridge`. Esto permite que:

- El `backend` se conecte a `db` usando el hostname `db` (nombre del servicio), **no** `localhost`.
- El `db-init` alcance `db` con el mismo hostname.
- Los contenedores estén **aislados** del resto del sistema; solo los puertos explícitamente mapeados son accesibles desde el host.

```
Host (navegador)
    │ :5173          │ :8000          │ :1433
    ▼                ▼                ▼
┌─────────────────────────────────────────────┐
│              app_network (bridge)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ frontend │  │ backend  │  │    db    │  │
│  │ :4173    │  │  :8000   │  │  :1433   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

### Persistencia — Volumen `sqlserver_data`

```yaml
volumes:
  sqlserver_data:
```

Docker gestiona este volumen con nombre en `/var/lib/docker/volumes/`. Los datos de SQL Server (`/var/opt/mssql` dentro del contenedor) se guardan aquí, por lo que **los datos sobreviven a `docker compose down`**.

> Para eliminar los datos completamente (restablecer la BD desde cero), usa `docker compose down -v`.

---

## 8. Puertos utilizados

| Servicio | Puerto en el host | Puerto en el contenedor | Protocolo | URL de acceso |
| --- | --- | --- | --- | --- |
| **Frontend** (React) | `5173` | `4173` | HTTP | <http://localhost:5173> |
| **Backend** (FastAPI) | `8000` | `8000` | HTTP | <http://localhost:8000> |
| **Swagger UI** | `8000` | `8000` | HTTP | <http://localhost:8000/docs> |
| **ReDoc** | `8000` | `8000` | HTTP | <http://localhost:8000/redoc> |
| **SQL Server** | `1433` | `1433` | TCP | `localhost,1433` |

> Si algún puerto está ocupado en tu máquina, cámbialo en `docker-compose.yml` solo en la parte izquierda del mapeo (`host:contenedor`). Por ejemplo, para el backend: `"8080:8000"`.

---

## 9. Construcción, ejecución y verificación del sistema

### Paso 1 — Crear el archivo `.env`

```bash
cp .env.example .env
# Edita .env con tus credenciales reales
```

### Paso 2 — Construir las imágenes y levantar los contenedores

```bash
docker compose up --build -d
```

- `--build`: fuerza la reconstrucción de las imágenes del backend y el frontend.
- `-d`: modo detached (en segundo plano).

La primera vez tarda varios minutos mientras descarga las imágenes base y compila el frontend.

### Paso 3 — Crear el administrador inicial

El administrador inicial debe crearse manualmente la primera vez (una sola vez):

```bash
docker exec fastapi_lab4 python seed_admin.py
```

Salida esperada:

```
Administrador creado: admin@institucion.edu (id=1)
Contraseña: Admin123!
```

> Si ya existe un administrador, el script lo indica y no duplica el registro.

### Paso 4 — Verificar que todo está corriendo

```bash
docker ps
```

Debes ver los cuatro contenedores (el `sqlserver_init` puede no aparecer porque ya terminó su trabajo):

```
CONTAINER ID   IMAGE                        PORTS                    NAMES
xxxxxxxxxxxx   laboratorio4_reservas-front  0.0.0.0:5173->4173/tcp   react_lab4
xxxxxxxxxxxx   laboratorio4_reservas-back   0.0.0.0:8000->8000/tcp   fastapi_lab4
xxxxxxxxxxxx   mssql/server:2022-latest     0.0.0.0:1433->1433/tcp   sqlserver_lab4
```

### Paso 5 — Verificar los logs

```bash
# Logs de todos los servicios en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Paso 6 — Acceder a la aplicación

| Recurso | URL |
| --- | --- |
| Aplicación web | <http://localhost:5173> |
| API (Swagger UI) | <http://localhost:8000/docs> |

Credenciales del administrador inicial:

| Campo | Valor |
| --- | --- |
| Correo | `admin@institucion.edu` |
| Contraseña | `Admin123!` |

---

## 10. Apagado, reinicio y actualización

### Detener los contenedores (sin eliminar datos)

```bash
docker compose down
```

Los datos de la base de datos se conservan en el volumen `sqlserver_data`.

### Detener y eliminar todos los datos

```bash
docker compose down -v
```

> **Precaución:** `-v` elimina el volumen `sqlserver_data`. Se perderán todos los datos de la base de datos. La próxima vez que levantes el sistema deberás volver a ejecutar `seed_admin.py`.

### Reiniciar un servicio específico

```bash
docker compose restart backend
docker compose restart frontend
```

### Actualizar el código y redesplegar

Cuando realizas cambios en el código fuente:

```bash
# 1. Detener los contenedores
docker compose down

# 2. Reconstruir las imágenes con el nuevo código y levantar
docker compose up --build -d
```

Solo los servicios cuyo código cambió reconstruyen su imagen; Docker reutiliza las capas sin cambios.

### Ver el estado de los servicios

```bash
docker compose ps
```

---

## 11. Solución de errores comunes

### El backend no puede conectarse a la base de datos

**Síntoma:** `docker compose logs backend` muestra errores de conexión a SQL Server.

**Causas y soluciones:**

| Causa | Solución |
| --- | --- |
| `DATABASE_URL` usa `localhost` en vez de `db` | Cambia el host en `.env` a `db`: `mssql+pymssql://sa:pass@db:1433/lab4_reservas` |
| La contraseña en `DATABASE_URL` no coincide con `DB_PASSWORD` | Verifica que ambas variables tengan el mismo valor en `.env` |
| SQL Server aún no terminó de arrancar | Espera 20-30 segundos y vuelve a verificar los logs |
| `DB_PASSWORD` no cumple la política de complejidad | La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo |

### Las tablas no existen / `db-init` falló

**Síntoma:** el backend arranca pero falla con errores de tabla no encontrada.

```bash
# Ver los logs del inicializador
docker compose logs db-init
```

Si falló, ejecútalo manualmente:

```bash
docker run --rm \
  --network laboratorio4_reservas_app_network \
  -v "$(pwd)/init.sql:/init.sql" \
  mcr.microsoft.com/mssql-tools \
  /bin/bash -c "/opt/mssql-tools/bin/sqlcmd -S db -U sa -P '${DB_PASSWORD}' -i /init.sql"
```

### El administrador inicial no existe

**Síntoma:** no se puede iniciar sesión con `admin@institucion.edu`.

```bash
docker exec fastapi_lab4 python seed_admin.py
```

### El frontend muestra errores de red (no carga datos)

**Síntoma:** la interfaz carga pero las peticiones a la API fallan.

**Causas:**
- El backend no está corriendo (`docker compose ps` para verificar).
- La URL del backend en el frontend apunta a una dirección incorrecta.

Verifica la `baseURL` configurada en `frontend/src/api/axios.js` y asegúrate de que coincida con el puerto real del backend.

### Puerto ya en uso

**Síntoma:** `docker compose up` falla con `Bind for 0.0.0.0:XXXX failed: port is already allocated`.

```bash
# Ver qué proceso usa el puerto (ejemplo: 8000)
sudo lsof -i :8000
# o
sudo ss -tulpn | grep 8000
```

Cambia el puerto del host en `docker-compose.yml` (solo la parte izquierda):

```yaml
ports:
  - "8001:8000"   # Ahora accesible en localhost:8001
```

### Espacio en disco insuficiente

Docker puede acumular imágenes y capas antiguas. Para limpiar recursos no utilizados:

```bash
# Eliminar imágenes, contenedores y redes sin uso (NO elimina volúmenes)
docker system prune

# Incluir volúmenes sin uso (con precaución)
docker system prune --volumes
```

### Ver todos los logs de un arranque completo

```bash
docker compose up --build 2>&1 | tee deploy.log
```

Esto muestra los logs en pantalla y los guarda en `deploy.log` para análisis posterior.

---

> **Documentación técnica de la aplicación:** ver [READMEDev.md](READMEDev.md)
> **Manual de usuario:** ver [README.md](README.md)
> **Guía de instalación en modo desarrollo:** ver [INSTALACION.md](INSTALACION.md)
