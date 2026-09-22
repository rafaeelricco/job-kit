export { hashPassword, verifyPassword, unmatchableHash }

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { Future } from "@lib/future"

/** scrypt cost: `N` CPU/memory cost, `r` block size, `p` parallelism. */
type Params = { N: number; r: number; p: number }

/**
 * scrypt from node:crypto, in place of the argon2 package. OWASP's scrypt
 * floor (N=2^15, r=8, p=3) needs 32 MiB, so `maxmem` sits above Node's
 * 32 MiB default. The encoded hash names its own parameters, so raising
 * them later still verifies old hashes.
 */
const PARAMS: Params = { N: 2 ** 15, r: 8, p: 3 }
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const MAX_MEMORY = 64 * 1024 * 1024

/** Run scrypt on libuv's thread pool, so a ~100 ms hash never blocks the event loop. */
function derive(password: string, salt: Buffer, params: Params): Future<Error, Buffer> {
  return Future.attemptP(
    () =>
      new Promise<Buffer>((resolve, reject) =>
        scrypt(password, salt, KEY_LENGTH, { ...params, maxmem: MAX_MEMORY }, (error, key) =>
          error ? reject(error) : resolve(key)
        )
      )
  )
}

/** Self-describing storage format: everything `verifyPassword` needs besides the password. */
function encode(params: Params, salt: Buffer, key: Buffer): string {
  return ["scrypt", params.N, params.r, params.p, salt.toString("base64"), key.toString("base64")].join("$")
}

/** Hash `password` with a fresh salt, as `scrypt$N$r$p$salt$key` (base64). */
function hashPassword(password: string): Future<Error, string> {
  const salt = randomBytes(SALT_LENGTH)
  return derive(password, salt, PARAMS).map((key) => encode(PARAMS, salt, key))
}

/**
 * True when `password` matches `encoded`, compared in constant time. A hash
 * that is not `scrypt$…` or is missing a field never matches; one with
 * non-numeric parameters rejects, since that is corrupt stored data.
 *
 * ```ts
 * hashPassword("correct horse battery").chain((hash) => verifyPassword("correct horse battery", hash)) // true
 * ```
 */
function verifyPassword(password: string, encoded: string): Future<Error, boolean> {
  const [scheme, N, r, p, salt, key] = encoded.split("$")
  if (scheme !== "scrypt" || !N || !r || !p || salt === undefined || key === undefined) return Future.resolve(false)
  const expected = Buffer.from(key, "base64")
  return derive(password, Buffer.from(salt, "base64"), { N: Number(N), r: Number(r), p: Number(p) }).map(
    (actual) => actual.length === expected.length && timingSafeEqual(actual, expected)
  )
}

/**
 * A well-formed hash no password derives to (all-zero key). Sign-in verifies
 * against it for an unknown email, so response time does not reveal which
 * emails exist.
 */
const unmatchableHash = encode(PARAMS, Buffer.alloc(SALT_LENGTH), Buffer.alloc(KEY_LENGTH))
