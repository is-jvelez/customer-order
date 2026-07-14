FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY src/AuthService.Api/*.csproj src/AuthService.Api/
COPY src/AuthService.Application/*.csproj src/AuthService.Application/
COPY src/AuthService.Domain/*.csproj src/AuthService.Domain/
COPY src/AuthService.Infrastructure/*.csproj src/AuthService.Infrastructure/
COPY src/AuthService.Shared/*.csproj src/AuthService.Shared/

RUN dotnet restore src/AuthService.Api/AuthService.Api.csproj

COPY . .

RUN dotnet publish \
    src/AuthService.Api/AuthService.Api.csproj \
    -c Release \
    -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet","AuthService.Api.dll"]