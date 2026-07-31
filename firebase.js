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
// Se exporta para que el panel pueda abrir una segunda instancia y dar de alta
// usuarios sin reemplazar la sesión del administrador.
export const firebaseConfig = {
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

// --- MENU DE CATEGORIAS Y BUSCADOR ---
// Vivian aqui como tres funciones casi identicas, una por marca, con el
// nombre de la empresa y los enlaces escritos a mano. Ahora es un solo modulo
// y cada pagina declara su empresa en el HTML. Se importa de forma dinamica
// porque necesita `db` de este mismo archivo.
import('./navegacion.js')
    .then((modulo) => modulo.iniciarNavegacion())
    .catch((e) => console.error("Error cargando la navegacion:", e));

// --- DATOS DE CONTACTO CENTRALIZADOS ---
// Telefonos y correos se administran desde el panel y se aplican a todas las
// paginas. Se importa de forma dinamica porque contacto.js necesita `db` de
// este mismo archivo y una importacion estatica crearia un ciclo.
import('./contacto.js')
    .then((modulo) => modulo.iniciarContacto())
    .catch((e) => console.error("Error cargando contacto:", e));

// --- FORMULARIO DE CONTACTO ---
import('./formulario_contacto.js')
    .then((modulo) => modulo.iniciarFormularios())
    .catch((e) => console.error("Error cargando el formulario:", e));
