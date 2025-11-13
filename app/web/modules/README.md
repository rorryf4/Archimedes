# Modules

This directory contains domain-specific modules for the Archimedes application.

## Structure

Each module should be organized as follows:

```
modules/
  <module-name>/
    components/     # React components specific to this module
    hooks/          # Custom React hooks
    utils/          # Utility functions
    types.ts        # TypeScript types/interfaces
    index.ts        # Public API exports
```

## Guidelines

- Each module should be self-contained and focused on a single domain
- Modules should export a clean public API via their `index.ts`
- Shared utilities should go in `/lib` instead
- Cross-module dependencies should be minimal and explicit
