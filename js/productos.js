// Consulta de productos (solo lectura) desde DummyJSON
let lista = [];
function pintar() {
  const c = $('categoria').value;
  const datos = c ? lista.filter(p => p.category === c) : lista;
  $('tabla').innerHTML = datos.map(p => `<tr><td>${p.id}</td><td>${esc(p.title)}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td><img src="${esc(p.thumbnail)}" alt="${esc(p.title)}"></td></tr>`).join('');
}
(async () => {
  const e = $('estado');
  msg(e, 'Cargando productos...', 'info');
  try {
    lista = await getProductos();
    const cats = [...new Set(lista.map(p => p.category))].sort();
    $('categoria').innerHTML = '<option value="">Todas</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
    $('categoria').onchange = pintar;
    pintar();
    msg(e, lista.length + ' productos obtenidos de la API.', 'ok');
  } catch (err) {
    msg(e, 'No se pudieron obtener los productos: ' + err.message, 'error');
  }
})();
