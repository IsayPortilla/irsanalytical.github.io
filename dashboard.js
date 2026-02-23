// import { db } from '../firebase.js';
// import { ref, push, onValue, remove, update, get } 
//     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// // Selectores
// const selEmp = document.getElementById('sel-empresa');
// const selSub = document.getElementById('sel-submarca');
// const selCat = document.getElementById('sel-categoria');
// const tabla = document.getElementById('tabla-prods');
// const btnAddProd = document.getElementById('btn-nuevo-prod');

// // --- 1. CARGA DE ESTRUCTURA (BAJO DEMANDA) ---

// // Escucha inicial de Empresas
// onValue(ref(db, 'nombres_empresa'), (snap) => {
//     llenarSelect(selEmp, snap.val());
// });

// // Al cambiar Empresa -> Carga Submarcas
// selEmp.onchange = async () => {
//     resetSelects(['sub', 'cat']);
//     if (!selEmp.value) return;
//     const snap = await get(ref(db, `nombres_submarca/${selEmp.value}`));
//     llenarSelect(selSub, snap.val());
// };

// // Al cambiar Submarca -> Carga Categorías
// selSub.onchange = async () => {
//     resetSelects(['cat']);
//     if (!selSub.value) return;
//     const snap = await get(ref(db, `nombres_categoria/${selSub.value}`));
//     llenarSelect(selCat, snap.val());
// };

// // Al cambiar Categoría -> Carga Realtime de Productos
// selCat.onchange = () => {
//     if (!selCat.value) {
//         btnAddProd.disabled = true;
//         tabla.innerHTML = '';
//         return;
//     }
//     btnAddProd.disabled = false;
//     onValue(ref(db, `data_productos/${selCat.value}`), (snap) => {
//         tabla.innerHTML = '';
//         snap.forEach(child => renderFila(child.key, child.val()));
//     });
// };

// // --- 2. GESTIÓN DE NODOS (EMPRESA / SUB / CAT) ---

// window.adminNodo = async (nivel, accion) => {
//     let path = '', parentId = '', el = null;

//     if (nivel === 'empresa') {
//         path = 'nombres_empresa';
//         el = selEmp;
//     } else if (nivel === 'submarca') {
//         if (!selEmp.value) return alert("Selecciona una empresa");
//         path = `nombres_submarca/${selEmp.value}`;
//         el = selSub;
//     } else {
//         if (!selSub.value) return alert("Selecciona una submarca");
//         path = `nombres_categoria/${selSub.value}`;
//         el = selCat;
//     }

//     if (accion === 'crear') {
//         const n = prompt(`Nombre de la nueva ${nivel}:`);
//         if (n) push(ref(db, path), { nombre: n });
//     } else {
//         if (!el.value) return alert("Selecciona un elemento");
//         const n = prompt("Nuevo nombre:", "Cargando...");
//         if (n) update(ref(db, `${path}/${el.value}`), { nombre: n });
//     }
// };

// // --- 3. CRUD DE PRODUCTOS ---

// window.abrirModalProd = () => {
//     document.getElementById('form-prod').reset();
//     document.getElementById('p-id').value = '';
//     new bootstrap.Modal(document.getElementById('modalProd')).show();
// };

// document.getElementById('form-prod').onsubmit = (e) => {
//     e.preventDefault();
//     const id = document.getElementById('p-id').value;
//     const data = {
//         nombre: document.getElementById('p-nombre').value,
//         precio: document.getElementById('p-precio').value,
//         stock: document.getElementById('p-stock').value,
//         oferta: document.getElementById('p-oferta').checked
//     };
//     const path = `data_productos/${selCat.value}`;
    
//     if (!id) push(ref(db, path), data);
//     else update(ref(db, `${path}/${id}`), data);

//     bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
// };

// window.prepararEdit = (id, p) => {
//     document.getElementById('p-id').value = id;
//     document.getElementById('p-nombre').value = p.nombre;
//     document.getElementById('p-precio').value = p.precio;
//     document.getElementById('p-stock').value = p.stock;
//     document.getElementById('p-oferta').checked = p.oferta;
//     new bootstrap.Modal(document.getElementById('modalProd')).show();
// };

// window.eliminarProd = (id) => {
//     if (confirm("¿Eliminar producto?")) remove(ref(db, `data_productos/${selCat.value}/${id}`));
// };

// // --- HELPERS ---

// function llenarSelect(el, data) {
//     el.innerHTML = '<option value="">-- Seleccionar --</option>';
//     if (data) Object.entries(data).forEach(([id, val]) => {
//         el.innerHTML += `<option value="${id}">${val.nombre}</option>`;
//     });
// }

// function resetSelects(keys) {
//     if (keys.includes('sub')) selSub.innerHTML = '';
//     if (keys.includes('cat')) selCat.innerHTML = '';
//     tabla.innerHTML = '';
//     btnAddProd.disabled = true;
// }

// function renderFila(id, p) {
//     tabla.innerHTML += `
//         <tr>
//             <td class="ps-4"><b>${p.nombre}</b></td>
//             <td>$${p.precio}</td>
//             <td>${p.stock}</td>
//             <td>${p.oferta ? '<span class="badge badge-oferta">OFERTA</span>' : 'Normal'}</td>
//             <td class="text-end pe-4">
//                 <button class="btn btn-sm btn-light" onclick='window.prepararEdit("${id}", ${JSON.stringify(p)})'><i class="bi bi-pencil"></i></button>
//                 <button class="btn btn-sm btn-light text-danger" onclick="window.eliminarProd('${id}')"><i class="bi bi-trash"></i></button>
//             </td>
//         </tr>`;
// }
import { db } from '../firebase.js';
import { ref, push, onValue, remove, update, set } 
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- SELECTORES DEL DOM ---
const selEmp = document.getElementById('sel-empresa');
const selSub = document.getElementById('sel-submarca');
const selCat = document.getElementById('sel-categoria');
const tabla = document.getElementById('tabla-prods');
const btnAddProd = document.getElementById('btn-nuevo-prod');
const formProd = document.getElementById('form-prod');

// Variables para controlar los listeners activos y evitar fugas de memoria
let listenerSub = null;
let listenerCat = null;
let listenerProd = null;

// --- 1. CARGA DE ESTRUCTURA RELACIONADA ---

// Nivel 1: Cargar Empresas (Raíz)
onValue(ref(db, 'nombres_empresa'), (snap) => {
    llenarSelect(selEmp, snap.val());
});

// Nivel 2: Cargar Submarcas FILTRADAS por Empresa
selEmp.onchange = () => {
    const empId = selEmp.value;
    resetSelects(['sub', 'cat']);
    
    if (!empId) return;

    // Ruta específica: submarcas pertenecen a ESTA empresa
    const pathSub = `relacion_empresa_submarca/${empId}`;
    onValue(ref(db, pathSub), (snap) => {
        llenarSelect(selSub, snap.val());
    });
};

// Nivel 3: Cargar Categorías FILTRADAS por Submarca
selSub.onchange = () => {
    const subId = selSub.value;
    resetSelects(['cat']);
    
    if (!subId) return;

    // Ruta específica: categorías pertenecen a ESTA submarca
    const pathCat = `relacion_submarca_categoria/${subId}`;
    onValue(ref(db, pathCat), (snap) => {
        llenarSelect(selCat, snap.val());
    });
};

// Nivel 4: Cargar Productos de la Categoría seleccionada
selCat.onchange = () => {
    const catId = selCat.value;
    if (!catId) {
        btnAddProd.disabled = true;
        tabla.innerHTML = '';
        return;
    }
    btnAddProd.disabled = false;
    
    const pathProds = `data_productos/${catId}`;
    onValue(ref(db, pathProds), (snap) => {
        tabla.innerHTML = '';
        if (snap.exists()) {
            snap.forEach(child => renderFila(child.key, child.val()));
        }
    });
};

// --- 2. GESTIÓN DE NODOS (CREAR / EDITAR CON RELACIÓN) ---

window.adminNodo = async (nivel, accion) => {
    let path = '';
    let el = null;
    let nombreNivel = '';

    if (nivel === 'empresa') {
        path = 'nombres_empresa';
        el = selEmp;
        nombreNivel = 'Empresa';
    } else if (nivel === 'submarca') {
        if (!selEmp.value) return alert("Selecciona una Empresa primero");
        path = `relacion_empresa_submarca/${selEmp.value}`;
        el = selSub;
        nombreNivel = 'Submarca';
    } else if (nivel === 'categoria') {
        if (!selSub.value) return alert("Selecciona una Submarca primero");
        path = `relacion_submarca_categoria/${selSub.value}`;
        el = selCat;
        nombreNivel = 'Categoría';
    }

    if (accion === 'crear') {
        const n = prompt(`Nombre de la nueva ${nombreNivel}:`);
        if (n && n.trim() !== "") {
            const nuevoRef = push(ref(db, path));
            set(nuevoRef, { nombre: n.trim() });
        }
    } else if (accion === 'editar') {
        if (!el.value) return alert(`Selecciona una ${nombreNivel} para editar`);
        const nombreActual = el.options[el.selectedIndex].text;
        const n = prompt(`Editar nombre de ${nombreNivel}:`, nombreActual);
        if (n && n.trim() !== "" && n !== nombreActual) {
            update(ref(db, `${path}/${el.value}`), { nombre: n.trim() });
        }
    }
};

// --- 3. CRUD DE PRODUCTOS ---

window.abrirModalProd = () => {
    formProd.reset();
    document.getElementById('p-id').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalProd'));
    modal.show();
};

formProd.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const catId = selCat.value;

    const data = {
        nombre: document.getElementById('p-nombre').value,
        precio: document.getElementById('p-precio').value,
        stock: document.getElementById('p-stock').value,
        oferta: document.getElementById('p-oferta').checked
    };

    // Los productos se guardan bajo la ID única de la categoría
    const path = `data_productos/${catId}`;
    
    if (!id) {
        push(ref(db, path), data);
    } else {
        update(ref(db, `${path}/${id}`), data);
    }

    bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
};

window.prepararEdit = (id, p) => {
    document.getElementById('p-id').value = id;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-precio').value = p.precio;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-oferta').checked = p.oferta;
    
    const modal = new bootstrap.Modal(document.getElementById('modalProd'));
    modal.show();
};

window.eliminarProd = (id) => {
    if (confirm("¿Eliminar este producto definitivamente?")) {
        remove(ref(db, `data_productos/${selCat.value}/${id}`));
    }
};

// --- HELPERS ---

function llenarSelect(el, data) {
    const valPrevio = el.value; // Guardar selección si existe
    el.innerHTML = '<option value="">-- Seleccionar --</option>';
    if (data) {
        Object.entries(data).forEach(([id, val]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = val.nombre;
            el.appendChild(opt);
        });
    }
    el.value = valPrevio; // Intentar restaurar
}

function resetSelects(keys) {
    if (keys.includes('sub')) {
        selSub.innerHTML = '<option value="">-- Seleccionar --</option>';
    }
    if (keys.includes('cat')) {
        selCat.innerHTML = '<option value="">-- Seleccionar --</option>';
    }
    tabla.innerHTML = '';
    btnAddProd.disabled = true;
}

function renderFila(id, p) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td class="ps-4">
            <div class="fw-bold">${p.nombre}</div>
            <small class="text-muted" style="font-size: 0.7rem;">REF: ${id.substring(0,8)}</small>
        </td>
        <td>$${parseFloat(p.precio).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
        <td>${p.stock}</td>
        <td>
            ${p.oferta 
                ? '<span class="badge bg-danger">OFERTA</span>' 
                : '<span class="badge bg-secondary opacity-50">Normal</span>'}
        </td>
        <td class="text-end pe-4">
            <button class="btn btn-sm btn-outline-primary me-1" onclick='window.prepararEdit("${id}", ${JSON.stringify(p)})'>
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarProd('${id}')">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    tabla.appendChild(fila);
}