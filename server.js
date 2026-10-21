/**
 * Hotel Antigua Miraflores — API REST (Express)
 * La lógica y la persistencia viven en db.js (SQLite). Este archivo solo expone
 * los endpoints HTTP y traduce los errores del "store" a respuestas JSON.
 */

// Carga sencilla de variables desde un archivo .env (sin dependencias).
const fs = require('fs');
try {
  const envPath = require('path').join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
} catch (e) {}

const express = require('express');
const cors = require('cors');
const store = require('./db');
const { chat } = require('./chatbot');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Envuelve un handler y traduce errores {status,tipo} a JSON
const h = (fn) => (req, res) => {
  try {
    const out = fn(req, res);
    if (out !== undefined) res.json(out);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Error interno', tipo: e.tipo });
  }
};

// ─── AUTH ───
app.post('/api/login', h((req) => ({ success: true, user: store.login(req.body.username, req.body.password) })));

// ─── HUÉSPEDES ───
app.get('/api/huespedes', h((req) => store.huespedesList(req.query.search)));
app.get('/api/huespedes/:id', h((req) => store.huespedGet(+req.params.id)));
app.get('/api/huespedes/:id/historial', h((req) => store.huespedHistorial(+req.params.id)));
app.post('/api/huespedes', h((req, res) => { res.status(201); return store.huespedCreate(req.body, req.query.force === 'true'); }));
app.put('/api/huespedes/:id', h((req) => store.huespedUpdate(+req.params.id, req.body)));
app.delete('/api/huespedes/:id', h((req) => store.huespedRemove(+req.params.id)));

// ─── TIPOS ───
app.get('/api/tipos-habitacion', h(() => store.tiposList()));
app.post('/api/tipos-habitacion', h((req, res) => { res.status(201); return store.tipoCreate(req.body); }));
app.put('/api/tipos-habitacion/:id', h((req) => store.tipoUpdate(+req.params.id, req.body)));
app.delete('/api/tipos-habitacion/:id', h((req) => store.tipoRemove(+req.params.id)));

// ─── HABITACIONES ───
app.get('/api/habitaciones', h((req) => store.habitacionesList(req.query)));
app.post('/api/habitaciones', h((req, res) => { res.status(201); return store.habitacionCreate(req.body); }));
app.put('/api/habitaciones/:id/estado', h((req) => store.habitacionEstado(+req.params.id, req.body.estado)));
app.put('/api/habitaciones/:id', h((req) => store.habitacionUpdate(+req.params.id, req.body)));

// ─── RESERVAS ───
app.get('/api/reservas', h((req) => store.reservasList(req.query)));
app.get('/api/reservas/:id', h((req) => store.reservaGet(+req.params.id)));
app.post('/api/reservas', h((req, res) => { res.status(201); return store.reservaCreate(req.body); }));
app.put('/api/reservas/:id/cancelar', h((req) => store.reservaCancelar(+req.params.id)));
app.put('/api/reservas/:id/finalizar', h((req) => store.reservaFinalizar(+req.params.id)));
app.delete('/api/reservas/:id', h((req) => store.reservaRemove(+req.params.id)));
app.post('/api/reservas/:id/consumos', h((req, res) => { res.status(201); return store.consumoAdd(+req.params.id, req.body); }));
app.post('/api/reservas/:id/pagos', h((req, res) => { res.status(201); return store.pagoAdd(+req.params.id, req.body); }));

// ─── USUARIOS ───
app.get('/api/usuarios', h(() => store.usuariosList()));
app.post('/api/usuarios', h((req, res) => { res.status(201); return store.usuarioCreate(req.body); }));
app.put('/api/usuarios/:id', h((req) => store.usuarioUpdate(+req.params.id, req.body)));
app.delete('/api/usuarios/:id', h((req) => store.usuarioRemove(+req.params.id, req.query.solicitante)));

// ─── INCIDENCIAS ───
app.get('/api/incidencias', h(() => store.incidenciasList()));
app.post('/api/incidencias', h((req, res) => { res.status(201); return store.incidenciaCreate(req.body); }));
app.put('/api/incidencias/:id/resolver', h((req) => store.incidenciaResolver(+req.params.id)));
app.put('/api/incidencias/:id', h((req) => store.incidenciaUpdate(+req.params.id, req.body)));
app.delete('/api/incidencias/:id', h((req) => store.incidenciaRemove(+req.params.id)));

// ─── PROMOCIONES ───
app.get('/api/promociones', h(() => store.promocionesList()));
app.post('/api/promociones', h((req, res) => { res.status(201); return store.promocionCreate(req.body); }));
app.put('/api/promociones/:id', h((req) => store.promocionUpdate(+req.params.id, req.body)));
app.delete('/api/promociones/:id', h((req) => store.promocionRemove(+req.params.id)));

// ─── ENCUESTAS ───
app.get('/api/encuestas', h(() => store.encuestasList()));
app.get('/api/public/huesped/:codigo', h((req) => store.publicHuesped(req.params.codigo)));
app.post('/api/public/encuesta', h((req, res) => { res.status(201); return store.publicEncuesta(req.body); }));

// ─── CHATBOT con IA (reserva rápida pública incluida vía tool use) ───
app.post('/api/public/reserva-rapida', h((req, res) => { res.status(201); return store.reservaRapida(req.body); }));
app.post('/api/public/chat', async (req, res) => {
  try {
    const out = await chat(req.body.messages || []);
    res.json(out);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Error en el asistente', tipo: 'chat' });
  }
});

// ─── REPORTES ───
app.get('/api/reportes/ingresos', h((req) => store.reporteIngresos(req.query)));
app.get('/api/reportes/dashboard', h(() => store.reporteDashboard()));

// ─── START ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Hotel Antigua Miraflores — Sistema de Gestión`);
  console.log(`🗄️  Base de datos: SQLite (${store.driver}) → archivo hotel.db`);
  console.log(`📡 Servidor: http://localhost:${PORT}`);
  console.log(`\n📋 Credenciales de prueba:`);
  console.log(`   Admin         → Alvaro / Alvaro123`);
  console.log(`   Recepción     → Maria / Maria123`);
  console.log(`   Mantenimiento → Pedro / Pedro123`);
  console.log(`\n🌐 Panel:    http://localhost:${PORT}/admin.html`);
  console.log(`🏨 Web/Chatbot/Encuesta: http://localhost:${PORT}/index.html`);
  console.log(process.env.ANTHROPIC_API_KEY
    ? `🤖 Chatbot con IA: ACTIVADO (modelo ${process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'})\n`
    : `🤖 Chatbot con IA: sin configurar (define ANTHROPIC_API_KEY en el archivo .env para activarlo)\n`);
});
