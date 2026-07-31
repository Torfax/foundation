// @torfax/foundation — public API barrel.
// Early development: this surface is not stable yet.

// Core contracts (framework-agnostic primitives: UidGenerator, ...)
export * from "./core";

// Cryptography (by purpose: password hashing, ...)
export * from "./crypto";

// Configuration
export * from "./config/ConfigService";

// Exceptions
export * from "./exceptions/HttpException";
export * from "./exceptions/ExceptionHandler";

// HTTP
export * from "./http/HttpResponse";
export * from "./http/HttpUtils";

// Files
export * from "./files";
export * from "./files/resolveStoreFileAccessUrl";

// Persistence / data access (Criteria pattern + TypeORM adapter)
export * from "./data";

// Utilities (namespaced: DateUtil, ObjectUtil, StringUtil, ZodUtils)
export * from "./utils";

// Validators
export * from "./validators/MatchClVal";

// Shared types
export * from "./types/DayOfWeek";
