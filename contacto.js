// Centraliza telefonos, correos y datos de contacto de los tres sitios.
//
// Estaban escritos a mano en 32 paginas (el telefono principal aparecia 75
// veces), asi que cambiarlos obligaba a editar el HTML. Ahora se guardan en
// `configuracion/contacto` y este modulo los aplica al cargar cada pagina.
//
// Para no tener que marcar a mano cada aparicion, se sustituye el valor que hoy
// esta escrito en el HTML por el configurado. La tabla VALORES_ORIGINALES es
// fija -- son las cadenas que estan en los archivos -- asi que la sustitucion
// sigue funcionando por muchas veces que se cambie el dato desde el panel.
//
// El marcado nuevo puede usar data-contacto="telefonoPrincipal" y se rellena
// igual, sin depender de la tabla.

import { ref, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { db } from './firebase.js';

export const RUTA_CONFIG = 'configuracion/contacto';

// Valores que se muestran si aun no se ha guardado nada en Firebase. Coinciden
// con los que estaban en el HTML, para que nada cambie hasta que se edite.
export const CONTACTO_POR_DEFECTO = {
    telefonoPrincipal: '7229063890',
    telefonoSecundario: '5613477010',
    telefonoAlterno: '5576574684',
    whatsapp: '7226817326',
    correoContacto: 'contacto@irsmx.com',
    correoCotizaciones: 'cotizaciones@irsmx.com',
    direccion: 'San Mateo, Edo. de Mexico',
    horario: 'Lunes a viernes de 9:00 a 18:00',
    // Clave publica de Web3Forms: entrega los mensajes del formulario al correo
    // registrado. Es segura en el navegador porque solo permite enviar a ese
    // correo. Sin ella el formulario recurre al gestor de correo del visitante.
    web3formsKey: ''
};

// Etiquetas para el panel de administracion.
export const CAMPOS_CONTACTO = [
    { clave: 'telefonoPrincipal', etiqueta: 'Telefono principal', tipo: 'tel' },
    { clave: 'telefonoSecundario', etiqueta: 'Telefono secundario', tipo: 'tel' },
    { clave: 'telefonoAlterno', etiqueta: 'Telefono alterno', tipo: 'tel' },
    { clave: 'whatsapp', etiqueta: 'WhatsApp', tipo: 'tel' },
    { clave: 'correoContacto', etiqueta: 'Correo de contacto', tipo: 'email' },
    { clave: 'correoCotizaciones', etiqueta: 'Correo de cotizaciones', tipo: 'email' },
    { clave: 'direccion', etiqueta: 'Direccion', tipo: 'text' },
    { clave: 'horario', etiqueta: 'Horario de atencion', tipo: 'text' },
    {
        clave: 'web3formsKey',
        etiqueta: 'Clave de Web3Forms (envio del formulario)',
        tipo: 'text',
        ancho: 12,
        ayuda: 'Pidela gratis en web3forms.com con el correo donde quieras '
            + 'recibir los mensajes. Sin ella el formulario abre el gestor de '
            + 'correo del visitante.'
    }
];

// Cadenas tal como aparecen hoy en el HTML, agrupadas por el campo que les
// corresponde. Incluye los marcadores que dejo la plantilla original
// (999-999-9999, ejemplo@ejemplo.com...), que asi quedan corregidos.
const VALORES_ORIGINALES = {
    telefonoPrincipal: [
        '7229063890', '999-999-9999', '+012 345 67890', '012 345 6789',
        '813-708-0819', '8137080819'
    ],
    telefonoSecundario: ['5613477010'],
    telefonoAlterno: ['5576574684'],
    whatsapp: ['7226817326'],
    correoContacto: [
        'contacto@irsmx.com', 'ejemplo@ejemplo.com', 'info@example.com',
        'direccion@irsanalyticalservice.com'
    ],
    correoCotizaciones: ['cotizaciones@irsmx.com']
};

// Atributos donde tambien aparecen los datos (enlaces de WhatsApp, mailto...).
const ATRIBUTOS = ['href', 'title', 'aria-label', 'content', 'data-bs-original-title'];

// En enlaces telefonicos solo caben digitos: si el administrador escribe
// "722 906 3890" el enlace debe quedar sin espacios.
const ENLACES_SOLO_DIGITOS = /^(tel:|https?:\/\/wa\.me\/|https?:\/\/api\.whatsapp\.com\/)/i;

let peticion = null;

export function cargarContacto() {
    if (!peticion) {
        peticion = get(ref(db, RUTA_CONFIG))
            .then((snap) => ({ ...CONTACTO_POR_DEFECTO, ...(snap.exists() ? snap.val() : {}) }))
            .catch(() => ({ ...CONTACTO_POR_DEFECTO }));
    }
    return peticion;
}

function soloDigitos(valor) {
    return String(valor).replace(/[^\d+]/g, '');
}

// Pares [original, nuevo] ordenados de mas largo a mas corto: evita que al
// sustituir "7229063890" se rompa una cadena que lo contenga como prefijo.
function construirSustituciones(contacto) {
    const pares = [];
    for (const [campo, originales] of Object.entries(VALORES_ORIGINALES)) {
        const nuevo = contacto[campo];
        if (nuevo === undefined || nuevo === null || nuevo === '') continue;
        for (const original of originales) {
            if (original !== String(nuevo)) pares.push([original, String(nuevo)]);
        }
    }
    return pares.sort((a, b) => b[0].length - a[0].length);
}

function sustituir(texto, pares, soloNumeros) {
    let salida = texto;
    for (const [original, nuevo] of pares) {
        if (!salida.includes(original)) continue;
        salida = salida.split(original).join(soloNumeros ? soloDigitos(nuevo) : nuevo);
    }
    return salida;
}

export function aplicarContacto(contacto, raiz = document.body) {
    if (!raiz) return;
    const pares = construirSustituciones(contacto);

    if (pares.length) {
        const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
            acceptNode(nodo) {
                const padre = nodo.parentNode;
                if (!padre) return NodeFilter.FILTER_REJECT;
                const etiqueta = padre.nodeName;
                if (etiqueta === 'SCRIPT' || etiqueta === 'STYLE') return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const textos = [];
        while (recorrido.nextNode()) textos.push(recorrido.currentNode);
        for (const nodo of textos) {
            const nuevo = sustituir(nodo.nodeValue, pares, false);
            if (nuevo !== nodo.nodeValue) nodo.nodeValue = nuevo;
        }

        for (const el of raiz.querySelectorAll('*')) {
            for (const attr of ATRIBUTOS) {
                const valor = el.getAttribute(attr);
                if (!valor) continue;
                const esEnlaceTelefonico = attr === 'href' && ENLACES_SOLO_DIGITOS.test(valor);
                const nuevo = sustituir(valor, pares, esEnlaceTelefonico);
                if (nuevo !== valor) el.setAttribute(attr, nuevo);
            }
        }
    }

    // Marcado explicito: <span data-contacto="direccion"></span>
    for (const el of raiz.querySelectorAll('[data-contacto]')) {
        const valor = contacto[el.getAttribute('data-contacto')];
        if (valor === undefined || valor === null) continue;
        if (el.tagName === 'A') {
            const destino = el.getAttribute('href') || '';
            if (destino.startsWith('mailto:')) el.setAttribute('href', `mailto:${valor}`);
            else if (ENLACES_SOLO_DIGITOS.test(destino)) {
                el.setAttribute('href', destino.replace(/[\d+][\d+\s\-()]*$/, soloDigitos(valor)));
            }
        }
        el.textContent = valor;
    }
}

export async function iniciarContacto() {
    const contacto = await cargarContacto();
    const aplicar = () => aplicarContacto(contacto);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar, { once: true });
    } else {
        aplicar();
    }
    return contacto;
}
