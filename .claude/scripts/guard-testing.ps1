# guard-testing.ps1
# HITL guard para el testing-agent: permite correr suites de prueba,
# pero bloquea deploys, borrado de datos y creacion de PR. Exit 2 = bloquear.

$input_raw = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input_raw)) { exit 0 }

try {
    $payload = $input_raw | ConvertFrom-Json
    $command = $payload.tool_input.command
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

$blocked = 'migrate:(fresh|refresh|reset)|db:wipe|drop\s+database|firebase\s+deploy|vercel|netlify\s+deploy|ng\s+deploy|git\s+push|gh\s+pr\s+create|rm\s+-rf'

if ($command -imatch $blocked) {
    [Console]::Error.WriteLine("HITL: deploys, borrado de datos y creacion de PR requieren aprobacion humana. Solo corre suites de prueba y verificacion; el PR lo genera el orquestador tras tu veredicto.")
    exit 2
}

exit 0