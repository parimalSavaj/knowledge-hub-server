# Authentication & Authorization Rules

## Overview

- Authentication verifies identity — handled via JWT.
- Authorization verifies permission — handled via role-based middleware.
- Both live in `src/shared/middlewares/` as reusable middleware functions.

## JWT Payload

A user can belong to multiple organizations with a different role in each.
The JWT carries the user identity plus their current active organization context.

```ts
// src/shared/services/types/jwt.types.ts
import { OrgRole } from '../../../domain/enums/org-role.enum';

export type JwtPayload = {
  userId: number;        // user id
  email: string;         // user email
  orgId: number;         // currently active organization id
  orgRole: OrgRole;      // user's role in the active organization
  iat?: number;          // issued at (set by jwt.sign)
  exp?: number;          // expiry (set by jwt.sign)
};

// Attached to req.user after token verification
export type AuthenticatedUser = {
  userId: number;
  email: string;
  orgId: number;
  orgRole: OrgRole;
};
```

### Why orgId + orgRole in the token

- A user switches organization context at login or via a "switch org" endpoint.
- The token always reflects one active org — no need to look up membership on every request.
- When the user switches org, a new token is issued with the new `orgId` and `orgRole`.
- The DB is the source of truth — token is invalidated if membership is revoked (check on sensitive operations).

## JWT Strategy

- Access token is validated in `src/shared/middlewares/auth.middleware.ts`.
- On success, the decoded payload is attached to `req.user` as `AuthenticatedUser`.
- On failure, throw `UnauthorizedError`.
- Access token is read from the `Authorization: Bearer <token>` header only.
- Refresh token is read from the HttpOnly cookie only — never from the header.

## Typed Request User

Extend Express `Request` type globally so `req.user` is typed everywhere:

```ts
// src/shared/@types/express.d.ts
import { AuthenticatedUser } from '../services/types/jwt.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
```

## Middleware Files

```
src/shared/middlewares/
├── auth.middleware.ts        ← verifies JWT, attaches req.user
└── role.middleware.ts        ← checks req.user.orgRole against allowed roles
```

### auth.middleware.ts
```ts
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  // 1. Extract Bearer token from Authorization header
  // 2. Verify with config.jwt.accessSecret
  // 3. Attach decoded payload as req.user (id, email, orgId, orgRole)
  // 4. On failure → next(new UnauthorizedError())
};
```

### role.middleware.ts
```ts
export const authorize = (...roles: OrgRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.orgRole)) {
      return next(new ForbiddenError());
    }
    next();
  };
};
```

## Applying Auth in Routes

```ts
// Public route — no auth
this.router.post('/login', validate(loginSchema), this.controller.login);

// Authenticated — any org role
this.router.get('/', authenticate, this.controller.getAll);

// Authenticated + specific org roles only
this.router.delete('/:id', authenticate, authorize(OrgRole.OWNER, OrgRole.ADMIN), this.controller.delete);
```

## Route Registration in app.ts

- `initializePublicRoutes()` — no auth middleware (login, register, etc.).
- `initializeProtectedRoutes()` — all routes here require `authenticate` applied per-route or at router level.
- Never apply `authenticate` globally to all routes — always be explicit.

## Token Strategy — Access Token + Refresh Token

Two tokens are issued together on login and org switch:

| | Access Token | Refresh Token |
|---|---|---|
| Purpose | Authenticate API requests | Obtain a new access token |
| Payload | `userId`, `email`, `orgId`, `orgRole` | `userId` only |
| Expiry | Short — `15m` to `1h` | Long — `7d` to `30d` |
| Storage | Memory / Authorization header | HttpOnly cookie (never localStorage) |
| Secret | `config.jwt.accessSecret` | `config.jwt.refreshSecret` |
| Rotation | Issued fresh on every refresh | Rotated on every use (old one invalidated) |

### Config keys required

```ts
// src/shared/config/index.ts
jwt: {
  accessSecret: env.JWT_ACCESS_SECRET,      // separate secret for access tokens
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,   // e.g. '15m'
  refreshSecret: env.JWT_REFRESH_SECRET,    // separate secret for refresh tokens
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN, // e.g. '7d'
}
```

### Refresh Token Payload

```ts
export interface RefreshTokenPayload {
  userId: number;   // user id only — no org context, no role
}
```

### Refresh Token Flow

```
POST /auth/refresh
  → read refresh token from HttpOnly cookie
  → verify with config.jwt.refreshSecret
  → look up token in DB (must exist and not be revoked)
  → issue new access token + new refresh token
  → invalidate old refresh token in DB (rotation)
  → set new refresh token as HttpOnly cookie
  → return new access token in response body
```

### Refresh Token Storage in DB

Refresh tokens are stored in a `refresh_tokens` table — never trust a refresh token that isn't in the DB:

```sql
CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Logout

```
POST /auth/logout
  → read refresh token from HttpOnly cookie
  → mark token as revoked in DB
  → clear the HttpOnly cookie
```

## Token Issuance

- Access token + refresh token are issued together on login and org switch.
- Access token payload: `userId`, `email`, `orgId`, `orgRole`.
- Refresh token payload: `userId` only.
- Access token returned in response body — client stores in memory.
- Refresh token set as HttpOnly cookie — never accessible via JavaScript.
- Use separate secrets for access and refresh tokens (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).
- Never hardcode secrets or expiry values — always from `config.jwt`.

## Rules

- Never read or verify JWT outside `auth.middleware.ts`.
- Never access `req.user` without first applying `authenticate` middleware on that route.
- Never store sensitive data in access token payload — only `userId`, `email`, `orgId`, `orgRole`.
- Refresh token payload contains `userId` only — no org context, no role.
- Access token travels in the `Authorization` header. Refresh token travels in an HttpOnly cookie only.
- Never store refresh tokens in localStorage or return them in the response body.
- Refresh tokens must be stored in DB — a token not in the DB is always rejected.
- On every refresh, rotate the refresh token — invalidate the old one immediately.
- On logout, revoke the refresh token in DB and clear the cookie.
- Passwords are always hashed before storage — never store plain text.
- When a user is removed from an org, treat their existing token as invalid for that org on sensitive operations — re-verify membership in the use case if needed.
- Auth module (`modules/auth/`) handles login, register, token refresh, logout, and org switch — nothing else.
- Use `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` as separate env vars — never share one secret for both token types.
