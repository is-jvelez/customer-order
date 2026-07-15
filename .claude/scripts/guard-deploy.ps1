# guard-deploy.ps1
# HITL guard para el deploy-agent: permite build/up/ps/logs/inspect de solo
# recarga local, pero bloquea borrado de datos, prune y despliegue remoto. Exit 2 = bloquear.

$input_raw = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input_raw)) { exit 0 }

try {
    $payload = $input_raw | ConvertFrom-Json
    $command = $payload.tool_input.command
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

$blocked = 'docker\s+compose\s+down\s+.*-v|docker\s+volume\s+rm|docker\s+system\s+prune|docker\s+rmi|docker\s+push|kubectl|flyway\s+migrate|sqlcmd|artisan\s+migrate|migrate:(fresh|refresh|reset|rollback)|db:wipe|db:seed|git\s+push|gh\s+pr\s+create|vercel|netlify|firebase\s+deploy'

if ($command -imatch $blocked) {
    [Console]::Error.WriteLine("HITL: borrado de datos/volumenes, prune y despliegue remoto o a PR requieren aprobacion humana o son responsabilidad de otra capa. Solo reconstruye y recarga el entorno local (build/up/ps/logs), y verifica; no apliques migraciones ni hagas deploy remoto.")
    exit 2
}

exit 0
