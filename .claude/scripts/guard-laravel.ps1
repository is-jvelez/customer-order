# guard-laravel.ps1
# HITL guard para el laravel-agent: permite escribir codigo y correr tests,
# pero bloquea comandos que muten la base de datos real. Exit 2 = bloquear.

$input_raw = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input_raw)) { exit 0 }

try {
    $payload = $input_raw | ConvertFrom-Json
    $command = $payload.tool_input.command
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

$blocked = 'artisan\s+migrate|migrate:(fresh|refresh|reset|rollback)|db:wipe|db:seed|schema:dump'

if ($command -imatch $blocked) {
    [Console]::Error.WriteLine("HITL: mutar la base de datos requiere aprobacion humana. Genera el codigo y los tests; no ejecutes migraciones ni seeders contra la BD real.")
    exit 2
}

exit 0