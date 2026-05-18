# Somerscales Hotel Management

Internal management platform for Somerscales Hotel — guest history, reservation calendar, expense tracking, and review-sentiment dashboards. Spring Boot REST API + React TypeScript SPA, deployed free-tier on Vercel + Hugging Face Spaces + Supabase.

**Live:**
- Frontend → <https://somerscales-fe.vercel.app>
- Backend → <https://mikael1234345-somerscales-be.hf.space>
- Health → <https://mikael1234345-somerscales-be.hf.space/actuator/health>

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4, Recharts 3, @tanstack/react-query 5, react-router-dom 7 |
| Backend | Spring Boot 4.0.6, Java 17, Spring Security + JWT (jjwt 0.11.5), Flyway, Apache POI |
| Database | PostgreSQL 17 (Supabase) |
| AI | Google Gemini 2.5 Flash (multi-label sentiment) |
| Reviews | Google Places API + TripAdvisor Content API |
| Email | Gmail SMTP via App Password |
| Hosting | Vercel (FE) + Hugging Face Spaces (BE Docker) + Supabase (DB) |
| CI/CD | GitHub Actions |

## Project Structure

```
.
├── API-somerscale-main/          Spring Boot backend (Java 17, Maven)
├── proyecto-hotel-sumer-main/    React 19 frontend (Vite, TypeScript)
├── tests/                        Offline JSON fixtures (Google Places + TripAdvisor reviews)
├── README.md
└── .gitignore
```

## Prerequisites

- Java 17 (Eclipse Temurin recommended)
- Maven 3.9+ (or use the bundled `./mvnw` wrapper)
- Node.js 20.19+ or 22.12+
- PostgreSQL 17 — local or [Supabase](https://supabase.com) free tier

## Quick Start

### Backend

```bash
cd API-somerscale-main
cp .env-example .env          # fill in DB, JWT, mail, encryption keys
./mvnw spring-boot:run        # Flyway applies V1..V8 on first boot
```

API listens on `http://localhost:8080`.

### Frontend

```bash
cd proyecto-hotel-sumer-main
npm install
npm run dev
```

SPA serves on `http://localhost:5173`.

### Seed credentials (dev only)

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `recep` | `recep123` | RECEPCIONISTA |
| `asistente` | `asis123` | ASISTENTE |

Rotate before any non-dev deployment.

## Features

- **Auth & RBAC** — JWT with `perms[]` claim; permission-table-driven `@PreAuthorize` gates; tokenized staff invitations (raw token never persisted).
- **Encryption at rest** — AES-GCM-256 on `huespedes.numero_documento` with HMAC-SHA-256 sidecar for equality lookups.
- **Guests & reservations** — CRUD, history aggregate, additional expenses, Cloudbeds Excel import, Datafaker seed (200 guests / 500 bookings).
- **Reviews pipeline** — daily Google Places + TripAdvisor sync (idempotent, with offline fixtures); Gemini multi-label 5-bucket sentiment + category classification.
- **Dashboard** — Recharts widgets: occupancy line, top-guests bar, multi-label sentiment doughnut with drill-in.
- **Settings** — roles & permissions matrix, categories, sentiment taxonomy, sheets/quick-picks editor, per-user dark mode + avatar + password change.

## Branch Model

| Branch | Purpose |
|---|---|
| `development` | Active work; all commits land here first. |
| `release` | QA / staging deploys. |
| `main` | Production cuts. |

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `revert`).

## License

Private — DuocUC academic project.
