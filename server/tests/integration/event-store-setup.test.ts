import assert from "node:assert/strict"
import { createHash, createHmac, pbkdf2Sync } from "node:crypto"
import { Client } from "pg"
import { afterEach, beforeEach, test, vi } from "vitest"
import env from "@be/app/environment"
import { initialize } from "@lib/event-sourcing/store/postgres"
import type { PostgresTransaction } from "@lib/postgres"

const clientConfig = {
  user: env.EVENT_STORE_USER,
  password: env.EVENT_STORE_PASSWORD,
  host: env.EVENT_STORE_HOST,
  port: env.EVENT_STORE_PORT,
  database: env.EVENT_STORE_DATABASE,
}

function hasPassword(verifier: string, password: string, username: string): boolean {
  if (verifier.startsWith("SCRAM-SHA-256$")) {
    const [, iterationsAndSalt, keys] = verifier.split("$")
    const [iterations, salt] = iterationsAndSalt!.split(":")
    const [storedKey, serverKey] = keys!.split(":")
    const saltedPassword = pbkdf2Sync(password, Buffer.from(salt!, "base64"), Number(iterations), 32, "sha256")
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest()
    const expectedStoredKey = createHash("sha256").update(clientKey).digest("base64")
    const expectedServerKey = createHmac("sha256", saltedPassword).update("Server Key").digest("base64")
    return storedKey === expectedStoredKey && serverKey === expectedServerKey
  }

  if (verifier.startsWith("md5")) {
    return verifier === `md5${createHash("md5").update(`${password}${username}`).digest("hex")}`
  }

  return false
}

async function expectNoObjects(client: Client, names: { schema: string; table: string; role: string; publication: string }) {
  const result = await client.query(
    `SELECT
       EXISTS (SELECT FROM pg_namespace WHERE nspname = $1) AS schema_exists,
       EXISTS (
         SELECT FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relname = $2
       ) AS table_exists,
       EXISTS (SELECT FROM pg_roles WHERE rolname = $3) AS role_exists,
       EXISTS (SELECT FROM pg_publication WHERE pubname = $4) AS publication_exists`,
    [names.schema, names.table, names.role, names.publication]
  )
  assert.deepEqual(result.rows[0], {
    schema_exists: false,
    table_exists: false,
    role_exists: false,
    publication_exists: false,
  })
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test.each([
  ["ordinary", "SafePass123!"],
  ["apostrophe", "O'Brien"],
  ["backslash", "back\\slash"],
  ["dollar quotes", "before$$after"],
  ["combined", "O'\\$$pass"],
])("initialize stores the exact %s password and rolls back scratch objects", async (_label, password) => {
  const suffix = `${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2)}`.replaceAll(".", "")
  const names = {
    schema: `event_store_setup_${suffix}`,
    table: "event_store",
    role: `event_store_setup_role_${suffix}`,
    publication: `event_store_setup_pub_${suffix}`,
  }
  const client = new Client(clientConfig)
  await client.connect()

  let failure: unknown
  try {
    await client.query("BEGIN")
    await client.query(`CREATE SCHEMA ${names.schema}`)
    const transaction = {
      query: (sql: string, values?: unknown[]) => client.query(sql, values),
    } as unknown as PostgresTransaction

    const setup = () =>
      initialize({
        transaction,
        database: env.EVENT_STORE_DATABASE,
        table: `${names.schema}.${names.table}`,
        replicationUserName: names.role,
        replicationUserPass: password,
        replicationPublication: names.publication,
      })

    await setup()

    const role = await client.query<{ rolpassword: string }>(
      "SELECT rolpassword FROM pg_authid WHERE rolname = $1",
      [names.role]
    )
    assert.equal(role.rows.length, 1)
    assert.ok(hasPassword(role.rows[0]!.rolpassword, password, names.role), "PostgreSQL stored a verifier for the exact password bytes")

    // The second initialization exercises the duplicate-role and duplicate-publication branches.
    await setup()

    const objects = await client.query(
      `SELECT
         EXISTS (SELECT FROM pg_namespace WHERE nspname = $1) AS schema_exists,
         EXISTS (
           SELECT FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = $1 AND c.relname = $2
         ) AS table_exists,
         EXISTS (SELECT FROM pg_roles WHERE rolname = $3) AS role_exists,
         EXISTS (SELECT FROM pg_publication WHERE pubname = $4) AS publication_exists`,
      [names.schema, names.table, names.role, names.publication]
    )
    assert.deepEqual(objects.rows[0], {
      schema_exists: true,
      table_exists: true,
      role_exists: true,
      publication_exists: true,
    })
  } catch (error) {
    failure = error
  } finally {
    try {
      await client.query("ROLLBACK")
    } catch (error) {
      failure ??= error
    }
    try {
      await expectNoObjects(client, names)
    } catch (error) {
      failure ??= error
    }
    try {
      await client.end()
    } catch (error) {
      failure ??= error
    }
  }

  if (failure !== undefined) throw failure
})
