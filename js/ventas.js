// CRUD de ventas con localStorage
let productos = [], usuarios = [], items = [], editId = null, codigo = uuid();
const hoy = () => new Date().toISOString().slice(0, 10);

async function cargar() {
  msg($('estado'), 'Cargando productos y vendedores...', 'info');
  try {
    [productos, usuarios] = await Promise.all([getProductos(), getUsuarios()]);
    $('vendedor').innerHTML = '<option value="">Seleccione...</option>' + usuarios.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('');
    $('producto').innerHTML = '<option value="">Seleccione...</option>' + productos.map(p => `<option value="${p.id}">${esc(p.title)} - ${money(p.price)}</option>`).join('');
    msg($('estado'), 'Productos y vendedores cargados desde las APIs.', 'ok');
  } catch (e) {
    msg($('estado'), 'No se pudieron cargar productos o vendedores (' + e.message + '). Las ventas guardadas se siguen mostrando.', 'error');
  }
}

function pintarItems() {
  const t = r2(items.reduce((s, i) => s + i.subtotal, 0));
  $('items').innerHTML = items.length ? items.map((i, n) => `<tr><td>${esc(i.nombre)}</td><td>${i.cantidad}</td><td>${money(i.precio)}</td><td>${money(i.subtotal)}</td><td><button type="button" class="btn-sm peligro" data-quitar="${n}">Retirar</button></td></tr>`).join('') : '<tr><td colspan="5">Aún no hay productos en la venta.</td></tr>';
  $('total').textContent = money(t);
  const sel = $('vendedor').selectedOptions[0];
  $('resumen-info').innerHTML = `Id: <code>${codigo}</code> · Vendedor: ${sel && sel.value ? esc(sel.textContent) : '(sin seleccionar)'}`;
}

function pintarVentas() {
  const v = leerVentas();
  let g = 0;
  $('ventas').innerHTML = v.length ? v.flatMap(s => { g += s.total; return s.productos.map(p => `<tr><td><code>${s.id}</code></td><td>${esc(p.nombre)}</td><td>${p.cantidad}</td><td>${money(p.precio)}</td><td>${esc(s.vendedor.nombre)}</td><td>${money(p.subtotal)}</td><td><button class="btn-sm" data-ver="${s.id}">Ver</button><button class="btn-sm" data-edit="${s.id}">Editar</button><button class="btn-sm peligro" data-del="${s.id}">Eliminar</button></td></tr>`); }).join('') : '<tr><td colspan="7">No hay ventas registradas.</td></tr>';
  $('total-general').textContent = money(r2(g));
}

function limpiar() {
  items = []; editId = null; codigo = uuid();
  $('form').reset(); $('fecha').value = hoy(); $('codigo').value = codigo;
  $('btn-guardar').textContent = 'Guardar venta';
  pintarItems();
}

$('btn-agregar').onclick = () => {
  const p = productos.find(x => x.id == $('producto').value), c = Number($('cantidad').value);
  if (!p) return msg($('msg'), 'Selecciona un producto.', 'error');
  if (!Number.isInteger(c) || c <= 0) return msg($('msg'), 'La cantidad debe ser un entero mayor que cero.', 'error');
  if (p.price < 0) return msg($('msg'), 'El precio no puede ser negativo.', 'error');
  const ex = items.find(i => i.id === p.id);
  if (ex) { ex.cantidad += c; ex.subtotal = r2(ex.cantidad * ex.precio); }
  else items.push({id: p.id, nombre: p.title, precio: p.price, cantidad: c, subtotal: r2(p.price * c)});
  msg($('msg'), 'Producto agregado a la venta.', 'ok'); pintarItems();
};

$('items').onclick = e => {
  const n = e.target.dataset.quitar;
  if (n === undefined) return;
  items.splice(n, 1); msg($('msg'), 'Producto retirado de la venta.', 'ok'); pintarItems();
};
$('vendedor').onchange = pintarItems;
$('btn-cancelar').onclick = () => { limpiar(); msg($('msg'), 'Formulario reiniciado.', 'info'); };

$('form').onsubmit = e => {
  e.preventDefault();
  const sel = $('vendedor').selectedOptions[0];
  if (!sel || !sel.value) return msg($('msg'), 'Debes seleccionar un vendedor.', 'error');
  if (!$('fecha').value) return msg($('msg'), 'Debes indicar la fecha.', 'error');
  if (!items.length) return msg($('msg'), 'Agrega al menos un producto a la venta.', 'error');
  if (items.some(i => i.cantidad <= 0 || i.precio < 0)) return msg($('msg'), 'Hay cantidades o precios inválidos.', 'error');
  const venta = {id: codigo, vendedor: {id: sel.value, nombre: sel.textContent}, fecha: $('fecha').value, productos: items.map(i => ({...i})), total: r2(items.reduce((s, i) => s + i.subtotal, 0))};
  const v = leerVentas();
  if (editId) v[v.findIndex(x => x.id === editId)] = venta; else v.push(venta);
  guardarVentas(v);
  const accion = editId ? 'actualizada' : 'registrada';
  limpiar(); pintarVentas();
  msg($('msg'), 'Venta ' + accion + ' correctamente.', 'ok');
};

$('ventas').onclick = e => {
  const d = e.target.dataset, v = leerVentas();
  if (d.ver) {
    const s = v.find(x => x.id === d.ver);
    $('detalle').hidden = false;
    $('detalle').innerHTML = `<strong>Detalle de venta</strong><br>Id: <code>${s.id}</code><br>Vendedor: ${esc(s.vendedor.nombre)} · Fecha: ${s.fecha}<ul>${s.productos.map(p => `<li>${esc(p.nombre)}: ${p.cantidad} x ${money(p.precio)} = ${money(p.subtotal)}</li>`).join('')}</ul><strong>Total: ${money(s.total)}</strong>`;
  }
  if (d.edit) {
    const s = v.find(x => x.id === d.edit), sel = $('vendedor');
    editId = codigo = s.id; items = s.productos.map(p => ({...p}));
    if (![...sel.options].some(o => o.value == s.vendedor.id)) sel.add(new Option(s.vendedor.nombre, s.vendedor.id));
    sel.value = s.vendedor.id; $('fecha').value = s.fecha; $('codigo').value = codigo;
    $('btn-guardar').textContent = 'Actualizar venta';
    pintarItems(); msg($('msg'), 'Editando la venta. Modifica productos o cantidades y guarda.', 'info');
    $('form').scrollIntoView({behavior: 'smooth'});
  }
  if (d.del && confirm('¿Seguro que deseas eliminar esta venta?')) {
    guardarVentas(v.filter(x => x.id !== d.del));
    $('detalle').hidden = true; pintarVentas();
    msg($('estado'), 'Venta eliminada correctamente.', 'ok');
  }
};

limpiar(); pintarVentas(); cargar();
