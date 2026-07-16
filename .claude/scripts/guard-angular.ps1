# guard-angular.ps1
# HITL guard para el angular-agent: permite escribir codigo y correr tests/lint,
# pero bloquea build de produccion, deploy y cambios de dependencias. Exit 2 = bloquear.
#
# R2 (presupuesto de autonomia): una excepcion angosta permite instalar, SIN pausa
# humana, un paquete que (a) ya existe en package.json bajo el mismo scope que
# @angular/core (ej. @angular/animations junto a @angular/core), y (b) se instala
# fijando una version cuyo major.minor coincide con el de @angular/core ya
# instalado (ej. @angular/core en ^21.2.x -> solo se permite @angular/<algo>@21.2.*).
# Cualquier otro paquete, scope, flag (-g, --force, --legacy-peer-deps) o comando
# de instalacion masiva (install/ci sin paquete especifico) sigue bloqueado.

$input_raw = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input_raw)) { exit 0 }

try {
    $payload = $input_raw | ConvertFrom-Json
    $command = $payload.tool_input.command
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

$blocked = 'npm\s+(install|i|ci|publish|update)|yarn\s+(add|install|publish|upgrade)|pnpm\s+(add|install|publish)|ng\s+build|ng\s+deploy|firebase\s+deploy|vercel|netlify\s+deploy'

if ($command -imatch $blocked) {

    # Excepcion angosta: `npm install @angular/<pkg>@<version>` (un solo paquete,
    # sin flags extra) cuando <version> calza en major.minor con @angular/core
    # ya declarado en package.json del mismo proyecto.
    $singlePkgMatch = $command -imatch '^npm\s+(?:install|i)\s+(@angular/[a-z0-9-]+)@([0-9]+\.[0-9]+)(\.[0-9]+)?\s*$'

    if ($singlePkgMatch) {
        $requestedMajorMinor = $Matches[2]
        $pkgJsonPath = Join-Path (Get-Location) "is-order-flow-app/package.json"
        if (-not (Test-Path $pkgJsonPath)) { $pkgJsonPath = Join-Path (Get-Location) "package.json" }

        if (Test-Path $pkgJsonPath) {
            try {
                $pkgJson = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
                $coreRange = $pkgJson.dependencies.'@angular/core'
                if ($coreRange -and ($coreRange -match '([0-9]+\.[0-9]+)')) {
                    $installedMajorMinor = $Matches[1]
                    if ($requestedMajorMinor -eq $installedMajorMinor) {
                        exit 0
                    }
                }
            } catch {
                # si no se puede parsear package.json, no se concede la excepcion
            }
        }

        [Console]::Error.WriteLine("HITL: la version solicitada no calza con la familia @angular/core ya instalada (major.minor debe coincidir). Pide aprobacion humana explicita para esta version.")
        exit 2
    }

    [Console]::Error.WriteLine("HITL: build de produccion, deploy y cambios de dependencias requieren aprobacion humana. Excepcion: instalar un paquete @angular/<x>@<version> cuya version calce en major.minor con @angular/core ya declarado esta permitido sin pausa (documentalo en el blueprint). Todo lo demas -- otro scope, flags, o install/ci masivo -- sigue requiriendo aprobacion.")
    exit 2
}

exit 0