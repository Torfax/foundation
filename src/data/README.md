# Database — a datasource connector

The `database` module is **not an ORM and not tied to one**. It is a small engine for
talking to **data sources** through a standard contract, so the same application code
(repositories, use-cases) works regardless of what is behind them.

> A data source exists (a Postgres DB, a REST API, …). You attach to it with a
> **Connector**. The Connector knows how to **read** (via `Criteria`) and **write**
> (via `create` / `update` / `delete`). Everything above the Connector is agnostic.

## The idea in one picture

```
   AGNOSTIC (foundation) — knows nothing about TypeORM / SQL / HTTP
   ┌──────────────────────────────────────────────────────────────┐
   │  Criteria (the read standard)     Writer commands (write std)  │
   │  Reader ───────────┐              ┌─────────── Writer           │
   │  EntityStore(entity)│              │  create / update / delete   │
   └────────────────────┼──────────────┼─────────────────────────────┘
                        │  translate    │
   ┌────────────────────┴──────────────┴─────────────────────────────┐
   │  Connector  (one per data source)                                 │
   │    • CriteriaTranslator :  Criteria ──► native query `Q`          │
   │    • ReadPort / WritePort :  execute `Q` against the source        │
   └────────────────────┬──────────────────────────────────────────────┘
       ┌────────────────┴───────────┐        ┌────────────────────────┐
       │ TypeOrmConnector (Postgres)│        │  RestApiConnector (soon)│
       │  Q = FindManyOptions       │        │  Q = HTTP request spec  │
       └────────────────────────────┘        └────────────────────────┘
```

## What "the standard" is

Two agnostic contracts describe **intent**, never a specific technology:

- **Read → `Criteria`** — *what* you want to match: `filters` / `filterTree` (AND/OR),
  `sort`, `pagination`, `relations`, `select`. Operators: `eq, neq, gt, lt, gte, lte,
  contains, startsWith, endsWith, in, notIn, between, isNull, notNull, like, notLike`.
- **Write → `Writer` commands** — `create` / `createMany`, `update*` (with a field
  whitelist), `delete*`. The *where* of update/delete is expressed with `Criteria` too.

## What each connector provides

`Criteria` and the write commands do **not** "build" anything by themselves. The
**Connector** you inject decides what they lower to:

| Connector | native query `Q` | executes with |
|---|---|---|
| `TypeOrmConnector` (today) | `FindManyOptions` | TypeORM `Repository` |
| `RestApiConnector` (future) | an HTTP request spec | `fetch` |

So a data source "plugs in" by implementing three things — a **CriteriaTranslator**
(`Criteria → Q`), a **read adapter** and a **write adapter**. Implement those and it
inherits the whole Reader/Writer/pagination/DNF machinery for free. If a source cannot
express `Criteria` (e.g. an RPC-only API), that is exactly where you write a bespoke
adapter/mapper.

## Where it is aiming

- **Now:** one connector, TypeORM/Postgres. The host owns the TypeORM `DataSource`
  (the connection pool / manager); foundation only wraps it via `createTypeOrmConnector`.
- **Next:** more connectors (a REST API is the obvious one), behind the same contracts.
- **Later (not built yet):** capability negotiation (a source declaring which operators
  it supports) and transactions / Unit of Work (the `options.manager` hook is the seam).

## Design rules

1. Agnostic layer (Criteria, Reader, Writer) never imports TypeORM.
2. Dependencies are injected — no global registry, no hidden singletons.
3. The host chooses the connector and owns its lifecycle.
4. A connector is only known through its public contract (`Connector`).

➡️ For concrete, copy-pasteable usage see **[USAGE.md](./USAGE.md)**.
