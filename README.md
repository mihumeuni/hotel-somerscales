# Somerscale Hotel Management

A hotel guest and reservation management system consisting of a Spring Boot REST API backend and a React TypeScript admin frontend.

## Project Structure

```
├── API-somerscale-main/          # Spring Boot backend (Java 17, Maven)
├── proyecto-hotel-sumer-main/    # React 19 frontend (Vite, TypeScript)
├── tests/                        # Review-API fixture JSON (Google Places + TripAdvisor, EN + ES) used as offline fallback
├── README.md                     # This file
└── .gitignore
```

## Prerequisites

- **Backend**: Java 17, Maven, PostgreSQL
- **Frontend**: Node.js 20+, npm (Vite 8 requires Node 20.19+ or 22.12+)
- **Database**: PostgreSQL (local or Supabase)

## Quick Start

### Backend

```bash
cd API-somerscale-main

# Copy environment template
cp .env-example .env
# Edit .env with:
#   - Supabase credentials (SPRING_DATASOURCE_URL/USERNAME/PASSWORD — see Supabase dashboard)
#   - JWT_SECRET (≥32 chars, e.g. `openssl rand -hex 32`)
#   - APP_ENCRYPTION_KEY / APP_HMAC_KEY for guest-document AES-GCM (`openssl rand -base64 32`, run twice)
#   - SMTP credentials (MAIL_HOST/PORT/USERNAME/PASSWORD/FROM — optional in dev; leave MAIL_PASSWORD blank to log emails to stdout instead of sending)
#   - GEMINI_API_KEY for review sentiment classification (optional; falls back to no-op if blank)
#   - GOOGLE_PLACES_API_KEY + TRIPADVISOR_API_KEY for review sync (optional; fixture data ships in repo as fallback)
#   - SPRING_PROFILES_ACTIVE=dev (so invitation emails log instead of send when SMTP is blank)

# Build and run (Flyway migrations V1-V8 apply on first boot)
mvn clean install
mvn spring-boot:run
```

The API runs on `http://localhost:8080`

### Frontend

```bash
cd proyecto-hotel-sumer-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173`

## Current Status

**Backend** — 14 phases shipped on `development` (Supabase Postgres + Flyway V1–V8):
- JWT auth + RBAC (`permissions` + `role_permissions` + `@PreAuthorize`).
- Tokenized staff invitations (raw token never persisted).
- AES-GCM encryption with HMAC sidecar on `huespedes.numero_documento`, verified live.
- Cloudbeds Excel importer + Java Faker demo seeder (200 huéspedes + 500 reservas).
- `additional_expenses` CRUD; guest history aggregate endpoint.
- Google Places + TripAdvisor review sync (`@Scheduled` + idempotent fixture fallback).
- Gemini 2.5 Flash sentiment + category classifier (rate-limited at runtime by free-tier quota; degrades gracefully).
- Recharts dashboard endpoints: occupancy, top-guests, sentiment KPIs.

**Frontend** — feature pages for login, signup-finish, guest CRUD, expenses, dashboard, and admin user creation. Heritage-themed revamp planned next (locked design contract pending).

**Pending (next two tasks):**
1. **Staff invitation delivery channel** — Brevo signup blocked at corporate-email check; pivoting to WhatsApp `wa.me` click-to-chat OR Gmail SMTP App Password.
2. **Public deployment** — Vercel (FE) + Render (BE Docker) + Supabase (prod) + GitHub Actions CI, plus branch protection on `release` / `main`.
