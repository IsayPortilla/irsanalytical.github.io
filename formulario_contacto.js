// Envio de los formularios del sitio desde un hosting estatico.
//
// El navegador no puede hablar con un servidor SMTP, asi que la entrega pasa
// por Web3Forms: se envia el formulario a su API y ellos lo reenvian al correo
// registrado. La clave de acceso se guarda en `configuracion/contacto` y se
// administra desde el panel, para no tener que tocar codigo.
//
// Sirve para cualquier formulario marcado con `data-formulario-contacto`, sean
// los de contacto o los de solicitud de servicio: se envian todos sus campos
// con nombre, sin que este modulo tenga que conocerlos.
//
// Si todavia no hay clave configurada el formulario no queda muerto: abre el
// gestor de correo del visitante con el mensaje ya redactado.
//
// JavaScript nativo, sin dependencias.

import { cargarContacto } from './contacto.js';

const API = 'https://api.web3forms.com/submit';

// Campo senuelo: los robots lo rellenan, las personas no lo ven.
const CAMPO_TRAMPA = 'website';

// Etiquetas legibles para el correo y para el respaldo por mailto.
const NOMBRES_BONITOS = {
    nombre: 'Nombre',
    email: 'Correo',
    asunto: 'Asunto',
    servicio: 'Servicio',
    fecha: 'Fecha preferida',
    mensaje: 'Mensaje'
};

function recogerDatos(formulario) {
    const datos = {};
    for (const campo of formulario.querySelectorAll('[name]')) {
        if (campo.name === CAMPO_TRAMPA) continue;
        datos[campo.name] = (campo.value || '').trim();
    }
    return datos;
}

function asuntoDelMensaje(formulario, datos) {
    if (datos.asunto) return datos.asunto;
    const base = formulario.dataset.asunto || 'Nuevo mensaje del sitio';
    return datos.nombre ? `${base} de ${datos.nombre}` : base;
}

function mostrarEstado(formulario, texto, tipo) {
    let caja = formulario.querySelector('[data-estado-envio]');
    if (!caja) {
        caja = document.createElement('div');
        caja.setAttribute('data-estado-envio', '');
        caja.className = 'col-12';
        (formulario.querySelector('.row') || formulario).appendChild(caja);
    }
    caja.innerHTML = texto
        ? `<div class="alert alert-${tipo} mb-0" role="status">${texto}</div>`
        : '';
}

// Respaldo cuando no hay clave: el visitante envia desde su propio correo.
function enviarPorCorreoDelVisitante(formulario, datos, destino) {
    const cuerpo = Object.entries(datos)
        .filter(([, valor]) => valor)
        .map(([clave, valor]) => `${NOMBRES_BONITOS[clave] || clave}: ${valor}`)
        .join('\n');

    window.location.href = `mailto:${destino}`
        + `?subject=${encodeURIComponent(asuntoDelMensaje(formulario, datos))}`
        + `&body=${encodeURIComponent(cuerpo)}`;
}

async function enviar(formulario, contacto) {
    if ((formulario.querySelector(`[name="${CAMPO_TRAMPA}"]`)?.value || '') !== '') return;

    const datos = recogerDatos(formulario);
    const boton = formulario.querySelector('[type="submit"]');
    const textoBoton = boton ? boton.textContent : '';
    const clave = (contacto.web3formsKey || '').trim();
    const destino = contacto.correoContacto || '';

    if (!clave) {
        enviarPorCorreoDelVisitante(formulario, datos, destino);
        mostrarEstado(formulario, 'Se abrio tu gestor de correo para completar el envio.', 'info');
        return;
    }

    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Enviando...';
    }
    mostrarEstado(formulario, '', 'info');

    try {
        const respuesta = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                access_key: clave,
                subject: asuntoDelMensaje(formulario, datos),
                from_name: datos.nombre || 'Sitio web',
                // Responder al correo escribe directo al visitante.
                replyto: datos.email || '',
                ...datos,
                origen: window.location.href
            })
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (respuesta.ok && resultado.success) {
            formulario.reset();
            mostrarEstado(
                formulario,
                'Mensaje enviado. Te responderemos lo antes posible.',
                'success'
            );
        } else {
            mostrarEstado(
                formulario,
                `No se pudo enviar: ${resultado.message || 'intenta de nuevo mas tarde'}.`
                + (destino ? ` Tambien puedes escribirnos a ${destino}.` : ''),
                'danger'
            );
        }
    } catch (e) {
        mostrarEstado(
            formulario,
            'No se pudo conectar. Revisa tu conexion'
            + (destino ? ` o escribenos a ${destino}.` : '.'),
            'danger'
        );
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoBoton;
        }
    }
}

export async function iniciarFormularios() {
    const formularios = [...document.querySelectorAll('form[data-formulario-contacto]')];
    if (!formularios.length) return;

    const contacto = await cargarContacto();

    for (const formulario of formularios) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            // Deja que el navegador muestre sus propios avisos de campo vacio.
            if (!formulario.checkValidity()) {
                formulario.reportValidity();
                return;
            }
            enviar(formulario, contacto);
        });
    }
}
