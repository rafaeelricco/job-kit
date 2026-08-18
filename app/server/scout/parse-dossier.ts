export { parseDossier }

import { err, ok } from "../../src/module/scout/result"
import {
  FACT_KEYS,
  UNKNOWN_TEXT,
  isBucket,
  isChannel,
  isLifecycle,
  isWriter,
  toIsoDate,
} from "../../src/module/scout/types"
import type {
  Dossier,
  Excerpt,
  FactKey,
  FactValue,
  Factor,
  LogEntry,
  ParseError,
  ParsedDossier,
  Posting,
  Provenance,
  Score,
  Verdict,
} from "../../src/module/scout/types"

// The grammar below was recovered by round-tripping the corpus on disk, so the
// odd-looking rules are the corpus, not taste: titles carry ": " and " — ",
// five fact values carry a raw pipe, the verdict header changes shape and
// order between files, and the "never writes below this line" comment is
// printed twice in a good number of records.

const FRONTMATTER_KEYS = [
  "company",
  "title",
  "url",
  "status",
  "first_seen",
  "last_seen",
  "score",
  "bucket",
  "channel",
] as const

const SECTIONS = [
  "## Verdict",
  "## Posting facts",
  "## From the posting",
  "## Provenance",
  "## Application log",
] as const

const VERDICT_LINE = /^score \*\*(.+?)\*\* · (.+?) · (.+?) · (.*)$/
const LOG_LINE = /^- (\d{4}-\d{2}-\d{2}) · (.*) — ([a-z-]+)$/
const APPLICATION_LINE = /^#### Application /gm
const FACTS_HEADER = "key | value"
const NUMERIC = /^-?\d+(?:\.\d+)?$/

function parseDossier(file: string, raw: string): ParsedDossier {
  const fail = (at: string, cause: ParseError["cause"]): ParsedDossier => err({ file, at, cause })
  const lines = raw.split("\n")

  /* -- frontmatter -------------------------------------------------------- */

  if (lines[0] !== "---") {
    return fail("frontmatter", {
      kind: "frontmatter",
      detail: "no --- on line 1",
    })
  }
  const close = lines.indexOf("---", 1)
  if (close === -1) {
    return fail("frontmatter", {
      kind: "frontmatter",
      detail: "unterminated frontmatter",
    })
  }

  const fields = new Map<string, string>()
  for (const line of lines.slice(1, close)) {
    if (line.trim() === "") continue
    // First ": " only — seven titles hold a second one.
    const at = line.indexOf(": ")
    if (at === -1) {
      return fail("frontmatter", { kind: "frontmatter", detail: line })
    }
    fields.set(line.slice(0, at), unquote(line.slice(at + 2)))
  }
  const missing = FRONTMATTER_KEYS.filter((key) => !fields.has(key))
  if (missing.length > 0) {
    return fail("frontmatter", {
      kind: "frontmatter",
      detail: `missing ${missing.join(", ")}`,
    })
  }
  const read = (key: string): string => fields.get(key) ?? ""

  const status = read("status")
  if (!isLifecycle(status)) {
    return fail("frontmatter", {
      kind: "vocabulary",
      field: "status",
      got: status,
    })
  }
  const bucket = read("bucket")
  if (!isBucket(bucket)) {
    return fail("frontmatter", {
      kind: "vocabulary",
      field: "bucket",
      got: bucket,
    })
  }
  const channel = read("channel")
  if (!isChannel(channel)) {
    return fail("frontmatter", {
      kind: "vocabulary",
      field: "channel",
      got: channel,
    })
  }
  const firstSeen = toIsoDate(read("first_seen"))
  if (firstSeen === null) {
    return fail("frontmatter", {
      kind: "date",
      field: "first_seen",
      got: read("first_seen"),
    })
  }
  const lastSeen = toIsoDate(read("last_seen"))
  if (lastSeen === null) {
    return fail("frontmatter", {
      kind: "date",
      field: "last_seen",
      got: read("last_seen"),
    })
  }
  const url = read("url")
  const host = hostOf(url)
  if (host === null) {
    return fail("frontmatter", {
      kind: "frontmatter",
      detail: `unparseable url ${url}`,
    })
  }

  /* -- sections ----------------------------------------------------------- */

  // The "# company — title" heading is never read: two titles contain " — ".
  const body = lines.slice(close + 1)
  // job-application stubs have frontmatter + Application log and no scout body.
  // Find the log first so a stub still parses; require the other headings only
  // when ## Verdict is present.
  const logHeading = "## Application log"
  const logStart = body.indexOf(logHeading)
  if (logStart === -1) {
    return fail(logHeading, { kind: "section", heading: logHeading })
  }

  const logged = readLog(body.slice(logStart + 1), fail)
  if (logged.kind === "fail") return logged.result
  const { log, posting, applications } = logged

  if (body.indexOf("## Verdict") === -1) {
    const rawScore = read("score")
    const score: Score =
      NUMERIC.test(rawScore) ? { kind: "scored", value: Number(rawScore) } : { kind: "unscored" }
    return ok({
      file,
      company: read("company"),
      title: read("title"),
      url,
      host,
      status,
      firstSeen,
      lastSeen,
      score,
      bucket,
      channel,
      verdict: { why: "", factors: [] },
      facts: blankFacts(),
      excerpt: { kind: "absent" },
      provenance: {
        source: UNKNOWN_TEXT,
        author: { kind: "unknown" },
        contact: { kind: "unknown" },
        date: UNKNOWN_TEXT,
      },
      log,
      posting,
      applications,
    })
  }

  const starts: number[] = []
  let cursor = 0
  for (const heading of SECTIONS) {
    const at = body.indexOf(heading, cursor)
    if (at === -1) return fail(heading, { kind: "section", heading })
    starts.push(at)
    cursor = at + 1
  }
  const sectionAt = (index: number): readonly string[] => {
    const start = starts[index]
    if (start === undefined) return []
    return body.slice(start + 1, starts[index + 1] ?? body.length)
  }

  /* -- verdict ------------------------------------------------------------ */

  const verdictBody = sectionAt(0)
  const headline = verdictBody.map((line) => line.trim()).find((line) => line !== "" && !line.startsWith("|"))
  const why = headline === undefined ? undefined : VERDICT_LINE.exec(headline)?.[4]
  if (why === undefined) {
    return fail("## Verdict line", { kind: "section", heading: "## Verdict" })
  }

  const pipes = verdictBody.filter((line) => line.trim().startsWith("|"))
  const headerLine = pipes[0]
  const rowLine = pipes[2]
  // Three lines exactly: header, decorative separator, row.
  if (pipes.length !== 3 || headerLine === undefined || rowLine === undefined) {
    return fail("## Verdict table", {
      kind: "table",
      detail: `expected 3 pipe lines, got ${pipes.length}`,
    })
  }
  const header = cells(headerLine)
  const row = cells(rowLine)
  if (header.length !== row.length || header.length < 2) {
    return fail("## Verdict table", {
      kind: "table",
      detail: `header ${header.length} cells, row ${row.length}`,
    })
  }
  if (header[header.length - 1] !== "=") {
    return fail("## Verdict table", {
      kind: "table",
      detail: "header does not end in =",
    })
  }
  // Positional: the header carries three different label sets and orders.
  const factors: Factor[] = header.slice(0, -1).map((label, index) => ({
    label,
    points: value(row[index] ?? UNKNOWN_TEXT),
  }))
  const verdict: Verdict = { why, factors }

  const total = row[row.length - 1] ?? UNKNOWN_TEXT
  const score: Score = NUMERIC.test(total) ? { kind: "scored", value: Number(total) } : { kind: "unscored" }
  if (score.kind === "scored" && Number(read("score")) !== score.value) {
    return fail("## Verdict table", {
      kind: "score-mismatch",
      frontmatter: read("score"),
      table: total,
    })
  }

  /* -- posting facts ------------------------------------------------------ */

  const factLines = sectionAt(1).filter((line) => line.trim().startsWith("|"))
  const factHeader = factLines[0]
  // Column padding varies between files, so the header is matched on cells.
  if (factHeader === undefined || cells(factHeader).join(" | ") !== FACTS_HEADER) {
    return fail("## Posting facts", {
      kind: "table",
      detail: `no | ${FACTS_HEADER} | header`,
    })
  }
  const factRows = factLines.slice(2)
  if (factRows.length !== FACT_KEYS.length) {
    return fail("## Posting facts", {
      kind: "table",
      detail: `expected ${FACT_KEYS.length} rows, got ${factRows.length}`,
    })
  }
  const collected: Partial<Record<FactKey, FactValue>> = {}
  for (const [index, line] of factRows.entries()) {
    const at = `## Posting facts row ${index + 1}`
    const inner = unpipe(line)
    // First remaining pipe only: five values print a raw pipe of their own.
    const split = inner.indexOf("|")
    if (split === -1) {
      return fail(at, { kind: "table", detail: "row has one cell" })
    }
    const key = inner.slice(0, split).trim()
    const expected = FACT_KEYS[index]
    if (expected === undefined || key !== expected) {
      return fail(at, {
        kind: "table",
        detail: `expected ${expected ?? "?"}, got ${key}`,
      })
    }
    collected[expected] = value(inner.slice(split + 1).trim())
  }
  const facts = complete(collected)
  if (facts === null) {
    return fail("## Posting facts", {
      kind: "table",
      detail: "incomplete fact set",
    })
  }

  /* -- excerpt ------------------------------------------------------------ */

  const quoted = sectionAt(2).filter((line) => line.startsWith(">"))
  // No text key at all when absent — the body reads "_(not printed)_".
  const excerpt: Excerpt =
    quoted.length === 0
      ? { kind: "absent" }
      : {
          kind: "printed",
          text: quoted
            .map((line) => line.replace(/^>\s?/, ""))
            .join("\n")
            .trim(),
        }

  /* -- provenance --------------------------------------------------------- */

  const provLine = sectionAt(3).find((line) => line.trim() !== "")
  const parts = provLine === undefined ? [] : provLine.trim().split(" · ")
  const [source, author, contact, seen] = parts
  if (
    parts.length !== 4 ||
    source === undefined ||
    author === undefined ||
    contact === undefined ||
    seen === undefined
  ) {
    return fail("## Provenance", {
      kind: "section",
      heading: "## Provenance",
    })
  }
  // date stays raw: "8d", "7 days ago" and "2026-08-03" all occur.
  const provenance: Provenance = {
    source: source.trim(),
    author: value(author.trim()),
    contact: value(contact.trim()),
    date: seen.trim(),
  }

  /* -- log already read above --------------------------------------------- */

  const dossier: Dossier = {
    file,
    company: read("company"),
    title: read("title"),
    url,
    host,
    status,
    firstSeen,
    lastSeen,
    score,
    bucket,
    channel,
    verdict,
    facts,
    excerpt,
    provenance,
    log,
    posting,
    applications,
  }
  return ok(dossier)
}

/* -- helpers -------------------------------------------------------------- */

type LogRead =
  | { readonly kind: "ok"; readonly log: readonly LogEntry[]; readonly posting: Posting; readonly applications: number }
  | { readonly kind: "fail"; readonly result: ParsedDossier }

// Scan to EOF. The "scout never writes below this line" comment is not a
// delimiter (43 files print it twice) and blank lines are not terminators.
function readLog(
  tail: readonly string[],
  fail: (at: string, cause: ParseError["cause"]) => ParsedDossier
): LogRead {
  const log: LogEntry[] = []
  for (const line of tail) {
    const match = LOG_LINE.exec(line)
    if (match === null) continue
    const [, stamp, event, writer] = match
    if (stamp === undefined || event === undefined || writer === undefined) {
      continue
    }
    const date = toIsoDate(stamp)
    if (date === null) {
      return {
        kind: "fail",
        result: fail("## Application log", { kind: "date", field: "log", got: stamp }),
      }
    }
    if (!isWriter(writer)) {
      return {
        kind: "fail",
        result: fail("## Application log", { kind: "vocabulary", field: "writer", got: writer }),
      }
    }
    log.push({ date, event, writer })
  }

  // Last transition wins.
  const posting = log.reduce<Posting>(
    (current, entry) =>
      entry.event.startsWith("posting dead")
        ? { kind: "dead", since: entry.date }
        : entry.event === "posting live again"
          ? { kind: "live" }
          : current,
    { kind: "live" }
  )

  // Counted across the whole tail: one file interleaves a record between two
  // log lines, so records are not reliably last.
  const applications = (tail.join("\n").match(APPLICATION_LINE) ?? []).length
  return { kind: "ok", log, posting, applications }
}

function blankFacts(): Readonly<Record<FactKey, FactValue>> {
  const out: Partial<Record<FactKey, FactValue>> = {}
  for (const key of FACT_KEYS) {
    out[key] = { kind: "unknown" }
  }
  return out as Readonly<Record<FactKey, FactValue>>
}

// One leading and one trailing quote; the writer has no escape mechanism.
function unquote(raw: string): string {
  const head = raw.startsWith('"') ? raw.slice(1) : raw
  return head.endsWith('"') ? head.slice(0, -1) : head
}

function unpipe(line: string): string {
  const trimmed = line.trim()
  const head = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed
  return head.endsWith("|") ? head.slice(0, -1) : head
}

const cells = (line: string): string[] =>
  unpipe(line)
    .split("|")
    .map((cell) => cell.trim())

const value = (text: string): FactValue => (text === UNKNOWN_TEXT ? { kind: "unknown" } : { kind: "known", text })

// Verified key by key, so the assertion below only restates what the loop
// already proved.
function complete(partial: Partial<Record<FactKey, FactValue>>): Readonly<Record<FactKey, FactValue>> | null {
  const out: Partial<Record<FactKey, FactValue>> = {}
  for (const key of FACT_KEYS) {
    const found = partial[key]
    if (found === undefined) return null
    out[key] = found
  }
  return out as Readonly<Record<FactKey, FactValue>>
}

function hostOf(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname
  } catch {
    return null
  }
}
