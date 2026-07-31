import { hash, verify } from "@node-rs/argon2";
import { PasswordHasher } from "./PasswordHasher";

/**
 * Argon2id password hasher (the @node-rs/argon2 default algorithm), with prebuilt native
 * binaries so there is no node-gyp build step. The encoded output is a self-describing PHC
 * string, so `verify` needs no separate parameters.
 */
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    try {
      return await verify(encodedHash, password);
    } catch {
      return false;
    }
  }
}
