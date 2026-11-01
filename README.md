# Foundation

**Framework-agnostic technical foundation for TypeScript and Node.js applications.**
_Fundamentos técnicos reutilizables y agnósticos de framework para aplicaciones TypeScript/Node._

Package: `@torfax/foundation`

Foundation is a set of reusable technical building blocks — an ORM-agnostic data-access
layer, HTTP primitives, an exception hierarchy, file upload + signed access, typed
configuration and utilities — with **no business domain and no framework baked in**. It
composes through **explicit dependency injection** (constructors + factories), so any
host (a plain Node script, Express, NestJS) can assemble it.

> Torfax is its first consumer, but **Foundation does not depend on Torfax**.
> El mapa de esos consumidores y del entorno local está en
> [`torfax-platform/docs/ecosistema.md`](../torfax-platform/docs/ecosistema.md); el arranque
> coordinado vive en [`torfax-dev`](../torfax-dev/README.md).

## Status

Early development (`0.0.x`). Public API and package boundaries are **not stable yet**.
The package is marked `private` — it is consumed **locally** (see Install), not published.

---

## Modules

| Import from `@torfax/foundation` | What it gives you |
|---|---|
| **data** | ORM-agnostic data access as a *datasource connector*: `Criteria` reads + `Writer` (create/update/delete), TypeORM adapter, `postgresDataSourceOptions` from `DB_*`. See [src/data/README.md](src/data/README.md) & [USAGE.md](src/data/USAGE.md). |
| **config** | `ConfigService` — typed `process.env` reader with auto-casting; `buildVersion` / `versionedName` — which release is running. |
| **exceptions** | Full HTTP exception hierarchy + an Express exception handler. |
| **http** | The envelope (`successEnvelope`, `errorEnvelope`), `normalizeError`, `browserErrorPage`, `browserOrigins` (CORS), `isApiPath`, `parseTrustProxy`, request ids (`resolveRequestIds`, W3C `traceparent`), `HttpResponse` + `HttpUtil` (Express). |
| **files** | `FilesModule` — uploads (Multer) + signed file-access URLs (JWT). |
| **validators** | `class-validator` custom decorators (e.g. `@MatchClVal`). |
| **utils** | `DateUtil`, `ObjectUtil`, `StringUtil`, `ZodUtils`. |

Framework/heavy libs (`typeorm`, `express`, `class-validator`, `class-transformer`,
`reflect-metadata`, and Nest) are **optional peer dependencies**: the host provides its own
copies, and you only need the ones for the parts you actually use.

### `@torfax/foundation/nest`

The same pieces wired into NestJS, for the services that are built on it — so they stop
copying their `infra/`. The core never imports Nest; this part imports the core and Nest.

| Export | What it gives you |
|---|---|
| `ConfigModule`, `APP_CONFIG` | `ConfigService` as a global provider |
| `DatabaseModule.forRoot({ entities, dataSource })` | the DataSource from `DB_*`, the runtime, `CONNECTOR`, `UNIT_OF_WORK` |
| `FoundationModule.forRoot({ secretBoxKey, passwordHasher, jwtSigner, providers })` | uids, hashed secrets, and only the signers and boxes the service asks for |
| `RequestContextModule.forRoot(ContextClass)`, `RequestContextService<T>` | the request context in AsyncLocalStorage, opened by a middleware with the request's ids |
| `applyHttpSetup(app, options)` | proxy trust, CORS, the static web, the envelope, the error filter |
| `HealthModule.forRoot({ service, name, public })` | `GET /health` with the running release |

A service linked with `file:` can end up with two copies of Nest, TypeORM and Express — its
own and Foundation's. This part is written for that: errors are recognised by shape, never by
`instanceof`; no Nest class is injected by type; rxjs is taken from the Observable that
arrives; and the DataSource is built with the service's own class.

---

## Install (local)

Foundation ships TypeScript sources; the published entry points live in `dist/`, so build
it once, then reference it from your project.

```bash
# in foundation/
npm install
npm run build          # tsc -> dist/
```

Point your project at it with a `file:` dependency (sibling folders):

```jsonc
// consumer package.json
{
  "dependencies": {
    "@torfax/foundation": "file:../foundation"
  }
}
```

```bash
# in the consumer
npm install
```

Then install the peer deps you use, e.g. `npm i typeorm reflect-metadata` for `database`.
When you change foundation, re-run `npm run build` (or `npm run build -- --watch`).

---

## Quickstart per module

```ts
// config — host loads env first (dotenv…); foundation never touches process.env on import
import { ConfigService } from "@torfax/foundation";
interface Env { PORT: number; DATABASE_URL: string; }
const config = new ConfigService<Env>();
config.getRequired("DATABASE_URL");     // throws if missing
config.get("PORT", 3000);               // default + auto-cast "3000" -> 3000
```

```ts
// exceptions
import { NotFoundException, ExceptionHandler } from "@torfax/foundation";
throw new NotFoundException("User not found");
app.use(ExceptionHandler.handle());     // Express error middleware
```

```ts
// http
import { HttpResponse } from "@torfax/foundation";
HttpResponse.success(res, user, "OK");        // { success, message, payload, statusCode }
HttpResponse.err(res, null, "Failed", 400);
```

```ts
// files
import { FilesModule } from "@torfax/foundation";
const files = new FilesModule({
  upload: { destination: "uploads/avatars", maxFileSize: 5 * 1024 * 1024 },
  access: { jwtSecret: process.env.FILE_SECRET! },
});
router.post("/avatar", files.api.upload.single("file"), handler);
const url = files.api.access.buildProtectedUrl("uploads/avatars/x.png"); // signed URL
```

```ts
// validators
import { MatchClVal } from "@torfax/foundation";
class SignupDto {
  password!: string;
  @MatchClVal("password") confirmPassword!: string;
}
```

```ts
// utils (namespaced)
import { ObjectUtil, DateUtil } from "@torfax/foundation";
ObjectUtil.excludeKeys(user, ["password"]);
DateUtil.getDayOfWeek(new Date());
```

```ts
// database — see src/database/USAGE.md for the full guide
import { createTypeOrmConnector, BaseRepository } from "@torfax/foundation";

class UserRepository extends BaseRepository {
  private users = this.createStore(User);
  list()          { return this.users.reader.paginate({ pagination: { page: 1, limit: 20 } }); }
  create(d)       { return this.users.writer.create(d); }
  remove(id)      { return this.users.writer.deleteById(id); }
}
```

---

## Composition (wiring it into an app)

Foundation never wires itself — the **host is the composition root**. It chooses the
connector, owns its lifecycle, and injects dependencies.

### Plain Node / Express

```ts
import { DataSource } from "typeorm";
import { createTypeOrmConnector } from "@torfax/foundation";

const dataSource = await new DataSource({ /* ... */ }).initialize();
const connector = createTypeOrmConnector(dataSource);

const users = new UserRepository(connector);   // explicit injection
```

### NestJS

Nest is *only* an external container: its providers call the same factories.

```ts
import { DataSource } from "typeorm";
import { createTypeOrmConnector, Connector } from "@torfax/foundation";

export const CONNECTOR = Symbol("CONNECTOR");

@Module({
  providers: [
    {
      provide: CONNECTOR,
      inject: [DataSource],
      useFactory: (ds: DataSource) => createTypeOrmConnector(ds),
    },
    {
      provide: UserRepository,
      inject: [CONNECTOR],
      useFactory: (connector: Connector) => new UserRepository(connector),
    },
  ],
  exports: [UserRepository],
})
export class DataModule {}
```

Same factories, same repositories — Nest just manages *when* instances are created and
*how long* they live. No global registry, no framework baked into foundation.

---

## Scripts

```bash
npm run build       # compile to dist/
npm run typecheck   # tsc --noEmit
npm run clean       # remove dist/
```

## Provenance

Extracted from an internal project's core folder, preserving its full commit history
(re-rooted at the repository root).
