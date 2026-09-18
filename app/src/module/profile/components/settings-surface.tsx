export { SettingsSurface }

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { describeSaveError } from "@/module/profile/helpers/describe-save-error"
import type { Save } from "@/module/profile/helpers/use-profile"
import type { Edit } from "@/module/profile/helpers/write-profile"
import type { Basics, JobSearch, Language, Profile, SearchPack, SocialProfile, Toggle } from "@/module/profile/types"

type Path = readonly (string | number)[]

const toLines = (values: readonly string[]): string => values.join("\n")

// A blank line is spacing the user typed, not a list entry, so it never reaches
// the file.
const fromLines = (text: string): readonly string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")

const sameList = (next: readonly string[], before: readonly string[]): boolean =>
  next.length === before.length && next.every((value, index) => value === before[index])

// An edit is emitted only for a field the user actually moved, so a save
// rewrites those scalars and leaves every other line of the file as it was.
const changed = (path: Path, next: string, before: string): readonly Edit[] =>
  next === before ? [] : [{ op: "set", path, value: next }]

const humanize = (key: string): string => key.replace(/_/g, " ").replace(/^./, (first) => first.toUpperCase())

// Each card owns its own save: one file, one in-flight guard. Saving Identity's
// basics never writes profiles.yaml, so a failure is scoped to the card that
// caused it.
function useCardSave(
  file: string,
  save: Save
): { readonly busy: boolean; readonly submit: (edits: readonly Edit[]) => void } {
  const [busy, setBusy] = useState(false)

  const submit = (edits: readonly Edit[]): void => {
    setBusy(true)
    void save(file, edits).then((result) => {
      setBusy(false)
      if (result.kind === "err") toast.error(describeSaveError(result.error))
      else toast.success(`Saved data/${file}`)
    })
  }

  return { busy, submit }
}

function SaveButton({
  busy,
  edits,
  onSubmit,
}: {
  readonly busy: boolean
  readonly edits: readonly Edit[]
  readonly onSubmit: (edits: readonly Edit[]) => void
}) {
  return (
    <Button size="sm" disabled={busy || edits.length === 0} onClick={() => onSubmit(edits)}>
      {busy ? "Saving…" : "Save"}
    </Button>
  )
}

function TextField({
  id,
  label,
  value,
  hint,
  onValueChange,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly hint?: string | undefined
  readonly onValueChange: (next: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} onChange={(event) => onValueChange(event.target.value)} />
      {hint !== undefined && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

function ListField({
  id,
  label,
  value,
  hint,
  onValueChange,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly hint?: string | undefined
  readonly onValueChange: (next: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea id={id} value={value} rows={4} onChange={(event) => onValueChange(event.target.value)} />
      <FieldDescription>{hint === undefined ? "One entry per line." : `${hint} One entry per line.`}</FieldDescription>
    </Field>
  )
}

function ToggleField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  readonly id: string
  readonly label: string
  readonly checked: boolean
  readonly onCheckedChange: (next: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} checked={checked} onCheckedChange={(next: boolean) => onCheckedChange(next)} />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      </FieldContent>
    </Field>
  )
}

type BasicsRow = {
  readonly field: keyof Basics
  readonly label: string
  readonly path: Path
  readonly hint?: string
}

const BASICS_ROWS: readonly BasicsRow[] = [
  { field: "name", label: "Name", path: ["name"], hint: "First and last split at the first space." },
  { field: "email", label: "Email", path: ["email"] },
  { field: "phone", label: "Phone", path: ["phone"] },
  { field: "location", label: "Location", path: ["location"], hint: "City, region, country as printed." },
  { field: "country", label: "Country", path: ["country"], hint: "Country of residence as a form lists it." },
  { field: "urlLabel", label: "Site label", path: ["url", "label"] },
  { field: "urlHref", label: "Site URL", path: ["url", "href"] },
]

function BasicsCard({ basics, save }: { readonly basics: Basics; readonly save: Save }) {
  const [draft, setDraft] = useState(basics)
  const { busy, submit } = useCardSave("basics.yaml", save)

  const setField = (field: keyof Basics, value: string): void =>
    setDraft((current): Basics => ({ ...current, [field]: value }))

  const edits = BASICS_ROWS.flatMap<Edit>((row) => changed(row.path, draft[row.field], basics[row.field]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity — data/basics.yaml</CardTitle>
        <CardDescription>Contact facts job-apply fills forms from.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {BASICS_ROWS.map((row) => (
            <TextField
              key={row.field}
              id={`basics-${row.field}`}
              label={row.label}
              value={draft[row.field]}
              hint={row.hint}
              onValueChange={(next) => setField(row.field, next)}
            />
          ))}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <SaveButton busy={busy} edits={edits} onSubmit={submit} />
      </CardFooter>
    </Card>
  )
}

function SocialsCard({ socials, save }: { readonly socials: readonly SocialProfile[]; readonly save: Save }) {
  const [draft, setDraft] = useState(socials)
  const { busy, submit } = useCardSave("profiles.yaml", save)

  const setRow = (position: number, field: "network" | "username" | "url", value: string): void =>
    setDraft((current) =>
      current.map((row, index): SocialProfile => (index === position ? { ...row, [field]: value } : row))
    )

  // `row.id` is the row's place in the file, which is what an edit path
  // addresses; username-less rows were dropped before this list was built.
  const edits = draft.flatMap<Edit>((row, position) => {
    const before = socials[position]
    if (before === undefined) return []
    const index = Number(row.id)
    return [
      ...changed(["profiles", index, row.key], row.network, before.network),
      ...changed(["profiles", index, "username"], row.username, before.username),
      ...changed(["profiles", index, "url"], row.url, before.url),
    ]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social profiles — data/profiles.yaml</CardTitle>
        <CardDescription>A network with an empty username is not a link, so it is not listed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {draft.map((row, position) => (
            <FieldSet key={row.id}>
              <FieldLegend variant="label">{row.network === "" ? `Profile ${row.id}` : row.network}</FieldLegend>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  id={`social-${row.id}-network`}
                  label="Network"
                  value={row.network}
                  onValueChange={(next) => setRow(position, "network", next)}
                />
                <TextField
                  id={`social-${row.id}-username`}
                  label="Username"
                  value={row.username}
                  onValueChange={(next) => setRow(position, "username", next)}
                />
                <TextField
                  id={`social-${row.id}-url`}
                  label="URL"
                  value={row.url}
                  onValueChange={(next) => setRow(position, "url", next)}
                />
              </div>
            </FieldSet>
          ))}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <SaveButton busy={busy} edits={edits} onSubmit={submit} />
      </CardFooter>
    </Card>
  )
}

function LanguagesCard({ languages, save }: { readonly languages: readonly Language[]; readonly save: Save }) {
  const [draft, setDraft] = useState(languages)
  const { busy, submit } = useCardSave("languages.yaml", save)

  const setRow = (position: number, field: "name" | "level", value: string): void =>
    setDraft((current) =>
      current.map((row, index): Language => (index === position ? { ...row, [field]: value } : row))
    )

  const edits = draft.flatMap<Edit>((row, position) => {
    const before = languages[position]
    if (before === undefined) return []
    const index = Number(row.id)
    return [
      ...changed(["languages", index, "name"], row.name, before.name),
      ...changed(["languages", index, "level"], row.level, before.level),
    ]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages — data/languages.yaml</CardTitle>
        <CardDescription>Level is carried to forms verbatim.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {draft.map((row, position) => (
            <div key={row.id} className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`language-${row.id}-name`}
                label="Language"
                value={row.name}
                onValueChange={(next) => setRow(position, "name", next)}
              />
              <TextField
                id={`language-${row.id}-level`}
                label="Level"
                value={row.level}
                onValueChange={(next) => setRow(position, "level", next)}
              />
            </div>
          ))}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <SaveButton busy={busy} edits={edits} onSubmit={submit} />
      </CardFooter>
    </Card>
  )
}

type ToggleGroupName = "workModel" | "jobTypes" | "datePosted"

const TOGGLE_GROUPS: readonly {
  readonly field: ToggleGroupName
  readonly label: string
  readonly key: string
  // date_posted carries exactly one window: leaving a previous one on means
  // scout reads the widest of the two and the narrower one has no effect.
  readonly single?: boolean
  readonly hint?: string
}[] = [
  { field: "workModel", label: "Work model", key: "work_model" },
  { field: "jobTypes", label: "Job types", key: "job_types" },
  { field: "datePosted", label: "Date posted", key: "date_posted", single: true, hint: "One window." },
]

const SINGLE_GROUPS: ReadonlySet<ToggleGroupName> = new Set(
  TOGGLE_GROUPS.filter((group) => group.single === true).map((group) => group.field)
)

type ListName =
  "positions" | "locations" | "excludeLocations" | "excludeCompanies" | "directRegions" | "marketCurrencies"

const LIST_ROWS: readonly {
  readonly field: ListName
  readonly label: string
  readonly path: Path
  readonly hint: string
}[] = [
  { field: "positions", label: "Positions", path: ["positions"], hint: "Title strings, in file order." },
  { field: "locations", label: "Locations", path: ["locations"], hint: "Named places, used when scope is listed." },
  {
    field: "excludeLocations",
    label: "Exclude locations",
    path: ["exclude_locations"],
    hint: "Hire-from countries to drop; empty drops none.",
  },
  {
    field: "excludeCompanies",
    label: "Exclude companies",
    path: ["exclude_companies"],
    hint: "Dropped at search and gate, slug-compared.",
  },
  {
    field: "directRegions",
    label: "Direct regions",
    path: ["direct_regions"],
    hint: "Hire-from tokens that count as direct.",
  },
  {
    field: "marketCurrencies",
    label: "Market currencies",
    path: ["market_currencies"],
    hint: "Salary currencies the gate keeps.",
  },
]

function JobSearchCard({ jobSearch, save }: { readonly jobSearch: JobSearch; readonly save: Save }) {
  const { busy, submit } = useCardSave("job_search.yaml", save)
  const [toggles, setToggles] = useState<Readonly<Record<ToggleGroupName, readonly Toggle[]>>>({
    workModel: jobSearch.workModel,
    jobTypes: jobSearch.jobTypes,
    datePosted: jobSearch.datePosted,
  })
  const [lists, setLists] = useState<Readonly<Record<ListName, string>>>({
    positions: toLines(jobSearch.positions),
    locations: toLines(jobSearch.locations),
    excludeLocations: toLines(jobSearch.excludeLocations),
    excludeCompanies: toLines(jobSearch.excludeCompanies),
    directRegions: toLines(jobSearch.directRegions),
    marketCurrencies: toLines(jobSearch.marketCurrencies),
  })
  const [scope, setScope] = useState(jobSearch.locationScope)
  const [pruneText, setPruneText] = useState(String(jobSearch.pruneScoreMax))

  const prune = Number(pruneText)
  const pruneValid = pruneText.trim() !== "" && Number.isFinite(prune)

  // Turning one row on in a single-select group turns the rest off, so the file
  // never carries two windows at once.
  const setToggle = (field: ToggleGroupName, key: string, on: boolean): void =>
    setToggles((current) => ({
      ...current,
      [field]: current[field].map((row): Toggle => {
        if (row.key === key) return { key, on }
        return on && SINGLE_GROUPS.has(field) ? { key: row.key, on: false } : row
      }),
    }))

  const setList = (field: ListName, value: string): void =>
    setLists((current): Record<ListName, string> => ({ ...current, [field]: value }))

  const toggleEdits = TOGGLE_GROUPS.flatMap<Edit>((group) =>
    toggles[group.field].flatMap<Edit>((row, index) => {
      const before = jobSearch[group.field][index]
      if (before === undefined || before.on === row.on) return []
      return [{ op: "set", path: [group.key, row.key], value: row.on }]
    })
  )

  const listEdits = LIST_ROWS.flatMap<Edit>((row) => {
    const next = fromLines(lists[row.field])
    return sameList(next, jobSearch[row.field]) ? [] : [{ op: "set", path: row.path, value: [...next] }]
  })

  const edits: readonly Edit[] = [
    ...toggleEdits,
    ...listEdits,
    ...changed(["location_scope"], scope, jobSearch.locationScope),
    // prune_score_max is a number in the file; a string here would retype the key.
    ...(pruneValid && prune !== jobSearch.pruneScoreMax
      ? [{ op: "set" as const, path: ["prune_score_max"], value: prune }]
      : []),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search constraints — data/job_search.yaml</CardTitle>
        <CardDescription>What scout searches for, and what it drops.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {TOGGLE_GROUPS.map((group) => (
            <FieldSet key={group.field}>
              <FieldLegend variant="label">{group.label}</FieldLegend>
              {group.hint !== undefined && <FieldDescription>{group.hint}</FieldDescription>}
              {toggles[group.field].map((row) => (
                <ToggleField
                  key={row.key}
                  id={`job-search-${group.key}-${row.key}`}
                  label={humanize(row.key)}
                  checked={row.on}
                  onCheckedChange={(next) => setToggle(group.field, row.key, next)}
                />
              ))}
            </FieldSet>
          ))}

          {LIST_ROWS.map((row) => (
            <ListField
              key={row.field}
              id={`job-search-${row.field}`}
              label={row.label}
              value={lists[row.field]}
              hint={row.hint}
              onValueChange={(next) => setList(row.field, next)}
            />
          ))}

          <TextField
            id="job-search-location-scope"
            label="Location scope"
            value={scope}
            hint="worldwide, or listed to use the locations above."
            onValueChange={setScope}
          />

          <Field>
            <FieldLabel htmlFor="job-search-prune-score-max">Prune score max</FieldLabel>
            <Input
              id="job-search-prune-score-max"
              type="number"
              inputMode="numeric"
              value={pruneText}
              aria-invalid={!pruneValid}
              onChange={(event) => setPruneText(event.target.value)}
            />
            {pruneValid ? (
              <FieldDescription>The job-prune threshold; scout itself ignores it.</FieldDescription>
            ) : (
              <FieldError>Enter a number.</FieldError>
            )}
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <SaveButton busy={busy} edits={edits} onSubmit={submit} />
      </CardFooter>
    </Card>
  )
}

type PackDraft = { readonly enabled: boolean; readonly formulations: string }

function PacksCard({ packs, save }: { readonly packs: readonly SearchPack[]; readonly save: Save }) {
  const { busy, submit } = useCardSave("search_packs.yaml", save)
  const [draft, setDraft] = useState<readonly PackDraft[]>(() =>
    packs.map((pack) => ({ enabled: pack.enabled, formulations: toLines(pack.formulations) }))
  )

  const setRow = (position: number, patch: PackDraft): void =>
    setDraft((current) => current.map((row, index) => (index === position ? patch : row)))

  // `pack.index` is the row's position in the file, not its position on screen:
  // id-less rows are dropped from this list but still occupy a slot in the YAML.
  const edits = packs.flatMap<Edit>((pack, position) => {
    const row = draft[position]
    if (row === undefined) return []
    const formulations = fromLines(row.formulations)
    return [
      ...(row.enabled === pack.enabled
        ? []
        : [{ op: "set" as const, path: ["packs", pack.index, "enabled"], value: row.enabled }]),
      ...(sameList(formulations, pack.formulations)
        ? []
        : [{ op: "set" as const, path: ["packs", pack.index, "formulations"], value: [...formulations] }]),
    ]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search packs — data/search_packs.yaml</CardTitle>
        <CardDescription>
          One pack is one site × one intent. Disabled packs stay in the file, out of the run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {packs.map((pack, position) => {
            const row = draft[position]
            if (row === undefined) return null
            return (
              <FieldSet key={pack.id}>
                <FieldLegend variant="label">{pack.id}</FieldLegend>
                <ToggleField
                  id={`pack-${pack.id}-enabled`}
                  label="Enabled"
                  checked={row.enabled}
                  onCheckedChange={(next) => setRow(position, { ...row, enabled: next })}
                />
                <ListField
                  id={`pack-${pack.id}-formulations`}
                  label="Formulations"
                  value={row.formulations}
                  hint={`${pack.surface}. [role] expands from positions.`}
                  onValueChange={(next) => setRow(position, { ...row, formulations: next })}
                />
              </FieldSet>
            )
          })}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <SaveButton busy={busy} edits={edits} onSubmit={submit} />
      </CardFooter>
    </Card>
  )
}

// A card's draft is seeded from props once, at mount. Keying each card on its
// file's read stamp remounts exactly the card whose file the save rewrote, so
// it re-seeds from the reloaded profile while an unsaved card beside it keeps
// the edits in progress.
function SettingsSurface({ profile, save }: { readonly profile: Profile; readonly save: Save }) {
  const stampOf = (file: string): number => profile.stamps[file] ?? 0

  return (
    <Tabs defaultValue="identity">
      <TabsList>
        <TabsTrigger value="identity">Identity</TabsTrigger>
        <TabsTrigger value="search">Search</TabsTrigger>
      </TabsList>

      <TabsContent value="identity" className="flex flex-col gap-4 pt-2">
        <BasicsCard key={stampOf("basics.yaml")} basics={profile.basics} save={save} />
        <SocialsCard key={stampOf("profiles.yaml")} socials={profile.socials} save={save} />
        <LanguagesCard key={stampOf("languages.yaml")} languages={profile.languages} save={save} />
      </TabsContent>

      <TabsContent value="search" className="flex flex-col gap-4 pt-2">
        <JobSearchCard key={stampOf("job_search.yaml")} jobSearch={profile.jobSearch} save={save} />
        <PacksCard key={stampOf("search_packs.yaml")} packs={profile.packs} save={save} />
      </TabsContent>
    </Tabs>
  )
}
