import { tecnicasPorNivel } from "./script.js";

const ordenNiveles = ["blanco", "amarillo", "verde", "azul", "rojo", "dan1", "dan2", "dan3", "dan4", "dan5"];
const etiquetas = { dan1: "1º Dan", dan2: "2º Dan", dan3: "3º Dan", dan4: "4º Dan", dan5: "5º Dan", vocabulario: "Vocabulario" };
const CLAVE_STATS = "tkd-stats-v1";

let nivelSeleccionado = null;
let tecnicasDisponibles = [];
let tecnicaActual = null;
let totalSesion = 0;
let sesion = { vistas: 0, sabidas: 0 };
let temporizador = null;

const $ = (id) => document.getElementById(id);
const imagenWebp = (ruta) => ruta.replace(/\.png$/i, ".webp");
const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function cargarStats() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_STATS)) || {};
  } catch {
    return {};
  }
}

function guardarStats(stats) {
  try {
    localStorage.setItem(CLAVE_STATS, JSON.stringify(stats));
  } catch { /* almacenamiento no disponible */ }
}

function mostrarVista(id) {
  for (const v of ["niveles", "contenido", "resumen", "modoEstudio"]) {
    $(v).hidden = v !== id;
  }
  if (id === "niveles") pintarStats();
  window.scrollTo({ top: 0 });
}

function pintarStats() {
  const stats = cargarStats();
  const caja = $("stats");
  const entradas = Object.entries(stats).filter(([, s]) => s.vistas > 0);
  if (!entradas.length) {
    caja.hidden = true;
    return;
  }
  caja.hidden = false;
  $("statsLista").innerHTML = entradas.map(([nivel, s]) => {
    const pct = Math.round((s.sabidas / s.vistas) * 100);
    return `<li><span>${escapar(etiquetas[nivel] || nivel)}</span>
      <progress max="100" value="${pct}" aria-label="Aciertos ${escapar(etiquetas[nivel] || nivel)}"></progress>
      <strong>${pct}%</strong> <small>(${s.sabidas}/${s.vistas})</small></li>`;
  }).join("");
}

function borrarStats() {
  if (confirm("¿Borrar todo tu progreso?")) {
    localStorage.removeItem(CLAVE_STATS);
    pintarStats();
  }
}

function seleccionarNivel(nivel) {
  nivelSeleccionado = nivel;
  if (nivel === "vocabulario") {
    tecnicasDisponibles = [...(tecnicasPorNivel.vocabulario || [])];
  } else {
    const index = ordenNiveles.indexOf(nivel);
    tecnicasDisponibles = [];
    for (let i = 0; i <= index; i++) {
      tecnicasDisponibles = tecnicasDisponibles.concat(tecnicasPorNivel[ordenNiveles[i]] || []);
    }
  }
  totalSesion = tecnicasDisponibles.length;
  sesion = { vistas: 0, sabidas: 0 };
  $("nivelActual").textContent = etiquetas[nivel] || nivel;
  mostrarVista("contenido");
  siguienteTecnica();
}

function detenerTemporizador() {
  clearInterval(temporizador);
  temporizador = null;
}

function siguienteTecnica() {
  detenerTemporizador();
  if (tecnicasDisponibles.length === 0) {
    mostrarResumen();
    return;
  }

  const i = Math.floor(Math.random() * tecnicasDisponibles.length);
  tecnicaActual = tecnicasDisponibles.splice(i, 1)[0];

  const hecho = totalSesion - tecnicasDisponibles.length;
  $("progresoTexto").textContent = `${hecho} / ${totalSesion}`;
  $("progresoBarra").max = totalSesion;
  $("progresoBarra").value = hecho;

  $("tecnicaNombre").textContent = tecnicaActual.nombre;
  $("tecnicaImagen").innerHTML = "";
  $("autoevaluacion").hidden = true;
  $("btnSiguiente").hidden = true;
  $("btnResolver").hidden = false;
  $("btnResolver").focus();
  $("cuentaAtras").hidden = true;
}

function mostrarImagen() {
  if (!tecnicaActual) return;
  detenerTemporizador();
  if (nivelSeleccionado === "vocabulario") {
    $("tecnicaImagen").innerHTML = `<p class="traduccion"><strong>Traducción:</strong> ${escapar(tecnicaActual.imagen)}</p>`;
  } else {
    $("tecnicaImagen").innerHTML = `<img src="${escapar(imagenWebp(tecnicaActual.imagen))}" alt="Ejecución de ${escapar(tecnicaActual.nombre)}" width="148" height="191">`;
  }
  $("cuentaAtras").hidden = true;
  $("btnResolver").hidden = true;
  $("autoevaluacion").hidden = false;
  $("btnSiguiente").hidden = false;
  $("btnSabia").focus();
}

function valorar(sabia) {
  sesion.vistas++;
  if (sabia) sesion.sabidas++;
  const stats = cargarStats();
  const s = stats[nivelSeleccionado] || { vistas: 0, sabidas: 0 };
  s.vistas++;
  if (sabia) s.sabidas++;
  stats[nivelSeleccionado] = s;
  guardarStats(stats);
  siguienteTecnica();
}

function mostrarResumen() {
  const pct = sesion.vistas ? Math.round((sesion.sabidas / sesion.vistas) * 100) : 0;
  $("resumenTexto").textContent = sesion.vistas
    ? `Has acertado ${sesion.sabidas} de ${sesion.vistas} (${pct}%).`
    : "Has repasado todas las técnicas de este nivel.";
  mostrarVista("resumen");
}

function reiniciar() {
  detenerTemporizador();
  tecnicaActual = null;
  nivelSeleccionado = null;
  tecnicasDisponibles = [];
  mostrarVista("niveles");
}

function modoEstudiar() {
  mostrarVista("modoEstudio");
  $("buscador").value = "";
  pintarEstudio();
  $("buscador").focus();
}

function pintarEstudio() {
  const filtro = $("buscador").value.trim().toLowerCase();
  const coincide = (t) => !filtro || t.nombre.toLowerCase().includes(filtro) || (t.imagen && t.imagen.toLowerCase().includes(filtro));
  const partes = [];

  for (const nivel of ordenNiveles) {
    const lista = (tecnicasPorNivel[nivel] || []).filter(coincide);
    if (!lista.length) continue;
    partes.push(`<section><h3>${escapar(etiquetas[nivel] || nivel)}</h3><div class="tecnica-grid">${lista.map((t) => `
      <figure class="tecnica-card">
        <figcaption>${escapar(t.nombre)}</figcaption>
        <img src="${escapar(imagenWebp(t.imagen))}" alt="Ejecución de ${escapar(t.nombre)}" loading="lazy" width="148" height="191">
      </figure>`).join("")}</div></section>`);
  }

  const vocab = (tecnicasPorNivel.vocabulario || []).filter(coincide);
  if (vocab.length) {
    partes.push(`<section><h3>Vocabulario</h3><div class="tabla-wrap"><table>
      <thead><tr><th scope="col">Palabra</th><th scope="col">Traducción</th></tr></thead>
      <tbody>${vocab.map((v) => `<tr><td>${escapar(v.nombre)}</td><td>${escapar(v.imagen)}</td></tr>`).join("")}</tbody>
    </table></div></section>`);
  }

  $("tablaEstudio").innerHTML = partes.join("") || "<p>No se encontraron resultados.</p>";
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-nivel]").forEach((b) => b.addEventListener("click", () => seleccionarNivel(b.dataset.nivel)));
  $("btnEstudiar").addEventListener("click", modoEstudiar);
  $("btnResolver").addEventListener("click", mostrarImagen);
  $("btnSiguiente").addEventListener("click", siguienteTecnica);
  $("btnSabia").addEventListener("click", () => valorar(true));
  $("btnNoSabia").addEventListener("click", () => valorar(false));
  document.querySelectorAll("[data-volver]").forEach((b) => b.addEventListener("click", reiniciar));
  $("btnBorrar").addEventListener("click", borrarStats);
  $("btnRepetir").addEventListener("click", () => seleccionarNivel(nivelSeleccionado));
  $("buscador").addEventListener("input", pintarEstudio);
  pintarStats();
});
