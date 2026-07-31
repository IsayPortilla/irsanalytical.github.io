// Catalogo y ficha de producto, compartidos por los sitios que venden en linea.
//
// Antes esta logica vivia dentro de un <script> en product.html y otro en
// detail.html, solo en el sitio de IRS. Al dar catalogo tambien a Tube &
// Fittings habria quedado duplicada, asi que esta aqui una sola vez y cada
// pagina le pasa lo que cambia: de que empresa es el catalogo y de donde salen
// las imagenes.
//
// El filtro por empresa importa: `data_productos` guarda los productos de las
// tres marcas mezclados, y sin filtrar, el catalogo de una marca mostraba los
// productos de las otras.
//
// JavaScript nativo, sin dependencias.

import { ref, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { db } from './firebase.js';
import { categoriasDeEmpresa } from './navegacion.js';

const IMAGEN_GENERICA = 'img/logo.png';

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Muchos productos estan dados de alta con precio 0 o "0000" porque se venden
// bajo cotizacion. Mostrar "$0" haria pensar que son gratis.
function formatearPrecio(valor, moneda = '') {
    const numero = Number(String(valor ?? '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(numero) || numero <= 0) return 'Precio bajo consulta';
    const cifra = '$' + numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return moneda ? `${cifra} ${moneda}` : cifra;
}

async function productosDeEmpresa(empresa) {
    const [snapshot, categorias] = await Promise.all([
        get(ref(db, 'data_productos')),
        empresa ? categoriasDeEmpresa(empresa) : Promise.resolve(null)
    ]);
    if (!snapshot.exists()) return { productos: [], nombresCategoria: new Map() };

    const permitidas = categorias ? new Set(categorias.map((c) => c.id)) : null;
    const nombresCategoria = new Map((categorias || []).map((c) => [c.id, c.nombre]));

    const productos = [];
    for (const [idCat, items] of Object.entries(snapshot.val())) {
        if (permitidas && !permitidas.has(idCat)) continue;
        for (const [id, info] of Object.entries(items)) {
            productos.push({ id, categoria: idCat, ...info });
        }
    }
    return { productos, nombresCategoria };
}

// --- CATALOGO ---

export async function iniciarCatalogo(opciones = {}) {
    const {
        empresa = '',
        ficha = 'detail.html',
        imagen = () => IMAGEN_GENERICA,
        porPagina = 8,
        moneda = '',
        // Vacuum Systems no tiene su catalogo en Firebase: sus kits y refacciones
        // se pasan aqui como lista y el resto de la pagina funciona igual.
        productos: listaFija = null,
        // Sin ficha de producto propia, la tarjeta lleva directo a cotizar.
        detalle = () => '',
        accion = (producto) => `
            <a href="${ficha}?id=${encodeURIComponent(producto.id)}&cat=${encodeURIComponent(producto.categoria)}"
               class="btn btn-outline-primary btn-sm w-100">Ver detalles</a>`
    } = opciones;

    const contenedor = document.getElementById('contenedor-productos');
    const cargando = document.getElementById('loading-productos');
    const paginacion = document.getElementById('paginacion-lista');
    const sinResultados = document.getElementById('sin-resultados');
    const titulo = document.getElementById('titulo-pagina');
    if (!contenedor) return;

    const params = new URLSearchParams(window.location.search);
    const busqueda = (params.get('search') || '').toLowerCase().trim();
    const idCategoria = params.get('cat');

    let encontrados = [];

    try {
        const { productos, nombresCategoria } = listaFija
            ? { productos: listaFija, nombresCategoria: new Map() }
            : await productosDeEmpresa(empresa);

        encontrados = productos.filter((p) => (
            (!idCategoria || p.categoria === idCategoria)
            && (!busqueda || `${p.nombre || ''} ${p.modelo || ''} ${p.marca || ''}`
                .toLowerCase().includes(busqueda))
        ));

        if (titulo) {
            if (busqueda) titulo.textContent = `Resultados para "${params.get('search').trim()}"`;
            else if (idCategoria && nombresCategoria.has(idCategoria)) titulo.textContent = nombresCategoria.get(idCategoria);
        }
    } catch (e) {
        console.error('Error cargando el catalogo:', e);
    } finally {
        cargando?.classList.add('d-none');
        document.getElementById('spinner')?.classList.remove('show');
    }

    const dibujar = (pagina) => {
        contenedor.innerHTML = '';
        if (paginacion) paginacion.innerHTML = '';

        if (!encontrados.length) {
            sinResultados?.classList.remove('d-none');
            return;
        }
        sinResultados?.classList.add('d-none');

        const desde = (pagina - 1) * porPagina;
        contenedor.innerHTML = encontrados.slice(desde, desde + porPagina).map((producto) => {
            const extra = detalle(producto);
            return `
            <div class="col-lg-3 col-md-6">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-img-container">
                        <img src="${escapar(imagen(producto))}" class="img-fluid"
                             alt="${escapar(producto.nombre)}" loading="lazy">
                    </div>
                    <div class="card-body d-flex flex-column text-center">
                        <h6 class="card-title ${extra ? '' : 'flex-grow-1'}">${escapar(producto.nombre)}</h6>
                        ${extra ? `<p class="text-muted small flex-grow-1 mb-2">${escapar(extra)}</p>` : ''}
                        <p class="text-primary fw-bold mb-3">${formatearPrecio(producto.precio, moneda)}</p>
                        ${accion(producto)}
                    </div>
                </div>
            </div>`;
        }).join('');

        const paginas = Math.ceil(encontrados.length / porPagina);
        if (!paginacion || paginas < 2) return;

        for (let i = 1; i <= paginas; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === pagina ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link">${i}</a>`;
            li.addEventListener('click', () => {
                dibujar(i);
                window.scrollTo({ top: 300, behavior: 'smooth' });
            });
            paginacion.appendChild(li);
        }
    };

    dibujar(1);
}

// --- FICHA DE PRODUCTO ---

export async function iniciarFicha(opciones = {}) {
    const { galeria = () => [IMAGEN_GENERICA] } = opciones;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const categoria = params.get('cat');

    const cargando = document.getElementById('loading-detalle');
    const contenido = document.getElementById('content-detalle');
    const noEncontrado = document.getElementById('detalle-no-encontrado');

    const terminar = () => {
        cargando?.classList.add('d-none');
        document.getElementById('spinner')?.classList.remove('show');
    };

    if (!id || !categoria) { noEncontrado?.classList.remove('d-none'); terminar(); return; }

    try {
        const snapshot = await get(ref(db, `data_productos/${categoria}/${id}`));
        if (!snapshot.exists()) { noEncontrado?.classList.remove('d-none'); terminar(); return; }

        const datos = snapshot.val();
        const poner = (elemento, texto) => {
            const el = document.getElementById(elemento);
            if (el) el.textContent = texto;
        };

        poner('p-nombre', datos.nombre || 'Producto');
        poner('p-id', id);
        poner('p-descripcion', datos.descripcion || 'Sin descripcion disponible.');
        poner('p-precio', formatearPrecio(datos.precio));
        poner('p-ficha', [
            datos.marca ? `Marca: ${datos.marca}` : '',
            datos.modelo ? `Modelo: ${datos.modelo}` : ''
        ].filter(Boolean).join(' \u00b7 '));

        mostrarGaleria(galeria(id, datos), datos.nombre || 'Producto');

        const boton = document.getElementById('btn-wa');
        if (boton) {
            // contacto.js reescribe el numero con el que este configurado.
            const mensaje = encodeURIComponent(`Hola, me interesa el producto: ${datos.nombre} (ID: ${id})`);
            boton.href = `https://wa.me/7226817326?text=${mensaje}`;
        }

        contenido?.classList.remove('d-none');
    } catch (e) {
        console.error('Error cargando el producto:', e);
        noEncontrado?.classList.remove('d-none');
    } finally {
        terminar();
    }
}

function mostrarGaleria(imagenes, nombre) {
    const principal = document.getElementById('p-imagen');
    const tira = document.getElementById('p-galeria');
    if (!principal) return;

    const lista = imagenes && imagenes.length ? imagenes : [IMAGEN_GENERICA];
    principal.src = lista[0];
    principal.alt = nombre;

    if (!tira) return;
    tira.innerHTML = '';
    if (lista.length < 2) return;

    for (const ruta of lista) {
        const miniatura = document.createElement('img');
        miniatura.src = ruta;
        miniatura.alt = nombre;
        miniatura.loading = 'lazy';
        miniatura.className = 'border rounded p-1 bg-white';
        miniatura.style.cssText = 'width:72px;height:72px;object-fit:contain;cursor:pointer;';
        miniatura.addEventListener('click', () => { principal.src = ruta; });
        tira.appendChild(miniatura);
    }
}
