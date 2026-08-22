export { StoreGate }
export type { Ready }

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConsentDialog } from "@/module/scout/components/consent-dialog"
import { PermissionEmpty } from "@/module/scout/components/permission-empty"
import { useAccess } from "@/module/scout/helpers/use-access"
import { useStore } from "@/module/scout/helpers/use-store"
import type { StoreState } from "@/module/scout/helpers/use-store"
import { assertNever } from "@/module/scout/result"
import type { Result } from "@/module/scout/result"
import type { Store, TrashOpError, Trashed } from "@/module/scout/types"

type Ready = Extract<Store, { kind: "ready" }>

type StoreActions = {
  readonly reload: () => void
  readonly trash: (files: readonly string[]) => Promise<Result<Trashed, TrashOpError>>
}

// Both Home and Dossiers open on the same ladder — access, load, fail, resolve —
// and only diverge once a ready store exists.
function StoreGate({
  title,
  Icon,
  children,
}: {
  readonly title: string
  readonly Icon: LucideIcon
  readonly children: (store: Ready, actions: StoreActions) => ReactNode
}) {
  const { state: access, pick, request, changeFolder } = useAccess()
  // Dismissing the dialog is not a dead end — the empty state reopens it.
  const [asking, setAsking] = useState(true)
  const { state, reload, trash } = useStore(access.kind === "granted")

  if (access.kind === "hydrating") {
    return (
      <Shell title={title} Icon={Icon}>
        <LoadingRows />
      </Shell>
    )
  }

  if (access.kind !== "granted") {
    return (
      <>
        <PermissionEmpty
          kind={access.kind}
          onPrimary={() => {
            if (access.kind === "prompt") void request()
            else void pick()
          }}
          {...(access.kind === "no-handle" ? { onReview: () => setAsking(true) } : {})}
        />
        <ConsentDialog
          open={access.kind === "no-handle" && asking}
          onOpenChange={setAsking}
          onAllow={() => {
            void pick()
          }}
        />
      </>
    )
  }

  return (
    <Shell title={title} Icon={Icon}>
      <Resolved state={state} reload={reload} trash={trash} onRepick={() => void changeFolder()}>
        {children}
      </Resolved>
    </Shell>
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

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, row) => (
        <Skeleton key={row} className="h-14 w-full" />
      ))}
    </div>
  )
}

function Resolved({
  state,
  reload,
  trash,
  onRepick,
  children,
}: {
  readonly state: StoreState
  readonly reload: () => void
  readonly trash: (files: readonly string[]) => Promise<Result<Trashed, TrashOpError>>
  readonly onRepick: () => void
  readonly children: (store: Ready, actions: StoreActions) => ReactNode
}) {
  switch (state.kind) {
    case "idle":
    case "loading":
      return <LoadingRows />
    case "read-failed":
      return (
        <Alert variant="destructive">
          <AlertTitle>Could not read the folder</AlertTitle>
          <AlertDescription>{state.detail}</AlertDescription>
        </Alert>
      )
    case "loaded":
      return state.store.kind === "wrong-root" ? (
        <WrongRoot label={state.store.label} missing={state.store.missing} onRepick={onRepick} />
      ) : (
        children(state.store, { reload, trash })
      )
    default:
      return assertNever(state)
  }
}

function WrongRoot({
  label,
  missing,
  onRepick,
}: {
  readonly label: string
  readonly missing: readonly string[]
  readonly onRepick: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Not a job-kit profile folder</AlertTitle>
      <AlertDescription>
        <p className="pt-1">
          <span className="font-mono text-xs">{label}</span> is missing required files:
        </p>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {missing.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="pb-3">
          Choose the profile root — the folder that contains <code>data/</code>.
        </p>
        <Button size="sm" onClick={onRepick}>
          Choose a different folder
        </Button>
      </AlertDescription>
    </Alert>
  )
}
