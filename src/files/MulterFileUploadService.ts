// src/upload/MulterFileUploadService.ts
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
    const filePrefix = options?.filePrefix ?? "file";
    const maxFileSize = options?.maxFileSize ?? 5 * 1024 * 1024;
    const allowedMimeTypes = options?.allowedMimeTypes ?? ["image/jpeg", "image/png"];

    this.baseUploadsDir = options?.baseUploadsDir ?? path.resolve(process.cwd(), "uploads");

    // Si la ruta es absoluta → se usa tal cual
    // Si es relativa → se resuelve desde process.cwd()
    const destination = options?.destination
      ? path.isAbsolute(options.destination)
        ? options.destination
        : path.resolve(process.cwd(), options.destination)
      : path.resolve(process.cwd(), "uploads/default");

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
        allowedMimeTypes.includes(file.mimetype)
          ? cb(null, true)
          : cb(new Error("Tipo de archivo no permitido"));
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
   */
  getRelativePath(fullPath: string): string {
    // Obtiene la ruta relativa desde el directorio base del proyecto
    const relativeToProject = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

    // Garantiza que siempre empiece con "uploads/"
    if (!relativeToProject.startsWith(path.basename(this.baseUploadsDir))) {
      return `${path.basename(this.baseUploadsDir)}/${relativeToProject}`;
    }

    return relativeToProject;
  }



  /**
   * Obtiene solo el filename con la subcarpeta
   */
  getStoredPath(fullPath: string): string {
    const relativePath = this.getRelativePath(fullPath);
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * Método principal para procesar un archivo subido
   */
  processUploadedFile(file: Express.Multer.File): ProcessedFile {
    // Si ya viene de diskStorage → todo ok
    if (file.path) {
      const relativePath = this.getRelativePath(file.path);
      return {
        ...file,
        storedPath: file.path,
        relativePath
      };
    }

    // Si viene de memoryStorage → guardar en disco
    if (file.buffer) {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const finalDir = this.baseUploadsDir;
      const finalPath = path.join(finalDir, filename);

      fs.writeFileSync(finalPath, file.buffer);

      const relativePath = this.getRelativePath(finalPath);

      return {
        ...file,
        path: finalPath,
        storedPath: finalPath,
        relativePath
      };
    }

    throw new Error("El archivo no tiene ni path ni buffer. No se puede procesar.");
  }


  /**
   * Procesa múltiples archivos organizados por field name
   */
  processUploadedFiles(files: { [fieldName: string]: Express.Multer.File[] }): {
    [fieldName: string]: ProcessedFile[]
  } {
    const processedFiles: { [fieldName: string]: ProcessedFile[] } = {};

    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        processedFiles[fieldName] = fileArray.map(file => this.processUploadedFile(file));
      } else {
        processedFiles[fieldName] = [];
      }
    }



    return processedFiles;
  }

  /**
   * Procesa un array simple de archivos (para upload.array())
   */
  processFileArray(files: Express.Multer.File[]): ProcessedFile[] {
    if (!files || !Array.isArray(files)) {
      return [];
    }
    return files.map(file => this.processUploadedFile(file));
  }

  /**
   * Procesa archivos de cualquier tipo (single, array, fields)
   */
  processAnyUpload(files?: Express.Multer.File[] | { [fieldName: string]: Express.Multer.File[] } | Express.Multer.File):
    ProcessedFile[] | { [fieldName: string]: ProcessedFile[] } | ProcessedFile | null {

    if (!files) {
      return null;
    }

    // Si es un solo archivo
    if ('fieldname' in files && 'originalname' in files) {
      return this.processUploadedFile(files as Express.Multer.File);
    }

    // Si es un array de archivos
    if (Array.isArray(files)) {
      return this.processFileArray(files);
    }

    // Si es un objeto con field names
    if (typeof files === 'object') {
      return this.processUploadedFiles(files as { [fieldName: string]: Express.Multer.File[] });
    }

    return null;
  }

  /**
   * Elimina un archivo del sistema de archivos
   */
  deleteFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error eliminando archivo ${filePath}:`, err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Elimina múltiples archivos
   */
  async deleteFiles(filePaths: string[]): Promise<{ success: string[], failed: string[] }> {
    const results = await Promise.all(
      filePaths.map(async (filePath) => {
        const success = await this.deleteFile(filePath);
        return { filePath, success };
      })
    );

    const success = results.filter(r => r.success).map(r => r.filePath);
    const failed = results.filter(r => !r.success).map(r => r.filePath);

    return { success, failed };
  }
}