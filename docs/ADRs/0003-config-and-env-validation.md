# ADR-0003: Config and Environment Validation

## Status

Accepted

## Context

Archimedes uses a Next.js App Router frontend located in `app/web`.
We need a consistent and safe way to:

- Access environment variables.
- Validate them at runtime.
- Expose a small, typed configuration surface to the rest of the app.
- Avoid scattering `process.env` usage across modules and routes.

## Decision

1. Use [Zod](https://github.com/colinhacks/zod) in `app/web` to validate required environment variables.
2. Introduce a server-only env loader at `app/web/lib/config/env.ts` which:
   - Defines a schema for environment variables.
   - Parses and validates `process.env` against that schema.
   - Throws on startup if validation fails.
   - Exposes `env` (raw validated env) and `config` (derived configuration).
3. Restrict the configuration touchpoint:
   - Domain modules (e.g. `app/web/modules/system`) should depend on `config`, not directly on `process.env`.
   - HTTP route handlers should call into modules and not read env directly.
4. Use the `server-only` boundary to ensure config/env code is never imported into client components.

## Consequences

- Misconfigured or missing environment variables fail fast at startup instead of causing subtle runtime bugs.
- There is a single, well-known place to update configuration (`lib/config/env.ts`).
- Modules can be tested in isolation with predictable configuration.
- We have a documented pattern for adding future configuration (API endpoints, feature flags, third-party integrations).
