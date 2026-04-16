import { FileAccessService } from "@src/core/files/FileAccessService";
import { StoreFiles } from "@src/database/entities/entities/StoreFiles";

/**
 * Resolves a public or protected URL for a store file row (same rules as landing).
 */
export function resolveStoreFileAccessUrl(
  file: StoreFiles | undefined | null,
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
