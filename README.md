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
# Edit .env with your database credentials

# Build and run
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

⚠️ **The project contains critical issues preventing it from running end-to-end.** See [docs/integration/03-mismatches.md](./docs/integration/03-mismatches.md) for details on backend startup failures, database schema issues, and API contract mismatches.
