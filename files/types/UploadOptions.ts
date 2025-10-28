export default interface UploadOptions {
  destination?: string;
  filePrefix?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}