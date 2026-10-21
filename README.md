# Hotel Antigua Miraflores — Sistema de Gestión Hotelera

Sistema web para la gestión del Hotel Antigua Miraflores: página pública con **chatbot** y **WhatsApp**, encuesta de satisfacción, login por roles y un panel de administración con reservas, huéspedes, habitaciones, pagos, incidencias, promociones, encuestas y reportes.

- **Frontend:** HTML, CSS y JavaScript (sin frameworks).
- **Backend:** Node.js + Express.
- **Base de datos:** SQLite (archivo `hotel.db`). Los datos **se conservan** entre reinicios.

## Requisitos

- **Node.js 22.5 o superior** (recomendado Node 22 LTS o 24). No requiere compilar nada ni instalar herramientas de C++.

## Instalación y ejecución

1. Coloca todos los archivos en una misma carpeta.
2. Instala las dependencias (solo Express y CORS, sin compilación):

   ```bash
   npm install
   ```

3. Inicia el servidor:

   ```bash
   npm start
   ```

4. Abre en el navegador:

   - Página del hotel (chatbot + encuesta): `http://localhost:3000/index.html`
   - Panel de administración: `http://localhost:3000/admin.html`

> **Importante:** abre las páginas desde `http://localhost:3000/...` con el servidor encendido. No funciona con doble clic al archivo (`file://`), porque el frontend consulta la API.

### Si la instalación falló antes (error de better-sqlite3 / Visual Studio)

Esta versión ya **no usa** `better-sqlite3`, así que ese error desaparece. Si te quedó una instalación a medias, límpiala así (en la carpeta del proyecto):

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json
npm install

# macOS / Linux
rm -rf node_modules package-lock.json
npm install
```

### Sobre la base de datos

- Usa el **SQLite integrado de Node.js** (módulo `node:sqlite`), disponible desde Node 22.5. **No hay que instalar ningún paquete extra ni compilar nada.**
- Al iniciar por primera vez se crea el archivo **`hotel.db`** y se carga con datos de prueba.
- Para **reiniciar los datos** a cero, basta con **borrar `hotel.db`** y volver a ejecutar `npm start`.

## Usuarios de prueba

| Usuario | Contraseña | Rol            |
|---------|-----------|----------------|
| Alvaro  | Alvaro123 | Administrador  |
| Andrea  | Andrea123 | Administrador  |
| Maria   | Maria123  | Recepcionista  |
| Carmen  | Carmen123 | Recepcionista  |
| Pedro   | Pedro123  | Mantenimiento  |
| Luis    | Luis123   | Mantenimiento  |

En el login puedes hacer clic en los usuarios de demostración para autocompletar.

## Chatbot con IA y WhatsApp (página principal)

En la esquina inferior derecha del sitio hay dos botones flotantes:

- **WhatsApp** → abre un chat con el número **+51 946 234 126** con un mensaje predefinido.
- **Asistente virtual (chatbot con IA)** → es un chatbot conversacional impulsado por la **API de Claude (Anthropic)**. Entiende lenguaje natural y, sin iniciar sesión, puede:
  - Responder sobre el hotel, **promociones** y **habitaciones/precios** (consulta datos reales de la base mediante *tool use*; no inventa precios).
  - Verificar **disponibilidad** por fechas.
  - **Hacer una reserva** completa: pide los datos en una conversación natural, la crea en el sistema y entrega el **código de reserva** con un botón para confirmar por WhatsApp.

Las reservas creadas por el chatbot aparecen en el panel con la etiqueta **"Web"**.

### Activar el chatbot con IA (API key)

El chatbot necesita una clave de la API de Anthropic:

1. Entra a **https://console.anthropic.com** → **API Keys** → crea una clave (empieza con `sk-ant-...`).
2. En la carpeta del proyecto, **copia el archivo `.env.example` y renómbralo a `.env`**.
3. Abre `.env` y pega tu clave en `ANTHROPIC_API_KEY=`.
4. Ejecuta `npm start`. Al iniciar verás el mensaje **"Chatbot con IA: ACTIVADO"**.

> El modelo por defecto es **Claude Haiku 4.5** (rápido y de bajo costo), ideal para un chatbot. Puedes cambiarlo en `.env` con `ANTHROPIC_MODEL`.
>
> Si no configuras la clave, todo lo demás funciona igual; el chatbot simplemente invitará a escribir por WhatsApp en lugar de responder con IA.

## Encuesta de satisfacción

La completa el huésped desde la sección **"Encuesta"** de la página principal, sin login, con su **código de huésped** (ej. `HSP-001`) o de **reserva** (ej. `RES-001`). Una sola respuesta por persona.

## Roles y permisos (resumen)

- **Administrador:** acceso completo. Gestiona usuarios (sin eliminarse a sí mismo; pide contraseña actual para cambiarla), tipos, promociones, reportes y elimina reservas canceladas.
- **Recepcionista:** reservas, huéspedes, habitaciones, incidencias (crear y resolver) y encuestas. No ve usuarios, tipos, promociones ni reportes; no edita precios.
- **Mantenimiento:** sin dashboard. Disponibilidad, habitaciones (cambia estado disponible ↔ mantenimiento), huéspedes (lectura), reservas (sin montos) e incidencias (solo marcar resueltas).

## Archivos del proyecto

- `index.html` — Página pública del hotel + chatbot + WhatsApp + encuesta.
- `login.html` — Inicio de sesión por roles (con splash de ingreso).
- `admin.html` — Panel de administración (con splash de carga por perfil).
- `server.js` — API REST (Express). Capa HTTP delgada.
- `db.js` — Base de datos SQLite: esquema, datos de prueba y toda la lógica.
- `chatbot.js` — Cerebro del chatbot con IA (API de Claude + herramientas sobre la base).
- `.env.example` — Plantilla para tu API key (renómbrala a `.env`).
- `package.json` — Dependencias y scripts.
- `hotel.db` — Archivo de base de datos (se crea solo al ejecutar; no hace falta incluirlo al compartir).

## Pasar a SQL Server o AWS (opcional)

El código de acceso a datos está aislado en `db.js` con SQL estándar. Para usar **SQL Server** se cambia el conector por `mssql` y se ajusta la sintaxis de algunas consultas; para **AWS** se puede desplegar el backend en EC2/Elastic Beanstalk y usar **RDS** (SQL Server, MySQL o PostgreSQL). La estructura de tablas ya está definida en `db.js`.

## Notas

- El envío de correos y la pasarela de pago están simulados (no usan servicios externos reales).
- Al compartir el proyecto no es necesario incluir `node_modules/` ni `hotel.db` (se generan con `npm install` y al ejecutar).
