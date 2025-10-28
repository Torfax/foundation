import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import UploadOptions from "./types/UploadOptions";
import { ProcessedFile } from "./types/ProcessedFile";

export class MulterFileUploadService {
  private storage: StorageEngine;
  public upload: multer.Multer;
  private baseUploadsDir: string;

  constructor(options?: UploadOptions) {
    const baseUploads = path.join(process.cwd(), "uploads");
    const destination = options?.destination || path.join(baseUploads, "uploads");
    const filePrefix = options?.filePrefix || "file";
    const maxFileSize = options?.maxFileSize || 5 * 1024 * 1024;
    const allowedMimeTypes = options?.allowedMimeTypes || ["image/jpeg", "image/png", "image/gif"];

    this.baseUploadsDir = baseUploads; // 👈 Base común, no la carpeta específica

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    this.storage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, destination),
      filename: (_, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${filePrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      },
    });

    this.upload = multer({
      storage: this.storage,
      limits: { fileSize: maxFileSize },
      fileFilter: (_, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Tipo de archivo no permitido"));
      },
    });
  }


  // Helper para subir un solo archivo
  single(fieldName: string) {
    return this.upload.single(fieldName);
  }

  // Helper para subir múltiples archivos
  array(fieldName: string, maxCount: number) {
    return this.upload.array(fieldName, maxCount);
  }

  fields(fieldDefinitions: multer.Field[]) {
    return this.upload.fields(fieldDefinitions);
  }

  /**
   * Obtiene la ruta relativa desde el directorio base de uploads
   * Ejemplo: "members/filename.jpg"
   */
  getRelativePath(fullPath: string): string {
    return path.relative(this.baseUploadsDir, fullPath);
  }

  /**
   * Obtiene la ruta pública para acceder al archivo via HTTP
   * Ejemplo: "/uploads/members/filename.jpg"
   */
  getPublicPath(fullPath: string): string {
    const relativePath = this.getRelativePath(fullPath);
    return `/uploads/${relativePath}`.replace(/\\/g, '/'); // Normalizar para web
  }

  /**
   * Obtiene solo el filename con la subcarpeta
   * Ejemplo: "members/filename.jpg"
   */
  getStoredPath(fullPath: string): string {
    const relativePath = this.getRelativePath(fullPath);
    return relativePath.replace(/\\/g, '/'); // Normalizar separadores
  }

  /**
   * Método conveniente para procesar archivos después de subirlos
   * y obtener la información lista para guardar en BD
   */
  processUploadedFile(file: Express.Multer.File): ProcessedFile {
    const processedFile: ProcessedFile = {
      ...file,
      relativePath: this.getStoredPath(file.path),    // "members/member-1761240933402-470794260.png"
      publicUrl: this.getPublicPath(file.path),       // "/uploads/members/member-1761240933402-470794260.png"
    };

    return processedFile;
  }


  processUploadedFiles(files: { [key: string]: Express.Multer.File[] }): {
    [key: string]: (ProcessedFile | undefined)[]
  } {

    console.log("Files que vienen: ", files);
    const processedFiles: { [key: string]: any[] } = {};

    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        processedFiles[fieldName] = fileArray.map(file => this.processUploadedFile(file));
      }
    }

    console.log("Files que retornan ", processedFiles);
    return processedFiles;
  }

}