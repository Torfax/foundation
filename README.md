# Foundation

**Framework-agnostic technical foundation for TypeScript and Node.js applications.**
_Fundamentos técnicos reutilizables y agnósticos de framework para aplicaciones TypeScript/Node._

Package: `@torfax/foundation`

## Purpose

Foundation provides reusable technical building blocks — an ORM-agnostic data-access
layer (Criteria pattern), HTTP primitives, an exception hierarchy, file upload and
signed file access, typed configuration, and utilities — without coupling them to a
specific business domain or framework.

Torfax is its first consumer, but **Foundation does not depend on Torfax**.

## Status

Early development (`0.0.x`). The public API and internal package boundaries are **not
stable yet**. The package is marked `private` to prevent accidental publishing; for now
it is meant to be consumed locally (workspace link / `file:` / git).

## Modules (`src/`)

- `database/` — ORM-agnostic data access via the Criteria pattern (reader + updater), with a TypeORM adapter.
- `config/` — Typed environment configuration service.
- `exceptions/` — Full HTTP exception hierarchy + Express exception handler.
- `http/` — Response envelope and request helpers (Express).
- `files/` — File upload (Multer) and signed file-access URLs (JWT).
- `utils/` — Date, object, string and Zod helpers.
- `validators/` — `class-validator` custom decorators.

## Build

Sources live in `src/`; the built entry points live in `dist/`.

```bash
pnpm install
pnpm build      # tsc -> dist/
```

## Consume from another project (development)

```jsonc
// consumer package.json
{
  "dependencies": {
    "@torfax/foundation": "file:../foundation"
  }
}
```

```ts
import { EntityStore, NotFoundException, HttpResponse } from "@torfax/foundation";
```

Heavy/framework dependencies (`typeorm`, `express`, `class-validator`, `class-transformer`,
`reflect-metadata`) are declared as **optional peer dependencies** — the consuming app
provides its own copies, and you only need the ones for the parts you actually use.

## Provenance

Extracted from the `src/core` folder of the `aloja-api` project, preserving its full
commit history (re-rooted at the repository root).

## Notes

- `app-coupled/` holds files carried over from the origin app that are **not** part of
  the package build (they still reference application-specific modules). See
  `app-coupled/README.md`.
