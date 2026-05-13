# Somerscale Hotel Management

A hotel guest and reservation management system consisting of a Spring Boot REST API backend and a React TypeScript admin frontend.

## Project Structure

```
├── API-somerscale-main/          # Spring Boot backend (Java 17, Maven)
├── proyecto-hotel-sumer-main/    # React 19 frontend (Vite, TypeScript)
└── docs/                         # Technical documentation and architecture
```

## Prerequisites

- **Backend**: Java 17, Maven, PostgreSQL
- **Frontend**: Node.js 18+, npm
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
#   - Resend SMTP (MAIL_HOST/PORT/USERNAME/PASSWORD/FROM — optional in dev; leave MAIL_PASSWORD blank to log emails to stdout)
#   - APP_ENCRYPTION_KEY / APP_HMAC_KEY for guest-document AES-GCM (`openssl rand -base64 32`, run twice)
#   - SPRING_PROFILES_ACTIVE=dev (so invitation emails log instead of send when Resend blank)

# Build and run (Flyway migrations V1-V5 apply on first boot)
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

## Documentation

For a comprehensive technical overview of the system architecture, API contracts, and identified issues:

📖 **[See the full technical report](./docs/README.md)**

This includes detailed documentation of:
- Backend architecture and REST API
- Frontend structure and integration
- System-level integration patterns
- Known issues and mismatches

## Current Status

The MVP backend is wired through tokenized staff invitations (task004) with Supabase Postgres + Flyway-managed schema, JWT-based auth carrying a `perms[]` claim, and permission-based authorization on protected endpoints. The pre-task001 contract breaks documented in [docs/integration/03-mismatches.md](./docs/integration/03-mismatches.md) are resolved (status annotations in that file). See [docs/plan/](./docs/plan/) for outstanding tasks (task005–task015) and [docs/eval2/](./docs/eval2/) for the Estado de Avance 2 submission package.
