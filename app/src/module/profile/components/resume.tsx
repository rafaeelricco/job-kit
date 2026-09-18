export { ResumeList }

import { useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { loadHandle } from "@/module/access/handle"
import { describeSaveError } from "@/module/profile/helpers/describe-save-error"
import type { Save } from "@/module/profile/helpers/use-profile"
import type { Resume } from "@/module/profile/types"

const KB = 1024

const sizeText = (bytes: number): string => (bytes < KB ? `${String(bytes)} B` : `${String(Math.round(bytes / KB))} KB`)

// A file:// path is not linkable from the browser, so Open builds a blob URL
// from the handle's File and revokes the previous one on the next open.
function ResumeList({
  resumes,
  adaptPerVacancy,
  save,
}: {
  readonly resumes: readonly Resume[]
  readonly adaptPerVacancy: boolean
  readonly save: Save
}) {
  const opened = useRef<string | null>(null)
  const [busy, setBusy] = useState(false)

  // cvs.yaml is the profile's, so the toggle commits on change rather than
  // collecting a draft: one switch has nothing to batch with. A successful save
  // re-reads the file, so adaptPerVacancy stays the source of truth.
  const setAdapt = (next: boolean) => {
    setBusy(true)
    void save("cvs.yaml", [{ op: "set", path: ["adapt_per_vacancy"], value: next }]).then((result) => {
      setBusy(false)
      if (result.kind === "err") toast.error(describeSaveError(result.error))
      else toast.success(`Per-vacancy tailoring ${next ? "on" : "off"}`)
    })
  }

  // The directory handle is read at click time rather than held in state: the
  // click is the only moment the File is needed.
  const open = (file: string) => {
    void (async () => {
      const loaded = await loadHandle()
      if (loaded.kind === "err" || loaded.value === null) {
        toast.error("Saved folder is gone — choose it again")
        return
      }
      try {
        const cv = await loaded.value.getDirectoryHandle("cv")
        const blob = await (await cv.getFileHandle(file)).getFile()
        if (opened.current !== null) URL.revokeObjectURL(opened.current)
        const url = URL.createObjectURL(blob)
        opened.current = url
        window.open(url, "_blank", "noopener,noreferrer")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error))
      }
    })()
  }

  return (
    <>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="adapt-per-vacancy">Per-vacancy tailoring</FieldLabel>
          <FieldDescription>
            {adaptPerVacancy
              ? "job-apply refines the base resume for each dossier."
              : "job-apply attaches the base resume unchanged."}
          </FieldDescription>
        </FieldContent>
        <Switch id="adapt-per-vacancy" checked={adaptPerVacancy} disabled={busy} onCheckedChange={setAdapt} />
      </Field>

      {resumes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground">No PDFs in cv/</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop a resume PDF into the profile folder's <code>cv/</code> directory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
          {resumes.map((resume) => (
            <Card key={resume.file}>
              <CardHeader className="gap-x-3">
                <CardTitle className="min-w-0 truncate text-foreground">
                  {resume.file.slice(0, -".pdf".length)}
                </CardTitle>
                <CardAction>
                  <Button size="sm" variant="outline" onClick={() => open(resume.file)}>
                    Open
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-1.5">
                  {resume.active && <Badge>Active</Badge>}
                  {resume.source !== null && <Badge variant="outline">LaTeX</Badge>}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {sizeText(resume.bytes)} · {resume.modified}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
