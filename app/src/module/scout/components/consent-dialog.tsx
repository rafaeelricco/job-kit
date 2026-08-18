export { ConsentDialog, type ConsentDialogProps }

import { FilesIcon, HardDriveIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConsentDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onAllow: () => void
}

const NOTES = [
  {
    lead: "You're in control",
    body: "This page reads, and sends nothing anywhere. The one thing it changes is a dossier you delete by hand — that file moves to scout/jobs/.trash rather than being erased.",
  },
  {
    lead: "What gets read",
    body: "The profile root resolved from $PROFILE_ROOT, ~/.config/profile-root, or ~/.config/job-kit — then every dossier under scout/jobs.",
  },
  {
    lead: "Where it stays",
    body: "The dev server reads those files from this machine and hands them to this tab. Your answer is remembered in this browser only.",
  },
] as const

function ConsentDialog(props: ConsentDialogProps) {
  const { onAllow, onOpenChange, open } = props

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto p-4 sm:max-w-100"
      >
        <div>
          <div className="flex justify-end">
            <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
                <HardDriveIcon className="size-6" />
              </span>
              <span className="flex gap-1" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-border" />
                <span className="size-1.5 rounded-full bg-border" />
                <span className="size-1.5 rounded-full bg-border" />
              </span>
              <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
                <FilesIcon className="size-6" />
              </span>
            </div>

            <DialogHeader className="items-center gap-0">
              <DialogTitle className="pt-3 text-center text-xl font-semibold">Read your job-kit profile</DialogTitle>
              <DialogDescription className="pt-1 text-center">Nothing is read until you allow it.</DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-2">
          {NOTES.map((note) => (
            <div key={note.lead} className="flex flex-col gap-1 border-b py-2.5 last:border-b-0">
              <div className="text-sm font-medium">{note.lead}</div>
              <div className="text-xs text-muted-foreground">{note.body}</div>
            </div>
          ))}
        </div>

        <Button size="lg" onClick={onAllow} className="h-11 w-full rounded-full">
          Allow and load dossiers
        </Button>
      </DialogContent>
    </Dialog>
  )
}
