# Knowledge Hub Server

A production-ready REST API server built with **Node.js**, **TypeScript**, and **PostgreSQL**. This project demonstrates real-world backend architecture patterns — not just a working server, but one structured the way it would be in a professional engineering team.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 24 | LTS, native `--watch` flag (no nodemon needed) |
| Language | TypeScript (strict mode) | Type safety, better DX, catches bugs at compile time |
| Framework | Express.js | Minimal, flexible, industry standard |
| Database | PostgreSQL 16 | Relational, battle-tested, great for structured data |
| DB Driver | `pg` (node-postgres) | Lightweight, no ORM overhead, full SQL control |
| Logging | Pino | Fastest Node.js logger, structured JSON logs in prod |
| Security | Helmet + CORS | HTTP header hardening, cross-origin control |
| Containerization | Docker + Docker Compose | Consistent environments across dev and prod |
| Migrations | Custom SQL runner | No ORM lock-in, full visibility into schema changes |

---

## Architecture Highlights

### Singleton Services
All shared services (`DatabaseService`, `LoggerService`) use the singleton pattern — one instance across the entire app lifecycle. This prevents multiple DB connection pools and ensures consistent logging config.

### Structured API Responses
Every response follows a consistent shape via `ApiResponse` and `ApiError` classes:

```json
// Success
{ "success": true, "statusCode": 200, "message": "...", "data": { ... } }

// Error
{ "success": false, "statusCode": 400, "message": "...", "errors": [...] }
```

### Graceful Shutdown
The server listens for `SIGTERM` / `SIGINT` signals, closes the HTTP server, disconnects the DB pool cleanly, and force-exits after 10 seconds if connections don't drain. This is critical for zero-downtime deployments.

### Custom Migration Runner
No ORM. SQL migration files live in `migrations/`, are tracked in a `migrations` table, and run in order. Each migration runs inside a transaction — if it fails, it rolls back cleanly.

### Docker Entrypoint — Automated Setup
A shell script (`scripts/docker/entrypoint.sh`) runs inside the container before the server starts. It executes migrations, then seeds, then hands off to the server process. If any step fails, the container exits immediately — the server never starts against a broken state.

### Multi-stage Dockerfile
The Dockerfile has four stages: `base → development → build → production`. The production image only contains compiled JS and production dependencies — no TypeScript, no dev tools, minimal attack surface.

---

## Project Structure

```
src/
├── shared/
│   ├── config/          # All env config in one place (never read process.env elsewhere)
│   ├── services/        # Singleton services: DatabaseService, LoggerService
│   ├── core/            # ApiResponse, ApiError, ErrorHandler
│   ├── constants/       # HTTP status codes, route constants
│   └── middlewares/     # Global middlewares
├── routes/              # Route files (health.routes.ts, etc.)
├── app.ts               # Express app setup — middleware, routes, error handling
└── server.ts            # Entry point — bootstrap, DB connect, listen, shutdown

migrations/              # Raw SQL migration files (timestamped, ordered)
scripts/
├── database/            # CLI scripts: migrate, seed, create-migration
└── docker/              # Docker entrypoint script (runs migrate + seed on startup)
```

---

## Prerequisites

You need **one of these** to run the project:

| Option | Requirement |
|---|---|
| With Docker | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| Without Docker | [Node.js](https://nodejs.org/) v24+ and a running PostgreSQL instance |

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd knowledge-hub-server
```

### 2. Create your environment file

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box with Docker. If running without Docker, update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to match your local PostgreSQL setup.

---

## Running the Project

### Option A — Docker (Recommended)

One command does everything — no extra steps needed.

```bash
docker compose up --build
```

What happens automatically, in order:
1. PostgreSQL starts and passes its health check
2. Migrations run — all pending SQL files applied in order
3. Seeds run — dummy/test data loaded
4. Server starts

**Stop everything:**
```bash
docker compose down
```

> To also wipe the database volume: `docker compose down -v`

---

### Option B — Node.js (Without Docker)

You need a running PostgreSQL instance with a database already created. Update `.env` with your credentials first — change `DB_HOST` from `postgres` to `localhost`.

**Create the database in PostgreSQL:**
```sql
CREATE DATABASE knowledge_hub;
```

Then run:
```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

> `db:migrate` validates your `.env` and connection before touching anything. If a variable is missing or the database is unreachable, it stops with a clear error message.

**Build and run for production:**
```bash
npm run build
npm run start
```

---

## Database Migrations

Migrations are plain `.sql` files in `migrations/`, tracked in a `migrations` table so they only ever run once. Each migration runs inside a transaction — if it fails, it rolls back and the runner exits with an error.

Files are named `<timestamp>_<description>.sql` so they always execute in the correct order.

| Command | Description |
|---|---|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:create-migration` | Scaffold a new timestamped migration file |
| `npm run db:seed` | Seed the database with initial/test data |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run build` | Compile TypeScript → JavaScript |
| `npm run start` | Run compiled production server |
| `npm run lint` | Check code for errors |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:create-migration` | Create a new migration file |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check — returns server status and timestamp |
| `GET` | `/api/v1/health/error` | Test endpoint — triggers a structured error response |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the server listens on |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |
| `DB_HOST` | `postgres` | PostgreSQL host (`postgres` for Docker, `localhost` otherwise) |
| `DB_PORT` | `5432` | PostgreSQL port inside the container |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `knowledge_hub` | Database name |
| `DB_EXPOSE_PORT` | `5433` | Host port mapped to PostgreSQL (avoids conflict with a local Postgres install) |

---

## Coding Conventions

These rules are enforced across the codebase:

- **No `any` type** — strict TypeScript throughout
- **No `process.env` outside config** — all env values go through `src/shared/config/index.ts`
- **No `console.log`** — all logging goes through `LoggerService`
- **Singleton services** — private constructor + static `getInstance()`
- **Interfaces on services** — every service exports an interface; consumers type against the interface, not the class
- **Kebab-case file names** — `logger.service.ts`, `error-handler.ts`, `health.routes.ts`
