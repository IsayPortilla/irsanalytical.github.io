// Menu de categorias y buscador, compartidos por los tres sitios.
//
// Antes habia tres funciones casi identicas dentro de firebase.js, una por
// marca, con el nombre de la empresa y los enlaces del menu escritos a mano.
// De ahi venian los enlaces rotos: el menu de Tube & Fittings apuntaba a
// paginas que solo existen en el sitio de IRS. Ahora hay una sola funcion y
// cada pagina declara en su HTML a que empresa pertenece.
//
// El menu se arma con lo que haya en Firebase, asi que dar de alta una
// categoria nueva desde el panel la publica en el menu sin tocar codigo.
//
// JavaScript nativo, sin dependencias.

import { ref, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { db } from './firebase.js';

// Como se agrupan las categorias en los desplegables de cada marca.
//
// Firebase guarda empresa -> submarca -> categoria, pero esa jerarquia no
// sirve igual en las dos marcas: en IRS todo cuelga de una sola submarca
// (BIOBASE) y lo que distingue a los productos es la categoria, mientras que
// en Tube & Fittings la submarca es el tipo de pieza (codo, niple, valvula) y
// la categoria es su variante (macho, hembra, de acero). Por eso cada marca
// declara sobre que nivel agrupar.
const MENUS = {
    'IRS ANALYTICAL SERVICE': {
        agruparPor: 'categoria',
        grupos: {
            'Laboratorio': [
                'ANÁLISIS DE LABORATORIO', 'PRE-PROCESAMIENTO DE MUESTRAS',
                'PROCESAMIENTO LÍQUIDO', 'CENTRÍFUGOS', 'ÓPTICOS',
                'OTROS PRODUCTOS DE LABORATORIO'
            ],
            'Control Ambiental': [
                'PROTECCIÓN DE AIRE', 'CONTROL DE TEMPERATURA', 'CADENA DE FRÍO',
                'DESINFECCIÓN Y ESTERILIZACIÓN', 'HORNOS', 'INCUBADORAS'
            ],
            'Diagnóstico': [
                'INSTRUMENTOS IVD', 'REACTIVOS IVD', 'BANCO DE SANGRE',
                'LABORATORIO DE PATOLOGÍA', 'LABORATORIO MICROBIOLÓGICO',
                'ANÁLISIS DE SUELOS/PLANTAS/SEMILLAS'
            ],
            'Salud': [
                'ATENCIÓN NEONATAL', 'MEDICINA Y REHABILITACIÓN',
                'PRODUCTO DE BELLEZA', 'PROYECTO DE SALA LIMPIA',
                'EDIFICIOS DE OFICINAS Y FÁBRICAS'
            ]
        }
    },
    'TUBE AND FITTINGS': {
        agruparPor: 'submarca',
        grupos: {
            'Conexiones': [
                'CONECTOR RECTO', 'CONECTOR', 'CODO', 'UNION', 'NIPLE',
                'COPLE', 'TAPON', 'ADAPTADOR'
            ],
            'Control de flujo': ['VÁLVULA', 'REGULADOR'],
            'Instalaciones': ['INSTALACIONES']
        }
    }
};

const normalizar = (t) => (t || '').toUpperCase().trim();

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Categorias de una empresa, con la submarca de la que cuelga cada una.
// Se cachea porque el menu y el buscador piden lo mismo.
const cacheCategorias = new Map();

export function categoriasDeEmpresa(nombreEmpresa) {
    const clave = normalizar(nombreEmpresa);
    if (!cacheCategorias.has(clave)) {
        cacheCategorias.set(clave, (async () => {
            const snapEmpresas = await get(ref(db, 'nombres_empresa'));
            if (!snapEmpresas.exists()) return [];

            const empresas = snapEmpresas.val();
            const idEmpresa = Object.keys(empresas)
                .find((k) => normalizar(empresas[k].nombre) === clave);
            if (!idEmpresa) return [];

            const snapSub = await get(ref(db, `relacion_empresa_submarca/${idEmpresa}`));
            if (!snapSub.exists()) return [];

            const submarcas = snapSub.val();
            const ids = Object.keys(submarcas);
            const porSubmarca = await Promise.all(
                ids.map((id) => get(ref(db, `relacion_submarca_categoria/${id}`)))
            );

            const categorias = [];
            porSubmarca.forEach((snap, i) => {
                if (!snap.exists()) return;
                const submarca = submarcas[ids[i]].nombre || '';
                for (const [id, detalle] of Object.entries(snap.val())) {
                    categorias.push({ id, nombre: detalle.nombre || 'Sin nombre', submarca });
                }
            });
            return categorias;
        })().catch(() => []));
    }
    return cacheCategorias.get(clave);
}

function agrupar(categorias, config) {
    const grupos = new Map(Object.keys(config.grupos).map((g) => [g, []]));

    for (const categoria of categorias) {
        const referencia = normalizar(
            config.agruparPor === 'submarca' ? categoria.submarca : categoria.nombre
        );
        for (const [titulo, miembros] of Object.entries(config.grupos)) {
            if (miembros.some((m) => normalizar(m) === referencia)) {
                grupos.get(titulo).push(categoria);
                break;
            }
        }
    }
    return grupos;
}

function dibujarGrupo(titulo, categorias, config, ficha) {
    let interior;

    if (config.agruparPor === 'submarca') {
        // Cada submarca es un tipo de pieza: se muestra como subtitulo para que
        // se entienda que "Macho" y "Hembra" son variantes de esa pieza.
        const porSubmarca = new Map();
        for (const c of categorias) {
            if (!porSubmarca.has(c.submarca)) porSubmarca.set(c.submarca, []);
            porSubmarca.get(c.submarca).push(c);
        }
        interior = [...porSubmarca.entries()].map(([submarca, lista]) => `
            <div class="menu-seccion mb-2">
                <h6 class="dropdown-header text-primary fw-bold text-uppercase small mb-1">${escapar(submarca)}</h6>
                ${lista.map((c) => `<a href="${ficha}?cat=${encodeURIComponent(c.id)}" class="dropdown-item py-1 px-4 small">${escapar(c.nombre)}</a>`).join('')}
            </div>`).join('');
    } else {
        interior = categorias
            .map((c) => `<a href="${ficha}?cat=${encodeURIComponent(c.id)}" class="dropdown-item py-1 px-4 small">${escapar(c.nombre)}</a>`)
            .join('');
    }

    return `
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false">${escapar(titulo)}</a>
            <div class="dropdown-menu border-0 m-0 shadow-sm">${interior}</div>
        </div>`;
}

async function construirMenu() {
    const contenedor = document.getElementById('main-nav-container');
    if (!contenedor) return;

    const empresa = contenedor.dataset.menuEmpresa;
    if (!empresa) return;

    const config = MENUS[normalizar(empresa)] || MENUS[empresa];
    if (!config) return;

    // A donde llevan las categorias. Cada sitio lo declara porque no todos
    // tienen catalogo propio.
    const ficha = contenedor.dataset.menuCatalogo || 'product.html';

    const categorias = await categoriasDeEmpresa(empresa);
    if (!categorias.length) return;

    const grupos = agrupar(categorias, config);

    // Se insertan antes de los enlaces fijos que ya trae el HTML.
    const html = [...grupos.entries()]
        .filter(([, lista]) => lista.length)
        .map(([titulo, lista]) => dibujarGrupo(titulo, lista, config, ficha))
        .join('');

    if (html) contenedor.insertAdjacentHTML('afterbegin', html);
}

// --- BUSCADOR ---

// Los productos se piden una sola vez por pagina: antes se descargaba el
// catalogo completo en cada pulsacion de tecla.
let productosCache = null;
function todosLosProductos() {
    if (!productosCache) {
        productosCache = get(ref(db, 'data_productos'))
            .then((snap) => (snap.exists() ? snap.val() : {}))
            .catch(() => ({}));
    }
    return productosCache;
}

async function iniciarBuscador() {
    const entrada = document.getElementById('input-busqueda');
    const boton = document.getElementById('btn-buscar');
    const sugerencias = document.getElementById('sugerencias-busqueda');
    if (!entrada) return;

    const destino = entrada.dataset.busquedaDestino || 'product.html';
    const ficha = entrada.dataset.busquedaFicha || '';
    const empresa = entrada.dataset.busquedaEmpresa || '';

    const buscar = () => {
        const texto = entrada.value.trim();
        if (texto) window.location.href = `${destino}?search=${encodeURIComponent(texto)}`;
    };

    if (boton) boton.addEventListener('click', buscar);
    entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });

    // Las sugerencias en vivo solo tienen sentido si la marca tiene catalogo
    // en Firebase y una pagina de ficha donde abrir el producto.
    if (!sugerencias || !ficha || !empresa) return;

    const permitidas = new Set((await categoriasDeEmpresa(empresa)).map((c) => c.id));
    if (!permitidas.size) return;

    let temporizador = null;

    entrada.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(async () => {
            const texto = entrada.value.toLowerCase().trim();
            if (texto.length < 2) {
                sugerencias.classList.add('d-none');
                return;
            }

            const categorias = await todosLosProductos();
            const encontrados = [];

            for (const [idCat, productos] of Object.entries(categorias)) {
                // Cada sitio busca solo dentro de su propio catalogo.
                if (!permitidas.has(idCat)) continue;
                for (const [idProd, datos] of Object.entries(productos)) {
                    if (encontrados.length >= 8) break;
                    if ((datos.nombre || '').toLowerCase().includes(texto)) {
                        encontrados.push({ idCat, idProd, nombre: datos.nombre });
                    }
                }
            }

            if (!encontrados.length) {
                sugerencias.classList.add('d-none');
                return;
            }

            sugerencias.innerHTML = encontrados.map((p) => `
                <a href="${ficha}?id=${encodeURIComponent(p.idProd)}&cat=${encodeURIComponent(p.idCat)}"
                   class="list-group-item list-group-item-action border-0 py-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-search me-3 text-muted"></i>
                        <span class="text-truncate">${escapar(p.nombre)}</span>
                    </div>
                </a>`).join('');
            sugerencias.classList.remove('d-none');
        }, 200);
    });

    document.addEventListener('click', (e) => {
        if (!entrada.contains(e.target) && !sugerencias.contains(e.target)) {
            sugerencias.classList.add('d-none');
        }
    });
}

export function iniciarNavegacion() {
    const arrancar = () => {
        construirMenu().catch((e) => console.error('Error armando el menu:', e));
        iniciarBuscador().catch((e) => console.error('Error en el buscador:', e));
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arrancar, { once: true });
    } else {
        arrancar();
    }
}
