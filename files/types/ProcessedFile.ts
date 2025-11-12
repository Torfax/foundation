export interface ProcessedFile extends Express.Multer.File {
  storedPath: string;
  relativePath: string;
}