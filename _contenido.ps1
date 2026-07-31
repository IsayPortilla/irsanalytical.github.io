# Escribe el cuerpo del catalogo y de la ficha de producto en los sitios que
# venden en linea, dejando intactos la cabecera y el pie que puso _maqueta.ps1.
# Se ejecuta en local; no forma parte del sitio publicado.

. (Join-Path $PSScriptRoot '_comun.ps1')

$CATALOGO = @'

    <div class="container-fluid bg-light py-5">
        <div class="container text-center">
            <h1 id="titulo-pagina" class="display-5 mb-0">Cat&aacute;logo de productos</h1>
        </div>
    </div>

    <div class="container py-5">
        <div id="loading-productos" class="text-center p-5">
            <div class="spinner-border text-primary" role="status"><span class="sr-only">Cargando...</span></div>
            <p class="mt-2 mb-0">Cargando productos...</p>
        </div>

        <div class="row g-4" id="contenedor-productos"></div>

        <nav aria-label="P&aacute;ginas del cat&aacute;logo" class="mt-5">
            <ul class="pagination justify-content-center mb-0" id="paginacion-lista"></ul>
        </nav>

        <div id="sin-resultados" class="text-center d-none py-5">
            <i class="fas fa-search fa-3x text-muted mb-3"></i>
            <h3>No encontramos productos con ese criterio</h3>
            <a href="product.html" class="btn btn-primary mt-3">Ver todo el cat&aacute;logo</a>
        </div>
    </div>

__SCRIPT__
'@

$FICHA = @'

    <div class="container py-5">
        <a href="product.html" class="btn btn-sm btn-outline-secondary mb-4">
            <i class="fa fa-arrow-left me-2"></i>Volver al cat&aacute;logo</a>

        <div id="loading-detalle" class="text-center p-5">
            <div class="spinner-border text-primary" role="status"><span class="sr-only">Cargando...</span></div>
        </div>

        <div id="detalle-no-encontrado" class="text-center d-none py-5">
            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h3>No encontramos ese producto</h3>
            <a href="product.html" class="btn btn-primary mt-3">Ver el cat&aacute;logo</a>
        </div>

        <div id="content-detalle" class="row g-5 d-none">
            <div class="col-lg-6">
                <div class="border rounded p-4 text-center bg-white shadow-sm">
                    <img id="p-imagen" src="" alt="" class="img-fluid" style="max-height: 400px; object-fit: contain;">
                </div>
                <div id="p-galeria" class="d-flex flex-wrap gap-2 mt-3"></div>
            </div>
            <div class="col-lg-6">
                <h1 id="p-nombre" class="display-6 fw-bold"></h1>
                <p id="p-ficha" class="text-muted small mb-0"></p>
                <h2 id="p-precio" class="text-primary fw-bold my-4"></h2>
                <div class="mb-4">
                    <h5>Descripci&oacute;n</h5>
                    <p id="p-descripcion" class="text-secondary mb-0"></p>
                </div>
                <div class="d-grid gap-2">
                    <a id="btn-wa" href="#" target="_blank" rel="noopener" class="btn btn-success btn-lg">
                        <i class="fab fa-whatsapp me-2"></i>Cotizar ahora</a>
                </div>
            </div>
        </div>

        <p class="visually-hidden">ID: <span id="p-id"></span></p>
    </div>

__SCRIPT__
'@

$SCRIPTS = [ordered]@{
    'irlanalytical\product.html'  = @'
    <script type="module">
        import { iniciarCatalogo } from "../catalogo.js";
        import { cargarMapeoImagenes, imagenDeProducto } from "./js/imagenes_productos.js";

        const mapeo = await cargarMapeoImagenes();
        iniciarCatalogo({
            empresa: "IRS ANALYTICAL SERVICE",
            imagen: (producto) => imagenDeProducto(mapeo, producto.id, producto)
        });
    </script>
'@
    'irlanalytical\detail.html'   = @'
    <script type="module">
        import { iniciarFicha } from "../catalogo.js";
        import { cargarMapeoImagenes, galeriaDeProducto } from "./js/imagenes_productos.js";

        const mapeo = await cargarMapeoImagenes();
        iniciarFicha({ galeria: (id, datos) => galeriaDeProducto(mapeo, id, datos) });
    </script>
'@
    'tube&Fittings\product.html' = @'
    <script type="module">
        import { iniciarCatalogo } from "../catalogo.js";

        // Las piezas todavia no tienen fotografia propia dada de alta, asi que
        // todas muestran la imagen de la marca hasta que se carguen.
        iniciarCatalogo({ empresa: "TUBE AND FITTINGS", imagen: () => "img/TNF_C2.png" });
    </script>
'@
    'tube&Fittings\detail.html'  = @'
    <script type="module">
        import { iniciarFicha } from "../catalogo.js";

        iniciarFicha({ galeria: () => ["img/TNF_C2.png"] });
    </script>
'@
}

foreach ($pagina in $SCRIPTS.Keys) {
    $base = if ($pagina -like '*product.html') { $CATALOGO } else { $FICHA }
    Reemplazar-Cuerpo $pagina $base.Replace('__SCRIPT__', $SCRIPTS[$pagina])
}
