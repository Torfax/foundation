import jwt from "jsonwebtoken";

export default interface FileAccessOptions {
  /** Secreto para firmar JWT */
  jwtSecret: jwt.Secret;
  /** Tiempo de expiración del token */
  tokenExpiresIn?: string | number;
  /** Endpoint base */
  endpoint?: string;
  /** Host opcional */
  host?: string;
}