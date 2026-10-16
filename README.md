# Lotificadora - Sistema de Gestión (MERN Stack)

Sistema de gestión para lotificadoras, con panel administrativo (login, proyectos,
manzanas, lotes, clientes, contratos, cuotas y pagos) y un **portal público** donde
cada cliente consulta su estado de cuenta mediante un enlace único (sin necesidad de
iniciar sesión).

Construido con **MongoDB + Express + React + Node.js**.

## Estructura del proyecto

```
lotificadora-mern/
├── backend/          API REST (Node + Express + Mongoose)
│   └── src/
│       ├── config/       Conexión a MongoDB
│       ├── models/       Esquemas de Mongoose
│       ├── controllers/  Lógica de negocio
│       ├── routes/       Definición de endpoints
│       ├── middleware/   Autenticación JWT y manejo de errores
│       └── utils/        Helpers (generación de cuotas, número de contrato, seed)
└── frontend/         Interfaz web (React + Vite)
    └── src/
        ├── api/          Cliente axios configurado
        ├── context/       Contexto de autenticación
        ├── components/    Componentes reutilizables (Layout, Modal, etc.)
        ├── pages/
        │   ├── admin/     Panel administrativo (requiere login)
        │   └── portal/    Portal público del cliente (sin login)
        └── styles/        Estilos globales
```

## Requisitos previos

- Node.js 18 o superior
- MongoDB corriendo localmente (`mongodb://127.0.0.1:27017`) o una cadena de conexión
  a MongoDB Atlas (gratis en https://www.mongodb.com/cloud/atlas)

## Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Abrí el archivo `.env` y, si usás MongoDB Atlas, reemplazá `MONGO_URI` por tu cadena
de conexión. Si usás MongoDB local con la configuración por defecto, no necesitás
cambiar nada.

Creá el usuario administrador inicial:

```bash
npm run seed
```

Esto crea el usuario:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

Iniciá el servidor:

```bash
npm run dev
```

El API queda disponible en `http://localhost:4000`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Uso

1. Entrá a `http://localhost:5173/login` y entrá con `admin` / `admin123`.
2. Creá un **Proyecto** (ej: "Residencial Las Flores").
3. En **Lotes**, elegí ese proyecto, creá una **Manzana** y agregá lotes.
4. Creá un **Cliente**.
5. En **Contratos**, creá un contrato nuevo asociando cliente + lote.
6. Entrá al detalle del contrato para registrar pagos.
7. Hacé clic en "🔗 Copiar link del portal" para obtener el enlace público que
   podés compartir con el cliente — no necesita ninguna cuenta para verlo.

## Módulos del sistema

- **Autenticación** — login con JWT, contraseñas con bcrypt, roles (Administrador,
  Vendedor, Cobrador).
- **Proyectos / Manzanas / Lotes** — jerarquía de ubicación de los terrenos.
- **Clientes** — datos de contacto de los compradores.
- **Contratos** — genera automáticamente el calendario de cuotas; si el contrato
  ya tiene pagos registrados, bloquea cambios a las condiciones financieras para
  proteger la integridad de los datos.
- **Pagos** — si un pago es mayor al saldo de la cuota seleccionada, el excedente
  se aplica automáticamente a las siguientes cuotas pendientes.
- **Dashboard** — resumen de lotes por estado, contratos activos, total recaudado
  y notificaciones de cuotas vencidas o próximas a vencer.
- **Portal del cliente** — página pública (sin login) accesible por un código único
  (UUID) por contrato, con línea de tiempo de progreso, estado de cuenta y botón
  de contacto por WhatsApp.

## Notas técnicas

- Las contraseñas nunca se devuelven en las respuestas de la API (se excluyen
  explícitamente en el modelo `Usuario`).
- El cálculo de `totalPagado` de un contrato siempre se basa en la suma real de
  los `Pago` registrados (no en las cuotas), para que la prima y cualquier abono
  general se reflejen correctamente.
- El número de contrato se genera tomando el número más alto existente (no un
  conteo), evitando colisiones si se elimina un contrato intermedio.
- El `codigoPublico` de cada contrato es un UUID v4 — es la única llave del
  portal del cliente, por lo que no se puede adivinar probando valores.


## Dos formas de entrar (página de inicio `/`)

- **Clientes** (`/consulta`): el cliente escribe su número de lote y ve su estado de cuenta. Si el mismo número existe en varias manzanas, se le pide también la manzana. Endpoint público `POST /api/portal/buscar`, con límite de 30 intentos por IP cada 15 min.
- **Administración** (`/login`): acceso del personal. Después de iniciar sesión se entra al panel en `/panel`.
- El link secreto por contrato (`/portal/<codigo>`) sigue funcionando.

## Módulo de Pagos (`/pagos`)

- Listado general de pagos con búsqueda (cliente, contrato, lote, recibo), filtro por método y rango de fechas, y totales según los filtros.
- **Registrar pago**: se elige el contrato y la cuota; si el monto supera el saldo de la cuota, el excedente se aplica solo a las siguientes.
- **Editar / eliminar** un pago (revierte el monto en la cuota y recalcula el estado del contrato).
- **Recibo imprimible** (también guardable como PDF) desde el listado y desde el detalle del contrato.
- **Carga inicial**: marca como pagadas las primeras cuotas de clientes que ya venían pagando antes del sistema.

## Publicar en línea (Netlify + Render + Atlas)

1. **Backend en Render** (Web Service): Root Directory `backend`, Build `npm install`, Start `npm start`.
   Variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=8h`, `CLIENT_URL=https://<tu-sitio>.netlify.app`.
2. **Frontend en Netlify**: Base directory `frontend`, Build `npm run build`, Publish `dist`.
   Variable: `VITE_API_URL=https://<tu-backend>.onrender.com/api` (se define ANTES de construir).
3. En Atlas → Network Access debe estar `0.0.0.0/0`.
