import { auth } from "./firebase.js";// Verifica que el nombre del archivo sea igual
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    const authContainer = document.getElementById('auth-container');
    const spinner = document.getElementById('spinner');

    if (user) {
        // USUARIO LOGUEADO: Cambiamos el link por un menú desplegable o botón de salir
        if (authContainer) {
            authContainer.innerHTML = `
                <div class="dropdown d-inline">
                    <button class="btn btn-link text-decoration-none text-primary dropdown-toggle p-0" data-bs-toggle="dropdown">
                        <i class="fas fa-user"></i> ${user.email.split('@')[0]}
                    </button>
                    <ul class="dropdown-menu">
                        <li><button class="dropdown-item text-danger" id="logout-btn">Cerrar Sesión</button></li>
                    </ul>
                </div>
            `;
            
            document.getElementById('logout-btn').addEventListener('click', async () => {
                await signOut(auth);
                window.location.reload();
            });
        }
    } else {
        // USUARIO NO LOGUEADO: Mantenemos el botón de "Ingresar"
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="login.html" class="text-decoration-none text-primary">
                    <i class="fas fa-user-circle fa-lg"></i>
                    <span class="ms-1 d-none d-md-inline">Ingresar / Mi cuenta</span>
                </a>
            `;
        }
    }

    // IMPORTANTE: Quitar el spinner cuando Firebase responda
    if (spinner) {
        spinner.classList.remove('show');
    }
});