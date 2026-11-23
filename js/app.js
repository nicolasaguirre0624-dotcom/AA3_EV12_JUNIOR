// Utilidades compartidas: APIs, localStorage y formato
const API_PRODUCTOS = 'https://dummyjson.com/products?limit=100';
const API_USUARIOS = 'https://jsonplaceholder.typicode.com/users';
const KEY = 'daroma_ventas';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('es-CO', {style:'currency', currency:'USD'}).format(n);
const r2 = n => Math.round(n * 100) / 100;
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
const getProductos = async () => (await getJSON(API_PRODUCTOS)).products;
const getUsuarios = () => getJSON(API_USUARIOS);
function leerVentas() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function guardarVentas(v) { localStorage.setItem(KEY, JSON.stringify(v)); }
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : r & 3 | 8).toString(16); });
}
function msg(el, texto, tipo = 'ok') { el.textContent = texto; el.className = 'msg ' + tipo; }
if ($('total-ventas')) $('total-ventas').textContent = leerVentas().length;
