# Recolorea la copia de Bootstrap y el style.css de un sitio para darle la
# paleta de su marca.
#
# Bootstrap ya viene compilado con los tonos derivados de cada color del tema:
# los estados (hover, activo) son el color base multiplicado por un factor, y
# los fondos suaves son mezclas con blanco. En vez de suponer que factores usa,
# se deduce el factor de cada color encontrado y se aplica el mismo al color de
# la marca. Asi el tema nuevo conserva exactamente el mismo contraste relativo.
#
# Se ejecuta en local una sola vez; no forma parte del sitio publicado.

param(
    [Parameter(Mandatory = $true)][string]$Sitio,
    [Parameter(Mandatory = $true)][string]$Primary,
    [Parameter(Mandatory = $true)][string]$Secondary,
    [Parameter(Mandatory = $true)][string]$Dark,
    [Parameter(Mandatory = $true)][string]$Light,
    [switch]$Detalle
)

# Paleta original (IRS) de la que parten los tres sitios.
$ORIGEN = [ordered]@{ primary = '#1E60AA'; secondary = '#FF4917'; dark = '#17224D'; light = '#EDF1FC' }
$DESTINO = [ordered]@{ primary = $Primary; secondary = $Secondary; dark = $Dark; light = $Light }

function ARgb($hex) {
    $h = $hex.TrimStart('#')
    , @([Convert]::ToInt32($h.Substring(0, 2), 16),
        [Convert]::ToInt32($h.Substring(2, 2), 16),
        [Convert]::ToInt32($h.Substring(4, 2), 16))
}

$bases = @()
foreach ($rol in $ORIGEN.Keys) {
    $v = ARgb $ORIGEN[$rol]
    $n = ARgb $DESTINO[$rol]
    # Canal mas fiable para deducir el factor: el de mayor valor para las
    # mezclas con negro, el de mayor margen hasta 255 para las mezclas con blanco.
    $iOscuro = 0; $iClaro = 0
    for ($i = 1; $i -lt 3; $i++) {
        if ($v[$i] -gt $v[$iOscuro]) { $iOscuro = $i }
        if ((255 - $v[$i]) -gt (255 - $v[$iClaro])) { $iClaro = $i }
    }
    $bases += [pscustomobject]@{ Rol = $rol; Viejo = $v; Nuevo = $n; CanalOscuro = $iOscuro; CanalClaro = $iClaro }
}

# Devuelve el color equivalente de la marca, o $null si el color no pertenece
# a ninguna familia del tema original.
function Equivalente([int]$r, [int]$g, [int]$b) {
    $c = @($r, $g, $b)
    foreach ($base in $bases) {
        $v = $base.Viejo; $n = $base.Nuevo

        # ¿Es el color base oscurecido por un factor?
        $i = $base.CanalOscuro
        if ($v[$i] -gt 0) {
            $f = $c[$i] / $v[$i]
            if ($f -le 1.02 -and $f -ge 0.15) {
                $ok = $true
                for ($k = 0; $k -lt 3; $k++) { if ([Math]::Abs($c[$k] - $v[$k] * $f) -gt 1.01) { $ok = $false; break } }
                if ($ok) {
                    return @([Math]::Round($n[0] * $f), [Math]::Round($n[1] * $f), [Math]::Round($n[2] * $f))
                }
            }
        }

        # ¿Es el color base aclarado hacia el blanco?
        $i = $base.CanalClaro
        if ((255 - $v[$i]) -gt 0) {
            $t = ($c[$i] - $v[$i]) / (255 - $v[$i])
            if ($t -gt 0 -and $t -le 0.99) {
                $ok = $true
                for ($k = 0; $k -lt 3; $k++) { if ([Math]::Abs($c[$k] - ($v[$k] + (255 - $v[$k]) * $t)) -gt 1.01) { $ok = $false; break } }
                if ($ok) {
                    return @([Math]::Round($n[0] + (255 - $n[0]) * $t),
                        [Math]::Round($n[1] + (255 - $n[1]) * $t),
                        [Math]::Round($n[2] + (255 - $n[2]) * $t))
                }
            }
        }
    }
    return $null
}

$vistos = @{}
$cambios = 0

foreach ($archivo in @("$Sitio\css\bootstrap.min.css", "$Sitio\css\style.css")) {
    $ruta = Join-Path (Get-Location) $archivo
    if (-not (Test-Path $ruta)) { continue }
    $texto = [System.IO.File]::ReadAllText($ruta)

    # Hex normales y los codificados dentro de data-URI SVG (%23RRGGBB).
    $texto = [regex]::Replace($texto, '(%23|#)([0-9A-Fa-f]{6})\b', {
            param($m)
            $h = $m.Groups[2].Value
            $eq = Equivalente ([Convert]::ToInt32($h.Substring(0, 2), 16)) ([Convert]::ToInt32($h.Substring(2, 2), 16)) ([Convert]::ToInt32($h.Substring(4, 2), 16))
            if ($null -eq $eq) { return $m.Value }
            $script:cambios++
            $nuevo = '{0:X2}{1:X2}{2:X2}' -f [int]$eq[0], [int]$eq[1], [int]$eq[2]
            $script:vistos["#$($h.ToUpper())"] = "#$nuevo"
            return $m.Groups[1].Value + $nuevo
        })

    # Tripletes rgb, dentro de rgb()/rgba() o sueltos en variables --bs-*-rgb.
    $texto = [regex]::Replace($texto, '\b(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\b', {
            param($m)
            $r = [int]$m.Groups[1].Value; $g = [int]$m.Groups[2].Value; $b = [int]$m.Groups[3].Value
            if ($r -gt 255 -or $g -gt 255 -or $b -gt 255) { return $m.Value }
            $eq = Equivalente $r $g $b
            if ($null -eq $eq) { return $m.Value }
            $script:cambios++
            $nuevo = "$([int]$eq[0]),$([int]$eq[1]),$([int]$eq[2])"
            $script:vistos["rgb($r,$g,$b)"] = "rgb($nuevo)"
            return $nuevo
        })

    [System.IO.File]::WriteAllText($ruta, $texto, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Output "$Sitio -> $cambios sustituciones, $($vistos.Count) colores distintos"
if ($Detalle) { $vistos.GetEnumerator() | Sort-Object Name | ForEach-Object { "     {0,-16} -> {1}" -f $_.Name, $_.Value } }
