# Evidencia cruda del pipeline (R6)

Cada corrida de `/run-cr <CR-id>` crea aquí `<CR-id>/<etapa>/` (`sql/`, `laravel/`, `angular/`, `testing/`, `deploy/`). Cada agente de capa guarda su evidencia cruda como archivos — salida completa de tests, respuestas JSON de `curl`, logs de Docker, capturas de pantalla — y la referencia desde su párrafo en `blueprint.md` por ruta relativa, en vez de pegarla completa en el texto.

Esto existe para dos cosas:

- Mantener `blueprint.md` escaneable (prosa + enlaces, no logs completos incrustados).
- Dejar un rastro auditable y diffable entre corridas del mismo CR (si una etapa se repite tras un "requiere cambios", la evidencia vieja no se pierde).

`acceptance-criteria.json` (en `.claude/artifacts/`, no aquí) es el checklist estructurado de los criterios de aceptación del CR, con un puntero a la evidencia concreta de cada uno.

Se versiona junto al código, igual que `blueprint.md` — es parte del registro que acompaña al PR.
