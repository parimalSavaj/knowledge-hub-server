---
description: Rules for infrastructure external services (third-party API integrations, co-located interface/types/implementation)
inclusion: fileMatch
fileMatchPattern: "src/infrastructure/external-services/**"
---

# External Service Rules

## Location

- All external service integrations live in `src/infrastructure/external-services/` — one folder per third-party service.
- Folder naming: `<service-name>/` (kebab-case, e.g., `email/`, `google-oauth/`, `stripe/`).

## What Is an External Service

An external service is any third-party system the application communicates with over the network:
- Email providers (SendGrid, Resend, SES)
- OAuth providers (Google, GitHub)
- Payment gateways (Stripe)
- Storage services (S3, Cloudinary)
- Notification services (Twilio, Firebase)

## What Is NOT an External Service

- Database access → that's a **repository**.
- Internal shared utilities (logger, jwt, config) → those are **shared services** in `src/shared/services/`.
- Business logic → that belongs in **use cases**.

## Folder Structure (per external service)

Each external service folder contains exactly three files:

```
src/infrastructure/external-services/<name>/
├── <name>.external-service.interface.ts    # Contract (what use cases depend on)
├── <name>.types.ts                         # Request/response types for the API
└── <name>.external-service.ts              # Implementation (HTTP calls)
```

Example:
```
src/infrastructure/external-services/email/
├── email.external-service.interface.ts
├── email.types.ts
└── email.external-service.ts
```

## Types — `<name>.types.ts`

Types specific to the external service — request payloads, response shapes, options.

```ts
export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult = {
  messageId: string;
  accepted: boolean;
};
```

Rules:
- Use `type` keyword — not `interface`.
- Types describe what the external API expects and returns — not domain concepts.
- One types file per external service folder.
- Never put domain entities or enums here — import them from `domain/` if needed.

## Interface — `<name>.external-service.interface.ts`

Defines the contract so use cases are not coupled to the specific provider.

```ts
import { SendEmailParams, SendEmailResult } from './email.types';

export interface IEmailExternalService {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
```

Rules:
- Interface name: `I<PascalName>ExternalService` (e.g., `IEmailExternalService`, `IGoogleOAuthExternalService`).
- Methods use the co-located types for parameters and return values.
- No HTTP-specific details leak into the interface (no headers, no URLs, no status codes).
- The interface represents "what" — not "how" or "which provider".

## Implementation — `<name>.external-service.ts`

The concrete class that makes HTTP calls to the third-party API.

```ts
import { IEmailExternalService } from './email.external-service.interface';
import { SendEmailParams, SendEmailResult } from './email.types';
import { ILoggerService } from '../../../shared/services/logger/logger.service.interface';
import { config } from '../../../shared/config';

export class EmailExternalService implements IEmailExternalService {
  constructor(private readonly logger: ILoggerService) {}

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // HTTP call to email provider
    this.logger.info('Sending email', { to: params.to, subject: params.subject });
    // ... implementation
  }
}
```

Rules:
- Class name: `<PascalName>ExternalService` (e.g., `EmailExternalService`, `GoogleOAuthExternalService`).
- Must implement its co-located interface.
- Constructor receives dependencies (logger, config values) — injected via the module factory.
- All config values (API keys, URLs, secrets) come from `shared/config/` — never hardcoded.
- Handles HTTP errors internally — throws domain-friendly errors, never leaks raw API errors to use cases.
- Logs all external calls via `ILoggerService` for observability.
- No business logic — only API communication and response mapping.

## Import Rules

```
<name>.external-service.ts imports:
  → ./<name>.external-service.interface   (co-located interface)
  → ./<name>.types                        (co-located types)
  → shared/services/<name>/<name>.service.interface  (for ILoggerService)
  → shared/config/                        (for API keys, URLs)
  → domain/enums/                         (if needed for mapping)

<name>.external-service.interface.ts imports:
  → ./<name>.types                        (co-located types only)
```

## Wiring

External services are instantiated in the module **factory** — same as repositories:

```ts
// modules/auth/auth.factory.ts
export class AuthFactory {
  static create(db: IDatabaseService, logger: ILoggerService): AuthController {
    const usersRepo = new UsersRepository(db);
    const googleOAuth = new GoogleOAuthExternalService(logger);
    const loginUseCase = new LoginUseCase(usersRepo, googleOAuth, logger);
    return new AuthController(loginUseCase);
  }
}
```

- Use cases receive external service interfaces via constructor — never the concrete class.
- Factories are the only place where concrete external service classes are imported and instantiated.

## Swapping Providers

Because use cases depend on the interface, swapping a provider means:
1. Create a new implementation in the same folder (or a new folder for a different service).
2. Change the factory to instantiate the new implementation.
3. Use cases remain unchanged — they only know the interface.
