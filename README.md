# Somerscales Hotel Management

Plataforma de gestión interna para Somerscales Hotel — historial de huéspedes, calendario de reservas, control de gastos y dashboards de sentimiento de reseñas. API REST en Spring Boot + SPA en React TypeScript, desplegada sobre tier gratuito en Vercel + Hugging Face Spaces + Supabase.

**En producción:**
- Frontend → <https://somerscales-fe.vercel.app>
- Backend → <https://mikael1234345-somerscales-be.hf.space>
- Healthcheck → <https://mikael1234345-somerscales-be.hf.space/actuator/health>

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4, Recharts 3, @tanstack/react-query 5, react-router-dom 7 |
| Backend | Spring Boot 4.0.6, Java 17, Spring Security + JWT (jjwt 0.11.5), Flyway, Apache POI |
| Base de datos | PostgreSQL 17 (Supabase) |
| IA | Google Gemini 2.5 Flash (sentimiento multi-label) |
| Reseñas | Google Places API + TripAdvisor Content API |
| Correo | Gmail SMTP con App Password |
| Hosting | Vercel (FE) + Hugging Face Spaces (BE Docker) + Supabase (DB) |
| CI/CD | GitHub Actions |

## Estructura del proyecto

```
.
├── API-somerscale-main/          Backend Spring Boot (Java 17, Maven)
├── proyecto-hotel-sumer-main/    Frontend React 19 (Vite, TypeScript)
├── tests/                        Fixtures JSON offline (reseñas de Google Places + TripAdvisor)
├── README.md
└── .gitignore
```

## Requisitos previos

- Java 17 (Eclipse Temurin recomendado)
- Maven 3.9+ (o usar el wrapper incluido `./mvnw`)
- Node.js 20.19+ o 22.12+
- PostgreSQL 17 — local o [Supabase](https://supabase.com) tier gratuito

## Inicio rápido

### Backend

```bash
cd API-somerscale-main
cp .env-example .env          # completar DB, JWT, correo, claves de cifrado
./mvnw spring-boot:run        # Flyway aplica V1..V8 en el primer arranque
```

La API escucha en `http://localhost:8080`.

### Frontend

```bash
cd proyecto-hotel-sumer-main
npm install
npm run dev
```

La SPA se sirve en `http://localhost:5173`.

### Credenciales semilla (solo desarrollo)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `recep` | `recep123` | RECEPCIONISTA |
| `asistente` | `asis123` | ASISTENTE |

Rotar antes de cualquier despliegue que no sea de desarrollo.

## Funcionalidades

- **Autenticación y RBAC** — JWT con claim `perms[]`; gates `@PreAuthorize` basados en tabla de permisos; invitaciones tokenizadas de staff (el token raw nunca se persiste).
- **Cifrado en reposo** — AES-GCM-256 sobre `huespedes.numero_documento` con sidecar HMAC-SHA-256 para búsquedas por igualdad.
- **Huéspedes y reservas** — CRUD, agregación de historial, gastos adicionales, importación Excel de Cloudbeds, seed con Datafaker (200 huéspedes / 500 reservas).
- **Pipeline de reseñas** — sync diario de Google Places + TripAdvisor (idempotente, con fixtures offline); clasificación multi-label de sentimiento en 5 buckets + categorías vía Gemini.
- **Dashboard** — widgets Recharts: línea de ocupación, barra de top huéspedes, doughnut de sentimiento multi-label con drill-in.
- **Settings** — matriz de roles y permisos, categorías, taxonomía de sentimiento, editor de fichas/quick-picks, dark mode + avatar + cambio de contraseña por usuario.

## Modelo de ramas

| Rama | Propósito |
|---|---|
| `development` | Trabajo activo; todos los commits aterrizan acá primero. |
| `release` | Deploys de QA / staging. |
| `main` | Cortes de producción. |

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `revert`).

## Integraciones de API

Las funciones de reseñas + IA corren con **fixtures offline** por defecto. Para habilitar datos en vivo en desarrollo local, pegar las claves en `API-somerscale-main/.env` y reiniciar el backend. Para producción, ver [Notas para activación en producción](#notas-para-activación-en-producción) más abajo (los secretos van en el dashboard de Hugging Face / Vercel, no en `.env`).

| Integración | Variables de entorno | Dónde obtenerla |
|---|---|---|
| Google Places (reseñas) | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACES_PLACE_ID` | <https://console.cloud.google.com> → habilitar Places API (New) + billing → [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) |
| TripAdvisor (reseñas) | `TRIPADVISOR_API_KEY`, `TRIPADVISOR_LOCATION_ID` | <https://developer-tripadvisor.com> → solicitar Content API (aprobación 1–3 días) |
| Google Gemini (sentimiento) | `GEMINI_API_KEY` | <https://aistudio.google.com> → "Get API key" (tier gratuito; si aparece `429 limit:0`, habilitar billing en el proyecto GCP) |
| Cloudbeds (sync PMS) | `CLOUDBEDS_CLIENT_ID`, `CLOUDBEDS_CLIENT_SECRET`, `CLOUDBEDS_PROPERTY_ID` | Dashboard de Cloudbeds → My Account → API Credentials → *Create a Server-to-Server App*. El `property-id` aparece en la URL `/admin/property/{id}`. Sin estas variables corre el mock de CSV (`tests/huespedes.csv`); con ellas se activa `LiveCloudbedsApiClient` (OAuth2 client-credentials) y el cron domingo 03:00 Santiago trae datos reales. |

Cada integración auto-detecta una clave vacía y degrada con elegancia (fixtures offline, fallback log-only o no-op).

### Notas para activación en producción

Esfuerzo real esperado por integración (más allá de "pegar la clave"):

| Integración | ¿Realmente paste-and-go? | Lo que efectivamente se requiere |
|---|---|---|
| Correo (Gmail SMTP) | Ya activo en producción | Ningún paso pendiente. |
| Cloudbeds | Sí, con matiz | Pegar `CLIENT_ID`/`SECRET`/`PROPERTY_ID` como secretos de HF Space + reiniciar. El primer sync puede requerir 1–2 renombres de `@JsonProperty` en `integrations/cloudbeds/dto/CloudbedsReservation.java` si la respuesta real difiere de la documentación pública v1.2 (build especulativo, declarado en el playbook task033). |
| Google Places | No | Antes de que la clave funcione: tarjeta de billing habilitada en GCP + Places API (New) activada. ~30 min de clicks en la consola. |
| TripAdvisor | No | La clave no se emite hasta que TripAdvisor aprueba la solicitud al free tier (1–3 días hábiles). |
| Gemini | Bloqueador conocido | El proyecto GCP actual está capado a `limit:0` en el free tier; pegar otra key del mismo proyecto no ayuda. Requiere habilitar billing o migrar a un proyecto GCP nuevo. |

Adicionalmente, dos detalles operativos para el despliegue en vivo:

1. **Los secretos van en el dashboard del proveedor, no en `.env` local.** Para el backend en Hugging Face Spaces → *Settings → Variables and secrets*; para el frontend en Vercel → *Project Settings → Environment Variables*. El `.env` local sólo aplica a desarrollo (`./mvnw spring-boot:run`).
2. **Primera sincronización de Cloudbeds en modo `INCREMENTAL`.** El modo `FULL` borra `huespedes` + `reservas` + `additional_expenses` antes de recargar. Si las credenciales son incorrectas o el `propertyID` está mal, queda el dashboard vacío hasta volver a sembrar. Recomendado: *Settings → Sincronización Cloudbeds → Sincronizar ahora (INCREMENTAL)* en la primera ejecución en vivo; pasar a `FULL` solo después de validar que llegan filas.

## Licencia

Privada — proyecto académico DuocUC.