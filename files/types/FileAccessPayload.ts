export default interface FileAccessPayload {
  /** Rutas relativas de archivos autorizados */
  files: string[];
  /** Timestamp de creación */
  iat?: number;
  /** Timestamp de expiración */
  exp?: number;
}