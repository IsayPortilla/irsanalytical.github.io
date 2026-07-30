// Resuelve la imagen de cada equipo del catalogo.
//
// El emparejamiento producto <-> carpeta se calcula en el navegador con
// `mapeo_imagenes.js`, asi que basta con publicar las imagenes y su indice: no
// hay paso de compilacion ni archivo de mapeo que mantener a mano.
//
// Prioridad: el campo `imagen` del producto en Firebase (si algun dia se
// captura desde el panel) gana sobre el mapeo, y el mapeo sobre la generica.

import { ref, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { db } from '../../firebase.js';
import { construirMapeo } from './mapeo_imagenes.js';

const RUTA_BASE = 'img/productos';
const RUTA_INDICE = `${RUTA_BASE}/indice.json`;
export const IMAGEN_POR_DEFECTO = 'img/croma.jpg';

// El mapeo depende del indice publicado y de los nombres en Firebase; si
// cambia cualquiera de los dos, la version invalida la copia guardada.
const CLAVE_CACHE = 'irs:mapeo-imagenes:v1';

let peticion = null;

function leerCache(sello) {
    try {
        const crudo = sessionStorage.getItem(CLAVE_CACHE);
        if (!crudo) return null;
        const guardado = JSON.parse(crudo);
        return guardado.sello === sello ? guardado.mapeo : null;
    } catch (e) {
        return null;
    }
}

function guardarCache(sello, mapeo) {
    try {
        sessionStorage.setItem(CLAVE_CACHE, JSON.stringify({ sello, mapeo }));
    } catch (e) {
        // sessionStorage lleno o deshabilitado: seguir sin cache.
    }
}

async function calcularMapeo() {
    const [indice, snapshot] = await Promise.all([
        fetch(RUTA_INDICE).then((r) => (r.ok ? r.json() : {})),
        get(ref(db, 'data_productos'))
    ]);

    const productos = [];
    if (snapshot.exists()) {
        const categorias = snapshot.val();
        for (const idCat of Object.keys(categorias)) {
            for (const [id, info] of Object.entries(categorias[idCat])) {
                productos.push({ id, categoria: idCat, nombre: info.nombre || '' });
            }
        }
    }

    const sello = `${Object.keys(indice).length}:${productos.length}`;
    const guardado = leerCache(sello);
    if (guardado) return guardado;

    const mapeo = construirMapeo(productos, indice, RUTA_BASE);
    guardarCache(sello, mapeo);
    return mapeo;
}

// El mapeo se calcula una sola vez por pagina aunque se pida en varios sitios.
export function cargarMapeoImagenes() {
    if (!peticion) {
        peticion = calcularMapeo().catch(() => ({}));
    }
    return peticion;
}

export function imagenDeProducto(mapeo, idProducto, producto) {
    if (producto && producto.imagen) return producto.imagen;
    const entrada = mapeo && mapeo[idProducto];
    return (entrada && entrada.imagen) || IMAGEN_POR_DEFECTO;
}

export function galeriaDeProducto(mapeo, idProducto, producto) {
    const entrada = mapeo && mapeo[idProducto];
    if (entrada && entrada.imagenes && entrada.imagenes.length) {
        return entrada.imagenes;
    }
    return [imagenDeProducto(mapeo, idProducto, producto)];
}
