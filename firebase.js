// 1. Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
    getDatabase, 
    ref, 
    set, 
    get 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 2. Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBZ4-ubMrRR_Zluskp7041b4HMOGbCk2ZM",
    authDomain: "irsanalyticalservice-507d9.firebaseapp.com",
    projectId: "irsanalyticalservice-507d9",
    storageBucket: "irsanalyticalservice-507d9.firebasestorage.app",
    messagingSenderId: "209418813356",
    appId: "1:209418813356:web:00fe49cfe67be270c10409",
};

// Inicialización
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// --- LÓGICA DE INTERFAZ DE USUARIO (AUTH) ---

let isLoggingIn = false; // Estado para alternar entre Login y Registro

const btnSwitch = document.getElementById('btn-switch');
if (btnSwitch) {
    btnSwitch.addEventListener('click', (e) => {
        e.preventDefault();
        isLoggingIn = !isLoggingIn;

        const authTitle = document.getElementById('auth-title');
        const btnAuth = document.getElementById('btn-auth');
        const nameField = document.getElementById('name-field');
        const repeatPassField = document.getElementById('repeat-pass-field');
        const toggleText = document.getElementById('toggle-text');

        if (isLoggingIn) {
            if (authTitle) authTitle.innerText = "Iniciar Sesión";
            if (btnAuth) btnAuth.innerText = "Entrar";
            if (btnSwitch) btnSwitch.innerText = "Regístrate aquí";
            if (toggleText) toggleText.firstChild.textContent = "¿No tienes cuenta? ";
            
            // Seguridad contra error classList undefined
            if (nameField) nameField.classList.add('d-none');
            if (repeatPassField) repeatPassField.classList.add('d-none');
        } else {
            if (authTitle) authTitle.innerText = "Crear Sesión";
            if (btnAuth) btnAuth.innerText = "Registrar";
            if (btnSwitch) btnSwitch.innerText = "Inicia Sesión";
            if (toggleText) toggleText.firstChild.textContent = "¿Ya tienes cuenta? ";
            
            if (nameField) nameField.classList.remove('d-none');
            if (repeatPassField) repeatPassField.classList.remove('d-none');
        }
    });
}

// --- PROCESO DE REGISTRO E INICIO DE SESIÓN ---

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;

        try {
            if (isLoggingIn) {
                await signInWithEmailAndPassword(auth, email, pass);
                alert("¡Bienvenido!");
                window.location.href = "index.html";
            } else {
                const name = document.getElementById('reg-name').value;
                const passConfirm = document.getElementById('auth-pass-confirm').value;

                if (pass !== passConfirm) {
                    alert("Las contraseñas no coinciden");
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                await set(ref(db, 'users/' + user.uid), {
                    username: name,
                    email: email,
                    role: "usuario",
                    lastLogin: new Date().toISOString()
                });

                alert("Cuenta creada con éxito");
                window.location.href = "index.html";
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

// --- GESTIÓN DEL ESTADO DE LA SESIÓN (BARRA DE NAVEGACIÓN) ---

onAuthStateChanged(auth, async (user) => {
    const userLink = document.querySelector('a[href="login.html"]');
    if (!user || !userLink) return;

    try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        let nombreAMostrar = "Usuario";
        let rolDeUsuario = "usuario";

        if (snapshot.exists()) {
            const userData = snapshot.val();
            nombreAMostrar = userData.username; 
            rolDeUsuario = userData.role;
        }

        const container = userLink.parentElement;
        const isAdmin = rolDeUsuario === "admin";

        container.innerHTML = `
            <div class="text-primary d-flex align-items-center">
                <i class="fas fa-user-circle fa-lg"></i>
                <span class="ms-2 d-none d-md-inline"><strong>${nombreAMostrar}</strong></span>
                ${isAdmin ? '<a href="dashboard.html" class="ms-3 btn btn-sm btn-outline-primary">Panel Admin</a>' : ''}
                <button id="btn-logout" class="btn btn-sm btn-outline-danger ms-3">Salir</button>
            </div>
        `;

        document.getElementById('btn-logout').addEventListener('click', () => {
            signOut(auth).then(() => window.location.reload());
        });
    } catch (error) {
        console.error("Error en sesión:", error);
    }
});

async function cargarNavegacionCompletaTNF() {
    const navContainer = document.getElementById('main-nav-tnf');
    if (!navContainer) return;

    // Clasificación de submarcas según tus imágenes
    const gruposTNF = {
        "CONECTORES Y UNIONES": ["CONECTOR RECTO", "CODO", "UNION", "NIPLE", "COPLE", "CONECTOR", "TAPON"],
        "CONTROL Y FLUJO": ["ADAPTADOR", "VÁLVULA", "REGULADOR"],
        "SERVICIOS": ["INSTALACIONES"]
    };

    try {
        // 1. Buscar ID de la empresa TNF
        const empresasRef = ref(db, 'nombres_empresa');
        const snapEmpresas = await get(empresasRef);
        let idTNF = null;
        if (snapEmpresas.exists()) {
            const empresas = snapEmpresas.val();
            idTNF = Object.keys(empresas).find(k => 
                empresas[k].nombre && empresas[k].nombre.toUpperCase().trim() === "TUBE AND FITTINGS"
            );
        }
        if (!idTNF) return;

        // 2. Obtener categorías de las submarcas vinculadas
        const snapSub = await get(ref(db, `relacion_empresa_submarca/${idTNF}`));
        if (!snapSub.exists()) return;

        const submarcasIds = Object.keys(snapSub.val());
        const promesas = submarcasIds.map(id => get(ref(db, `relacion_submarca_categoria/${id}`)));
        const resultados = await Promise.all(promesas);

        // Objeto para clasificar los enlaces
        let clasificado = { "CONECTORES Y UNIONES": [], "CONTROL Y FLUJO": [], "SERVICIOS": [] };

        resultados.forEach(snap => {
            if (snap.exists()) {
                Object.entries(snap.val()).forEach(([idCat, detalle]) => {
                    const nombreOriginal = detalle.nombre || "Sin nombre";
                    const nombreLimpio = nombreOriginal.toUpperCase().trim();
                    const linkHtml = `<a href="product.html?cat=${idCat}" class="dropdown-item">${nombreOriginal}</a>`;
                    
                    // Verificamos en qué grupo encaja (usamos includes para mayor flexibilidad)
                    for (let grupo in gruposTNF) {
                        if (gruposTNF[grupo].some(sub => nombreLimpio.includes(sub))) {
                            clasificado[grupo].push(linkHtml);
                            break;
                        }
                    }
                });
            }
        });

        // 3. Renderizar Menús Dinámicos + Enlaces Estáticos
        let menusHtml = "";
        const orden = ["CONECTORES Y UNIONES", "CONTROL Y FLUJO", "SERVICIOS"];

        orden.forEach(titulo => {
            if (clasificado[titulo].length > 0) {
                menusHtml += `
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle fw-bold" data-bs-toggle="dropdown">${titulo}</a>
                        <div class="dropdown-menu border-0 m-0 shadow-sm">
                            ${clasificado[titulo].join('')}
                        </div>
                    </div>`;
            }
        });

        // Agregamos los links finales (Nosotros, Ofertas, Contacto)
        const estaticosHtml = `
            <a href="specials.html" class="nav-item nav-link text-danger fw-bold">OFERTAS ESPECIALES</a>
            <a href="about-us.html" class="nav-item nav-link">NOSOTROS</a>
            <a href="contact.html" class="nav-item nav-link">CONTACTO</a>
        `;

        navContainer.innerHTML = menusHtml + estaticosHtml;

    } catch (error) {
        console.error("Error cargando navegación:", error);
    }
}

// Llamar a la función
cargarNavegacionCompletaTNF();

// --- CARGA DINÁMICA DE SUBMARCAS (CATEGORÍAS) DESDE FIREBASE ---

async function cargarCategoriasIRS() {
    const menuContainer = document.getElementById('navbar-submarcas');
    if (!menuContainer) return;

    const grupos = {
        "Equipamiento de Laboratorio": ["ANÁLISIS DE LABORATORIO", "PRE-PROCESAMIENTO DE MUESTRAS", "PROCESAMIENTO LÍQUIDO", "CENTRÍFUGOS", "ÓPTICOS", "OTROS PRODUCTOS DE LABORATORIO"],
        "Control Ambiental y Térmico": ["PROTECCIÓN DE AIRE", "CONTROL DE TEMPERATURA", "CADENA DE FRÍO", "DESINFECCIÓN Y ESTERILIZACIÓN", "HORNOS", "INCUBADORAS"],
        "Diagnóstico Especializado": ["INSTRUMENTOS IVD", "REACTIVOS IVD", "BANCO DE SANGRE", "LABORATORIO DE PATOLOGÍA", "LABORATORIO MICROBIOLÓGICO", "ANÁLISIS DE SUELOS/PLANTAS/SEMILLAS"],
        "Salud e Infraestructura": ["ATENCIÓN NEONATAL", "MEDICINA Y REHABILITACIÓN", "PRODUCTO DE BELLEZA", "PROYECTO DE SALA LIMPIA", "EDIFICIOS DE OFICINAS Y FÁBRICAS"]
    };

    try {
        // --- INICIO LÓGICA FIREBASE ---
        const empresasRef = ref(db, 'nombres_empresa');
        const snapEmpresas = await get(empresasRef);
        let idEmpresaIRS = null;

        if (snapEmpresas.exists()) {
            const empresas = snapEmpresas.val();
            idEmpresaIRS = Object.keys(empresas).find(key => 
                empresas[key].nombre && empresas[key].nombre.toUpperCase().trim() === "IRS ANALYTICAL SERVICE"
            );
        }
        if (!idEmpresaIRS) return;

        const relacionSubmarcasRef = ref(db, `relacion_empresa_submarca/${idEmpresaIRS}`);
        const snapSubmarcas = await get(relacionSubmarcasRef);

        if (snapSubmarcas.exists()) {
            const submarcasIds = Object.keys(snapSubmarcas.val());
            const promesasCategorias = submarcasIds.map(idSub => get(ref(db, `relacion_submarca_categoria/${idSub}`)));
            const resultadosCategorias = await Promise.all(promesasCategorias);

            let clasificado = {
                "Equipamiento de Laboratorio": [],
                "Control Ambiental y Térmico": [],
                "Diagnóstico Especializado": [],
                "Salud e Infraestructura": []
            };

            resultadosCategorias.forEach((snapCat) => {
                if (snapCat.exists()) {
                    Object.entries(snapCat.val()).forEach(([idCat, detalle]) => {
                        const nombre = detalle.nombre || "Sin nombre";
                        const link = `<a href="product.html?cat=${idCat}" class="dropdown-item py-1 px-4 small">${nombre}</a>`;
                        
                        const nombreLimpio = nombre.toUpperCase().trim();
                        for (let titulo in grupos) {
                            if (grupos[titulo].includes(nombreLimpio)) {
                                clasificado[titulo].push(link);
                                break;
                            }
                        }
                    });
                }
            });
            // --- FIN LÓGICA FIREBASE ---

            let finalHtml = `<div class="d-md-flex flex-wrap p-2" style="min-width: 650px;">`;
            
            for (let titulo in clasificado) {
                if (clasificado[titulo].length > 0) {
                    finalHtml += `
                        <div class="menu-seccion mb-4" style="flex: 0 0 50%; max-width: 50%;">
                            <a href="#" class="nav-link dropdown-toggle text-primary fw-bold" style="pointer-events: none;">
                                ${titulo}
                            </a>
                            <div class="sub-items ms-2 border-start">
                                ${clasificado[titulo].join('')}
                            </div>
                        </div>`;
                }
            }
            finalHtml += `</div>`;

            menuContainer.innerHTML = finalHtml;
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
cargarCategoriasIRS();


const inputBusqueda = document.getElementById('input-busqueda');
const sugerenciasContainer = document.getElementById('sugerencias-busqueda');
const btnBuscar = document.getElementById('btn-buscar');

if (inputBusqueda) {
    inputBusqueda.addEventListener('input', async (e) => {
        const texto = e.target.value.toLowerCase().trim();
        
        if (texto.length < 2) {
            sugerenciasContainer.classList.add('d-none');
            return;
        }

        try {
            // Referencia a tus productos en Firebase
            const productosRef = ref(db, 'data_productos'); 
            const snapshot = await get(productosRef);

            if (snapshot.exists()) {
                const categorias = snapshot.val();
                let sugerenciasHtml = "";
                let encontrados = 0;

                Object.keys(categorias).forEach(catId => {
                    const productosDeCategoria = categorias[catId];
                    Object.entries(productosDeCategoria).forEach(([prodId, datos]) => {
                        const nombre = datos.nombre ? datos.nombre.toLowerCase() : "";
                        
                        if (nombre.includes(texto) && encontrados < 8) {
                            // CAMBIO AQUÍ: Ahora redirige a detail.html en lugar de product.html
                            sugerenciasHtml += `
                                <a href="detail.html?id=${prodId}&cat=${catId}" class="list-group-item list-group-item-action border-0 py-2">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-search me-3 text-muted"></i>
                                        <span class="text-truncate">${datos.nombre}</span>
                                    </div>
                                </a>`;
                            encontrados++;
                        }
                    });
                });

                if (encontrados > 0) {
                    sugerenciasContainer.innerHTML = sugerenciasHtml;
                    sugerenciasContainer.classList.remove('d-none');
                } else {
                    sugerenciasContainer.classList.add('d-none');
                }
            }
        } catch (error) {
            console.error("Error en buscador:", error);
        }
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!inputBusqueda.contains(e.target) && !sugerenciasContainer.contains(e.target)) {
            sugerenciasContainer.classList.add('d-none');
        }
    });

    // Búsqueda general al dar clic a la lupa o Enter
    const ejecutarBusquedaGeneral = () => {
        const query = inputBusqueda.value.trim();
        // Si el usuario escribe algo y da Enter/Lupa, va al listado general (product.html)
        if (query) window.location.href = `product.html?search=${encodeURIComponent(query)}`;
    };

    if (btnBuscar) btnBuscar.addEventListener('click', ejecutarBusquedaGeneral);
    inputBusqueda.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') ejecutarBusquedaGeneral(); 
    });
}

async function cargarNavegacionDinamica() {
    const mainContainer = document.getElementById('main-nav-container');
    if (!mainContainer) return;

    const grupos = {
        "Laboratorio": ["ANÁLISIS DE LABORATORIO", "PRE-PROCESAMIENTO DE MUESTRAS", "PROCESAMIENTO LÍQUIDO", "CENTRÍFUGOS", "ÓPTICOS", "OTROS PRODUCTOS DE LABORATORIO"],
        "Control Ambiental": ["PROTECCIÓN DE AIRE", "CONTROL DE TEMPERATURA", "CADENA DE FRÍO", "DESINFECCIÓN Y ESTERILIZACIÓN", "HORNOS", "INCUBADORAS"],
        "Diagnóstico": ["INSTRUMENTOS IVD", "REACTIVOS IVD", "BANCO DE SANGRE", "LABORATORIO DE PATOLOGÍA", "LABORATORIO MICROBIOLÓGICO", "ANÁLISIS DE SUELOS/PLANTAS/SEMILLAS"],
        "Salud": ["ATENCIÓN NEONATAL", "MEDICINA Y REHABILITACIÓN", "PRODUCTO DE BELLEZA", "PROYECTO DE SALA LIMPIA", "EDIFICIOS DE OFICINAS Y FÁBRICAS"]
    };

    try {
        // 1. Obtener datos de Firebase (IRS Analytical Service)
        const empresasRef = ref(db, 'nombres_empresa');
        const snapEmpresas = await get(empresasRef);
        let idIRS = null;
        if (snapEmpresas.exists()) {
            idIRS = Object.keys(snapEmpresas.val()).find(k => snapEmpresas.val()[k].nombre?.toUpperCase().trim() === "IRS ANALYTICAL SERVICE");
        }
        if (!idIRS) return;

        const snapSub = await get(ref(db, `relacion_empresa_submarca/${idIRS}`));
        if (!snapSub.exists()) return;

        const promesas = Object.keys(snapSub.val()).map(id => get(ref(db, `relacion_submarca_categoria/${id}`)));
        const resultados = await Promise.all(promesas);

        let clasificado = { "Laboratorio": [], "Control Ambiental": [], "Diagnóstico": [], "Salud": [] };

        resultados.forEach(snap => {
            if (snap.exists()) {
                Object.entries(snap.val()).forEach(([id, det]) => {
                    const nombre = det.nombre || "";
                    const html = `<a href="product.html?cat=${id}" class="dropdown-item">${nombre}</a>`;
                    for (let g in grupos) {
                        if (grupos[g].includes(nombre.toUpperCase().trim())) {
                            clasificado[g].push(html);
                            break;
                        }
                    }
                });
            }
        });

        // 2. Crear los elementos del menú en orden
        // Insertamos al principio del contenedor para que Ofertas y Contacto queden al final
        for (let titulo in clasificado) {
            if (clasificado[titulo].length > 0) {
                const navItem = document.createElement('div');
                navItem.className = 'nav-item dropdown';
                navItem.innerHTML = `
                    <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">${titulo}</a>
                    <div class="dropdown-menu border-0 m-0 shadow-sm">
                        ${clasificado[titulo].join('')}
                    </div>
                `;
                mainContainer.prepend(navItem); // Coloca los grupos dinámicos primero
            }
        }

    } catch (e) { console.error("Error en nav:", e); }
}

cargarNavegacionDinamica();