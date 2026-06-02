# Config & Environment Rules

## Overview

All configuration comes from `src/shared/config/index.ts`. No other file in the project reads `process.env` directly.

## Config File Structure

```ts
// src/shared/config/index.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
};
```

## Fail Fast on Startup

- Config is validated with Zod at boot time.
- If any required env var is missing or invalid, the process exits immediately with a clear error message.
- This prevents the server from starting in a broken state.

## .env Files

```
.env              ← local development values (gitignored)
.env.example      ← template with all keys, no real values (committed)
```

- `.env.example` must be kept in sync with the config schema — every key in the schema must appear in `.env.example`.
- Never commit `.env` — it is always in `.gitignore`.
- Never hardcode default values for secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DB_PASSWORD) — these must always be explicitly set.

## Rules

- Never read `process.env` outside `src/shared/config/index.ts`.
- Never use string defaults for secret values — fail fast if they are missing.
- All new env vars must be added to both the Zod schema and `.env.example`.
- Config is a plain exported object — never a class, never a singleton service.
- Feature flags and environment-specific behaviour always come from `config` — never from inline `process.env.NODE_ENV` checks.
