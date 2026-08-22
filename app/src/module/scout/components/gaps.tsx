export { Gaps }

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ParseError } from "@/module/scout/types"

// A file that does not parse is named here; repair stays out of the browser —
// FSA only exposes a folder basename, which cannot bind an agent to this root.
function Gaps({ gaps }: { readonly gaps: readonly ParseError[] }) {
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
      </AlertDescription>
    </Alert>
  )
}
