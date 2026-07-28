import { FileAccessService } from "./FileAccessService";

/**
 * Minimal shape of a stored-file record needed to resolve its access URL.
 * Kept local so this helper stays decoupled from any concrete ORM entity.
 */
export interface StoreFileLike {
  storageType?: string | null;
  fileUrl?: string | null;
  filePath?: string | null;
  isPrivate?: boolean | null;
}

/**
 * Resolves a public or protected URL for a store file row (same rules as landing).
 */
export function resolveStoreFileAccessUrl(
  file: StoreFileLike | undefined | null,
  fileAccess: FileAccessService
): string | null {
  if (!file) return null;
  if (file.storageType === "url" && file.fileUrl) {
    return file.fileUrl;
  }
  if (!file.filePath) return null;
  return file.isPrivate
    ? (fileAccess.buildProtectedUrl(file.filePath) as string)
    : (fileAccess.buildPublicUrl(file.filePath) as string);
}
