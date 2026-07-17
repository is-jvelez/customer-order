# customer-order
App de clientes y ordenes

## Prerrequisitos
- Docker y Docker Compose
- Copiar variables de entorno:

    cp .env.example .env

## Ejecutar el proyecto

    docker compose build
    docker compose up -d

    docker-compose down -v
    docker-compose up -d --build

Verificar configuración (opcional):

    docker compose config

Ver logs:

    docker compose logs -f

Detener:

    docker compose down


## Ejecutar un servicio en particular
    docker compose up <nombre_servicio>
    Ejemplo:
        docker compose up flyway
