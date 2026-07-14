# guard-angular.ps1
# HITL guard para el angular-agent: permite escribir codigo y correr tests/lint,
# pero bloquea build de produccion, deploy y cambios de dependencias. Exit 2 = bloquear.

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
    [Console]::Error.WriteLine("HITL: build de produccion, deploy y cambios de dependencias requieren aprobacion humana. Genera el codigo y corre los tests; no despliegues ni alteres dependencias.")
    exit 2
}

exit 0