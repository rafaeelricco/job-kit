export { probe, resolveAsideSkillsRoot, resolveProfileRoot }

import fs from "node:fs"
import path from "node:path"

import type { Attempt, AttemptOutcome, AttemptSource, Resolution } from "../../src/module/scout/types"

// SKILL.md lines 8-30. The reader mirrors the resolver the skill runs, so the
// app and a scout run can never disagree about which profile is in play.

const ASIDE_SUFFIX = "/.aside/runtime/home"
const POINTER = ".config/profile-root"
const PROBE_FILES = ["data/candidate.yaml", "data/job_search.yaml"] as const

/* -- probe ---------------------------------------------------------------- */

// Total: a sandbox denial and a typo'd path both have to become an outcome,
// never an exception, or one bad candidate kills the whole resolution.
function probe(dir: string): AttemptOutcome {
  let stats: fs.Stats
  try {
    stats = fs.statSync(dir)
  } catch (error) {
    return denied(errnoCode(error)) ?? { kind: "missing" }
  }
  if (!stats.isDirectory()) return { kind: "missing" }
  try {
    fs.accessSync(dir, fs.constants.R_OK)
  } catch (error) {
    return denied(errnoCode(error)) ?? { kind: "unreadable" }
  }
  for (const name of PROBE_FILES) {
    try {
      fs.accessSync(path.join(dir, name), fs.constants.R_OK)
    } catch (error) {
      // The dir itself read clean, so an absent file is a failed probe rather
      // than a missing candidate.
      return denied(errnoCode(error)) ?? { kind: "probe-failed" }
    }
  }
  return { kind: "passed" }
}

const denied = (code: string): AttemptOutcome | null =>
  code === "EACCES" || code === "EPERM" ? { kind: "unreadable" } : null

function errnoCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code
    return typeof code === "string" ? code : ""
  }
  return ""
}

/* -- homes and pointers --------------------------------------------------- */

function hostHome(env: NodeJS.ProcessEnv): string {
  const home = env.HOME ?? ""
  if (home.endsWith(ASIDE_SUFFIX)) return home.slice(0, -ASIDE_SUFFIX.length)
  const host = env.HOST_HOME
  if (host !== undefined && path.isAbsolute(host)) return host
  return home
}

const isAside = (env: NodeJS.ProcessEnv): boolean => (env.HOME ?? "").endsWith(ASIDE_SUFFIX)

// Same rule as scripts/aside/lib.sh resolve_aside_skills_root, but via hostHome
// so an Aside-sandbox HOME does not point the prompt at ~/.aside/runtime/home.
function resolveAsideSkillsRoot(env: NodeJS.ProcessEnv): string {
  const override = env.ASIDE_SKILLS || env.ASIDE_SKILLS_USER || ""
  if (override !== "" && path.isAbsolute(override)) return override
  const account = env.ASIDE_ACCOUNT || "0"
  return `${hostHome(env)}/.aside/u/${account}/skills/builtin`
}

type Pointer =
  | { readonly kind: "read"; readonly line: string }
  | { readonly kind: "empty" }
  | { readonly kind: "missing" }
  | { readonly kind: "unreadable" }

// First line, trimmed, and nothing else. No realpath: canonicalization is the
// writing skill's job, and a reader that resolves symlinks reports a root the
// user never wrote down.
function readPointer(file: string): Pointer {
  let raw: string
  try {
    raw = fs.readFileSync(file, "utf8")
  } catch (error) {
    return denied(errnoCode(error)) === null ? { kind: "missing" } : { kind: "unreadable" }
  }
  const first = raw.split("\n")[0]
  const line = (first ?? "").trim()
  return line === "" ? { kind: "empty" } : { kind: "read", line }
}

/* -- resolution ----------------------------------------------------------- */

function resolveProfileRoot(env: NodeJS.ProcessEnv, cwd: string): Resolution {
  const attempts: Attempt[] = []
  const tried = new Set<string>()

  const record = (source: AttemptSource, at: string | null, line: string | null, outcome: AttemptOutcome): void => {
    attempts.push({ source, path: at, line, outcome })
  }

  // Every step reports itself, passing or not, so a STOP can name what it saw.
  const consider = (source: AttemptSource, at: string, candidate: string, line: string | null): boolean => {
    if (tried.has(candidate)) {
      record(source, at, line, { kind: "skipped", reason: "already-tried" })
      return false
    }
    tried.add(candidate)
    const outcome = probe(candidate)
    record(source, at, line, outcome)
    return outcome.kind === "passed"
  }

  const resolved = (root: string, via: AttemptSource): Resolution => ({
    kind: "resolved",
    root,
    via,
    attempts,
  })

  /* 1. $PROFILE_ROOT */
  const explicit = env.PROFILE_ROOT
  if (explicit === undefined || explicit === "") {
    record("PROFILE_ROOT", explicit ?? null, null, {
      kind: "skipped",
      reason: "not-applicable",
    })
  } else if (consider("PROFILE_ROOT", explicit, explicit, null)) {
    return resolved(explicit, "PROFILE_ROOT")
  }

  /* 2. $HOME/.config/profile-root */
  const homePointer = `${env.HOME ?? ""}/${POINTER}`
  const fromHome = readPointer(homePointer)
  if (fromHome.kind === "read") {
    if (consider("host-pointer", homePointer, fromHome.line, fromHome.line)) {
      return resolved(fromHome.line, "host-pointer")
    }
  } else {
    record("host-pointer", homePointer, null, fromHome)
  }

  /* 3. aside dual-home mirror of the same pointer */
  const mirrorPointer = `${hostHome(env)}/${POINTER}`
  if (!isAside(env)) {
    record("aside-mirror", mirrorPointer, null, {
      kind: "skipped",
      reason: "not-applicable",
    })
  } else if (mirrorPointer === homePointer) {
    record("aside-mirror", mirrorPointer, null, {
      kind: "skipped",
      reason: "already-tried",
    })
  } else {
    const fromHost = readPointer(mirrorPointer)
    if (fromHost.kind === "read") {
      if (consider("aside-mirror", mirrorPointer, fromHost.line, fromHost.line)) {
        return resolved(fromHost.line, "aside-mirror")
      }
    } else {
      record("aside-mirror", mirrorPointer, null, fromHost)
    }
  }

  /* 4. default config dirs */
  const xdg = env.XDG_CONFIG_HOME
  const jobKitConfig = xdg !== undefined && xdg !== "" ? `${xdg}/job-kit` : `${env.HOME ?? ""}/.config/job-kit`
  if (consider("job-kit-config", jobKitConfig, jobKitConfig, null)) {
    return resolved(jobKitConfig, "job-kit-config")
  }

  const hostDefault = `${hostHome(env)}/.config/job-kit`
  if (hostDefault === jobKitConfig) {
    record("host-default", hostDefault, null, {
      kind: "skipped",
      reason: "already-tried",
    })
  } else if (consider("host-default", hostDefault, hostDefault, null)) {
    return resolved(hostDefault, "host-default")
  }

  /* 5. walk the session CWD upward */
  const walked = walkUp(cwd, tried)
  record("cwd-walk", cwd, null, {
    kind: walked === null ? "probe-failed" : "passed",
  })
  if (walked !== null) return resolved(walked, "cwd-walk")

  /* 6. STOP */
  return { kind: "unresolved", attempts }
}

// One attempt for the whole walk: the interesting fact is where it started,
// not the dozen ancestors that were never going to hold a profile.
function walkUp(cwd: string, tried: Set<string>): string | null {
  let dir = cwd
  for (;;) {
    if (!tried.has(dir)) {
      tried.add(dir)
      if (probe(dir).kind === "passed") return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}
