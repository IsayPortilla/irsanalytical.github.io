// Empareja cada equipo dado de alta en Firebase con su carpeta de imagenes.
//
// Las carpetas de img/productos usan el slug ingles del catalogo BioBase y los
// productos estan en espanol, asi que se traduce el nombre con el lexico y se
// puntua la coincidencia de terminos contra cada slug.
//
// Todo corre en el navegador: JavaScript nativo, sin dependencias.

import { FRASES, PALABRAS, VACIAS } from './lexico_es_en.js';

// Puntuacion minima para aceptar un emparejamiento. Por debajo es preferible
// la imagen generica a colgarle al equipo la foto de otro.
const UMBRAL = 0.60;

// Tokens de los slugs que no aportan significado: marca, sufijos del scraper y
// codigos de modelo.
const RUIDO = new Set([
    'biobase', 'customized', 'and', 'for', 'with', 'the', 'of', 'in', 'on',
    'bk', 'bkc', 'bjpx', 'bdf', 'bbs', 'bm', 'scsj', 'pp', 'bsc', 'bkq',
    'series', 'type', 'new', 'china', 'price', 'sale', 'supplier', 'factory'
]);

// Siglas cortas que si son significativas pese a su longitud.
const SIGLAS = new Set([
    'uv', 'ph', 'gc', 'co2', 'ii', 'iii', 'a2', 'b2', 'en', 'nsf', 'esr',
    'dna', 'rna', 'pcr', 'bod', 'cod', 'nir', 'vis', 'prp', 'aed', 'ivc',
    'hot', 'dry', 'air', 'gas', 'low', 'top', 'bed', 'box', 'jar', 'kit',
    'lab', 'oil', 'ice', 'arm', 'bag', 'cell', 'fat'
]);

// Emparejamientos revisados a mano, para los nombres donde la traduccion
// automatica no basta (siglas, sinonimos comerciales o slugs muy escuetos).
const FORZADOS_CRUDO = {
    'Congelador de la morgue': 'morgue-freezer-bk-xg1-bk-xg2-bk-xg3-bk-xg4-bk-xg6',
    'Gabinete de diapositivas': 'slides-cabinet-bkc-e1-1-bkc-e2-1-bkc-e3',
    'Instrumento de amplificación genética': 'pcr-thermal-cycler-tec01',
    'Analizador químico semiautomático': 'semi-auto-chemistry-analyzer-biobase-claire',
    HPLC: 'high-performance-liquid-chromatography-system-bk3100',
    'Monitor de calefacción': 'electronic-digital-heating-mantles',
    'Probador de fugas': 'leakage-tester-bk-st132',
    Filtros: 'biobase-ffu-fan-filter-unit-hepa-with-hepa-filter-clean-room',
    Pipetas: 'micropette-plus-autoclavable-adjustable-pipette',
    'Generador de gas': 'biobase-nha-300-nitrogen-hydrogen-air-generator',
    'Autoclave de sobremesa clase Serie B': 'biobase-16l-18l-23l-dental-medical-autoclave-sterilizer-class-b',
    'Purificación de aleación de aluminio': 'handmade-aluminum-honeycomb-cleanroom-panel',
    'Panel de purificación': 'mechanized-pu-cleanroom-panel',
    'Sala limpia': 'handmade-pu-cleanroom-panel',
    // Traducciones correctas que el puntaje deja por debajo del umbral.
    'Sistema de electroforesis': 'vertical-electrophoresis-tank',
    'Cámara de estabilidad': 'medicine-stability-test-chamberbjpx-ms',
    'Analizador automático de ESR para camas de hospital planas': 'auto-esr-analyzer-bk-esr20pro-bk-esr40pro',
    'Silla para extracción de sangre': 'blood-bank-instrument-blood-collection-chair',
    'Máquina para descongelar sangre': 'blood-thaw-machine',
    'Máquina de molienda': 'grinding-machine',
    'Medidor de pH y humedad del suelo': 'soil-phmoisture-meter',
    'Aparato de destilación': 'biobase-wd-5-electric-heating-water-distillation-distiller-system',
    'Analizador de DBO': 'bod-tester-bk-bod02',
    'Ayuda para caminar': 'walking-aid',
    'Silla elevadora auxiliar para inodoro eléctrica': 'toilet-chair-mfcya101',
    'Pipeta electrónica': 'e-pipette',
    'Cabina Limpia': 'bbs-h1800-horizontal-laminar-air-flow-cabinet-clean-bench',
    // Sinonimos comerciales que no coinciden literalmente.
    'Armario de seguridad': 'safety-storage-cabinet-bksc-y',
    DEA: 'semi-automated-external-defibrillator-bio-aed-i',
    'Centrífuga de hematocrito': 'capillary-centrifuge-bkc-mh12-b',
    'Placa de enfriamiento': 'tissue-cooling-center-bk-cpii',
    'Mobiliario de laboratorio': 'all-steel-wall-bench',
    'Microscopio monocular': 'biological-microscope-bbm-17-bbm-17a',
    'Microscopio didáctico': 'economical-biological-microscope-bme-500d-bme-20e-bme-30sm-bme-500v',
    'Medidor de electroquímica': 'benchtop-conductivity-meter-bk-ec100'
};

// Productos sin equivalente real en el catalogo de imagenes.
const SIN_IMAGEN_CRUDO = [
    'Pregunta por nuestros servicios en edificios',
    'Trimmer',
    'Lavaojos',
    'Ventana de purificación',
    'Puerta de purificación',
    'Piso de PVC',
    'Sistema de manejo de aire',
    'Sistema de ventilación',
    'Accesorios de purificación',
    'Máquina de turnos',
    'Reactivo POCT',
    'Reactivo CLIA',
    'Reactivo de PCR',
    'Reactivo de coagulación',
    'Tiras reactivas para orina',
    'Criba vibradora',
    'Centrífuga de destapado automático',
    'Cajas para congelador',
    'Probador de frascos',
    'Probador de enfermedades de las plantas',
    'Edificio modular',
    'Laboratorio móvil'
];

export function normalizar(texto) {
    return (texto || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[º°]/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

const FORZADOS = new Map(
    Object.entries(FORZADOS_CRUDO).map(([k, v]) => [normalizar(k), v])
);
const SIN_IMAGEN = new Set(SIN_IMAGEN_CRUDO.map(normalizar));

// Las frases se prueban de mayor a menor longitud para que la mas especifica
// gane sobre la generica.
const FRASES_ORDENADAS = Object.keys(FRASES)
    .sort((a, b) => b.length - a.length)
    .map((frase) => [normalizar(frase), FRASES[frase]]);

// Devuelve el nombre como lista de grupos de sinonimos en ingles: basta con que
// el slug contenga una alternativa para dar la palabra por cubierta.
export function traducir(nombre) {
    let texto = normalizar(nombre);
    const grupos = [];

    for (const [clave, traduccion] of FRASES_ORDENADAS) {
        if (clave && texto.includes(clave)) {
            texto = texto.split(clave).join(' ');
            for (const t of traduccion.split(' ')) grupos.push([t]);
        }
    }

    for (const palabra of texto.split(' ')) {
        if (!palabra || VACIAS.has(palabra)) continue;
        const traduccion = PALABRAS[palabra];
        if (traduccion === undefined) {
            // Cifras y siglas no traducidas se comparan tal cual.
            if (/^\d+$/.test(palabra) || palabra.length <= 2) continue;
            grupos.push([palabra]);
        } else if (traduccion) {
            grupos.push(traduccion.split(' '));
        }
    }

    const vistos = new Set();
    const unicos = [];
    for (const grupo of grupos) {
        const clave = [...grupo].sort().join('|');
        if (!vistos.has(clave)) {
            vistos.add(clave);
            unicos.push(grupo);
        }
    }
    return unicos;
}

function tokensSlug(slug) {
    const utiles = [];
    for (const token of slug.split('-')) {
        if (!token || RUIDO.has(token)) continue;
        if (/\d/.test(token)) continue;
        if (token.length <= 3 && !SIGLAS.has(token)) continue;
        utiles.push(token);
    }
    return utiles;
}

// Cifras significativas del slug, ignorando capacidades y codigos de modelo. El
// scraper perdio el signo menos de las temperaturas, asi que un congelador de
// -86 C quedo como `86-freezer-...`; esas cifras distinguen entre si a los
// productos que comparten nombre base.
function numerosSlug(slug) {
    const numeros = new Set();
    for (const token of slug.split('-')) {
        if (/^\d{1,4}$/.test(token)) numeros.add(token);
        else if (/^\d{1,3}c$/.test(token)) numeros.add(token.slice(0, -1));
    }
    return numeros;
}

function numerosNombre(nombre) {
    const texto = (nombre || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return new Set(texto.match(/\d{1,4}/g) || []);
}

function construirIdf(carpetas) {
    const df = new Map();
    for (const carpeta of carpetas) {
        for (const token of new Set(tokensSlug(carpeta))) {
            df.set(token, (df.get(token) || 0) + 1);
        }
    }
    const idf = new Map();
    for (const [token, n] of df) {
        idf.set(token, Math.log(carpetas.length / (1 + n)) + 1);
    }
    return idf;
}

// Dice ponderado por IDF entre los terminos del producto y los del slug. Las
// cifras solo suman como desempate: nunca penalizan, porque el slug incluye
// capacidades y modelos que el nombre en espanol no menciona.
function puntuar(grupos, tokens, idf, numsProducto, numsSlug) {
    if (!grupos.length || !tokens.size) return 0;

    const peso = (t) => (idf.has(t) ? idf.get(t) : 3.0);
    let pesoTotal = 0;
    let pesoCubierto = 0;
    const usados = new Set();

    for (const grupo of grupos) {
        let pesoGrupo = 0;
        for (const t of grupo) pesoGrupo = Math.max(pesoGrupo, peso(t));
        pesoTotal += pesoGrupo;

        let mejor = 0;
        let hay = false;
        for (const t of grupo) {
            if (tokens.has(t)) {
                hay = true;
                mejor = Math.max(mejor, peso(t));
                usados.add(t);
            }
        }
        if (hay) pesoCubierto += mejor;
    }

    if (pesoCubierto === 0) return 0;

    let pesoSobrante = 0;
    for (const t of tokens) if (!usados.has(t)) pesoSobrante += peso(t);

    const cobertura = pesoCubierto / pesoTotal;
    const precision = pesoCubierto / (pesoCubierto + pesoSobrante);
    // beta > 1: importa mas cubrir el nombre del producto que la brevedad del slug.
    const beta2 = 2.25;
    let base = ((1 + beta2) * precision * cobertura) / (beta2 * precision + cobertura);

    if (numsProducto.size) {
        let aciertos = 0;
        for (const n of numsProducto) if (numsSlug.has(n)) aciertos += 1;
        base += 0.15 * (aciertos / numsProducto.size);
    }
    return base;
}

/**
 * Construye el mapeo id de producto -> imagenes.
 *
 * Si un producto trae `imagenCarpeta` (fijada desde el panel) se respeta esa
 * eleccion y se excluye del emparejamiento automatico, para que su carpeta no
 * se la lleve otro equipo.
 *
 * @param {Array<{id: string, nombre: string, imagenCarpeta?: string}>} productos
 * @param {Object<string, string[]>} indice carpeta -> archivos publicados.
 * @param {string} rutaBase prefijo web de las imagenes.
 */
export function construirMapeo(productos, indice, rutaBase = 'img/productos') {
    const manuales = new Map();
    for (const producto of productos) {
        if (producto.imagenCarpeta && indice[producto.imagenCarpeta]) {
            manuales.set(producto.id, producto.imagenCarpeta);
        }
    }

    const reservadas = new Set(manuales.values());
    const automaticos = productos.filter((p) => !manuales.has(p.id));
    const carpetas = Object.keys(indice).filter((c) => !reservadas.has(c));
    const idf = construirIdf(carpetas);
    const tokensPorCarpeta = new Map();
    const numerosPorCarpeta = new Map();
    for (const carpeta of carpetas) {
        tokensPorCarpeta.set(carpeta, new Set(tokensSlug(carpeta)));
        numerosPorCarpeta.set(carpeta, numerosSlug(carpeta));
    }

    // 1. Candidatos: mejores carpetas de cada producto ordenadas por puntaje.
    const items = automaticos.map((producto) => {
        const clave = normalizar(producto.nombre);
        let candidatos = [];

        if (SIN_IMAGEN.has(clave)) {
            candidatos = [];
        } else if (FORZADOS.has(clave) && indice[FORZADOS.get(clave)]) {
            candidatos = [{ puntaje: 1, carpeta: FORZADOS.get(clave) }];
        } else {
            const grupos = traducir(producto.nombre);
            const nums = numerosNombre(producto.nombre);
            candidatos = carpetas
                .map((carpeta) => ({
                    puntaje: puntuar(grupos, tokensPorCarpeta.get(carpeta), idf,
                        nums, numerosPorCarpeta.get(carpeta)),
                    carpeta
                }))
                .filter((c) => c.puntaje >= UMBRAL)
                .sort((a, b) => b.puntaje - a.puntaje || a.carpeta.localeCompare(b.carpeta))
                .slice(0, 40);
        }
        return { producto, clave, candidatos };
    });

    // 2. Asignacion global: cada carpeta se usa una sola vez y gana el producto
    //    que mejor puntua, para que equipos parecidos no compitan por la misma.
    const asignado = new Map();
    const usadas = new Set();
    const porNombre = new Map();
    const pendientes = [...items].sort(
        (a, b) => (b.candidatos[0] ? b.candidatos[0].puntaje : 0)
            - (a.candidatos[0] ? a.candidatos[0].puntaje : 0)
    );

    for (const { producto, clave, candidatos } of pendientes) {
        const libre = candidatos.find((c) => !usadas.has(c.carpeta));
        if (libre) {
            asignado.set(producto.id, libre.carpeta);
            usadas.add(libre.carpeta);
            if (!porNombre.has(clave)) porNombre.set(clave, libre.carpeta);
        } else if (porNombre.has(clave)) {
            // El catalogo repite algunos nombres; que compartan carpeta es
            // mejor que dejar al duplicado sin imagen.
            asignado.set(producto.id, porNombre.get(clave));
        }
    }

    const mapeo = {};
    for (const [id, carpeta] of [...manuales, ...asignado]) {
        const archivos = indice[carpeta] || [];
        if (!archivos.length) continue;
        const imagenes = archivos.map((a) => `${rutaBase}/${carpeta}/${a}`);
        mapeo[id] = { carpeta, imagen: imagenes[0], imagenes, manual: manuales.has(id) };
    }
    return mapeo;
}
