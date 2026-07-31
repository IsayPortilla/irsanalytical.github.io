# Escribe la misma cabecera, pie y bloque de scripts en todas las paginas de
# los tres sitios. Cada marca solo cambia de logotipo, de nombre y de enlaces:
# el color lo pone su propio css/bootstrap.min.css, no el marcado.
#
# Se ejecuta en local; no forma parte del sitio publicado.

param([string[]]$Sitios = @('irlanalytical', 'tube&Fittings', 'vacumSystem'))

$ErrorActionPreference = 'Stop'

# --- Configuracion de cada marca -------------------------------------------

$MARCAS = @{
    'irlanalytical' = @{
        Nombre  = 'IRS ANALYTICAL'
        Sigla   = 'IRS'
        Logo    = 'img/logo.png'
        Icono   = 'img/logo.ico'
        Empresa = 'IRS ANALYTICAL SERVICE'
        Catalogo = 'product.html'
        Ficha   = 'detail.html'
        Destino = 'product.html'
        Aviso   = '<b>COMPRAS INMEDIATAS</b> en nuestras ofertas. Da clic <a href="specials.html" class="text-light fw-bold">AQU&Iacute;</a>'
        Enlaces = @(
            @{ Texto = 'Ofertas Especiales'; Href = 'specials.html'; Clase = ' text-danger fw-bold' },
            @{ Texto = 'Nosotros'; Href = 'about-us.html' },
            @{ Texto = 'Contacto'; Href = 'contact.html' }
        )
        EnlacesPie = @(
            @{ Texto = 'Solicitar servicio'; Href = 'booking.html' }
        )
        Titulos = @{
            'index.html' = 'IRS ANALYTICAL'; 'about-us.html' = 'Nosotros'; 'about.html' = 'Marcas'
            'service.html' = 'Servicios'; 'product.html' = 'Cat&aacute;logo'; 'detail.html' = 'Producto'
            'specials.html' = 'Ofertas especiales'; 'contact.html' = 'Contacto'
            'booking.html' = 'Solicitar servicio'; 'team.html' = 'Equipo'
            'testimonial.html' = 'Testimonios'; '404.html' = 'P&aacute;gina no encontrada'
            'login.html' = 'Ingresar'
        }
    }
    'tube&Fittings' = @{
        Nombre  = 'TUBE &amp; FITTINGS'
        Sigla   = 'TNF'
        Logo    = 'img/TNF_L2.png'
        Icono   = 'img/TNF_L2.png'
        Empresa = 'TUBE AND FITTINGS'
        Catalogo = 'product.html'
        Ficha   = 'detail.html'
        Destino = 'product.html'
        Aviso   = 'Conexiones, tuber&iacute;a e instrumentaci&oacute;n para gases. Ver <a href="product.html" class="text-light fw-bold">cat&aacute;logo</a>'
        Enlaces = @(
            @{ Texto = 'Cat&aacute;logo'; Href = 'product.html' },
            @{ Texto = 'Servicios'; Href = 'service.html' },
            @{ Texto = 'Nosotros'; Href = 'about.html' },
            @{ Texto = 'Contacto'; Href = 'contact.html' }
        )
        EnlacesPie = @(
            @{ Texto = 'Lista de precios DS-LOK'; Href = 'team.html' },
            @{ Texto = 'Solicitar servicio'; Href = 'booking.html' }
        )
        Titulos = @{
            'index.html' = 'TUBE &amp; FITTINGS'; 'about.html' = 'Nosotros'; 'service.html' = 'Servicios'
            'product.html' = 'Cat&aacute;logo'; 'detail.html' = 'Producto'; 'team.html' = 'Cat&aacute;logo DS-LOK'
            'contact.html' = 'Contacto'; 'booking.html' = 'Solicitar servicio'
            'testimonial.html' = 'Testimonios'; '404.html' = 'P&aacute;gina no encontrada'
            'login.html' = 'Ingresar'
        }
    }
    'vacumSystem' = @{
        Nombre  = 'VACUUM SYSTEMS'
        Sigla   = 'VS'
        Logo    = 'img/vs_2.png'
        Icono   = 'img/vs_2.png'
        # Sin catalogo en Firebase todavia: su menu es fijo y el buscador filtra
        # el listado de equipos que vive en team.html.
        Empresa = ''
        Catalogo = 'team.html'
        Ficha   = ''
        Destino = 'team.html'
        Aviso   = 'Bombas de vac&iacute;o, refacciones y servicio t&eacute;cnico. Ver <a href="team.html" class="text-light fw-bold">equipos</a>'
        Enlaces = @(
            @{ Texto = 'Equipos y refacciones'; Href = 'team.html' },
            @{ Texto = 'Servicios'; Href = 'service.html' },
            @{ Texto = 'Nosotros'; Href = 'about.html' },
            @{ Texto = 'Contacto'; Href = 'contact.html' }
        )
        EnlacesPie = @(
            @{ Texto = 'Solicitar servicio'; Href = 'booking.html' }
        )
        Titulos = @{
            'index.html' = 'VACUUM SYSTEMS'; 'about.html' = 'Nosotros'; 'service.html' = 'Servicios'
            'team.html' = 'Equipos y refacciones'; 'contact.html' = 'Contacto'
            'booking.html' = 'Solicitar servicio'; 'testimonial.html' = 'Testimonios'
            '404.html' = 'P&aacute;gina no encontrada'; 'login.html' = 'Ingresar'
        }
    }
}

# Scripts de plantilla que ya estan en el bloque comun: cualquier otro script
# que tenga la pagina es suyo y hay que conservarlo.
$SCRIPTS_COMUNES = @(
    'code.jquery.com', 'bootstrap.bundle.min.js', 'lib/wow/', 'lib/easing/',
    'lib/waypoints/', 'lib/counterup/', 'lib/owlcarousel/', 'lib/tempusdominus/',
    'js/main.js', 'firebase.js', 'auth_handler.js'
)

# --- Plantillas -------------------------------------------------------------

function Cabeza($marca, $titulo, $extra) {
    @"
<head>
    <meta charset="utf-8">
    <title>$titulo</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta content="" name="keywords">
    <meta content="" name="description">

    <link rel="icon" href="$($marca.Icono)">

    <!-- Google Web Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Roboto:wght@500;700&display=swap"
        rel="stylesheet">

    <!-- Icon Font Stylesheet -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Libraries Stylesheet -->
    <link href="lib/animate/animate.min.css" rel="stylesheet">
    <link href="lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">
    <link href="lib/tempusdominus/css/tempusdominus-bootstrap-4.min.css" rel="stylesheet" />

    <!-- Bootstrap con los colores de la marca -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Template Stylesheet -->
    <link href="css/style.css" rel="stylesheet">
$extra</head>
"@
}

function Cabecera($marca) {
    $enlaces = ($marca.Enlaces | ForEach-Object {
            $clase = if ($_.Clase) { $_.Clase } else { '' }
            "                    <a href=`"$($_.Href)`" class=`"nav-item nav-link$clase`">$($_.Texto)</a>"
        }) -join "`n"

    # Solo las marcas con catalogo en Firebase arman desplegables y sugerencias.
    $attrEmpresa = if ($marca.Empresa) { " data-menu-empresa=`"$($marca.Empresa)`" data-menu-catalogo=`"$($marca.Catalogo)`"" } else { '' }
    $attrBusca = " data-busqueda-destino=`"$($marca.Destino)`""
    if ($marca.Empresa -and $marca.Ficha) {
        $attrBusca += " data-busqueda-ficha=`"$($marca.Ficha)`" data-busqueda-empresa=`"$($marca.Empresa)`""
    }

    @"
<body>

    <!-- Spinner Start -->
    <div id="spinner"
        class="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
            <span class="sr-only">Cargando...</span>
        </div>
    </div>
    <!-- Spinner End -->

    <!-- Aviso superior -->
    <div class="row g-0 align-items-center bg-primary text-light py-1">
        <div class="col-12 col-md text-center">
            <p class="mb-0 small">$($marca.Aviso)</p>
        </div>
        <div class="col-12 col-md text-center">
            <p class="mb-0 small"><i class="fas fa-phone-alt me-2"></i>Cont&aacute;ctanos
                <a href="tel:7229063890" class="text-light" data-contacto="telefonoPrincipal">7229063890</a>
            </p>
        </div>
    </div>

    <!-- Logotipo, buscador y cuenta -->
    <div class="row g-0 align-items-center bg-white py-2">
        <div class="col-12 col-lg-4 text-center">
            <a href="index.html"><img src="$($marca.Logo)" alt="$($marca.Nombre)" height="90"></a>
        </div>
        <div class="col-12 col-lg-5 position-relative px-3 py-2 py-lg-0" style="z-index: 1060;">
            <div class="input-group">
                <input type="text" id="input-busqueda" class="form-control" placeholder="Buscar productos..."
                    aria-label="Buscar productos" autocomplete="off"$attrBusca>
                <button class="btn btn-outline-primary" type="button" id="btn-buscar" aria-label="Buscar">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <div id="sugerencias-busqueda" class="list-group position-absolute w-100 shadow-lg d-none"
                style="z-index: 9999; top: 100%; left: 0; background-color: #ffffff !important; border: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
            </div>
        </div>
        <div class="col-12 col-lg-3 text-center">
            <a href="login.html" class="text-decoration-none text-primary">
                <i class="fas fa-user-circle fa-lg"></i>
                <span class="ms-1 d-none d-md-inline">Ingresar / Mi cuenta</span>
            </a>
        </div>
    </div>

    <!-- Navbar Start -->
    <div class="container-fluid nav-bar bg-light">
        <nav class="navbar navbar-expand-lg navbar-light bg-white p-3 py-lg-0 px-lg-4">
            <a href="index.html" class="navbar-brand d-flex align-items-center m-0 p-0 d-lg-none">
                <h1 class="text-primary m-0">$($marca.Sigla)</h1>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse"
                aria-label="Abrir men&uacute;">
                <span class="fa fa-bars"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse">
                <div class="navbar-nav me-auto" id="main-nav-container"$attrEmpresa>
$enlaces
                </div>
            </div>
        </nav>
    </div>
    <!-- Navbar End -->
"@
}

function Pie($marca, $sitio) {
    $otras = @(
        @{ Nombre = 'IRS ANALYTICAL'; Sitio = 'irlanalytical'; Inicio = 'index.html' },
        @{ Nombre = 'VACUUM SYSTEMS'; Sitio = 'vacumSystem'; Inicio = 'index.html' },
        @{ Nombre = 'TUBE &amp; FITTINGS'; Sitio = 'tube&amp;Fittings'; Inicio = 'index.html' }
    )
    $marcas = ($otras | ForEach-Object {
            $href = if ($_.Sitio -eq ($sitio -replace '&', '&amp;')) { $_.Inicio } else { "../$($_.Sitio)/$($_.Inicio)" }
            "                    <a class=`"btn btn-link`" href=`"$href`">$($_.Nombre)</a>"
        }) -join "`n"

    # El pie recoge tambien las paginas utiles que no caben en el menu; sin esto
    # quedaban publicadas pero sin un solo enlace que llevara a ellas.
    $secciones = (@($marca.Enlaces) + @($marca.EnlacesPie) | Where-Object { $_ } | ForEach-Object {
            "                    <a class=`"btn btn-link`" href=`"$($_.Href)`">$($_.Texto)</a>"
        }) -join "`n"

    @"
    <a href="https://wa.me/7226817326?text=Hola,%20%C2%BFme%20puede%20dar%20informaci%C3%B3n?" target="_blank"
        rel="noopener" class="whatsapp-btn" aria-label="Escr&iacute;benos por WhatsApp">
        <i class="bi bi-whatsapp"></i>
    </a>

    <!-- Footer Start -->
    <div class="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-lg-4 col-md-6">
                    <h4 class="text-light mb-4">$($marca.Nombre)</h4>
                    <p class="mb-2"><i class="fa fa-map-marker-alt me-3"></i><span
                            data-contacto="direccion">San Mateo, Edo. de M&eacute;xico</span></p>
                    <p class="mb-2"><i class="fa fa-phone-alt me-3"></i><a href="tel:7229063890"
                            class="text-light text-decoration-none" data-contacto="telefonoPrincipal">7229063890</a></p>
                    <p class="mb-2"><i class="fa fa-envelope me-3"></i><a href="mailto:contacto@irsmx.com"
                            class="text-light text-decoration-none" data-contacto="correoContacto">contacto@irsmx.com</a></p>
                    <p class="mb-0"><i class="fa fa-clock me-3"></i><span data-contacto="horario">Lunes a viernes de
                            9:00 a 18:00</span></p>
                </div>

                <div class="col-lg-4 col-md-6">
                    <h4 class="text-light mb-4">Secciones</h4>
$secciones
                </div>

                <div class="col-lg-4 col-md-6">
                    <h4 class="text-light mb-4">Nuestras marcas</h4>
$marcas
                </div>
            </div>
        </div>
        <div class="container">
            <div class="copyright">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a class="border-bottom" href="index.html">$($marca.Nombre)</a>
                    </div>
                    <div class="col-md-6 text-center text-md-end">
                        <a class="border-bottom" href="contact.html">Cont&aacute;ctanos</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Footer End -->
"@
}

function Scripts($propios) {
    $extra = if ($propios) { "`n" + ($propios -join "`n") } else { '' }
    @"
    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/wow/wow.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/counterup/counterup.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/tempusdominus/js/moment.min.js"></script>
    <script src="lib/tempusdominus/js/moment-timezone.min.js"></script>
    <script src="lib/tempusdominus/js/tempusdominus-bootstrap-4.min.js"></script>

    <!-- Template Javascript -->
    <script src="js/main.js"></script>
    <script type="module" src="../firebase.js"></script>$extra
</body>
"@
}

# --- Aplicacion -------------------------------------------------------------

foreach ($sitio in $Sitios) {
    $marca = $MARCAS[$sitio]
    if (-not $marca) { Write-Output "sin configuracion: $sitio"; continue }

    foreach ($pagina in (Get-ChildItem $sitio -Filter *.html | Sort-Object Name)) {
        $nombre = $pagina.Name
        # El panel es una interfaz aparte y no lleva la cabecera del sitio.
        if ($nombre -eq 'dashboard.html') { continue }

        $texto = [System.IO.File]::ReadAllText($pagina.FullName)
        $original = $texto
        $notas = @()

        # 1. <head>: se conservan los <style> propios de la pagina.
        $mHead = [regex]::Match($texto, '(?s)<head\b[^>]*>.*?</head>')
        if ($mHead.Success) {
            $estilos = ([regex]::Matches($mHead.Value, '(?s)<style\b[^>]*>.*?</style>') | ForEach-Object { '    ' + $_.Value }) -join "`n"
            if ($estilos) { $estilos += "`n" }
            $sufijo = $marca.Titulos[$nombre]
            $titulo = if ($sufijo -and $sufijo -ne $marca.Nombre) { "$sufijo | $($marca.Nombre)" } else { $marca.Nombre }
            $texto = $texto.Remove($mHead.Index, $mHead.Length).Insert($mHead.Index, (Cabeza $marca $titulo $estilos))
        }
        else { $notas += 'sin <head>' }

        # 2. Cabecera: desde <body> hasta el fin del menu.
        $iBody = [regex]::Match($texto, '<body\b[^>]*>')
        $iFin = $texto.IndexOf('<!-- Navbar End -->')
        if ($iBody.Success -and $iFin -gt $iBody.Index) {
            $largo = $iFin + '<!-- Navbar End -->'.Length - $iBody.Index
            $texto = $texto.Remove($iBody.Index, $largo).Insert($iBody.Index, (Cabecera $marca))
        }
        else { $notas += 'sin marca de fin de menu' }

        # 3. Pie.
        $iPie = $texto.IndexOf('<!-- Footer Start -->')
        $iPieFin = $texto.IndexOf('<!-- Footer End -->')
        if ($iPie -ge 0 -and $iPieFin -gt $iPie) {
            # El boton de WhatsApp va justo antes y se vuelve a escribir con el pie.
            $inicio = $iPie
            $mWa = [regex]::Matches($texto.Substring(0, $iPie), '(?s)<a[^>]*class="whatsapp-btn".*?</a>')
            if ($mWa.Count) {
                $ultimo = $mWa[$mWa.Count - 1]
                if ($iPie - ($ultimo.Index + $ultimo.Length) -lt 200) { $inicio = $ultimo.Index }
            }
            $largo = $iPieFin + '<!-- Footer End -->'.Length - $inicio
            $texto = $texto.Remove($inicio, $largo).Insert($inicio, (Pie $marca $sitio))
        }
        else { $notas += 'sin pie' }

        # 4. Scripts: se conservan los que son propios de la pagina.
        $iJs = $texto.IndexOf('<!-- JavaScript Libraries -->')
        $iBodyFin = $texto.LastIndexOf('</body>')
        if ($iJs -ge 0 -and $iBodyFin -gt $iJs) {
            $bloque = $texto.Substring($iJs, $iBodyFin - $iJs)
            $propios = @()
            foreach ($m in [regex]::Matches($bloque, '(?s)<script\b.*?</script>')) {
                $esComun = $false
                foreach ($c in $SCRIPTS_COMUNES) { if ($m.Value -like "*$c*") { $esComun = $true; break } }
                if (-not $esComun) { $propios += '    ' + $m.Value.Trim() }
            }
            $largo = $iBodyFin + '</body>'.Length - $iJs
            $texto = $texto.Remove($iJs, $largo).Insert($iJs, (Scripts $propios))
        }
        else { $notas += 'sin bloque de scripts' }

        # 5. El idioma declarado estaba en ingles en todas las paginas.
        $texto = [regex]::Replace($texto, '<html\b[^>]*>', '<html lang="es">', 1)

        if ($texto -ne $original) {
            [System.IO.File]::WriteAllText($pagina.FullName, $texto, (New-Object System.Text.UTF8Encoding($false)))
        }
        $estado = if ($notas) { 'PENDIENTE: ' + ($notas -join ', ') } else { 'ok' }
        "{0,-16} {1,-20} {2}" -f $sitio, $nombre, $estado
    }
}
