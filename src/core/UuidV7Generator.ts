import { randomBytes } from "node:crypto";
import { UidGenerator } from "./UidGenerator";

/**
 * UUIDv7 generator (RFC 9562): 48-bit Unix-millisecond timestamp + version/variant bits +
 * random. Globally unique but roughly time-ordered, which gives far better index locality
 * than fully-random v4. See ADR-0001.
 */
export class UuidV7Generator implements UidGenerator {
  generate(): string {
    const bytes = randomBytes(16);
    const ts = BigInt(Date.now());

    // 48-bit big-endian millisecond timestamp
    bytes[0] = Number((ts >> 40n) & 0xffn);
    bytes[1] = Number((ts >> 32n) & 0xffn);
    bytes[2] = Number((ts >> 24n) & 0xffn);
    bytes[3] = Number((ts >> 16n) & 0xffn);
    bytes[4] = Number((ts >> 8n) & 0xffn);
    bytes[5] = Number(ts & 0xffn);

    // version 7 (high nibble of byte 6) and variant 10 (high bits of byte 8)
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString("hex");
    return (
      `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-` +
      `${hex.slice(16, 20)}-${hex.slice(20)}`
    );
  }
}
