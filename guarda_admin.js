// Restringe una pagina a usuarios con rol de administrador.
//
// El panel se cargaba sin comprobar la sesion: bastaba conocer la URL. Esta
// guarda resuelve solo cuando hay un administrador autenticado; en cualquier
// otro caso manda al login y no devuelve el control.
//
// Es una defensa de interfaz: quien mande peticiones a mano sigue limitado por
// las reglas de database.rules.json, que son las que de verdad protegen.

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { auth, db } from './firebase.js';

function pantallaBloqueo(titulo, detalle, destino) {
    document.body.innerHTML = `
        <div class="d-flex align-items-center justify-content-center"
             style="min-height:100vh;background:#f4f7f9;font-family:system-ui,sans-serif;">
            <div class="text-center p-5 bg-white rounded-4 shadow-sm" style="max-width:420px;">
                <div style="font-size:2.5rem;">&#128274;</div>
                <h5 class="fw-bold mt-3">${titulo}</h5>
                <p class="text-muted mb-4">${detalle}</p>
                <a href="${destino}" class="btn btn-primary px-4">Ir al inicio de sesion</a>
            </div>
        </div>`;
}

/**
 * @param {string} rutaLogin ruta al login relativa a la pagina protegida.
 * @returns {Promise<{uid: string, email: string, perfil: object}>}
 */
export function exigirAdmin(rutaLogin = 'login.html') {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (usuario) => {
            if (!usuario) {
                pantallaBloqueo(
                    'Necesitas iniciar sesion',
                    'Esta area es solo para administradores.',
                    rutaLogin
                );
                return;
            }

            let perfil = {};
            try {
                const snap = await get(ref(db, `users/${usuario.uid}`));
                if (snap.exists()) perfil = snap.val();
            } catch (e) {
                // Con las reglas activas, un usuario sin permiso no puede leer
                // su propio nodo si la ruta esta restringida: se trata como
                // falta de permisos.
                perfil = {};
            }

            if (perfil.role !== 'admin') {
                pantallaBloqueo(
                    'No tienes permisos',
                    `La cuenta ${usuario.email} no es administradora.`,
                    rutaLogin
                );
                return;
            }

            if (perfil.activo === false) {
                pantallaBloqueo(
                    'Cuenta desactivada',
                    'Un administrador desactivo este acceso.',
                    rutaLogin
                );
                return;
            }

            resolve({ uid: usuario.uid, email: usuario.email, perfil });
        });
    });
}
