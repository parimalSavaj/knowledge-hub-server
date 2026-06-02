# Knowledge Hub Server

A production-ready multi-tenant REST API server built with **Node.js**, **TypeScript**, and **PostgreSQL**. This project demonstrates real-world backend architecture patterns — not just a working server, but one structured the way it would be in a professional engineering team.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 24 | LTS, native `--watch` flag (no nodemon needed) |
| Language | TypeScript (strict mode) | Type safety, better DX, catches bugs at compile time |
| Framework | Express.js | Minimal, flexible, industry standard |
| Database | PostgreSQL 16 | Relational, battle-tested, great for structured data |
| DB Driver | `pg` (node-postgres) | Lightweight, no ORM overhead, full SQL control |
| Validation | Zod | Schema-first validation at the HTTP boundary |
| Auth | jsonwebtoken + bcrypt | JWT access/refresh token strategy, bcrypt password hashing |
| Logging | Pino | Fastest Node.js logger, structured JSON logs in prod |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) | Auto-generated, always in sync with the code |
| Security | Helmet + CORS + HttpOnly cookies | HTTP header hardening, cross-origin control, secure token storage |
| Containerization | Docker + Docker Compose | Consistent environments across dev and prod |
| Migrations | Custom SQL runner | No ORM lock-in, full visibility into schema changes |

---

## Architecture Highlights

### Domain-Driven Structure
The codebase is organised into four clear layers:

- **`domain/`** — the base layer. Entities, interfaces, types, enums, value objects. Zero dependencies on other layers.
- **`infrastructure/`** — raw SQL repository implementations. Depends only on `domain/`.
- **`modules/`** — feature modules (auth, system). Each module has `application/` (use cases + DTOs) and `presentation/` (routes, controller, validation) sub-layers.
- **`shared/`** — cross-cutting concerns: config, services, middlewares, core HTTP primitives.

### Strict Layer Boundaries
Import direction is enforced — no layer imports upward or sideways:

```
factory → presentation/controller → application/use-cases → domain/interfaces
                                                           ↑
infrastructure/repositories ──────────────────────────────┘
```

Use cases never import repositories directly — only their interfaces. The factory is the sole composition root per module.

### Multi-Tenant Authentication
A user can belong to multiple organizations with a different role in each (`owner`, `admin`, `member`, `viewer`). The JWT carries the user's active org context — `orgId` and `orgRole` — so authorization is resolved without extra DB lookups on every request. Switching organization issues a fresh token pair.

### JWT + Refresh Token Strategy
Two tokens are issued together on login and org switch:

| | Access Token | Refresh Token |
|---|---|---|
| Payload | `sub`, `email`, `orgId`, `orgRole` | `sub` only |
| Expiry | Short (default `15m`) | Long (default `7d`) |
| Transport | `Authorization: Bearer` header | HttpOnly cookie |
| Rotation | Issued on every refresh | Rotated on every use — old one revoked |

Refresh tokens are stored in the database. A token not in the DB is always rejected. On logout the token is revoked and the cookie is cleared.

### Singleton Services
All shared services (`DatabaseService`, `LoggerService`, `SwaggerService`) use the singleton pattern — one instance across the entire app lifecycle. Services are instantiated in `server.ts` and passed into `App.create()` — never imported directly inside `app.ts`.

### Structured API Responses
Every response follows a consistent shape via `ApiResponse` and `ApiError` classes:

```json
// Success
{ "success": true, "statusCode": 200, "message": "...", "data": { ... } }

// Error
{ "success": false, "statusCode": 400, "message": "Validation failed", "errors": [...] }
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
│   ├── config/            # All env config in one place (Zod-validated at boot)
│   ├── services/          # Singleton services: DatabaseService, LoggerService, SwaggerService
│   ├── core/              # ApiResponse, ApiError subclasses, ErrorHandler
│   ├── constants/         # HTTP status codes, route constants
│   ├── middlewares/       # auth.middleware, role.middleware, validate.middleware
│   └── types/             # Global type augmentations (express.d.ts)
│
├── domain/                # Base layer — zero dependencies on other src folders
│   ├── entities/          # DB row shapes: UserEntity, OrganizationEntity, etc.
│   ├── interfaces/        # Repository contracts: IUsersRepository, etc.
│   ├── types/             # Plain TS types and enums: auth.types.ts
│   ├── enums/             # Standalone enums: OrgRole
│   ├── value-objects/     # Email, OrgSlug value objects
│   └── errors/            # Domain-level error definitions
│
├── infrastructure/
│   └── repositories/      # Raw SQL implementations of domain interfaces
│
├── modules/
│   ├── system/            # System routes (no business logic, no DB)
│   │   └── health.routes.ts
│   └── auth/              # Auth feature module
│       ├── auth.factory.ts              # Composition root — wires repo + use cases → controller
│       ├── application/
│       │   ├── dtos/                    # Request + response DTOs (one file per use case)
│       │   ├── login.use-case.ts
│       │   ├── register.use-case.ts
│       │   ├── logout.use-case.ts
│       │   ├── refresh.use-case.ts
│       │   └── switch-org.use-case.ts
│       └── presentation/
│           ├── auth.routes.ts
│           ├── auth.controller.ts
│           └── auth.validation.ts       # Zod schemas for all auth endpoints
│
├── app.ts                 # Express app setup — middleware, routes, error handling
└── server.ts              # Entry point — bootstrap, services, listen, shutdown

migrations/                # Raw SQL migration files (timestamped, run in order)
scripts/
├── database/              # CLI scripts: migrate.ts, seed.ts, create-migration.ts
└── docker/                # entrypoint.sh — runs migrate + seed before server starts
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

The defaults in `.env.example` work out of the box with Docker. If running without Docker, update `DB_HOST` from `postgres` to `localhost` and set `DB_PORT` to `5433` (the exposed host port).

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

You need a running PostgreSQL instance with a database already created. Update `.env` first:

```
DB_HOST=localhost
DB_PORT=5433        # matches the DB_EXPOSE_PORT in docker-compose.yml
```

Or if using a native local PostgreSQL install:
```
DB_HOST=localhost
DB_PORT=5432
```

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

> `db:migrate` validates your `.env` and DB connection before touching anything. If a variable is missing or the database is unreachable, it stops with a clear error message.

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
| `npm run db:create-migration <name>` | Scaffold a new timestamped migration file |
| `npm run db:seed` | Seed the database with initial/test data |

**Running from host (without Docker):** set `DB_HOST=localhost` in `.env` first, then:
```bash
npm run db:migrate
npm run db:seed
```

**Running inside Docker (with containers already up):**
```bash
docker exec knowledge-hub-server npm run db:migrate
docker exec knowledge-hub-server npm run db:seed
```

> Never create migration files manually. Always use `npm run db:create-migration` to get a correctly timestamped file.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run build` | Compile TypeScript → JavaScript |
| `npm run start` | Run compiled production server |
| `npm run lint` | Check code for lint errors |
| `npm run format` | Format source files with Prettier |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:create-migration` | Create a new migration file |

---

## API Endpoints

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | None | Health check — returns server status and timestamp |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register a new user and create a personal organization |
| `POST` | `/api/v1/auth/login` | None | Login — returns access token + sets refresh token cookie |
| `POST` | `/api/v1/auth/refresh` | Cookie | Rotate refresh token — returns new access token |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke refresh token and clear cookie |
| `POST` | `/api/v1/auth/switch-org` | Bearer | Switch active organization — returns new token pair |

> Full interactive API documentation is available at `/api/v1/docs` when the server is running.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the server listens on |
| `NODE_ENV` | `development` | Environment (`development` / `production` / `test`) |
| `DB_HOST` | `postgres` | PostgreSQL host — use `postgres` inside Docker, `localhost` otherwise |
| `DB_PORT` | `5432` | PostgreSQL port (inside the container or native install) |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `knowledge_hub` | Database name |
| `DB_EXPOSE_PORT` | `5433` | Host port mapped to PostgreSQL (avoids conflict with a local Postgres install) |
| `JWT_ACCESS_SECRET` | — | Secret for signing access tokens (min 32 chars, required) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_SECRET` | — | Secret for signing refresh tokens (min 32 chars, required, separate from access secret) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |

> `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` have no defaults — the server will refuse to start if they are missing.

---

## Coding Conventions

These rules are enforced across the codebase:

- **No `any` type** — strict TypeScript throughout; use `unknown` if the type is genuinely uncertain
- **No `process.env` outside config** — all env values go through `src/shared/config/index.ts`
- **No `console.log`** — all logging goes through `LoggerService`
- **Singleton services** — private constructor + static `getInstance()`
- **Interfaces on services** — every service exports an interface; consumers type against the interface, not the class
- **Kebab-case file names** — `logger.service.ts`, `error-handler.ts`, `health.routes.ts`
- **One use case per file** — one `execute()` method, one responsibility
- **Validation at the HTTP boundary only** — Zod schemas in `presentation/<name>.validation.ts`; use cases and repositories trust their inputs
- **Transaction boundary in use cases** — never in repositories or controllers
