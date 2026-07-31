# Piezas que comparten los scripts de construccion del sitio.
# Se ejecutan en local; no forman parte de lo que se publica.

$ErrorActionPreference = 'Stop'

# Cambia todo lo que hay entre el final del menu y el boton de WhatsApp, es
# decir el cuerpo de la pagina, sin tocar la cabecera ni el pie.
function Reemplazar-Cuerpo($pagina, $cuerpo) {
    $ruta = Join-Path (Get-Location) $pagina
    if (-not (Test-Path $ruta)) { Write-Output "no existe: $pagina"; return }

    $texto = [System.IO.File]::ReadAllText($ruta)

    $marca = '<!-- Navbar End -->'
    $inicio = $texto.IndexOf($marca)
    if ($inicio -lt 0) { Write-Output "$pagina : sin marca de fin de menu"; return }
    $inicio += $marca.Length

    $mWa = [regex]::Match($texto, '(?s)[ \t]*<a[^>]*class="whatsapp-btn".*?</a>')
    if (-not $mWa.Success) { Write-Output "$pagina : sin boton de WhatsApp"; return }

    $limpio = ($cuerpo -replace "`r?`n", "`r`n")
    $texto = $texto.Remove($inicio, $mWa.Index - $inicio).Insert($inicio, "`r`n" + $limpio + "`r`n")
    [System.IO.File]::WriteAllText($ruta, $texto, (New-Object System.Text.UTF8Encoding($false)))
    Write-Output "$pagina : cuerpo actualizado"
}

# Cabecera con el titulo de la pagina y la ruta de migas.
function Portadilla($titulo) {
    @"
    <!-- Page Header Start -->
    <div class="container-fluid page-header mb-5 py-5">
        <div class="container">
            <h1 class="display-3 text-white mb-3 animated slideInDown">$titulo</h1>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb animated slideInDown">
                    <li class="breadcrumb-item"><a class="text-white" href="index.html">Inicio</a></li>
                    <li class="breadcrumb-item text-white active" aria-current="page">$titulo</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Page Header End -->
"@
}

# Las tres marcas del grupo. La que se esta viendo queda marcada y enlaza a su
# propia portada, las otras dos cruzan de carpeta.
function Marcas($actual) {
    $fichas = @(
        @{ Nombre = 'IRS ANALYTICAL'; Carpeta = 'irlanalytical'; Logo = 'irlanalytical/img/logo.png'; Texto = 'Equipos e insumos para laboratorio' },
        @{ Nombre = 'TUBE &amp; FITTINGS'; Carpeta = 'tube&amp;Fittings'; Logo = 'tube&amp;Fittings/img/TNF_L2.png'; Texto = 'Conexiones, tuber&iacute;a e instrumentaci&oacute;n' },
        @{ Nombre = 'VACUUM SYSTEMS'; Carpeta = 'vacumSystem'; Logo = 'vacumSystem/img/vs_2.png'; Texto = 'Bombas de vac&iacute;o y servicio t&eacute;cnico' }
    )
    $tarjetas = ($fichas | ForEach-Object {
            $esActual = $_.Carpeta -eq ($actual -replace '&', '&amp;')
            $href = if ($esActual) { 'index.html' } else { "../$($_.Carpeta)/index.html" }
            $logo = if ($esActual) { ($_.Logo -split '/', 2)[1] } else { "../$($_.Logo)" }
            $etiqueta = if ($esActual) { '<span class="badge bg-primary ms-2">Est&aacute;s aqu&iacute;</span>' } else { '' }
            @"
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                <a href="$href" class="text-decoration-none text-dark">
                    <div class="h-100 border bg-white">
                        <div class="overflow-hidden bg-light d-flex align-items-center justify-content-center"
                            style="height: 150px;">
                            <img class="img-fluid p-3" src="$logo" alt="$($_.Nombre)"
                                style="max-height: 100%; object-fit: contain;">
                        </div>
                        <div class="p-4">
                            <h5 class="mb-1">$($_.Nombre)$etiqueta</h5>
                            <p class="text-muted small mb-0">$($_.Texto)</p>
                        </div>
                    </div>
                </a>
            </div>
"@
        }) -join "`n"

    @"
    <!-- Marcas Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
                <h1 class="mb-3">Nuestras marcas</h1>
                <p class="text-muted mb-0">Tres especialidades, un mismo equipo de trabajo.</p>
            </div>
            <div class="row g-4">
$tarjetas
            </div>
        </div>
    </div>
    <!-- Marcas End -->
"@
}

# Bloque con los datos de contacto reales; contacto.js los rellena desde
# Firebase, asi que aqui solo van como valor de respaldo.
function Contacto($destino) {
    @"
    <!-- Contacto Start -->
    <div class="container-xxl pb-5">
        <div class="container">
            <div class="panel-acento p-5 wow fadeInUp" data-wow-delay="0.1s">
                <div class="row g-4 align-items-center">
                    <div class="col-lg-7">
                        <h2 class="mb-4">&iquest;Hablamos de tu proyecto?</h2>
                        <p class="mb-2"><i class="fa fa-map-marker-alt me-3"></i><span
                                data-contacto="direccion">San Mateo, Edo. de M&eacute;xico</span></p>
                        <p class="mb-2"><i class="fa fa-phone-alt me-3"></i><a href="tel:7229063890"
                                class="text-reset text-decoration-none"
                                data-contacto="telefonoPrincipal">7229063890</a></p>
                        <p class="mb-2"><i class="fa fa-envelope me-3"></i><a href="mailto:contacto@irsmx.com"
                                class="text-reset text-decoration-none"
                                data-contacto="correoContacto">contacto@irsmx.com</a></p>
                        <p class="mb-0"><i class="fa fa-clock me-3"></i><span data-contacto="horario">Lunes a viernes
                                de 9:00 a 18:00</span></p>
                    </div>
                    <div class="col-lg-5 text-lg-end">
                        <a class="btn btn-primary rounded-pill py-3 px-5 me-2 mb-2" href="contact.html">Escr&iacute;benos</a>
                        <a class="btn btn-outline-primary rounded-pill py-3 px-5 mb-2" href="$destino">Ver cat&aacute;logo</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Contacto End -->
"@
}
