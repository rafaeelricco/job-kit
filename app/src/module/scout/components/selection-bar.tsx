export { SelectionBar, type SelectionBarProps }

import { DownloadIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { HoldButton } from "@/components/ui/hold-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { download, toCsv, toJson, toMarkdown } from "@/module/scout/helpers/export"
import type { Dossier } from "@/module/scout/types"

type SelectionBarProps = {
  readonly rows: readonly Dossier[]
  readonly onDelete: () => void
  readonly onClear: () => void
}

const DELETE_HINT = "Hold to move these files into scout/jobs/.trash — recoverable with mv"

function SelectionBar(props: SelectionBarProps) {
  const { onClear, onDelete, rows } = props
  const count = rows.length

  if (count === 0) return null

  const noun = count === 1 ? "dossier" : "dossiers"

  const exportAs = (extension: string, mime: string, body: string) => {
    download(`dossiers-${count}.${extension}`, mime, body)
    toast.success(`Exported ${count} ${noun}`)
  }

  return (
    <div className="sticky bottom-4 z-40 mx-auto flex w-fit flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <span className="text-sm font-medium">{count.toLocaleString()} selected</span>

      <Separator orientation="vertical" className="my-auto h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <DownloadIcon />
          Export
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-44">
          {/* Base UI requires a label to sit inside a group. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Export {noun}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportAs("csv", "text/csv", toCsv(rows))}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportAs("json", "application/json", toJson(rows))}>JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportAs("md", "text/markdown", toMarkdown(rows))}>
              Markdown
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <HoldButton variant="destructive" size="sm" onHold={onDelete} title={DELETE_HINT} aria-label={DELETE_HINT}>
        <Trash2Icon />
        Hold to delete
      </HoldButton>

      <Button variant="ghost" size="icon-sm" onClick={onClear} title="Clear selection" aria-label="Clear selection">
        <XIcon />
      </Button>
    </div>
  )
}
