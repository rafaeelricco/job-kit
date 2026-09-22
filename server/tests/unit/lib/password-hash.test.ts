import assert from "node:assert/strict"
import { describe, test } from "vitest"
import { hashPassword, verifyPassword, unmatchableHash } from "@be/lib/password-hash"

describe("password-hash", () => {
  test("the right password verifies and a wrong one does not", async () => {
    const encoded = await hashPassword("correct horse battery").promise((error) => error)
    assert.equal(await verifyPassword("correct horse battery", encoded).promise((error) => error), true)
    assert.equal(await verifyPassword("wrong password", encoded).promise((error) => error), false)
  })

  test("two hashes of the same password differ (fresh salt)", async () => {
    const first = await hashPassword("correct horse battery").promise((error) => error)
    const second = await hashPassword("correct horse battery").promise((error) => error)
    assert.notEqual(first, second)
  })

  test("a malformed encoded hash never matches", async () => {
    assert.equal(await verifyPassword("anything", "argon2$x").promise((error) => error), false)
  })

  test("unmatchableHash never matches an empty or common password", async () => {
    assert.equal(await verifyPassword("", unmatchableHash).promise((error) => error), false)
    assert.equal(await verifyPassword("password", unmatchableHash).promise((error) => error), false)
  })

  test("the encoded form names its scrypt parameters", async () => {
    const encoded = await hashPassword("correct horse battery").promise((error) => error)
    assert.match(encoded, /^scrypt\$32768\$8\$3\$/)
  })
})
