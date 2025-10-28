// src/core/files/types/ProcessedFile.ts
export type ProcessedFile = Express.Multer.File & {
  relativePath: string;
  publicUrl: string;
};