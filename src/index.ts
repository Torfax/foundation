// @torfax/foundation — public API barrel.
// Early development: this surface is not stable yet.

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
export * from "./database";

// Utilities (namespaced: DateUtil, ObjectUtil, StringUtil, ZodUtils)
export * from "./utils";

// Validators
export * from "./validators/MatchClVal";

// Shared types
export * from "./types/DayOfWeek";
