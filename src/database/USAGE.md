# Database — Usage

How to compose the module, define repositories, read with `Criteria`, write with the
`Writer`, and how a new data source plugs in.

All symbols below are exported from the package root:

```ts
import {
  BaseRepository,
  EntityStore,
  Connector,
  createTypeOrmConnector,
  ReadCriteria,
  ReadCriteriaBuilder,
  createUpdateConfig,
  PaginatedResult,
} from "@torfax/foundation";
```

---

## 1. Compose (the host owns the data source)

The application creates the TypeORM `DataSource` (the connection pool) and wraps it in a
**Connector**. Nothing is global — the connector is injected explicitly.

```ts
import { DataSource } from "typeorm";
import { createTypeOrmConnector } from "@torfax/foundation";

const dataSource = await new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, Order],
}).initialize();

const connector = createTypeOrmConnector(dataSource);
```

You can build a store directly…

```ts
const users = new EntityStore(connector, User);   // users.reader / users.writer
```

…but usually you go through a repository (next section).

---

## 2. Define a repository

Extend `BaseRepository`; it receives the connector and gives you `createStore(entity)`.
`createStore` returns an `EntityStore<E>` exposing **`.reader`** and **`.writer`**.

```ts
import { BaseRepository } from "@torfax/foundation";

export class UserRepository extends BaseRepository {
  private users = this.createStore(User);
  private orders = this.createStore(Order);

  findActive() {
    return this.users.reader.find({
      filters: [{ field: "status", operator: "eq", value: "active" }],
    });
  }

  register(data: Partial<User>) {
    return this.users.writer.create(data);
  }
}

// wired by the host / composition root:
const repo = new UserRepository(connector);
```

---

## 3. Read — `store.reader` + `Criteria`

### Operations

| Method | Returns |
|---|---|
| `find(criteria?)` | `E[]` |
| `findOne(criteria?)` | `E \| null` |
| `getOne(criteria?)` | `E` (throws `NotFoundException`) |
| `findById(id, criteria?)` | `E \| null` |
| `getById(id, criteria?)` | `E` (throws `NotFoundException`) |
| `findByField(field, value)` | `E \| null` |
| `findManyByField(field, value)` | `E[]` |
| `paginate(criteria?, config?)` | `PaginatedResult<E>` |

### Criteria cookbook

```ts
// simple filters (implicit AND)
await users.reader.find({
  filters: [
    { field: "status", operator: "eq", value: "active" },
    { field: "age", operator: "gte", value: 18 },
  ],
  sort: [{ field: "createdAt", direction: "DESC" }],
  select: ["id", "name"],
  relations: ["profile"],
});

// logical tree (AND / OR, nested) — expands to DNF internally
await users.reader.find({
  filterTree: {
    kind: "group", op: "and",
    nodes: [
      { kind: "leaf", field: "status", operator: "eq", value: "active" },
      {
        kind: "group", op: "or",
        nodes: [
          { kind: "leaf", field: "role", operator: "eq", value: "admin" },
          { kind: "leaf", field: "role", operator: "eq", value: "owner" },
        ],
      },
    ],
  },
});
```

**Operators:** `eq, neq, gt, lt, gte, lte, contains, startsWith, endsWith, in, notIn,
between, isNull, notNull, like, notLike`. Dotted fields (`profile.city`) auto-infer the
relation join.

### Pagination

```ts
const result: PaginatedResult<User> = await users.reader.paginate(
  { pagination: { page: 1, limit: 20 } },
  { defaultLimit: 10, maxLimit: 100, defaultSort: "createdAt", defaultOrder: "DESC" },
);
// result.data, result.pagination.{ currentPage, totalPages, totalItems, hasNext, hasPrev }
```

### From an HTTP query (DTO → Criteria)

`ListQueryDto` (class-validator) parses `?page=&limit=&filters=&filterTree=&sort=` and
`ReadCriteriaBuilder` turns it into a `Criteria`:

```ts
const criteria = ReadCriteriaBuilder.fromDto(listQueryDto);
const page = await users.reader.paginate(criteria, { maxLimit: 100 });
```

---

## 4. Write — `store.writer` (create / update / delete)

### Create

```ts
const user = await users.writer.create({ name: "Ana", email: "ana@x.com" });
const many = await users.writer.createMany([{ name: "A" }, { name: "B" }]);
```

### Update (field-whitelisted)

Updates require an **`UpdateConfig`** — the list of fields allowed to change. Anything
outside it is rejected (`strict`, default `true`).

```ts
import { createUpdateConfig } from "@torfax/foundation";

const editable = createUpdateConfig<User>()(["name", "email"] as const);

await users.writer.updateById(id, { name: "New name" }, { config: editable });
await users.writer.updateByCriteria(
  { filters: [{ field: "status", operator: "eq", value: "pending" }] },
  { status: "active" },
  { config: createUpdateConfig<User>()(["status"] as const) },
);
```

**Compared / diff update** — reads the row first, updates only changed fields, and
returns the before/after diff (great for audit logs):

```ts
const r = await users.writer.updateByIdCompared(id, patch, { config: editable });
// r.changes -> { name: [oldValue, newValue] }
// r.hasChanges, r.updated, r.skippedReason ("NO_CHANGES")
```

### Delete

```ts
await users.writer.deleteById(id);
await users.writer.deleteByCriteria({
  filters: [{ field: "status", operator: "eq", value: "archived" }],
});
```

---

## 5. Escape hatch — `store.raw`

For a query the abstraction does not cover yet. **Leaks the TypeORM `Repository`** on
purpose; use sparingly.

```ts
const total = await users.raw((repo) => repo.count());
```

---

## 6. Add a new connector (e.g. a REST API)

Implement `Connector` — a translator plus read/write adapters. The repositories and the
Reader/Writer above do not change; you just inject a different connector.

```ts
import { Connector } from "@torfax/foundation";

class RestApiConnector implements Connector<ApiQuery> {
  createCriteriaTranslator() {
    // Criteria -> ApiQuery, e.g. { path, query: "?page=1&status=active" }
  }
  createReadAdapter(entity) {
    // returns a ReadDataSourcePort that runs the ApiQuery via fetch (GET)
  }
  createWriteAdapter(entity) {
    // returns a WriteDataSourcePort: create=POST, update=PATCH, delete=DELETE
  }
  raw(entity, op) { /* optional */ }
}

// same repository, different data source:
const repo = new UserRepository(new RestApiConnector(/* ... */));
```

> If the API cannot express part of `Criteria` (some operator, nested OR…), make the
> translator throw a clear error instead of silently returning wrong data.
