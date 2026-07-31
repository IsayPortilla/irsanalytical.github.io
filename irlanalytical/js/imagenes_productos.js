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
let peticionIndice = null;

// El indice lista las carpetas publicadas y sus archivos. El panel lo usa para
// ofrecer la lista de imagenes disponibles al corregir un producto a mano.
export function cargarIndiceImagenes() {
    if (!peticionIndice) {
        peticionIndice = fetch(RUTA_INDICE)
            .then((r) => (r.ok ? r.json() : {}))
            .catch(() => ({}));
    }
    return peticionIndice;
}

export function rutaDeImagen(carpeta, archivo) {
    return `${RUTA_BASE}/${carpeta}/${archivo}`;
}

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
        cargarIndiceImagenes(),
        get(ref(db, 'data_productos'))
    ]);

    const productos = [];
    if (snapshot.exists()) {
        const categorias = snapshot.val();
        for (const idCat of Object.keys(categorias)) {
            for (const [id, info] of Object.entries(categorias[idCat])) {
                productos.push({
                    id,
                    categoria: idCat,
                    nombre: info.nombre || '',
                    imagenCarpeta: info.imagenCarpeta || ''
                });
            }
        }
    }

    // Las correcciones manuales entran en el sello: si el panel cambia la
    // carpeta de un producto, la copia guardada deja de servir aunque el
    // numero de productos y de carpetas siga igual.
    const manuales = productos
        .filter((p) => p.imagenCarpeta)
        .map((p) => `${p.id}=${p.imagenCarpeta}`)
        .sort()
        .join(',');
    const sello = `${Object.keys(indice).length}:${productos.length}:${manuales}`;
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

// El panel lo llama tras cambiar la carpeta de un producto, para no seguir
// mostrando el emparejamiento anterior.
export function refrescarMapeoImagenes() {
    peticion = null;
    try {
        sessionStorage.removeItem(CLAVE_CACHE);
    } catch (e) {
        // sessionStorage no disponible: no hay nada que limpiar.
    }
    return cargarMapeoImagenes();
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
