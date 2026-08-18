export { Gaps }

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CopyButton } from "@/components/ui/copy"
import { toFixPrompt } from "@/module/scout/helpers/fix-prompt"
import type { ParseError } from "@/module/scout/types"

// A file that does not parse is named, never repaired here — the button hands
// the repair off with every cause spelled out.
function Gaps({ gaps, root }: { readonly gaps: readonly ParseError[]; readonly root: string }) {
  if (gaps.length === 0) return null

  return (
    <Alert>
      <AlertTitle>{gaps.length.toLocaleString()} files did not parse</AlertTitle>
      <AlertDescription>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {gaps.map((gap) => (
            <li key={gap.file}>
              {gap.file} · {gap.cause.kind} at {gap.at}
            </li>
          ))}
        </ul>
        <CopyButton value={() => toFixPrompt(root, gaps)} label="Copy fix prompt" />
      </AlertDescription>
    </Alert>
  )
}
