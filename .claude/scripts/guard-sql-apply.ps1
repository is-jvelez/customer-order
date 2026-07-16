# guard-sql-apply.ps1
# HITL guard para el sql-agent: bloquea comandos que apliquen cambios al
# servidor SQL real (aplicar migraciones / ejecutar DDL directo), permitiendo
# generar archivos y lecturas. Exit 2 = bloquear.

$input_raw = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input_raw)) { exit 0 }

try {
    $payload = $input_raw | ConvertFrom-Json
    $command = $payload.tool_input.command
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

$blocked = 'flyway\s+migrate|sqlcmd|docker\s+compose\s+.*flyway|invoke-sqlcmd|bcp'

if ($command -imatch $blocked) {
    [Console]::Error.WriteLine("HITL: aplicar cambios al servidor SQL requiere aprobacion humana. Genera la migracion .sql y detente para revision; no la apliques automaticamente.")
    exit 2
}

exit 0