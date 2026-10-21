/**
 * Capa de base de datos (SQLite) para el Hotel Antigua Miraflores.
 *
 * Usa `better-sqlite3` si está instalado (recomendado, funciona en cualquier
 * versión de Node). Si no está disponible, usa el SQLite integrado de Node 22.5+
 * (`node:sqlite`). Ambos comparten casi la misma API (prepare/run/get/all/exec).
 *
 * La base se guarda en el archivo `hotel.db` (persistente entre reinicios).
 */

const path = require('path');
const DB_FILE = process.env.HOTEL_DB || path.join(__dirname, 'hotel.db');

// ─── Adaptador: better-sqlite3 ó node:sqlite ────────────────────────────────
let db;
let driver = '';
try {
  // Motor principal: SQLite integrado en Node 22.5+ (no requiere instalar nada)
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);
  driver = 'node:sqlite (integrado)';
} catch (e) {
  try {
    // Alternativa: better-sqlite3 si alguien lo instaló manualmente
    const Database = require('better-sqlite3');
    db = new Database(DB_FILE);
    driver = 'better-sqlite3';
  } catch (e2) {
    console.error('\n❌ No se encontró un motor SQLite.');
    console.error('   Usa Node.js 22.5 o superior (incluye SQLite integrado).');
    console.error('   Tu versión actual de Node es: ' + process.version + '\n');
    throw e;
  }
}
try { db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;'); } catch (e) {}

// ─── Esquema ────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY, nombre TEXT, apellido TEXT, email TEXT UNIQUE,
  password TEXT, rol TEXT, activo INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS huespedes (
  id INTEGER PRIMARY KEY, nombre TEXT, apellido TEXT, documento TEXT,
  tipo_documento TEXT, email TEXT, telefono TEXT, nacionalidad TEXT,
  codigo TEXT, fecha_registro TEXT
);
CREATE TABLE IF NOT EXISTS tipos_habitacion (
  id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT,
  precio_noche REAL, capacidad INTEGER
);
CREATE TABLE IF NOT EXISTS habitaciones (
  id INTEGER PRIMARY KEY, numero TEXT, tipo_id INTEGER, piso INTEGER,
  estado TEXT, descripcion TEXT
);
CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY, huesped_id INTEGER, codigo TEXT,
  fecha_entrada TEXT, fecha_salida TEXT, estado TEXT,
  total REAL DEFAULT 0, pagado REAL DEFAULT 0, fecha_creacion TEXT,
  origen TEXT DEFAULT 'recepcion'
);
CREATE TABLE IF NOT EXISTS reserva_habitaciones (
  reserva_id INTEGER, habitacion_id INTEGER
);
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY, reserva_id INTEGER, monto REAL, metodo TEXT,
  fecha TEXT, nota TEXT, diferencia REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS consumos (
  id INTEGER PRIMARY KEY, reserva_id INTEGER, descripcion TEXT,
  monto REAL, categoria TEXT, fecha TEXT
);
CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY, habitacion_id INTEGER, descripcion TEXT,
  prioridad TEXT, estado TEXT, fecha TEXT
);
CREATE TABLE IF NOT EXISTS promociones (
  id INTEGER PRIMARY KEY, nombre TEXT, descuento INTEGER, tipo_id INTEGER,
  fecha_inicio TEXT, fecha_fin TEXT, descripcion TEXT, activa INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS encuestas (
  id INTEGER PRIMARY KEY, huesped_id INTEGER, codigo_huesped TEXT,
  huesped_nombre TEXT, reserva_id INTEGER, limpieza INTEGER, atencion INTEGER,
  instalaciones INTEGER, comentario TEXT, promedio TEXT, fecha TEXT
);
`);

// ─── Semilla (solo si la base está vacía) ───────────────────────────────────
function seed() {
  const count = db.prepare('SELECT COUNT(*) c FROM usuarios').get().c;
  if (count > 0) return;

  const ins = (sql, rows) => { const st = db.prepare(sql); rows.forEach(r => st.run(...r)); };

  ins(`INSERT INTO usuarios (id,nombre,apellido,email,password,rol,activo) VALUES (?,?,?,?,?,?,?)`, [
    [1,'Alvaro','Admin','admin@antigua.com','Alvaro123','administrador',1],
    [2,'Maria','Recepcion','recepcion@antigua.com','Maria123','recepcionista',1],
    [3,'Pedro','Mantenimiento','mantenimiento@antigua.com','Pedro123','mantenimiento',1],
    [4,'Carmen','Salas','carmen@antigua.com','Carmen123','recepcionista',1],
    [5,'Luis','Vega','luis@antigua.com','Luis123','mantenimiento',1],
    [6,'Andrea','Ruiz','andrea@antigua.com','Andrea123','administrador',1],
    [7,'Jorge','Pinto','jorge@antigua.com','Jorge123','recepcionista',0]
  ]);

  ins(`INSERT INTO huespedes (id,nombre,apellido,documento,tipo_documento,email,telefono,nacionalidad,codigo,fecha_registro) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
    [1,'Juan','Pérez','12345678','DNI','juan@email.com','987654321','Peruana','HSP-001','2026-01-15'],
    [2,'Ana','García','87654321','DNI','ana@email.com','912345678','Peruana','HSP-002','2026-02-10'],
    [3,'Carlos','Mendoza','45678912','DNI','carlos@email.com','998877665','Peruana','HSP-003','2026-02-20'],
    [4,'Lucía','Torres','78912345','DNI','lucia@email.com','955443322','Peruana','HSP-004','2026-03-05'],
    [5,'Roberto','Díaz','001234567','CE','roberto@email.com','933221100','Argentina','HSP-005','2026-03-18'],
    [6,'Sofía','Ramírez','32165498','DNI','sofia@email.com','977889900','Peruana','HSP-006','2026-04-01'],
    [7,'Diego','Flores','65498732','DNI','diego@email.com','944556677','Peruana','HSP-007','2026-04-22'],
    [8,'Valentina','Cruz','P1234567','Pasaporte','valentina@email.com','911223344','Chilena','HSP-008','2026-05-10'],
    [9,'Fernando','Salas','40404040','DNI','fernando@email.com','987112233','Peruana','HSP-009','2026-05-20'],
    [10,'Camila','Reyes','50505050','DNI','camila@email.com','987223344','Peruana','HSP-010','2026-05-28'],
    [11,'Martín','Rojas','60606060','DNI','martin@email.com','987334455','Peruana','HSP-011','2026-06-03'],
    [12,'Isabella','Fuentes','PA998877','Pasaporte','isabella@email.com','987445566','Colombiana','HSP-012','2026-06-09'],
    [13,'Thiago','Núñez','002556677','CE','thiago@email.com','987556677','Argentina','HSP-013','2026-06-15'],
    [14,'Renata','Campos','70701010','DNI','renata@email.com','987667788','Peruana','HSP-014','2026-06-22'],
    [15,'Mateo','Herrera','80802020','DNI','mateo@email.com','987778899','Peruana','HSP-015','2026-07-01']
  ]);

  ins(`INSERT INTO tipos_habitacion (id,nombre,descripcion,precio_noche,capacidad) VALUES (?,?,?,?,?)`, [
    [1,'Señorial','Junior suite con jacuzzi, kitchenette y vista al jardín',180,2],
    [2,'Colonial','Habitación deluxe en la antigua casona',130,2],
    [3,'Tradicional','Habitación estándar con arte local',90,2],
    [4,'Premium','Suite Premium exclusiva con terraza privada, jacuzzi y vista panorámica de Miraflores',320,4]
  ]);

  ins(`INSERT INTO habitaciones (id,numero,tipo_id,piso,estado,descripcion) VALUES (?,?,?,?,?,?)`, [
    [1,'101',1,1,'ocupada','Vista jardín, cama king'],
    [2,'102',1,1,'disponible','Vista jardín, dos queens'],
    [3,'103',2,1,'disponible','Casona, queen + twin'],
    [4,'104',3,1,'ocupada','Estándar, queen'],
    [5,'105',3,1,'disponible','Estándar, dos twins'],
    [6,'201',2,2,'disponible','Casona original, queen + twin'],
    [7,'202',2,2,'disponible','Casona original, queen + twin'],
    [8,'203',1,2,'mantenimiento','Suite con jacuzzi'],
    [9,'204',3,2,'disponible','Estándar, queen'],
    [10,'205',2,2,'disponible','Casona, dos twins'],
    [11,'301',3,3,'ocupada','Estándar superior, queen'],
    [12,'302',3,3,'disponible','Estándar superior, dos twins'],
    [13,'303',2,3,'disponible','Deluxe con balcón'],
    [14,'304',1,3,'ocupada','Suite vista ciudad'],
    [15,'305',3,3,'disponible','Estándar superior, king'],
    [16,'106',2,1,'disponible','Casona, cama king'],
    [17,'206',3,2,'disponible','Estándar, dos twins'],
    [18,'306',1,3,'disponible','Junior suite con vista al jardín'],
    [19,'401',4,4,'disponible','Suite Premium — terraza privada, jacuzzi y vista panorámica']
  ]);

  ins(`INSERT INTO reservas (id,huesped_id,codigo,fecha_entrada,fecha_salida,estado,total,pagado,fecha_creacion,origen) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
    [1,1,'RES-001','2026-06-01','2026-06-05','activa',475,180,'2026-05-20','recepcion'],
    [2,2,'RES-002','2026-05-28','2026-05-31','finalizada',390,390,'2026-05-25','recepcion'],
    [3,3,'RES-003','2026-06-10','2026-06-13','activa',540,540,'2026-06-05','recepcion'],
    [4,4,'RES-004','2026-05-20','2026-05-25','finalizada',690,690,'2026-05-15','recepcion'],
    [5,5,'RES-005','2026-06-15','2026-06-18','activa',270,100,'2026-06-10','recepcion'],
    [6,6,'RES-006','2026-04-10','2026-04-14','cancelada',720,0,'2026-04-01','recepcion'],
    [7,7,'RES-007','2026-05-29','2026-05-31','finalizada',180,180,'2026-05-27','recepcion'],
    [8,8,'RES-008','2026-06-20','2026-06-22','activa',360,360,'2026-06-12','recepcion'],
    [9,9,'RES-009','2026-03-10','2026-03-13','finalizada',390,390,'2026-03-08','recepcion'],
    [10,10,'RES-010','2026-03-20','2026-03-22','finalizada',180,180,'2026-03-19','recepcion'],
    [11,11,'RES-011','2026-04-05','2026-04-08','finalizada',540,540,'2026-04-02','recepcion'],
    [12,12,'RES-012','2026-04-15','2026-04-18','finalizada',960,960,'2026-04-10','recepcion'],
    [13,13,'RES-013','2026-05-02','2026-05-05','finalizada',390,390,'2026-04-28','recepcion'],
    [14,14,'RES-014','2026-05-12','2026-05-15','finalizada',270,270,'2026-05-09','recepcion'],
    [15,15,'RES-015','2026-06-02','2026-06-05','finalizada',960,960,'2026-05-29','recepcion'],
    [16,9,'RES-016','2026-06-14','2026-06-16','finalizada',360,360,'2026-06-11','recepcion'],
    [17,11,'RES-017','2026-07-01','2026-07-03','finalizada',260,260,'2026-06-27','recepcion']
  ]);

  ins(`INSERT INTO reserva_habitaciones (reserva_id,habitacion_id) VALUES (?,?)`, [
    [1,4],[2,6],[3,1],[4,13],[5,11],[6,2],[7,9],[8,14],
    [9,3],[10,5],[11,18],[12,19],[13,16],[14,17],[15,19],[16,18],[17,16]
  ]);

  ins(`INSERT INTO pagos (id,reserva_id,monto,metodo,fecha,nota,diferencia) VALUES (?,?,?,?,?,?,?)`, [
    [1,1,180,'tarjeta','2026-05-20','Adelanto 50% de la reserva',0],
    [2,2,390,'efectivo','2026-05-28','Pago total de la estadía',0],
    [3,3,540,'transferencia','2026-06-05','Pago completo por adelantado',0],
    [4,4,500,'tarjeta','2026-05-18','Adelanto de reserva',0],
    [5,4,190,'efectivo','2026-05-25','Saldo final + consumibles (bebidas y snacks)',0],
    [6,5,100,'yape','2026-06-10','Adelanto de reserva',0],
    [7,7,180,'efectivo','2026-05-29','Pago total de la estadía',0],
    [8,8,360,'tarjeta','2026-06-18','Pago completo por adelantado',0],
    [9,9,390,'transferencia','2026-03-10','Pago completo de la estadía',0],
    [10,10,180,'efectivo','2026-03-20','Pago total de la estadía',0],
    [11,11,540,'tarjeta','2026-04-05','Pago completo por adelantado',0],
    [12,12,960,'tarjeta','2026-04-15','Pago suite Premium (3 noches)',0],
    [13,13,390,'yape','2026-05-02','Pago total de la estadía',0],
    [14,14,270,'efectivo','2026-05-12','Pago total de la estadía',0],
    [15,15,960,'transferencia','2026-06-02','Pago suite Premium (3 noches)',0],
    [16,16,360,'tarjeta','2026-06-14','Pago completo de la estadía',0],
    [17,17,260,'efectivo','2026-07-01','Pago total de la estadía',0]
  ]);

  ins(`INSERT INTO consumos (id,reserva_id,descripcion,monto,categoria,fecha) VALUES (?,?,?,?,?,?)`, [
    [1,1,'Cena en el restaurante (2 personas)',80,'comida','2026-06-02'],
    [2,1,'Bebidas del minibar',35,'bebidas','2026-06-03'],
    [3,4,'Snacks y bebidas',40,'bebidas','2026-05-22']
  ]);

  ins(`INSERT INTO incidencias (id,habitacion_id,descripcion,prioridad,estado,fecha) VALUES (?,?,?,?,?,?)`, [
    [1,8,'El aire acondicionado no enfría','alta','pendiente','2026-05-29'],
    [2,5,'El grifo del baño gotea','media','pendiente','2026-05-30'],
    [3,12,'Bombilla quemada en el velador','baja','resuelta','2026-05-25']
  ]);

  ins(`INSERT INTO promociones (id,nombre,descuento,tipo_id,fecha_inicio,fecha_fin,descripcion,activa) VALUES (?,?,?,?,?,?,?,?)`, [
    [1,'Promo Temporada Baja',15,3,'','','Descuento en habitaciones Tradicional',1]
  ]);

  ins(`INSERT INTO encuestas (id,huesped_id,codigo_huesped,huesped_nombre,reserva_id,limpieza,atencion,instalaciones,comentario,promedio,fecha) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
    [1,2,'HSP-002','Ana García',2,5,5,4,'Todo excelente, el desayuno delicioso. Volveré.','4.7','2026-05-31'],
    [2,4,'HSP-004','Lucía Torres',4,4,5,5,'La casona es hermosa y el personal muy atento.','4.7','2026-05-26']
  ]);
}
seed();

// ─── Helpers ────────────────────────────────────────────────────────────────
const get = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);
const today = () => new Date().toISOString().split('T')[0];
const pad = (n) => String(n).padStart(3, '0');
const err = (status, error, tipo) => { const e = new Error(error); e.status = status; e.tipo = tipo; return e; };

function promoVigente(p) {
  if (!p.activa) return false;
  const h = today();
  if (p.fecha_inicio && h < p.fecha_inicio) return false;
  if (p.fecha_fin && h > p.fecha_fin) return false;
  return true;
}
function descuentoParaTipo(tipoId) {
  const promos = all('SELECT * FROM promociones').filter(promoVigente)
    .filter(p => p.tipo_id == null || +p.tipo_id === +tipoId);
  if (!promos.length) return { descuento: 0, promo: null };
  const mejor = promos.reduce((a, b) => (b.descuento > a.descuento ? b : a));
  return { descuento: mejor.descuento, promo: mejor.nombre };
}
function tipoConDescuento(tipo) {
  if (!tipo) return tipo;
  const { descuento, promo } = descuentoParaTipo(tipo.id);
  const precio_final = +(tipo.precio_noche * (1 - descuento / 100)).toFixed(2);
  return { ...tipo, descuento, promo_nombre: promo, precio_final };
}
function habitacionesDeReserva(reservaId) {
  return all('SELECT habitacion_id FROM reserva_habitaciones WHERE reserva_id = ?', reservaId).map(r => r.habitacion_id);
}
function detallarReserva(r) {
  const huesped = get('SELECT * FROM huespedes WHERE id = ?', r.huesped_id) || null;
  const ids = habitacionesDeReserva(r.id);
  const habitaciones = ids.map(hid => {
    const hab = get('SELECT * FROM habitaciones WHERE id = ?', hid);
    return hab ? { ...hab, tipo: tipoConDescuento(get('SELECT * FROM tipos_habitacion WHERE id = ?', hab.tipo_id)) } : null;
  }).filter(Boolean);
  const pagos = all('SELECT * FROM pagos WHERE reserva_id = ?', r.id);
  const consumos = all('SELECT * FROM consumos WHERE reserva_id = ?', r.id);
  return { ...r, habitaciones: ids, _habitaciones: habitaciones, huesped, pagos, consumos };
}
// Forma final que espera el frontend (habitaciones como objetos)
function detalleReservaPublico(r) {
  const d = detallarReserva(r);
  return { ...d, habitaciones: d._habitaciones, _habitaciones: undefined };
}
function habitacionesOcupadasEnRango(entrada, salida) {
  const set = new Set();
  all("SELECT id FROM reservas WHERE estado = 'activa' AND fecha_entrada < ? AND fecha_salida > ?", salida, entrada)
    .forEach(r => habitacionesDeReserva(r.id).forEach(id => set.add(id)));
  return set;
}

// ─── API de datos (store) ───────────────────────────────────────────────────
const store = {
  driver,

  login(username, password) {
    const u = get('SELECT * FROM usuarios WHERE (nombre = ? OR email = ?) AND password = ? AND activo = 1', username, username, password);
    if (!u) throw err(401, 'Credenciales incorrectas');
    const { password: _, ...safe } = u; safe.activo = !!u.activo;
    return safe;
  },

  // HUÉSPEDES
  huespedesList(search) {
    let list = all('SELECT * FROM huespedes ORDER BY id DESC');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(h => (h.nombre + ' ' + h.apellido).toLowerCase().includes(s) || h.documento.includes(search) || h.codigo.toLowerCase().includes(s));
    }
    return list;
  },
  huespedGet(id) {
    const h = get('SELECT * FROM huespedes WHERE id = ?', id);
    if (!h) throw err(404, 'Huésped no encontrado');
    const reservas = all('SELECT * FROM reservas WHERE huesped_id = ?', id);
    return { ...h, reservas };
  },
  huespedCreate(b, force) {
    let { nombre, apellido, documento, tipo_documento, email, telefono, nacionalidad } = b;
    const faltan = [];
    if (!nombre || !nombre.trim()) faltan.push('Nombre');
    if (!apellido || !apellido.trim()) faltan.push('Apellido');
    if (!tipo_documento || !tipo_documento.trim()) faltan.push('Tipo de documento');
    if (!documento || !documento.trim()) faltan.push('N° de documento');
    if (faltan.length) throw err(400, 'Faltan datos obligatorios: ' + faltan.join(', '), 'incompleto');
    nombre = nombre.trim(); apellido = apellido.trim(); documento = documento.trim();
    if (get('SELECT id FROM huespedes WHERE lower(documento) = lower(?)', documento))
      throw err(409, 'Ya existe un huésped registrado con el documento ' + documento, 'duplicado');
    const mismo = get('SELECT * FROM huespedes WHERE lower(nombre) = lower(?) AND lower(apellido) = lower(?)', nombre, apellido);
    if (mismo && !force)
      throw err(409, `Ya existe un huésped llamado "${nombre} ${apellido}" (${mismo.codigo}, doc. ${mismo.documento}). ¿Deseas registrarlo de todas formas?`, 'duplicado_nombre');
    const info = run('INSERT INTO huespedes (nombre,apellido,documento,tipo_documento,email,telefono,nacionalidad,codigo,fecha_registro) VALUES (?,?,?,?,?,?,?,?,?)',
      nombre, apellido, documento, tipo_documento, email || '', telefono || '', nacionalidad || '', 'TMP', today());
    const id = Number(info.lastInsertRowid);
    run('UPDATE huespedes SET codigo = ? WHERE id = ?', 'HSP-' + pad(id), id);
    return get('SELECT * FROM huespedes WHERE id = ?', id);
  },
  huespedUpdate(id, b) {
    const h = get('SELECT * FROM huespedes WHERE id = ?', id);
    if (!h) throw err(404, 'Huésped no encontrado');
    if (!b.nombre || !b.apellido || !b.documento) throw err(400, 'Faltan datos obligatorios', 'incompleto');
    if (get('SELECT id FROM huespedes WHERE documento = ? AND id != ?', b.documento, id))
      throw err(409, 'Ese documento ya existe en otro huésped', 'duplicado');
    run('UPDATE huespedes SET nombre=?,apellido=?,documento=?,tipo_documento=?,email=?,telefono=?,nacionalidad=? WHERE id=?',
      b.nombre, b.apellido, b.documento, b.tipo_documento, b.email, b.telefono, b.nacionalidad, id);
    return get('SELECT * FROM huespedes WHERE id = ?', id);
  },
  huespedRemove(id) {
    const h = get('SELECT * FROM huespedes WHERE id = ?', id);
    if (!h) throw err(404, 'Huésped no encontrado');
    const ra = get("SELECT * FROM reservas WHERE huesped_id = ? AND estado = 'activa'", id);
    if (ra) throw err(409, 'No se puede eliminar: el huésped tiene una reserva activa (' + ra.codigo + ')', 'bloqueado');
    run('DELETE FROM huespedes WHERE id = ?', id);
    return { success: true };
  },
  huespedHistorial(id) {
    return all('SELECT * FROM reservas WHERE huesped_id = ?', id).map(r => {
      const habitaciones = habitacionesDeReserva(r.id).map(hid => get('SELECT * FROM habitaciones WHERE id = ?', hid)).filter(Boolean);
      const pagos = all('SELECT * FROM pagos WHERE reserva_id = ?', r.id);
      return { ...r, habitaciones, pagos };
    });
  },

  // TIPOS
  tiposList() { return all('SELECT * FROM tipos_habitacion ORDER BY id').map(tipoConDescuento); },
  tipoCreate(b) {
    if (!b.nombre || !b.precio_noche) throw err(400, 'Nombre y precio son obligatorios', 'incompleto');
    const info = run('INSERT INTO tipos_habitacion (nombre,descripcion,precio_noche,capacidad) VALUES (?,?,?,?)',
      b.nombre, b.descripcion || '', +b.precio_noche, b.capacidad || 2);
    return tipoConDescuento(get('SELECT * FROM tipos_habitacion WHERE id = ?', Number(info.lastInsertRowid)));
  },
  tipoUpdate(id, b) {
    if (!get('SELECT id FROM tipos_habitacion WHERE id = ?', id)) throw err(404, 'Tipo no encontrado');
    run('UPDATE tipos_habitacion SET nombre=?,descripcion=?,precio_noche=?,capacidad=? WHERE id=?',
      b.nombre, b.descripcion, +b.precio_noche, b.capacidad, id);
    return tipoConDescuento(get('SELECT * FROM tipos_habitacion WHERE id = ?', id));
  },
  tipoRemove(id) {
    if (get('SELECT id FROM habitaciones WHERE tipo_id = ?', id)) throw err(409, 'Este tipo tiene habitaciones asignadas');
    run('DELETE FROM tipos_habitacion WHERE id = ?', id);
    return { success: true };
  },

  // HABITACIONES
  habitacionesList({ estado, tipo_id, fecha_entrada, fecha_salida } = {}) {
    let list = all('SELECT * FROM habitaciones ORDER BY numero').map(h => ({ ...h, tipo: tipoConDescuento(get('SELECT * FROM tipos_habitacion WHERE id = ?', h.tipo_id)) }));
    if (estado) list = list.filter(h => h.estado === estado);
    if (tipo_id) list = list.filter(h => +h.tipo_id === +tipo_id);
    if (fecha_entrada && fecha_salida) {
      const ocup = habitacionesOcupadasEnRango(fecha_entrada, fecha_salida);
      list = list.map(h => {
        let e = h.estado === 'mantenimiento' ? 'mantenimiento' : (ocup.has(h.id) ? 'ocupada' : 'disponible');
        return { ...h, estado_rango: e, disponible_rango: e === 'disponible' };
      });
    }
    return list;
  },
  habitacionCreate(b) {
    if (!b.numero || !b.tipo_id) throw err(400, 'Número y tipo son obligatorios', 'incompleto');
    if (get('SELECT id FROM habitaciones WHERE numero = ?', b.numero)) throw err(409, 'Ya existe una habitación con ese número', 'duplicado');
    const tipo = get('SELECT * FROM tipos_habitacion WHERE id = ?', +b.tipo_id);
    if (!tipo) throw err(400, 'Tipo de habitación inválido');
    const info = run('INSERT INTO habitaciones (numero,tipo_id,piso,estado,descripcion) VALUES (?,?,?,?,?)',
      b.numero, +b.tipo_id, +b.piso || 1, b.estado || 'disponible', b.descripcion || '');
    const h = get('SELECT * FROM habitaciones WHERE id = ?', Number(info.lastInsertRowid));
    return { ...h, tipo: tipoConDescuento(tipo) };
  },
  habitacionUpdate(id, b) {
    if (!get('SELECT id FROM habitaciones WHERE id = ?', id)) throw err(404, 'Habitación no encontrada');
    if (get('SELECT id FROM habitaciones WHERE numero = ? AND id != ?', b.numero, id)) throw err(409, 'Ese número ya existe en otra habitación', 'duplicado');
    run('UPDATE habitaciones SET numero=?,tipo_id=?,piso=?,estado=?,descripcion=? WHERE id=?',
      b.numero, +b.tipo_id, +b.piso, b.estado, b.descripcion, id);
    return get('SELECT * FROM habitaciones WHERE id = ?', id);
  },
  habitacionEstado(id, estado) {
    const h = get('SELECT * FROM habitaciones WHERE id = ?', id);
    if (!h) throw err(404, 'Habitación no encontrada');
    if (!['disponible', 'mantenimiento'].includes(estado)) throw err(400, 'Estado inválido. Solo se permite disponible o mantenimiento.');
    if (h.estado === 'ocupada') throw err(409, `La habitación ${h.numero} está ocupada por un huésped; no se puede poner en mantenimiento.`, 'bloqueado');
    run('UPDATE habitaciones SET estado = ? WHERE id = ?', estado, id);
    return get('SELECT * FROM habitaciones WHERE id = ?', id);
  },

  // RESERVAS
  reservasList({ estado, huesped_id } = {}) {
    let rows = all('SELECT * FROM reservas ORDER BY id');
    if (estado) rows = rows.filter(r => r.estado === estado);
    if (huesped_id) rows = rows.filter(r => +r.huesped_id === +huesped_id);
    return rows.map(detalleReservaPublico);
  },
  reservaGet(id) {
    const r = get('SELECT * FROM reservas WHERE id = ?', id);
    if (!r) throw err(404, 'Reserva no encontrada');
    return detalleReservaPublico(r);
  },
  reservaCreate(b) {
    const { huesped_id, fecha_entrada, fecha_salida, habitaciones_ids } = b;
    if (!huesped_id || !fecha_entrada || !fecha_salida || !habitaciones_ids || !habitaciones_ids.length)
      throw err(400, 'Faltan datos obligatorios', 'incompleto');
    if (fecha_entrada >= fecha_salida) throw err(400, 'La fecha de salida debe ser mayor a la de entrada');
    if (!get('SELECT id FROM huespedes WHERE id = ?', huesped_id)) throw err(404, 'Huésped no encontrado');
    const noches = Math.ceil((new Date(fecha_salida) - new Date(fecha_entrada)) / 86400000);
    const ocup = habitacionesOcupadasEnRango(fecha_entrada, fecha_salida);
    let total = 0;
    for (const hid of habitaciones_ids) {
      const hab = get('SELECT * FROM habitaciones WHERE id = ?', hid);
      if (!hab) throw err(400, `Habitación ${hid} no existe`);
      if (hab.estado === 'mantenimiento') throw err(409, `La habitación ${hab.numero} está en mantenimiento`);
      if (ocup.has(hid)) throw err(409, `La habitación ${hab.numero} ya está reservada para esas fechas`, 'duplicado');
      total += tipoConDescuento(get('SELECT * FROM tipos_habitacion WHERE id = ?', hab.tipo_id)).precio_final * noches;
    }
    const info = run('INSERT INTO reservas (huesped_id,codigo,fecha_entrada,fecha_salida,estado,total,pagado,fecha_creacion,origen) VALUES (?,?,?,?,?,?,?,?,?)',
      +huesped_id, 'TMP', fecha_entrada, fecha_salida, 'activa', +total.toFixed(2), 0, today(), b.origen || 'recepcion');
    const id = Number(info.lastInsertRowid);
    run('UPDATE reservas SET codigo = ? WHERE id = ?', 'RES-' + pad(id), id);
    // Marca la habitación como ocupada solo si la reserva incluye el día de hoy
    const hoy = today();
    const ocupaHoy = fecha_entrada <= hoy && hoy < fecha_salida;
    habitaciones_ids.forEach(hid => {
      run('INSERT INTO reserva_habitaciones (reserva_id,habitacion_id) VALUES (?,?)', id, hid);
      if (ocupaHoy) run("UPDATE habitaciones SET estado = 'ocupada' WHERE id = ?", hid);
    });
    return get('SELECT * FROM reservas WHERE id = ?', id);
  },
  reservaCancelar(id) {
    const r = get('SELECT * FROM reservas WHERE id = ?', id);
    if (!r) throw err(404, 'Reserva no encontrada');
    if (r.estado !== 'activa') throw err(400, 'Solo se pueden cancelar reservas activas');
    run("UPDATE reservas SET estado = 'cancelada' WHERE id = ?", id);
    habitacionesDeReserva(id).forEach(hid => run("UPDATE habitaciones SET estado = 'disponible' WHERE id = ?", hid));
    return get('SELECT * FROM reservas WHERE id = ?', id);
  },
  reservaFinalizar(id) {
    const r = get('SELECT * FROM reservas WHERE id = ?', id);
    if (!r) throw err(404, 'Reserva no encontrada');
    if (r.estado !== 'activa') throw err(400, 'Solo se pueden finalizar reservas activas');
    run("UPDATE reservas SET estado = 'finalizada' WHERE id = ?", id);
    habitacionesDeReserva(id).forEach(hid => run("UPDATE habitaciones SET estado = 'disponible' WHERE id = ?", hid));
    return get('SELECT * FROM reservas WHERE id = ?', id);
  },
  reservaRemove(id) {
    const r = get('SELECT * FROM reservas WHERE id = ?', id);
    if (!r) throw err(404, 'Reserva no encontrada');
    if (r.estado !== 'cancelada') throw err(409, 'Solo se pueden eliminar reservas canceladas', 'bloqueado');
    run('DELETE FROM reservas WHERE id = ?', id);
    run('DELETE FROM reserva_habitaciones WHERE reserva_id = ?', id);
    run('DELETE FROM pagos WHERE reserva_id = ?', id);
    run('DELETE FROM consumos WHERE reserva_id = ?', id);
    return { success: true };
  },

  // CONSUMOS
  consumoAdd(reservaId, b) {
    const r = get('SELECT * FROM reservas WHERE id = ?', reservaId);
    if (!r) throw err(404, 'Reserva no encontrada');
    if (!b.descripcion || !b.monto) throw err(400, 'Descripción y monto son obligatorios', 'incompleto');
    const info = run('INSERT INTO consumos (reserva_id,descripcion,monto,categoria,fecha) VALUES (?,?,?,?,?)',
      reservaId, b.descripcion, +b.monto, b.categoria || 'otros', today());
    run('UPDATE reservas SET total = ? WHERE id = ?', +(r.total + +b.monto).toFixed(2), reservaId);
    return get('SELECT * FROM consumos WHERE id = ?', Number(info.lastInsertRowid));
  },

  // PAGOS
  pagoAdd(reservaId, b) {
    const r = get('SELECT * FROM reservas WHERE id = ?', reservaId);
    if (!r) throw err(404, 'Reserva no encontrada');
    if (!b.monto || !b.metodo) throw err(400, 'Monto y método son obligatorios', 'incompleto');
    if (!b.nota || !b.nota.trim()) throw err(400, 'Debes registrar una nota o motivo del pago (ej: adelanto, saldo, consumibles, cargo extra)', 'nota_requerida');
    const nuevoPagado = +(r.pagado + +b.monto).toFixed(2);
    const diferencia = +(nuevoPagado - r.total).toFixed(2);
    const info = run('INSERT INTO pagos (reserva_id,monto,metodo,fecha,nota,diferencia) VALUES (?,?,?,?,?,?)',
      reservaId, +b.monto, b.metodo, today(), b.nota.trim(), diferencia > 0 ? diferencia : 0);
    run('UPDATE reservas SET pagado = ? WHERE id = ?', nuevoPagado, reservaId);
    return get('SELECT * FROM pagos WHERE id = ?', Number(info.lastInsertRowid));
  },

  // USUARIOS
  usuariosList() { return all('SELECT id,nombre,apellido,email,rol,activo FROM usuarios ORDER BY id').map(u => ({ ...u, activo: !!u.activo })); },
  usuarioCreate(b) {
    if (!b.nombre || !b.email || !b.password || !b.rol) throw err(400, 'Faltan datos obligatorios', 'incompleto');
    if (get('SELECT id FROM usuarios WHERE email = ?', b.email)) throw err(409, 'Ya existe un usuario con ese email', 'duplicado');
    const info = run('INSERT INTO usuarios (nombre,apellido,email,password,rol,activo) VALUES (?,?,?,?,?,1)',
      b.nombre, b.apellido || '', b.email, b.password, b.rol);
    const u = get('SELECT id,nombre,apellido,email,rol,activo FROM usuarios WHERE id = ?', Number(info.lastInsertRowid));
    return { ...u, activo: !!u.activo };
  },
  usuarioUpdate(id, b) {
    const u = get('SELECT * FROM usuarios WHERE id = ?', id);
    if (!u) throw err(404, 'Usuario no encontrado');
    if (b.password && b.password.trim()) {
      if (!b.password_actual || b.password_actual !== u.password) throw err(403, 'La contraseña actual no es correcta', 'password');
      run('UPDATE usuarios SET password = ? WHERE id = ?', b.password, id);
    }
    run('UPDATE usuarios SET nombre=?,apellido=?,email=?,rol=?,activo=? WHERE id=?',
      b.nombre, b.apellido, b.email, b.rol, b.activo ? 1 : 0, id);
    const r = get('SELECT id,nombre,apellido,email,rol,activo FROM usuarios WHERE id = ?', id);
    return { ...r, activo: !!r.activo };
  },
  usuarioRemove(id, solicitante) {
    if (!get('SELECT id FROM usuarios WHERE id = ?', id)) throw err(404, 'Usuario no encontrado');
    if (solicitante && +solicitante === +id) throw err(409, 'No puedes eliminar tu propio usuario', 'bloqueado');
    run('DELETE FROM usuarios WHERE id = ?', id);
    return { success: true };
  },

  // INCIDENCIAS
  incidenciasList() { return all('SELECT * FROM incidencias ORDER BY id'); },
  incidenciaCreate(b) {
    if (!b.habitacion_id || !b.descripcion || !b.descripcion.trim()) throw err(400, 'Habitación y descripción son obligatorios', 'incompleto');
    const info = run('INSERT INTO incidencias (habitacion_id,descripcion,prioridad,estado,fecha) VALUES (?,?,?,?,?)',
      +b.habitacion_id, b.descripcion.trim(), b.prioridad || 'media', 'pendiente', today());
    return get('SELECT * FROM incidencias WHERE id = ?', Number(info.lastInsertRowid));
  },
  incidenciaResolver(id) {
    if (!get('SELECT id FROM incidencias WHERE id = ?', id)) throw err(404, 'Incidencia no encontrada');
    run("UPDATE incidencias SET estado = 'resuelta' WHERE id = ?", id);
    return get('SELECT * FROM incidencias WHERE id = ?', id);
  },
  incidenciaUpdate(id, b) {
    if (!get('SELECT id FROM incidencias WHERE id = ?', id)) throw err(404, 'Incidencia no encontrada');
    if (!b.habitacion_id || !b.descripcion || !b.descripcion.trim()) throw err(400, 'Faltan datos obligatorios: Habitación y Descripción', 'incompleto');
    run('UPDATE incidencias SET habitacion_id=?,descripcion=?,prioridad=COALESCE(?,prioridad),estado=COALESCE(?,estado) WHERE id=?',
      +b.habitacion_id, b.descripcion.trim(), b.prioridad || null, b.estado || null, id);
    return get('SELECT * FROM incidencias WHERE id = ?', id);
  },
  incidenciaRemove(id) {
    if (!get('SELECT id FROM incidencias WHERE id = ?', id)) throw err(404, 'Incidencia no encontrada');
    run('DELETE FROM incidencias WHERE id = ?', id);
    return { success: true };
  },

  // PROMOCIONES
  promocionesList() {
    return all('SELECT * FROM promociones ORDER BY id').map(p => ({
      ...p, activa: !!p.activa,
      tipo_nombre: p.tipo_id ? (get('SELECT nombre FROM tipos_habitacion WHERE id = ?', p.tipo_id) || {}).nombre : 'Todas las habitaciones',
      vigente: promoVigente(p)
    }));
  },
  promocionCreate(b) {
    if (!b.nombre || !b.descuento) throw err(400, 'Nombre y descuento son obligatorios', 'incompleto');
    if (+b.descuento < 1 || +b.descuento > 100) throw err(400, 'El descuento debe estar entre 1 y 100%');
    const info = run('INSERT INTO promociones (nombre,descuento,tipo_id,fecha_inicio,fecha_fin,descripcion,activa) VALUES (?,?,?,?,?,?,1)',
      b.nombre, +b.descuento, b.tipo_id ? +b.tipo_id : null, b.fecha_inicio || '', b.fecha_fin || '', b.descripcion || '');
    return get('SELECT * FROM promociones WHERE id = ?', Number(info.lastInsertRowid));
  },
  promocionUpdate(id, b) {
    const p = get('SELECT * FROM promociones WHERE id = ?', id);
    if (!p) throw err(404, 'Promoción no encontrada');
    if (b.descuento != null && (+b.descuento < 1 || +b.descuento > 100)) throw err(400, 'El descuento debe estar entre 1 y 100%');
    run('UPDATE promociones SET nombre=?,descuento=?,tipo_id=?,fecha_inicio=?,fecha_fin=?,descripcion=?,activa=? WHERE id=?',
      b.nombre != null ? b.nombre : p.nombre,
      b.descuento != null ? +b.descuento : p.descuento,
      b.tipo_id !== undefined ? (b.tipo_id ? +b.tipo_id : null) : p.tipo_id,
      b.fecha_inicio != null ? b.fecha_inicio : p.fecha_inicio,
      b.fecha_fin != null ? b.fecha_fin : p.fecha_fin,
      b.descripcion != null ? b.descripcion : p.descripcion,
      b.activa != null ? (b.activa ? 1 : 0) : p.activa, id);
    return get('SELECT * FROM promociones WHERE id = ?', id);
  },
  promocionRemove(id) {
    if (!get('SELECT id FROM promociones WHERE id = ?', id)) throw err(404, 'Promoción no encontrada');
    run('DELETE FROM promociones WHERE id = ?', id);
    return { success: true };
  },

  // ENCUESTAS
  encuestasList() { return all('SELECT * FROM encuestas ORDER BY id'); },
  resolverHuesped(codigo) {
    const c = String(codigo || '').toLowerCase().trim();
    let h = get('SELECT * FROM huespedes WHERE lower(codigo) = ?', c);
    if (!h) {
      const r = get('SELECT * FROM reservas WHERE lower(codigo) = ?', c);
      if (r) h = get('SELECT * FROM huespedes WHERE id = ?', r.huesped_id);
    }
    return h;
  },
  publicHuesped(codigo) {
    const h = this.resolverHuesped(codigo);
    if (!h) throw err(404, 'No encontramos a nadie con ese código. Revisa tu código de huésped (por ejemplo, HSP-001).');
    const ya = get('SELECT id FROM encuestas WHERE huesped_id = ?', h.id);
    const reservas = all('SELECT * FROM reservas WHERE huesped_id = ?', h.id);
    const ultima = reservas[reservas.length - 1];
    return {
      codigo: h.codigo, nombre: `${h.nombre} ${h.apellido}`, ya_respondida: !!ya,
      estadia: ultima ? `${ultima.fecha_entrada} → ${ultima.fecha_salida}` : null,
      habitaciones: ultima ? habitacionesDeReserva(ultima.id).map(hid => (get('SELECT numero FROM habitaciones WHERE id = ?', hid) || {}).numero).filter(Boolean) : []
    };
  },
  publicEncuesta(b) {
    const h = this.resolverHuesped(b.codigo);
    if (!h) throw err(404, 'Código inválido');
    if (get('SELECT id FROM encuestas WHERE huesped_id = ?', h.id)) throw err(409, 'Ya registramos una encuesta tuya. ¡Gracias!', 'duplicado');
    if (!b.limpieza || !b.atencion || !b.instalaciones) throw err(400, 'Debes calificar todas las categorías', 'incompleto');
    const reservas = all('SELECT * FROM reservas WHERE huesped_id = ?', h.id);
    const ultima = reservas[reservas.length - 1];
    const prom = ((+b.limpieza + +b.atencion + +b.instalaciones) / 3).toFixed(1);
    run('INSERT INTO encuestas (huesped_id,codigo_huesped,huesped_nombre,reserva_id,limpieza,atencion,instalaciones,comentario,promedio,fecha) VALUES (?,?,?,?,?,?,?,?,?,?)',
      h.id, h.codigo, `${h.nombre} ${h.apellido}`, ultima ? ultima.id : null, +b.limpieza, +b.atencion, +b.instalaciones, b.comentario || '', prom, today());
    return { success: true };
  },

  // RESERVA RÁPIDA (chatbot público)
  reservaRapida(b) {
    const req = ['nombre', 'apellido', 'documento', 'tipo_id', 'fecha_entrada', 'fecha_salida'];
    for (const k of req) if (!b[k] || String(b[k]).trim() === '') throw err(400, 'Faltan datos para la reserva', 'incompleto');
    if (b.fecha_entrada >= b.fecha_salida) throw err(400, 'La fecha de salida debe ser posterior a la de entrada');
    const tipo = get('SELECT * FROM tipos_habitacion WHERE id = ?', +b.tipo_id);
    if (!tipo) throw err(400, 'Tipo de habitación inválido');
    const ocup = habitacionesOcupadasEnRango(b.fecha_entrada, b.fecha_salida);
    const libre = all('SELECT * FROM habitaciones WHERE tipo_id = ?', +b.tipo_id)
      .find(h => h.estado !== 'mantenimiento' && !ocup.has(h.id));
    if (!libre) throw err(409, `No hay habitaciones ${tipo.nombre} disponibles para esas fechas.`, 'sin_disponibilidad');
    // Huésped: reutiliza por documento o crea uno nuevo
    let huesped = get('SELECT * FROM huespedes WHERE lower(documento) = lower(?)', String(b.documento).trim());
    if (!huesped) huesped = this.huespedCreate({
      nombre: b.nombre, apellido: b.apellido, documento: b.documento,
      tipo_documento: b.tipo_documento || 'DNI', email: b.email || '', telefono: b.telefono || '', nacionalidad: b.nacionalidad || ''
    }, true);
    const reserva = this.reservaCreate({
      huesped_id: huesped.id, fecha_entrada: b.fecha_entrada, fecha_salida: b.fecha_salida,
      habitaciones_ids: [libre.id], origen: 'chatbot'
    });
    const noches = Math.ceil((new Date(b.fecha_salida) - new Date(b.fecha_entrada)) / 86400000);
    const td = tipoConDescuento(tipo);
    return {
      codigo: reserva.codigo, huesped_codigo: huesped.codigo, nombre: `${huesped.nombre} ${huesped.apellido}`,
      habitacion: libre.numero, tipo: tipo.nombre, noches,
      precio_noche: td.precio_final, descuento: td.descuento, total: reserva.total
    };
  },

  // REPORTES
  reporteIngresos({ desde, hasta } = {}) {
    let pagos = all('SELECT * FROM pagos ORDER BY id');
    if (desde) pagos = pagos.filter(p => p.fecha >= desde);
    if (hasta) pagos = pagos.filter(p => p.fecha <= hasta);
    const total = pagos.reduce((s, p) => s + p.monto, 0);
    const porMetodo = {};
    pagos.forEach(p => { porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + p.monto; });
    const pagosDet = pagos.map(p => {
      const r = get('SELECT * FROM reservas WHERE id = ?', p.reserva_id);
      const huesped = r ? get('SELECT * FROM huespedes WHERE id = ?', r.huesped_id) : null;
      const habs = r ? habitacionesDeReserva(r.id).map(hid => (get('SELECT numero FROM habitaciones WHERE id = ?', hid) || {}).numero).filter(Boolean) : [];
      return { ...p, reserva_codigo: r ? r.codigo : '—', huesped: huesped ? `${huesped.nombre} ${huesped.apellido}` : '—', habitaciones: habs };
    });
    return { total, pagos: pagosDet, porMetodo, cantidad: pagos.length };
  },
  reporteDashboard() {
    const habs = all('SELECT estado FROM habitaciones');
    const totalHabitaciones = habs.length;
    const ocupadas = habs.filter(h => h.estado === 'ocupada').length;
    const disponibles = habs.filter(h => h.estado === 'disponible').length;
    const mantenimiento = habs.filter(h => h.estado === 'mantenimiento').length;
    const reservasActivas = get("SELECT COUNT(*) c FROM reservas WHERE estado = 'activa'").c;
    const totalHuespedes = get('SELECT COUNT(*) c FROM huespedes').c;
    const incidenciasPendientes = get("SELECT COUNT(*) c FROM incidencias WHERE estado = 'pendiente'").c;
    const mes = new Date().toISOString().slice(0, 7);
    const ingresosMes = all('SELECT monto,fecha FROM pagos').filter(p => p.fecha.startsWith(mes)).reduce((s, p) => s + p.monto, 0);
    const ocupacion = totalHabitaciones ? Math.round((ocupadas / totalHabitaciones) * 100) : 0;
    const enc = all('SELECT promedio FROM encuestas');
    const promedioEncuesta = enc.length ? (enc.reduce((s, e) => s + +e.promedio, 0) / enc.length).toFixed(1) : 'N/A';
    return { totalHabitaciones, ocupadas, disponibles, mantenimiento, reservasActivas, totalHuespedes, incidenciasPendientes, ingresosMes, ocupacion, promedioEncuesta };
  }
};

module.exports = store;
