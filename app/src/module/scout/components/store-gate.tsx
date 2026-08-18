export { StoreGate }
export type { Ready }

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ConsentDialog } from "@/module/scout/components/consent-dialog"
import { PermissionEmpty } from "@/module/scout/components/permission-empty"
import { useConsent } from "@/module/scout/helpers/use-consent"
import { useStore } from "@/module/scout/helpers/use-store"
import type { StoreState } from "@/module/scout/helpers/use-store"
import { assertNever } from "@/module/scout/result"
import type { Attempt, Store } from "@/module/scout/types"

type Ready = Extract<Store, { kind: "ready" }>

// Both Home and Dossiers open on the same ladder — ask, load, fail, resolve —
// and only diverge once a ready store exists.
function StoreGate({
  title,
  Icon,
  children,
}: {
  readonly title: string
  readonly Icon: LucideIcon
  readonly children: (store: Ready, reload: () => void) => ReactNode
}) {
  const { granted, grant } = useConsent()
  // Dismissing the dialog is not a dead end — the empty state reopens it.
  const [asking, setAsking] = useState(true)
  const { state, reload } = useStore(granted)

  return (
    <>
      {state.kind === "idle" ? (
        <PermissionEmpty onAllow={grant} onReview={() => setAsking(true)} />
      ) : (
        <Shell title={title} Icon={Icon}>
          <Resolved state={state} reload={reload}>
            {children}
          </Resolved>
        </Shell>
      )}

      <ConsentDialog open={!granted && asking} onOpenChange={setAsking} onAllow={grant} />
    </>
  )
}

function Shell({
  title,
  Icon,
  children,
}: {
  readonly title: string
  readonly Icon: LucideIcon
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6">
      <h1 className="flex items-center gap-2 text-xl font-medium">
        <Icon className="size-5" aria-hidden="true" />
        {title}
      </h1>
      {children}
    </div>
  )
}

function Resolved({
  state,
  reload,
  children,
}: {
  readonly state: Exclude<StoreState, { kind: "idle" }>
  readonly reload: () => void
  readonly children: (store: Ready, reload: () => void) => ReactNode
}) {
  switch (state.kind) {
    case "loading":
      return (
        <div className="space-y-3">
          {Array.from({ length: 8 }, (_, row) => (
            <Skeleton key={row} className="h-14 w-full" />
          ))}
        </div>
      )
    case "failed":
      return (
        <Alert variant="destructive">
          <AlertTitle>Could not reach the store</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )
    case "loaded":
      return state.store.kind === "unresolved" ? (
        <Unresolved attempts={state.store.attempts} />
      ) : (
        children(state.store, reload)
      )
    default:
      return assertNever(state)
  }
}

// The skills require every attempt be named on STOP, then a handoff to
// job-profile-init. This is that report, not a generic error.
function Unresolved({ attempts }: { readonly attempts: readonly Attempt[] }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>No profile root resolved</AlertTitle>
      <AlertDescription>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {attempts.map((attempt) => (
            <li key={`${attempt.source}:${attempt.path ?? ""}`}>
              {attempt.source} · {attempt.path ?? "—"} · {attempt.outcome.kind}
              {attempt.line === null ? "" : ` · line "${attempt.line}"`}
            </li>
          ))}
        </ul>
        Create one with <code>job-profile-init</code>, or register an existing profile with Activate = Yes.
      </AlertDescription>
    </Alert>
  )
}
