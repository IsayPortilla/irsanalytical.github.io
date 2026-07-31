// Panel de administracion: catalogo, datos de contacto, usuarios y resumen.
//
// Todo se resuelve en el navegador con JavaScript nativo contra Firebase.

import { auth, db, firebaseConfig } from './firebase.js';
import { exigirAdmin } from './guarda_admin.js';
import {
    CAMPOS_CONTACTO, CONTACTO_POR_DEFECTO, RUTA_CONFIG
} from './contacto.js';
import {
    ref, get, set, push, update, remove, onValue
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
    cargarMapeoImagenes, refrescarMapeoImagenes, cargarIndiceImagenes,
    imagenDeProducto, IMAGEN_POR_DEFECTO
} from './irlanalytical/js/imagenes_productos.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let admin = null;
let mapeoImagenes = {};
let indiceImagenes = {};
let productosVista = [];
let cancelarEscuchaProd = null;
// Arbol completo del catalogo, para el resumen y el selector de categorias.
let arbol = { empresas: {}, submarcas: {}, categorias: {}, productos: {} };

// --- UTILIDADES ---

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function avisar(mensaje, tipo = 'success') {
    const contenedor = $('#avisos');
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapar(mensaje)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"></button>
        </div>`;
    contenedor.appendChild(el);
    setTimeout(() => el.remove(), 4500);
}

function precioLegible(precio) {
    const n = parseFloat(precio);
    if (!Number.isFinite(n) || n <= 0) return 'Consultar';
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

function fechaLegible(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// --- NAVEGACION ENTRE VISTAS ---

function activarVista(nombre) {
    $$('.vista').forEach((v) => v.classList.toggle('activa', v.dataset.vista === nombre));
    $$('.sidebar .nav-link').forEach((a) => a.classList.toggle('activo', a.dataset.vista === nombre));
}

$$('.sidebar .nav-link[data-vista]').forEach((enlace) => {
    enlace.addEventListener('click', (e) => {
        e.preventDefault();
        activarVista(enlace.dataset.vista);
    });
});

// --- CATALOGO: ARBOL Y SELECTORES ---

const selEmp = $('#sel-empresa');
const selSub = $('#sel-submarca');
const selCat = $('#sel-categoria');
const tablaProds = $('#tabla-prods');
const btnNuevoProd = $('#btn-nuevo-prod');
const buscarProd = $('#buscar-prod');

function llenarSelect(el, datos, textoVacio = '-- Seleccionar --') {
    const previo = el.value;
    el.innerHTML = `<option value="">${textoVacio}</option>`;
    Object.entries(datos || {}).forEach(([id, val]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = val.nombre || '(sin nombre)';
        el.appendChild(opt);
    });
    if ([...el.options].some((o) => o.value === previo)) el.value = previo;
}

async function cargarArbol() {
    const [emp, sub, cat, prod] = await Promise.all([
        get(ref(db, 'nombres_empresa')),
        get(ref(db, 'relacion_empresa_submarca')),
        get(ref(db, 'relacion_submarca_categoria')),
        get(ref(db, 'data_productos'))
    ]);
    arbol = {
        empresas: emp.exists() ? emp.val() : {},
        submarcas: sub.exists() ? sub.val() : {},
        categorias: cat.exists() ? cat.val() : {},
        productos: prod.exists() ? prod.val() : {}
    };
    llenarSelect(selEmp, arbol.empresas, '-- Todas --');
}

selEmp.addEventListener('change', () => {
    selSub.innerHTML = '<option value="">-- Seleccionar --</option>';
    selCat.innerHTML = '<option value="">-- Seleccionar --</option>';
    limpiarTablaProductos();
    if (selEmp.value) llenarSelect(selSub, arbol.submarcas[selEmp.value]);
});

selSub.addEventListener('change', () => {
    selCat.innerHTML = '<option value="">-- Seleccionar --</option>';
    limpiarTablaProductos();
    if (selSub.value) llenarSelect(selCat, arbol.categorias[selSub.value]);
});

selCat.addEventListener('change', () => escucharProductos(selCat.value));

function limpiarTablaProductos() {
    if (cancelarEscuchaProd) {
        cancelarEscuchaProd();
        cancelarEscuchaProd = null;
    }
    productosVista = [];
    tablaProds.innerHTML = '';
    btnNuevoProd.disabled = true;
    buscarProd.disabled = true;
    buscarProd.value = '';
    $('#conteo-prods').textContent = '';
}

function escucharProductos(catId) {
    limpiarTablaProductos();
    if (!catId) return;

    btnNuevoProd.disabled = false;
    buscarProd.disabled = false;

    cancelarEscuchaProd = onValue(ref(db, `data_productos/${catId}`), (snap) => {
        productosVista = [];
        snap.forEach((hijo) => {
            productosVista.push({ id: hijo.key, ...hijo.val() });
        });
        arbol.productos[catId] = snap.exists() ? snap.val() : {};
        pintarProductos();
    });
}

function pintarProductos() {
    const filtro = buscarProd.value.trim().toLowerCase();
    const lista = filtro
        ? productosVista.filter((p) => (p.nombre || '').toLowerCase().includes(filtro))
        : productosVista;

    $('#conteo-prods').textContent = filtro
        ? `(${lista.length} de ${productosVista.length})`
        : `(${productosVista.length})`;

    if (!lista.length) {
        tablaProds.innerHTML = `
            <tr><td colspan="6" class="text-center text-muted py-5">
                ${filtro ? 'Ningun producto coincide con la busqueda.' : 'Esta categoria no tiene productos.'}
            </td></tr>`;
        return;
    }

    tablaProds.innerHTML = lista.map((p) => {
        const imagen = imagenDeProducto(mapeoImagenes, p.id, p);
        const entrada = mapeoImagenes[p.id];
        const generica = imagen === IMAGEN_POR_DEFECTO;
        const etiquetaImg = generica
            ? '<span class="badge bg-warning text-dark">sin imagen</span>'
            : (entrada && entrada.manual ? '<span class="badge bg-info text-dark">fijada</span>' : '');

        return `
            <tr>
                <td class="ps-4">
                    <img src="${escapar(imagen)}" class="miniatura" alt="" loading="lazy">
                </td>
                <td>
                    <div class="fw-semibold">${escapar(p.nombre)}</div>
                    <div class="d-flex gap-2 align-items-center mt-1">
                        <small class="text-muted" style="font-size:.7rem;">REF ${escapar(p.id.substring(0, 8))}</small>
                        ${etiquetaImg}
                        ${p.descripcion ? '' : '<span class="badge bg-light text-muted border">sin descripcion</span>'}
                    </div>
                </td>
                <td>${escapar(precioLegible(p.precio))}</td>
                <td>${escapar(p.stock ?? '--')}</td>
                <td>${p.oferta
                    ? '<span class="badge bg-danger">Oferta</span>'
                    : '<span class="badge bg-light text-secondary border">Normal</span>'}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-1" data-editar="${escapar(p.id)}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-borrar="${escapar(p.id)}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

buscarProd.addEventListener('input', pintarProductos);

tablaProds.addEventListener('click', (e) => {
    const editar = e.target.closest('[data-editar]');
    const borrar = e.target.closest('[data-borrar]');
    if (editar) abrirModalProducto(editar.dataset.editar);
    if (borrar) eliminarProducto(borrar.dataset.borrar);
});

// --- CATALOGO: NODOS (EMPRESA / SUBMARCA / CATEGORIA) ---

function rutaNodo(nivel) {
    if (nivel === 'empresa') return { path: 'nombres_empresa', el: selEmp, etiqueta: 'empresa' };
    if (nivel === 'submarca') {
        if (!selEmp.value) return null;
        return { path: `relacion_empresa_submarca/${selEmp.value}`, el: selSub, etiqueta: 'submarca' };
    }
    if (!selSub.value) return null;
    return { path: `relacion_submarca_categoria/${selSub.value}`, el: selCat, etiqueta: 'categoria' };
}

// Contar lo que cuelga de un nodo antes de borrarlo evita sorpresas: al quitar
// una empresa desaparecen tambien sus submarcas, categorias y productos.
function contarDescendientes(nivel, id) {
    if (nivel === 'categoria') {
        return { categorias: 1, productos: Object.keys(arbol.productos[id] || {}).length };
    }
    if (nivel === 'submarca') {
        const cats = Object.keys(arbol.categorias[id] || {});
        return {
            categorias: cats.length,
            productos: cats.reduce((n, c) => n + Object.keys(arbol.productos[c] || {}).length, 0)
        };
    }
    const subs = Object.keys(arbol.submarcas[id] || {});
    let categorias = 0;
    let productos = 0;
    for (const s of subs) {
        const cats = Object.keys(arbol.categorias[s] || {});
        categorias += cats.length;
        productos += cats.reduce((n, c) => n + Object.keys(arbol.productos[c] || {}).length, 0);
    }
    return { submarcas: subs.length, categorias, productos };
}

async function eliminarNodo(nivel, destino) {
    const id = destino.el.value;
    const nombre = destino.el.options[destino.el.selectedIndex].text;
    const cuenta = contarDescendientes(nivel, id);

    const detalle = [
        cuenta.submarcas ? `${cuenta.submarcas} submarca(s)` : '',
        cuenta.categorias ? `${cuenta.categorias} categoria(s)` : '',
        cuenta.productos ? `${cuenta.productos} producto(s)` : ''
    ].filter(Boolean).join(', ');

    const mensaje = `Se eliminara "${nombre}"`
        + (detalle ? ` y con ella ${detalle}.` : '.')
        + '\n\nEsta accion no se puede deshacer. Escribe ELIMINAR para confirmar.';

    if (prompt(mensaje) !== 'ELIMINAR') return;

    const borrados = [remove(ref(db, `${destino.path}/${id}`))];

    if (nivel === 'categoria') {
        borrados.push(remove(ref(db, `data_productos/${id}`)));
    } else if (nivel === 'submarca') {
        for (const c of Object.keys(arbol.categorias[id] || {})) {
            borrados.push(remove(ref(db, `data_productos/${c}`)));
        }
        borrados.push(remove(ref(db, `relacion_submarca_categoria/${id}`)));
    } else {
        for (const s of Object.keys(arbol.submarcas[id] || {})) {
            for (const c of Object.keys(arbol.categorias[s] || {})) {
                borrados.push(remove(ref(db, `data_productos/${c}`)));
            }
            borrados.push(remove(ref(db, `relacion_submarca_categoria/${s}`)));
        }
        borrados.push(remove(ref(db, `relacion_empresa_submarca/${id}`)));
    }

    await Promise.all(borrados);
    avisar(`${destino.etiqueta} eliminada`);
    await recargarTodo();
}

$$('[data-nodo]').forEach((boton) => {
    boton.addEventListener('click', async () => {
        const nivel = boton.dataset.nodo;
        const accion = boton.dataset.accion;
        const destino = rutaNodo(nivel);

        if (!destino) {
            avisar(nivel === 'submarca'
                ? 'Selecciona primero una empresa'
                : 'Selecciona primero una submarca', 'warning');
            return;
        }

        try {
            if (accion === 'crear') {
                const nombre = prompt(`Nombre de la nueva ${destino.etiqueta}:`);
                if (!nombre || !nombre.trim()) return;
                await set(push(ref(db, destino.path)), { nombre: nombre.trim() });
                avisar(`${destino.etiqueta} creada`);
                await recargarTodo();
                return;
            }

            if (!destino.el.value) {
                avisar(`Selecciona una ${destino.etiqueta}`, 'warning');
                return;
            }

            if (accion === 'editar') {
                const actual = destino.el.options[destino.el.selectedIndex].text;
                const nombre = prompt(`Nuevo nombre de la ${destino.etiqueta}:`, actual);
                if (!nombre || !nombre.trim() || nombre === actual) return;
                await update(ref(db, `${destino.path}/${destino.el.value}`), { nombre: nombre.trim() });
                avisar('Nombre actualizado');
                await recargarTodo();
                return;
            }

            if (accion === 'eliminar') await eliminarNodo(nivel, destino);
        } catch (e) {
            avisar(`No se pudo completar: ${e.message}`, 'danger');
        }
    });
});

// --- CATALOGO: PRODUCTOS ---

function listaCategoriasPlana() {
    const salida = [];
    for (const [idEmp, emp] of Object.entries(arbol.empresas)) {
        for (const idSub of Object.keys(arbol.submarcas[idEmp] || {})) {
            const sub = arbol.submarcas[idEmp][idSub];
            for (const [idCat, cat] of Object.entries(arbol.categorias[idSub] || {})) {
                salida.push({
                    id: idCat,
                    etiqueta: `${emp.nombre} / ${sub.nombre} / ${cat.nombre}`
                });
            }
        }
    }
    return salida.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
}

function actualizarVistaPreviaImagen() {
    const carpeta = $('#p-imagen-carpeta').value.trim();
    const preview = $('#p-preview');
    const origen = $('#p-origen-imagen');

    if (carpeta && indiceImagenes[carpeta] && indiceImagenes[carpeta].length) {
        preview.src = `img/productos/${carpeta}/${indiceImagenes[carpeta][0]}`;
        origen.innerHTML = `<span class="text-info">Imagen fijada a mano</span>
            &middot; ${indiceImagenes[carpeta].length} foto(s)`;
        return;
    }

    if (carpeta) {
        preview.src = IMAGEN_POR_DEFECTO;
        origen.innerHTML = '<span class="text-danger">Esa carpeta no existe</span>';
        return;
    }

    const id = $('#p-id').value;
    const entrada = id ? mapeoImagenes[id] : null;
    if (entrada) {
        preview.src = entrada.imagen;
        origen.innerHTML = `Automatica &middot; <code class="small">${escapar(entrada.carpeta)}</code>`;
    } else {
        preview.src = IMAGEN_POR_DEFECTO;
        origen.innerHTML = '<span class="text-warning">Sin imagen asociada</span>';
    }
}

$('#p-imagen-carpeta').addEventListener('input', actualizarVistaPreviaImagen);
$('#btn-imagen-auto').addEventListener('click', () => {
    $('#p-imagen-carpeta').value = '';
    actualizarVistaPreviaImagen();
});

function abrirModalProducto(id) {
    const producto = id ? productosVista.find((p) => p.id === id) : null;

    $('#titulo-modal-prod').textContent = producto ? 'Editar producto' : 'Nuevo producto';
    $('#p-id').value = producto ? producto.id : '';
    $('#p-nombre').value = producto ? (producto.nombre || '') : '';
    $('#p-descripcion').value = producto ? (producto.descripcion || '') : '';
    $('#p-marca').value = producto ? (producto.marca || '') : '';
    $('#p-modelo').value = producto ? (producto.modelo || '') : '';
    $('#p-precio').value = producto ? (producto.precio ?? '') : '0';
    $('#p-stock').value = producto ? (producto.stock ?? '') : '1';
    $('#p-oferta').checked = producto ? Boolean(producto.oferta) : false;
    $('#p-imagen-carpeta').value = producto ? (producto.imagenCarpeta || '') : '';

    const selector = $('#p-categoria');
    selector.innerHTML = listaCategoriasPlana()
        .map((c) => `<option value="${escapar(c.id)}">${escapar(c.etiqueta)}</option>`)
        .join('');
    selector.value = selCat.value;

    actualizarVistaPreviaImagen();
    new bootstrap.Modal($('#modalProd')).show();
}

btnNuevoProd.addEventListener('click', () => abrirModalProducto(null));

$('#form-prod').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#p-id').value;
    const categoriaOrigen = selCat.value;
    const categoriaDestino = $('#p-categoria').value;

    const datos = {
        nombre: $('#p-nombre').value.trim(),
        descripcion: $('#p-descripcion').value.trim(),
        marca: $('#p-marca').value.trim(),
        modelo: $('#p-modelo').value.trim(),
        precio: $('#p-precio').value.trim(),
        stock: $('#p-stock').value.trim(),
        oferta: $('#p-oferta').checked,
        imagenCarpeta: $('#p-imagen-carpeta').value.trim()
    };

    try {
        if (!id) {
            await set(push(ref(db, `data_productos/${categoriaDestino}`)), datos);
        } else if (categoriaDestino !== categoriaOrigen) {
            // Mover conserva la misma clave para no invalidar enlaces guardados.
            await set(ref(db, `data_productos/${categoriaDestino}/${id}`), datos);
            await remove(ref(db, `data_productos/${categoriaOrigen}/${id}`));
        } else {
            await update(ref(db, `data_productos/${categoriaOrigen}/${id}`), datos);
        }

        bootstrap.Modal.getInstance($('#modalProd')).hide();
        avisar('Producto guardado');
        mapeoImagenes = await refrescarMapeoImagenes();
        pintarProductos();
        await recargarResumen();
    } catch (err) {
        avisar(`No se pudo guardar: ${err.message}`, 'danger');
    }
});

async function eliminarProducto(id) {
    const producto = productosVista.find((p) => p.id === id);
    if (!confirm(`Eliminar "${producto ? producto.nombre : id}" definitivamente?`)) return;
    try {
        await remove(ref(db, `data_productos/${selCat.value}/${id}`));
        avisar('Producto eliminado');
        mapeoImagenes = await refrescarMapeoImagenes();
        await recargarResumen();
    } catch (e) {
        avisar(`No se pudo eliminar: ${e.message}`, 'danger');
    }
}

// --- CONTACTO ---

function pintarFormularioContacto(valores) {
    $('#campos-contacto').innerHTML = CAMPOS_CONTACTO.map((campo) => `
        <div class="col-md-${campo.ancho || 6}">
            <label class="form-label fw-bold small">${escapar(campo.etiqueta)}</label>
            <input type="${campo.tipo}" class="form-control" data-campo="${escapar(campo.clave)}"
                value="${escapar(valores[campo.clave] ?? '')}">
            ${campo.ayuda ? `<div class="form-text">${escapar(campo.ayuda)}</div>` : ''}
        </div>`).join('');
}

async function cargarContactoEnPanel() {
    const snap = await get(ref(db, RUTA_CONFIG));
    pintarFormularioContacto({ ...CONTACTO_POR_DEFECTO, ...(snap.exists() ? snap.val() : {}) });
}

$('#form-contacto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const valores = {};
    $$('#campos-contacto [data-campo]').forEach((input) => {
        valores[input.dataset.campo] = input.value.trim();
    });
    try {
        await set(ref(db, RUTA_CONFIG), valores);
        $('#estado-contacto').innerHTML = '<span class="text-success">Guardado</span>';
        avisar('Datos de contacto actualizados en todo el sitio');
    } catch (err) {
        avisar(`No se pudo guardar: ${err.message}`, 'danger');
    }
});

$('#btn-restaurar-contacto').addEventListener('click', () => {
    pintarFormularioContacto(CONTACTO_POR_DEFECTO);
    $('#estado-contacto').innerHTML = '<span class="text-muted">Revisa y pulsa guardar</span>';
});

// --- USUARIOS ---

function pintarUsuarios(usuarios) {
    const filas = Object.entries(usuarios || {});
    if (!filas.length) {
        $('#tabla-usuarios').innerHTML =
            '<tr><td colspan="5" class="text-center text-muted py-5">No hay usuarios registrados.</td></tr>';
        return;
    }

    $('#tabla-usuarios').innerHTML = filas.map(([uid, u]) => {
        const esYo = uid === admin.uid;
        const activo = u.activo !== false;
        return `
            <tr>
                <td class="ps-4">
                    <div class="fw-semibold">${escapar(u.username || '(sin nombre)')}
                        ${esYo ? '<span class="badge bg-secondary ms-1">tu cuenta</span>' : ''}</div>
                    <small class="text-muted">${escapar(u.email || '')}</small>
                </td>
                <td>
                    <select class="form-select form-select-sm" data-rol="${escapar(uid)}" ${esYo ? 'disabled' : ''}>
                        <option value="usuario" ${u.role !== 'admin' ? 'selected' : ''}>Usuario</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </td>
                <td>
                    <span class="badge ${activo ? 'bg-success' : 'bg-secondary'}">
                        ${activo ? 'Activo' : 'Desactivado'}
                    </span>
                </td>
                <td class="small text-muted">${escapar(fechaLegible(u.lastLogin || u.createdAt))}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-secondary me-1" data-reset="${escapar(u.email || '')}"
                        title="Enviar correo para restablecer la contrasena">
                        <i class="bi bi-envelope"></i>
                    </button>
                    <button class="btn btn-sm ${activo ? 'btn-outline-danger' : 'btn-outline-success'}"
                        data-activo="${escapar(uid)}" data-valor="${activo ? 'false' : 'true'}"
                        ${esYo ? 'disabled' : ''}
                        title="${activo ? 'Desactivar' : 'Activar'}">
                        <i class="bi ${activo ? 'bi-person-slash' : 'bi-person-check'}"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

$('#tabla-usuarios').addEventListener('change', async (e) => {
    const select = e.target.closest('[data-rol]');
    if (!select) return;
    try {
        await update(ref(db, `users/${select.dataset.rol}`), { role: select.value });
        avisar('Rol actualizado');
    } catch (err) {
        avisar(`No se pudo cambiar el rol: ${err.message}`, 'danger');
    }
});

$('#tabla-usuarios').addEventListener('click', async (e) => {
    const reset = e.target.closest('[data-reset]');
    const alternar = e.target.closest('[data-activo]');

    if (reset) {
        const correo = reset.dataset.reset;
        if (!correo) return avisar('Ese usuario no tiene correo registrado', 'warning');
        try {
            await sendPasswordResetEmail(auth, correo);
            avisar(`Correo de restablecimiento enviado a ${correo}`);
        } catch (err) {
            avisar(`No se pudo enviar: ${err.message}`, 'danger');
        }
    }

    if (alternar) {
        try {
            await update(ref(db, `users/${alternar.dataset.activo}`), {
                activo: alternar.dataset.valor === 'true'
            });
            avisar('Estado actualizado');
        } catch (err) {
            avisar(`No se pudo actualizar: ${err.message}`, 'danger');
        }
    }
});

$('#btn-nuevo-usuario').addEventListener('click', () => {
    $('#form-usuario').reset();
    $('#error-usuario').classList.add('d-none');
    new bootstrap.Modal($('#modalUsuario')).show();
});

$('#form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const error = $('#error-usuario');
    error.classList.add('d-none');

    // Crear la cuenta con la instancia principal dejaria al administrador
    // dentro de la sesion del usuario recien creado. Una segunda instancia
    // aislada evita ese efecto.
    const appAlta = initializeApp(firebaseConfig, `alta-${Date.now()}`);
    const authAlta = getAuth(appAlta);

    try {
        const credencial = await createUserWithEmailAndPassword(
            authAlta, $('#u-email').value.trim(), $('#u-pass').value
        );
        await set(ref(db, `users/${credencial.user.uid}`), {
            username: $('#u-nombre').value.trim(),
            email: $('#u-email').value.trim(),
            role: $('#u-rol').value,
            activo: true,
            createdAt: new Date().toISOString()
        });
        bootstrap.Modal.getInstance($('#modalUsuario')).hide();
        avisar('Usuario creado');
    } catch (err) {
        error.textContent = err.message;
        error.classList.remove('d-none');
    } finally {
        await signOut(authAlta).catch(() => {});
        await deleteApp(appAlta).catch(() => {});
    }
});

// --- RESUMEN ---

function tarjetaKpi(valor, etiqueta, icono) {
    return `
        <div class="col-6 col-lg-3">
            <div class="card p-3 h-100">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="kpi">${valor}</div>
                        <div class="nav-label mt-1">${etiqueta}</div>
                    </div>
                    <i class="bi ${icono} fs-4 text-secondary opacity-50"></i>
                </div>
            </div>
        </div>`;
}

async function recargarResumen() {
    const todosProductos = [];
    for (const [idCat, productos] of Object.entries(arbol.productos)) {
        for (const [id, p] of Object.entries(productos || {})) {
            todosProductos.push({ id, categoria: idCat, ...p });
        }
    }

    let totalSubmarcas = 0;
    Object.values(arbol.submarcas).forEach((s) => { totalSubmarcas += Object.keys(s || {}).length; });
    let totalCategorias = 0;
    Object.values(arbol.categorias).forEach((c) => { totalCategorias += Object.keys(c || {}).length; });

    let usuarios = {};
    try {
        const snap = await get(ref(db, 'users'));
        if (snap.exists()) usuarios = snap.val();
    } catch (e) {
        usuarios = {};
    }
    pintarUsuarios(usuarios);

    $('#kpis').innerHTML = [
        tarjetaKpi(Object.keys(arbol.empresas).length, 'Empresas', 'bi-building'),
        tarjetaKpi(totalCategorias, 'Categorias', 'bi-tags'),
        tarjetaKpi(todosProductos.length, 'Productos', 'bi-box-seam'),
        tarjetaKpi(Object.keys(usuarios).length, 'Usuarios', 'bi-people')
    ].join('');

    const sinImagen = todosProductos.filter((p) => !mapeoImagenes[p.id]);
    const sinDescripcion = todosProductos.filter((p) => !p.descripcion);
    const sinPrecio = todosProductos.filter((p) => !(parseFloat(p.precio) > 0));
    const sinStock = todosProductos.filter((p) => !(parseInt(p.stock, 10) > 0));

    const linea = (n, total, texto, tipo) => {
        const pct = total ? Math.round((n / total) * 100) : 0;
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>${texto}</span>
                    <span class="fw-semibold">${n} <span class="text-muted fw-normal">(${pct}%)</span></span>
                </div>
                <div class="progress mt-1" style="height:6px;">
                    <div class="progress-bar bg-${tipo}" style="width:${pct}%"></div>
                </div>
            </div>`;
    };

    const total = todosProductos.length;
    $('#salud-catalogo').innerHTML = total ? [
        linea(sinImagen.length, total, 'Productos sin imagen asociada', 'warning'),
        linea(sinDescripcion.length, total, 'Productos sin descripcion', 'info'),
        linea(sinPrecio.length, total, 'Productos con precio a consultar', 'secondary'),
        linea(sinStock.length, total, 'Productos sin stock', 'danger'),
        `<div class="text-muted mt-3" style="font-size:.82rem;">
            La imagen se asigna sola a partir del nombre del producto; puedes fijar otra
            desde la ficha de cada uno.
        </div>`
    ].join('') : '<span class="text-muted">Todavia no hay productos.</span>';

    const porEmpresa = Object.entries(arbol.empresas).map(([idEmp, emp]) => {
        let n = 0;
        for (const idSub of Object.keys(arbol.submarcas[idEmp] || {})) {
            for (const idCat of Object.keys(arbol.categorias[idSub] || {})) {
                n += Object.keys(arbol.productos[idCat] || {}).length;
            }
        }
        return { nombre: emp.nombre, n };
    }).sort((a, b) => b.n - a.n);

    const mayor = Math.max(1, ...porEmpresa.map((e) => e.n));
    $('#reparto-empresas').innerHTML = porEmpresa.map((e) => `
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>${escapar(e.nombre)}</span>
                <span class="fw-semibold">${e.n}</span>
            </div>
            <div class="progress mt-1" style="height:6px;">
                <div class="progress-bar" style="width:${Math.round((e.n / mayor) * 100)}%"></div>
            </div>
        </div>`).join('') || '<span class="text-muted">Sin empresas registradas.</span>';
}

async function recargarTodo() {
    await cargarArbol();
    await recargarResumen();
}

// --- ARRANQUE ---

$('#btn-salir').addEventListener('click', () => {
    signOut(auth).then(() => { window.location.href = 'login.html'; });
});

(async function iniciar() {
    admin = await exigirAdmin('login.html');
    $('#admin-email').textContent = admin.email;

    [indiceImagenes, mapeoImagenes] = await Promise.all([
        cargarIndiceImagenes(),
        cargarMapeoImagenes()
    ]);

    $('#lista-carpetas').innerHTML = Object.keys(indiceImagenes)
        .sort()
        .map((c) => `<option value="${escapar(c)}"></option>`)
        .join('');

    await cargarArbol();
    await cargarContactoEnPanel();
    await recargarResumen();

    // Mantener la lista de usuarios al dia mientras el panel esta abierto.
    onValue(ref(db, 'users'), (snap) => {
        if (admin) pintarUsuarios(snap.exists() ? snap.val() : {});
    }, () => { /* sin permisos de lectura: la tabla queda como estaba */ });
})();
