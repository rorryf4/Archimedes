# Archimedes Web Shell

Next.js-based web application for Archimedes.

## Local Development

From the repository root:

```bash
pnpm install
pnpm dev:web
```

The app will be available at `http://localhost:3000`.

## Build

```bash
pnpm build:web
```

## Lint & Type Check

```bash
pnpm lint:web
pnpm typecheck:web
```

## Environment Variables

This app uses `NEXT_PUBLIC_APP_NAME` to customize the application name displayed in the header and page title.

- **`.env.example`**: Template showing available environment variables (committed to git)
- **`.env.local`**: Your local values (gitignored, not committed)

Default value if not set: `"Archimedes"`

Example `.env.local`:

```
NEXT_PUBLIC_APP_NAME=Archimedes
```
