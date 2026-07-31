# Reescribe la portada de Tube & Fittings y la de Vacuum Systems.
#
# Las dos mostraban el carrusel, las fotos y los textos del sitio de IRS
# ("Aqui en IRS ANALYTICAL" sobre una foto de laboratorio), porque se habian
# copiado de ahi. El contenido que se pone ahora sale de la pagina de servicios
# de cada marca, que si esta escrita con lo que cada una vende de verdad.
#
# Se ejecuta en local; no forma parte del sitio publicado.

. (Join-Path $PSScriptRoot '_comun.ps1')

# Un slide del carrusel de cabecera.
function Slide($imagen, $sobretitulo, $titulo, $texto, $enlace, $boton) {
    @"
                <div class="owl-carousel-item position-relative">
                    <img class="img-fluid" src="$imagen" alt="$titulo">
                    <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
                        style="background: rgba(0, 0, 0, .55);">
                        <div class="container">
                            <div class="row justify-content-start">
                                <div class="col-10 col-lg-8">
                                    <h5 class="text-white text-uppercase mb-3 animated slideInDown">$sobretitulo</h5>
                                    <h1 class="display-3 text-white animated slideInDown mb-4">$titulo</h1>
                                    <p class="fs-5 fw-medium text-white mb-4 pb-2">$texto</p>
                                    <a href="$enlace" class="btn btn-primary py-3 px-5 animated slideInLeft">$boton</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"@
}

# Una tarjeta de la seccion de servicios.
function Servicio($icono, $titulo, $resumen, $puntos, $retraso) {
    $lista = ($puntos | ForEach-Object { "                            <li class=`"mb-1`">$_</li>" }) -join "`n"
    @"
            <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="$retraso">
                <div class="h-100 bg-light p-4 border-top border-4 border-primary">
                    <div class="d-flex align-items-center mb-3">
                        <i class="$icono fa-2x text-primary me-3"></i>
                        <h5 class="mb-0">$titulo</h5>
                    </div>
                    <p class="text-muted small mb-3">$resumen</p>
                    <ul class="list-unstyled small mb-0">
$lista
                    </ul>
                </div>
            </div>
"@
}


# --- Tube & Fittings --------------------------------------------------------

$slidesTNF = (Slide 'img/tnf_f1.jpg' 'Conexiones para gases especiales' `
        'Tuber&iacute;a y accesorios para tu instalaci&oacute;n' `
        'N2, H2, O2, aire, acetileno, arg&oacute;n, helio y otros gases.' `
        'product.html' 'Ver cat&aacute;logo') + "`n" +
(Slide 'img/tnf_f3.jpg' 'Sistemas completos de distribuci&oacute;n' `
        'Del regulador a la l&iacute;nea de servicio' `
        'Dise&ntilde;o, montaje y puesta en marcha de l&iacute;neas de alta pureza.' `
        'service.html' 'Ver servicios')

$serviciosTNF = (Servicio 'fas fa-stream' 'Tuber&iacute;as y accesorios' `
        'Venta e instalaci&oacute;n para gases especiales' `
    @('N2, H2, O2, aire y acetileno', 'Arg&oacute;n, helio y otros gases', 'Sistemas completos de distribuci&oacute;n') '0.1s') + "`n" +
(Servicio 'fas fa-tachometer-alt' 'Reguladores e instrumentaci&oacute;n' `
        'Control y medici&oacute;n de alta precisi&oacute;n' `
    @('Reguladores de alta pureza', 'Man&oacute;metros y v&aacute;lvulas de paso', 'V&aacute;lvulas de control de flujo') '0.3s') + "`n" +
(Servicio 'fas fa-wind' 'Generadores de gases' `
        'Equipos para generaci&oacute;n in situ' `
    @('Aire seco, cero y grado TOC', 'Nitr&oacute;geno e hidr&oacute;geno', 'Sistemas de alta pureza') '0.5s') + "`n" +
(Servicio 'fas fa-cogs' 'Sistemas especializados' `
        'Desarrollo de soluciones a medida' `
    @('Preparaci&oacute;n de muestras', 'Instalaciones el&eacute;ctricas', 'Respaldo de energ&iacute;a y regulaci&oacute;n') '0.7s')

$portadaTNF = @"
    <!-- Carousel Start -->
    <div class="container-fluid p-0 mb-5">
        <div class="owl-carousel header-carousel position-relative">
$slidesTNF
        </div>
    </div>
    <!-- Carousel End -->

    <!-- Servicios Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
                <h1 class="mb-3">Qu&eacute; hacemos</h1>
                <p class="text-muted mb-0">M&aacute;s de 10 a&ntilde;os instalando l&iacute;neas de gases y sistemas de conducci&oacute;n.</p>
            </div>
            <div class="row g-4">
$serviciosTNF
            </div>
        </div>
    </div>
    <!-- Servicios End -->

    <!-- Llamada al catalogo -->
    <div class="container-fluid bg-primary text-light py-5 my-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-3">
            <div class="row align-items-center g-4">
                <div class="col-lg-8">
                    <h2 class="text-light mb-2">Conectores, codos, niples, v&aacute;lvulas y reguladores</h2>
                    <p class="mb-0">Consulta medidas y disponibilidad en el cat&aacute;logo, o escr&iacute;benos y te
                        cotizamos la pieza que necesitas.</p>
                </div>
                <div class="col-lg-4 text-lg-end">
                    <a href="product.html" class="btn btn-light py-3 px-5 me-2">Ver cat&aacute;logo</a>
                    <a href="contact.html" class="btn btn-outline-light py-3 px-4 mt-2 mt-lg-0">Cotizar</a>
                </div>
            </div>
        </div>
    </div>

$(Marcas 'tube&Fittings')
"@

# --- Vacuum Systems ---------------------------------------------------------

$slidesVS = (Slide 'img/bv_vs2.jpg' 'Bombas de vac&iacute;o' `
        'Venta, refacciones y servicio especializado' `
        'Diagn&oacute;stico, mantenimiento preventivo y correctivo para tu equipo.' `
        'team.html' 'Ver equipos') + "`n" +
(Slide 'img/vs_i1.jpg' 'Equipos anal&iacute;ticos' `
        'Instrumentaci&oacute;n nueva y reacondicionada' `
        'GC, GC-MS, HPLC, UV-VIS, AA e ICP, con consumibles y reactivos.' `
        'service.html' 'Ver servicios')

$serviciosVS = (Servicio 'fas fa-microscope' 'Equipos anal&iacute;ticos' `
        'Gran variedad de equipos nuevos y reacondicionados' `
    @('GC, GC-MS y HPLC', 'UV-VIS, AA e ICP', 'Consumibles y reactivos') '0.1s') + "`n" +
(Servicio 'fas fa-vials' 'Infraestructura' `
        'Soluciones completas para laboratorio' `
    @('Mesas de laboratorio', 'Sistemas de extracci&oacute;n', 'Cabinas m&oacute;viles para campo') '0.3s') + "`n" +
(Servicio 'fas fa-compress-arrows-alt' 'Bombas de vac&iacute;o' `
        'Venta y servicio especializado' `
    @('Venta y diagn&oacute;stico', 'Mantenimiento preventivo y correctivo', 'Consumibles y refacciones') '0.5s') + "`n" +
(Servicio 'fas fa-tools' 'Servicios t&eacute;cnicos' `
        'Soporte especializado integral' `
    @('Bombas turbomoleculares', 'Kits de mantenimiento', 'Generadores de gases') '0.7s')

$portadaVS = @"
    <!-- Carousel Start -->
    <div class="container-fluid p-0 mb-5">
        <div class="owl-carousel header-carousel position-relative">
$slidesVS
        </div>
    </div>
    <!-- Carousel End -->

    <!-- Servicios Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
                <h1 class="mb-3">Qu&eacute; hacemos</h1>
                <p class="text-muted mb-0">M&aacute;s de 10 a&ntilde;os dando servicio a equipos de vac&iacute;o y de laboratorio.</p>
            </div>
            <div class="row g-4">
$serviciosVS
            </div>
        </div>
    </div>
    <!-- Servicios End -->

    <!-- Llamada al catalogo -->
    <div class="container-fluid bg-primary text-light py-5 my-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-3">
            <div class="row align-items-center g-4">
                <div class="col-lg-8">
                    <h2 class="text-light mb-2">Kits de mantenimiento y refacciones en existencia</h2>
                    <p class="mb-0">Revisa el listado de equipos y refacciones, o escr&iacute;benos con el modelo de tu
                        bomba y te decimos qu&eacute; necesita.</p>
                </div>
                <div class="col-lg-4 text-lg-end">
                    <a href="team.html" class="btn btn-light py-3 px-5 me-2">Ver equipos</a>
                    <a href="contact.html" class="btn btn-outline-light py-3 px-4 mt-2 mt-lg-0">Cotizar</a>
                </div>
            </div>
        </div>
    </div>

$(Marcas 'vacumSystem')
"@

Reemplazar-Cuerpo 'tube&Fittings\index.html' $portadaTNF
Reemplazar-Cuerpo 'vacumSystem\index.html' $portadaVS
