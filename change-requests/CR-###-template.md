# CR-XXX: [Título corto y accionable]

## Metadatos
- **ID:** CR-XXX
- **Sistema:** [WEBFORMS_NET40 | SOAP_NET40 | API_REST_NET8/10]
- **Prioridad:** [Alta | Media | Baja]
- **Autor / Solicitante:**
- **Fecha:**

## Qué  🔴 OBLIGATORIA
Descripción funcional precisa del cambio. Qué debe hacer el sistema
DESPUÉS del cambio, en lenguaje concreto. Evita ambigüedad.

## Por qué  🔴 OBLIGATORIA
Contexto de negocio. Qué problema resuelve, quién lo pidió, qué
pasa si no se hace. Da al agente el "norte" para decidir en zonas grises.

## Criterios de aceptación  🔴 OBLIGATORIA
Lista verificable de condiciones que definen "terminado". Redáctalos
como afirmaciones comprobables (idealmente Given/When/Then):
- [ ] Dado [contexto], cuando [acción], entonces [resultado esperado]
- [ ] ...
Sin esta sección el pipeline no sabe cuándo parar.

## Fuera de alcance  🔴 OBLIGATORIA
Qué NO se debe tocar. Archivos, módulos, comportamientos o refactors
prohibidos. Es la barrera que evita que el agente "mejore" cosas que
no pediste.

## Contexto técnico  🟡 Recomendada
- Archivos/proyectos afectados conocidos
- Dependencias, tablas SQL, endpoints o servicios involucrados
- Restricciones (compatibilidad IE11, versión de framework, etc.)

## Casos borde y validaciones  🟡 Recomendada
Escenarios especiales, manejo de errores, valores nulos, concurrencia.

## Notas / Referencias  ⚪ Opcional
Enlaces a tickets, SonarCloud, capturas, PRs relacionados.