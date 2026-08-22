export {
  clearHandle,
  hasDirectoryPicker,
  loadHandle,
  persistHandle,
  pickDirectory,
  queryWrite,
  readJobs,
  requestWrite,
  snapshotProbe,
  trashJobs,
  type Permission,
  type PickError,
}

import { dossierName } from "@/module/scout/helpers/dossier-name"
import type { ProbeFiles } from "@/module/scout/helpers/probe"
import { err, ok, partition } from "@/module/scout/result"
import type { Result } from "@/module/scout/result"
import type { TrashFailure, TrashOpError, Trashed } from "@/module/scout/types"

const DB = "job-kit"
const STORE = "directory-handles"
const KEY = "profile-root"
const MODE = { mode: "readwrite" as const }

// Survives the tab only when IndexedDB put fails after a successful pick.
let sessionHandle: FileSystemDirectoryHandle | null = null

type PickError =
  | { readonly kind: "unsupported" }
  | { readonly kind: "aborted" }
  | { readonly kind: "insecure" }
  | { readonly kind: "failed"; readonly detail: string }

type Permission =
  { readonly kind: "granted" } | { readonly kind: "prompt" } | { readonly kind: "denied" } | { readonly kind: "stale" }

// lib.dom lacks showDirectoryPicker / queryPermission / requestPermission.
type DirectoryPickerWindow = Window & {
  showDirectoryPicker: (options?: {
    id?: string
    mode?: "read" | "readwrite"
    startIn?: "documents" | "desktop" | "downloads"
  }) => Promise<FileSystemDirectoryHandle>
}

type PermissionedHandle = FileSystemDirectoryHandle & {
  queryPermission: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>
  requestPermission: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>
}

type MovableHandle = FileSystemFileHandle & {
  move: (parent: FileSystemDirectoryHandle, name?: string) => Promise<void>
}

function hasDirectoryPicker(w: Window): boolean {
  return w.isSecureContext && typeof (w as DirectoryPickerWindow).showDirectoryPicker === "function"
}

async function pickDirectory(): Promise<Result<FileSystemDirectoryHandle, PickError>> {
  if (!window.isSecureContext) return err({ kind: "insecure" })
  if (!hasDirectoryPicker(window)) return err({ kind: "unsupported" })
  try {
    const handle = await (window as unknown as DirectoryPickerWindow).showDirectoryPicker({
      id: "job-kit-profile",
      mode: "readwrite",
      startIn: "documents",
    })
    return ok(handle)
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return err({ kind: "aborted" })
    return err({ kind: "failed", detail: error instanceof Error ? error.message : String(error) })
  }
}

async function queryWrite(handle: FileSystemDirectoryHandle): Promise<Permission> {
  try {
    return mapPermission(await (handle as PermissionedHandle).queryPermission(MODE))
  } catch (error) {
    return isNotFound(error) ? { kind: "stale" } : { kind: "denied" }
  }
}

async function requestWrite(handle: FileSystemDirectoryHandle): Promise<Permission> {
  try {
    return mapPermission(await (handle as PermissionedHandle).requestPermission(MODE))
  } catch (error) {
    return isNotFound(error) ? { kind: "stale" } : { kind: "denied" }
  }
}

const mapPermission = (state: PermissionState): Permission => {
  if (state === "granted") return { kind: "granted" }
  if (state === "denied") return { kind: "denied" }
  return { kind: "prompt" }
}

const isNotFound = (error: unknown): boolean => error instanceof DOMException && error.name === "NotFoundError"

const isNotAllowed = (error: unknown): boolean => error instanceof DOMException && error.name === "NotAllowedError"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("indexedDB open failed"))
  })
}

async function persistHandle(handle: FileSystemDirectoryHandle): Promise<Result<void, string>> {
  sessionHandle = handle
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).put(handle, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB put failed"))
    })
    db.close()
    return ok(undefined)
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error))
  }
}

async function loadHandle(): Promise<Result<FileSystemDirectoryHandle | null, string>> {
  if (sessionHandle !== null) return ok(sessionHandle)
  try {
    const db = await openDb()
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const request = tx.objectStore(STORE).get(KEY)
      request.onsuccess = () => {
        const value = request.result
        resolve(value instanceof FileSystemDirectoryHandle ? value : null)
      }
      request.onerror = () => reject(request.error ?? new Error("indexedDB get failed"))
    })
    db.close()
    if (handle !== null) sessionHandle = handle
    return ok(handle)
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error))
  }
}

async function clearHandle(): Promise<Result<void, string>> {
  sessionHandle = null
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB delete failed"))
    })
    db.close()
    return ok(undefined)
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error))
  }
}

async function snapshotProbe(root: FileSystemDirectoryHandle): Promise<ProbeFiles> {
  let data: FileSystemDirectoryHandle
  try {
    data = await root.getDirectoryHandle("data")
  } catch {
    return { candidate: false, jobSearch: false }
  }
  const candidate = await data.getFileHandle("candidate.yaml").then(
    () => true,
    () => false
  )
  const jobSearch = await data.getFileHandle("job_search.yaml").then(
    () => true,
    () => false
  )
  return { candidate, jobSearch }
}

async function readJobs(
  root: FileSystemDirectoryHandle
): Promise<Result<readonly { readonly file: string; readonly raw: string }[], string>> {
  let jobs: FileSystemDirectoryHandle
  try {
    const scout = await root.getDirectoryHandle("scout")
    jobs = await scout.getDirectoryHandle("jobs")
  } catch (error) {
    if (isNotFound(error)) return ok([])
    return err(error instanceof Error ? error.message : String(error))
  }

  try {
    const names: string[] = []
    for await (const [name, entry] of jobs.entries()) {
      if (entry.kind === "file" && name.endsWith(".md")) names.push(name)
    }
    names.sort()
    const files = await Promise.all(
      names.map(async (file) => {
        const handle = await jobs.getFileHandle(file)
        const raw = await (await handle.getFile()).text()
        return { file, raw }
      })
    )
    return ok(files)
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error))
  }
}

async function trashJobs(
  root: FileSystemDirectoryHandle,
  files: readonly string[]
): Promise<Result<Trashed, TrashOpError>> {
  let jobs: FileSystemDirectoryHandle
  try {
    const scout = await root.getDirectoryHandle("scout")
    jobs = await scout.getDirectoryHandle("jobs")
  } catch (error) {
    if (isNotFound(error)) return err({ kind: "jobs-missing" })
    if (isNotAllowed(error)) return err({ kind: "not-allowed" })
    return err({ kind: "failed", detail: error instanceof Error ? error.message : String(error) })
  }

  let trash: FileSystemDirectoryHandle
  try {
    trash = await jobs.getDirectoryHandle(".trash", { create: true })
  } catch (error) {
    if (isNotAllowed(error)) return err({ kind: "not-allowed" })
    if (isNotFound(error)) return err({ kind: "stale" })
    return err({ kind: "failed", detail: error instanceof Error ? error.message : String(error) })
  }

  const results = await Promise.all(files.map((file) => moveOne(jobs, trash, file)))
  const { values, errors } = partition(results)
  return ok({ moved: values, failed: errors })
}

async function moveOne(
  jobs: FileSystemDirectoryHandle,
  trash: FileSystemDirectoryHandle,
  file: string
): Promise<Result<string, TrashFailure>> {
  const confined = dossierName(file)
  if (confined.kind === "err") return confined

  try {
    const source = await jobs.getFileHandle(file)
    const target = await freeName(trash, file)
    if (typeof (source as MovableHandle).move === "function") {
      await (source as MovableHandle).move(trash, target)
      return ok(file)
    }
    const blob = await (await source.getFile()).arrayBuffer()
    const dest = await trash.getFileHandle(target, { create: true })
    const writable = await dest.createWritable()
    await writable.write(blob)
    await writable.close()
    await jobs.removeEntry(file)
    return ok(file)
  } catch (error) {
    return err({ file, reason: error instanceof Error ? error.message : String(error) })
  }
}

async function freeName(trash: FileSystemDirectoryHandle, file: string): Promise<string> {
  try {
    await trash.getFileHandle(file)
    return `${file.slice(0, -".md".length)}-${Date.now()}.md`
  } catch {
    return file
  }
}
