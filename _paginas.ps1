# Reescribe las paginas que seguian con el relleno de la plantilla comprada:
# "Nosotros" con cifras inventadas y fichas de "Full Name / Designation", el
# 404 en ingles y la solicitud de servicio con un video de YouTube ajeno.
#
# Se ejecuta en local; no forma parte del sitio publicado.

. (Join-Path $PSScriptRoot '_comun.ps1')

# Que catalogo tiene cada marca: los dos primeros lo sacan de Firebase, Vacuum
# Systems todavia lista sus equipos en una tabla estatica.
$CATALOGO = @{
    'irlanalytical'  = 'product.html'
    'tube&Fittings'  = 'product.html'
    'vacumSystem'    = 'team.html'
}

# --- Pagina no encontrada ---------------------------------------------------

function Cuerpo404($destino) {
    @"

    <div class="container-xxl py-5 my-5 wow fadeInUp" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <i class="bi bi-exclamation-triangle display-1 text-primary"></i>
            <h1 class="display-1 mb-0">404</h1>
            <h2 class="mb-4">No encontramos esta p&aacute;gina</h2>
            <p class="mb-4 mx-auto" style="max-width: 540px;">La direcci&oacute;n que abriste no existe o cambi&oacute;
                de lugar. Vuelve al inicio o usa el buscador del men&uacute; para encontrar lo que necesitas.</p>
            <a class="btn btn-primary rounded-pill py-3 px-5 me-2 mb-2" href="index.html">Ir al inicio</a>
            <a class="btn btn-outline-primary rounded-pill py-3 px-5 mb-2" href="$destino">Ver cat&aacute;logo</a>
        </div>
    </div>
"@
}

# --- Solicitud de servicio --------------------------------------------------

function CuerpoSolicitud($opciones) {
    $lista = ($opciones | ForEach-Object {
            "                                        <option value=`"$_`">$_</option>"
        }) -join "`n"

    @"

$(Portadilla 'Solicitar servicio')

    <!-- Solicitud Start -->
    <div class="container-xxl pb-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="text-center mb-4 wow fadeInUp" data-wow-delay="0.1s">
                        <h1 class="mb-3">Cu&eacute;ntanos qu&eacute; necesitas</h1>
                        <p class="text-muted mb-0">Escribe tu solicitud y te respondemos con una propuesta y un
                            tiempo estimado. Los campos marcados son obligatorios.</p>
                    </div>
                    <div class="bg-light p-5 wow fadeInUp" data-wow-delay="0.2s">
                        <form data-formulario-contacto data-asunto="Nueva solicitud de servicio" novalidate>
                            <div class="row g-3">
                                <div class="col-12 col-sm-6">
                                    <label for="b-nombre" class="visually-hidden">Nombre</label>
                                    <input type="text" id="b-nombre" name="nombre" class="form-control border-0"
                                        placeholder="Nombre" style="height: 55px;" required>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <label for="b-email" class="visually-hidden">Correo electr&oacute;nico</label>
                                    <input type="email" id="b-email" name="email" class="form-control border-0"
                                        placeholder="Correo electr&oacute;nico" style="height: 55px;" required>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <label for="b-servicio" class="visually-hidden">Servicio</label>
                                    <select id="b-servicio" name="servicio" class="form-select border-0"
                                        style="height: 55px;" required>
                                        <option value="">Selecciona un servicio</option>
$lista
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <label for="b-fecha" class="visually-hidden">Fecha preferida</label>
                                    <input type="date" id="b-fecha" name="fecha" class="form-control border-0"
                                        style="height: 55px;">
                                </div>
                                <div class="col-12">
                                    <label for="b-mensaje" class="visually-hidden">Detalles de la solicitud</label>
                                    <textarea id="b-mensaje" name="mensaje" class="form-control border-0" rows="5"
                                        placeholder="Cu&eacute;ntanos qu&eacute; necesitas" required></textarea>
                                </div>
                                <!-- Campo trampa contra robots: oculto para las personas. -->
                                <input type="text" name="website" tabindex="-1" autocomplete="off"
                                    style="position:absolute;left:-9999px;" aria-hidden="true">
                                <div class="col-12">
                                    <button class="btn btn-primary w-100 py-3" type="submit">Enviar solicitud</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Solicitud End -->
"@
}

$SERVICIOS = @{
    'irlanalytical' = @('Reparaci&oacute;n de equipo', 'Asesor&iacute;a t&eacute;cnica',
        'Cotizaci&oacute;n de equipo', 'Consumibles y reactivos')
    'tube&Fittings' = @('Tuber&iacute;as y accesorios', 'Reguladores e instrumentaci&oacute;n',
        'Generadores de gases', 'Sistemas especializados')
    'vacumSystem'   = @('Equipos anal&iacute;ticos', 'Infraestructura de laboratorio',
        'Bombas de vac&iacute;o', 'Servicios t&eacute;cnicos')
}

# --- Nosotros ---------------------------------------------------------------

function Punto($icono, $titulo, $texto) {
    @"
                    <div class="col-sm-6">
                        <div class="d-flex">
                            <i class="fa $icono fa-2x text-primary me-3 mt-1"></i>
                            <div>
                                <h6 class="mb-1">$titulo</h6>
                                <p class="text-muted small mb-0">$texto</p>
                            </div>
                        </div>
                    </div>
"@
}

function CuerpoNosotros($sitio, $imagen, $entrada, $detalle, $puntos) {
    $destino = $CATALOGO[$sitio]
    $rejilla = ($puntos | ForEach-Object { Punto $_.Icono $_.Titulo $_.Texto }) -join "`n"

    @"

$(Portadilla 'Nosotros')

    <!-- Quienes somos Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5 align-items-center">
                <div class="col-lg-5 wow fadeInUp" data-wow-delay="0.1s">
                    <img class="img-fluid w-100" src="$imagen" alt="">
                </div>
                <div class="col-lg-7 wow fadeInUp" data-wow-delay="0.2s">
                    <h1 class="mb-4">Qui&eacute;nes somos</h1>
                    <p>$entrada</p>
                    <p class="mb-4">$detalle</p>
                    <a class="btn btn-primary rounded-pill py-3 px-5 me-2 mb-2" href="service.html">Nuestros servicios</a>
                    <a class="btn btn-outline-primary rounded-pill py-3 px-5 mb-2" href="$destino">Ver cat&aacute;logo</a>
                </div>
            </div>
        </div>
    </div>
    <!-- Quienes somos End -->

    <!-- En que ayudamos Start -->
    <div class="container-xxl pb-5">
        <div class="container">
            <div class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
                <h1 class="mb-3">En qu&eacute; te podemos ayudar</h1>
            </div>
            <div class="row g-4 wow fadeInUp" data-wow-delay="0.2s">
$rejilla
            </div>
        </div>
    </div>
    <!-- En que ayudamos End -->

$(Marcas $sitio)

$(Contacto $destino)
"@
}

$entradaTNF = 'Tube &amp; Fittings es la divisi&oacute;n de IRS ANALYTICAL SERVICE dedicada a las l&iacute;neas ' +
'de gases. Suministramos e instalamos tuber&iacute;a, conexiones, v&aacute;lvulas, reguladores e ' +
'instrumentaci&oacute;n para nitr&oacute;geno, hidr&oacute;geno, ox&iacute;geno, aire, acetileno, ' +
'arg&oacute;n, helio y otros gases.'

$detalleTNF = 'Llevamos m&aacute;s de diez a&ntilde;os montando sistemas completos de distribuci&oacute;n en ' +
'laboratorios e industria. Trabajamos con DS-LOK y con generadores de gases, y tambi&eacute;n ' +
'desarrollamos soluciones a la medida cuando el proyecto del cliente lo pide.'

$NOSOTROS_TNF = CuerpoNosotros 'tube&Fittings' 'img/tnf_f2.jpg' $entradaTNF $detalleTNF @(
    @{ Icono = 'fa-project-diagram'; Titulo = 'L&iacute;neas de gases'; Texto = 'Venta e instalaci&oacute;n de tuber&iacute;a y accesorios para gases especiales, con sistemas completos de distribuci&oacute;n.' },
    @{ Icono = 'fa-tachometer-alt'; Titulo = 'Control y medici&oacute;n'; Texto = 'Reguladores de alta pureza, man&oacute;metros, v&aacute;lvulas de paso y de control de flujo.' },
    @{ Icono = 'fa-industry'; Titulo = 'Generadores de gases'; Texto = 'Equipos para generar in situ aire seco, cero y grado TOC, nitr&oacute;geno e hidr&oacute;geno.' },
    @{ Icono = 'fa-cogs'; Titulo = 'Sistemas a la medida'; Texto = 'Preparaci&oacute;n de muestras, instalaciones el&eacute;ctricas y respaldo de energ&iacute;a y regulaci&oacute;n.' }
)

$entradaVS = 'Vacuum Systems es la divisi&oacute;n de IRS ANALYTICAL SERVICE especializada en vac&iacute;o y en ' +
'equipo anal&iacute;tico. Vendemos y damos servicio a bombas de vac&iacute;o, y ofrecemos equipos ' +
'nuevos y reacondicionados de cromatograf&iacute;a y espectroscop&iacute;a.'

$detalleVS = 'Con m&aacute;s de diez a&ntilde;os de experiencia acompa&ntilde;amos al laboratorio en todo el ' +
'ciclo: la compra del equipo, la infraestructura donde va montado y el mantenimiento que necesita ' +
'para seguir midiendo bien.'

$NOSOTROS_VS = CuerpoNosotros 'vacumSystem' 'img/bb_vs2.jpg' $entradaVS $detalleVS @(
    @{ Icono = 'fa-flask'; Titulo = 'Equipos anal&iacute;ticos'; Texto = 'GC, GC-MS, HPLC, UV-VIS, AA e ICP, nuevos y reacondicionados, adem&aacute;s de consumibles y reactivos.' },
    @{ Icono = 'fa-building'; Titulo = 'Infraestructura'; Texto = 'Mesas de laboratorio, sistemas de extracci&oacute;n y cabinas m&oacute;viles para trabajo en campo.' },
    @{ Icono = 'fa-compress-arrows-alt'; Titulo = 'Bombas de vac&iacute;o'; Texto = 'Venta, diagn&oacute;stico, mantenimiento preventivo y correctivo, consumibles y refacciones.' },
    @{ Icono = 'fa-tools'; Titulo = 'Servicios t&eacute;cnicos'; Texto = 'Servicio a bombas turbomoleculares, kits de mantenimiento y generadores de gases.' }
)

# --- Aplicar ----------------------------------------------------------------

foreach ($sitio in $CATALOGO.Keys) {
    Reemplazar-Cuerpo "$sitio\404.html" (Cuerpo404 $CATALOGO[$sitio])
    Reemplazar-Cuerpo "$sitio\booking.html" (CuerpoSolicitud $SERVICIOS[$sitio])
}

Reemplazar-Cuerpo 'tube&Fittings\about.html' $NOSOTROS_TNF
Reemplazar-Cuerpo 'vacumSystem\about.html' $NOSOTROS_VS
