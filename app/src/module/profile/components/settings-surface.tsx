// eslint-disable-next-line react-refresh/only-export-components -- the dialog reads the panel registry and its parser from the module that renders them, so the two can never drift apart.
export { PANELS, PANEL_ORDER, SettingsPanel, parsePanel }
export type { PanelId }

import {
  ComputerIcon,
  Copy01Icon,
  FilterIcon,
  Layers01Icon,
  Link02Icon,
  Location01Icon,
  Moon02Icon,
  SearchList01Icon,
  Sun01Icon,
  Tick02Icon,
  TranslateIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useTheme } from "@components/ui/theme-provider"
import type { Theme } from "@components/ui/theme-provider"
import { Button } from "@ui/button"
import { Checkbox } from "@ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@ui/field"
import { Input } from "@ui/input"
import { Label } from "@ui/label"
import { Textarea } from "@ui/textarea"
import { cn } from "@lib/utils"
import { describeSaveError } from "@module/profile/helpers/describe-save-error"
import type { Save } from "@module/profile/helpers/use-profile"
import type { Edit } from "@module/profile/helpers/write-profile"
import type { Basics, JobSearch, Language, Profile, SearchPack, SocialProfile, Toggle } from "@module/profile/types"
import { assertNever } from "@module/scout/result"

type PanelId = "profile" | "basics" | "profiles" | "languages" | "search" | "filters" | "packs"

// One section per YAML file, except basics.yaml (identity facts vs. contact
// facts) and job_search.yaml (what scout looks for vs. what it drops). Both
// halves write disjoint keys and only one panel is ever mounted, so two forms
// on one file never race. `file` is the caption the dialog header prints.
const PANELS: Readonly<
  Record<PanelId, { readonly label: string; readonly file: string | null; readonly Icon: IconSvgElement }>
> = {
  profile: { label: "Profile", file: "basics.yaml", Icon: UserIcon },
  basics: { label: "Basics", file: "basics.yaml", Icon: Location01Icon },
  profiles: { label: "Profiles", file: "profiles.yaml", Icon: Link02Icon },
  languages: { label: "Languages", file: "languages.yaml", Icon: TranslateIcon },
  search: { label: "Search", file: "job_search.yaml", Icon: SearchList01Icon },
  filters: { label: "Filters", file: "job_search.yaml", Icon: FilterIcon },
  packs: { label: "Packs", file: "search_packs.yaml", Icon: Layers01Icon },
}

const PANEL_ORDER: readonly PanelId[] = ["profile", "basics", "profiles", "languages", "search", "filters", "packs"]

const isPanelId = (value: string): value is PanelId => Object.hasOwn(PANELS, value)

// An unknown or empty value is a bare `?settings`, not an error: it opens the
// first panel rather than blanking the dialog.
const parsePanel = (value: string): PanelId => (isPanelId(value) ? value : "profile")

const THEMES = [
  { value: "light", label: "Light", Icon: Sun01Icon },
  { value: "dark", label: "Dark", Icon: Moon02Icon },
  { value: "system", label: "System", Icon: ComputerIcon },
] as const

type Path = readonly (string | number)[]

// Measured off the console: 12px labels at 65% ink, 11px hints at 35%. Our
// Label is 14px/medium and FieldDescription 14px, so both need the override.
const LABEL = "text-xs leading-none font-normal text-ink-soft"
const HINT = "text-[11px] leading-normal text-ink-faint"

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
  onReset,
}: {
  readonly busy: boolean
  readonly edits: readonly Edit[]
  readonly onSubmit: (edits: readonly Edit[]) => void
  readonly onReset: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm" className="h-8 px-3" disabled={busy || edits.length === 0} onClick={() => onSubmit(edits)}>
        {busy ? "Saving…" : "Save"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 border-divider-emphasis bg-transparent px-3 text-ink-soft"
        disabled={busy || edits.length === 0}
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  )
}

function TextField({
  id,
  label,
  labelHidden,
  value,
  hint,
  onValueChange,
}: {
  readonly id: string
  readonly label: string
  readonly labelHidden?: boolean
  readonly value: string
  readonly hint?: string | undefined
  readonly onValueChange: (next: string) => void
}) {
  return (
    <Field>
      {/* Hidden, not dropped: base-ui only fills aria-labelledby under a
          Field.Root this app never renders, so deleting the element would
          leave the input with no accessible name at all. */}
      <FieldLabel htmlFor={id} className={labelHidden === true ? "sr-only" : LABEL}>
        {label}
      </FieldLabel>
      {/* max-w-sm: the console's 384px field width, not the full column. */}
      <Input id={id} value={value} className="max-w-sm" onChange={(event) => onValueChange(event.target.value)} />
      {hint !== undefined && <FieldDescription className={HINT}>{hint}</FieldDescription>}
    </Field>
  )
}

// The console's non-input readout: a 12px label over arbitrary content, used
// where there is no control to point an htmlFor at.
function Block({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={LABEL}>{label}</Label>
      {children}
    </div>
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
      <FieldLabel htmlFor={id} className={LABEL}>
        {label}
      </FieldLabel>
      <Textarea id={id} value={value} rows={4} onChange={(event) => onValueChange(event.target.value)} />
      <FieldDescription className={HINT}>
        {hint === undefined ? "One entry per line." : `${hint} One entry per line.`}
      </FieldDescription>
    </Field>
  )
}

// No FieldContent around the label: Field's horizontal variant flips itself to
// items-start (and nudges the box by mt-px) the moment one is a direct child,
// to make room for a description. A bare toggle has none, so the wrapper only
// broke the centering.
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
      <FieldLabel htmlFor={id} className={LABEL}>
        {label}
      </FieldLabel>
    </Field>
  )
}

type BasicsRow = {
  readonly field: keyof Basics
  readonly label: string
  readonly path: Path
  readonly hint?: string
}

// Split across two panels: who you are, then how to reach you. Disjoint key
// sets, so the two forms never write the same line of basics.yaml.
const PROFILE_ROWS: readonly BasicsRow[] = [
  { field: "name", label: "Display name", path: ["name"], hint: "First and last split at the first space." },
  { field: "email", label: "Email", path: ["email"] },
]

const BASICS_ROWS: readonly BasicsRow[] = [
  { field: "phone", label: "Phone", path: ["phone"] },
  { field: "location", label: "Location", path: ["location"], hint: "City, region, country as printed." },
  { field: "country", label: "Country", path: ["country"], hint: "Country of residence as a form lists it." },
  { field: "urlLabel", label: "Site label", path: ["url", "label"] },
  { field: "urlHref", label: "Site URL", path: ["url", "href"] },
]

// One form over an explicit row list, so Profile and Basics share it and each
// emits edits for its own keys only.
function BasicsForm({
  rows,
  basics,
  save,
}: {
  readonly rows: readonly BasicsRow[]
  readonly basics: Basics
  readonly save: Save
}) {
  const [draft, setDraft] = useState(basics)
  const { busy, submit } = useCardSave("basics.yaml", save)

  const setField = (field: keyof Basics, value: string): void =>
    setDraft((current): Basics => ({ ...current, [field]: value }))

  const edits = rows.flatMap<Edit>((row) => changed(row.path, draft[row.field], basics[row.field]))

  return (
    <div className="space-y-2">
      <FieldGroup>
        {rows.map((row) => (
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
      <SaveButton busy={busy} edits={edits} onSubmit={submit} onReset={() => setDraft(basics)} />
    </div>
  )
}

function BasicsSection({ basics, save }: { readonly basics: Basics; readonly save: Save }) {
  return <BasicsForm rows={BASICS_ROWS} basics={basics} save={save} />
}

function SocialsSection({ socials, save }: { readonly socials: readonly SocialProfile[]; readonly save: Save }) {
  const [draft, setDraft] = useState(socials)
  const { busy, submit } = useCardSave("profiles.yaml", save)

  const setRow = (position: number, field: "username" | "url", value: string): void =>
    setDraft((current) =>
      current.map((row, index): SocialProfile => (index === position ? { ...row, [field]: value } : row))
    )

  // `row.id` is the row's place in the file, which is what an edit path
  // addresses; username-less rows were dropped before this list was built.
  // The network name is a heading now, so no edit targets `row.key` — the
  // row that spells its label `x` keeps that spelling untouched.
  const edits = draft.flatMap<Edit>((row, position) => {
    const before = socials[position]
    if (before === undefined) return []
    const index = Number(row.id)
    return [
      ...changed(["profiles", index, "username"], row.username, before.username),
      ...changed(["profiles", index, "url"], row.url, before.url),
    ]
  })

  return (
    <div className="space-y-2">
      <FieldGroup>
        {draft.map((row, position) => (
          <FieldSet key={row.id}>
            <FieldLegend variant="label" className={LABEL}>
              {row.network === "" ? `Profile ${row.id}` : row.network}
            </FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* The visible name is the legend above; the hidden label names
                  the network too, or three rows read alike. */}
              <TextField
                id={`social-${row.id}-username`}
                label={`${row.network === "" ? `Profile ${row.id}` : row.network} username`}
                labelHidden
                value={row.username}
                onValueChange={(next) => setRow(position, "username", next)}
              />
              <TextField
                id={`social-${row.id}-url`}
                label={`${row.network === "" ? `Profile ${row.id}` : row.network} URL`}
                labelHidden
                value={row.url}
                onValueChange={(next) => setRow(position, "url", next)}
              />
            </div>
          </FieldSet>
        ))}
      </FieldGroup>
      <SaveButton busy={busy} edits={edits} onSubmit={submit} onReset={() => setDraft(socials)} />
    </div>
  )
}

function LanguagesSection({ languages, save }: { readonly languages: readonly Language[]; readonly save: Save }) {
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
    <div className="space-y-2">
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
      <SaveButton busy={busy} edits={edits} onSubmit={submit} onReset={() => setDraft(languages)} />
    </div>
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

type SearchListName = "positions" | "locations"

type FilterListName = "excludeLocations" | "excludeCompanies" | "directRegions" | "marketCurrencies"

// location_scope's vocabulary, empty included: an incomplete profile is a gap
// scout names, where an unknown value silently matches no search branch.
const SCOPES: readonly string[] = ["", "worldwide", "listed"]

type ListRow<Name extends string> = {
  readonly field: Name
  readonly label: string
  readonly path: Path
  readonly hint: string
}

const SEARCH_LIST_ROWS: readonly ListRow<SearchListName>[] = [
  { field: "positions", label: "Positions", path: ["positions"], hint: "Title strings, in file order." },
  { field: "locations", label: "Locations", path: ["locations"], hint: "Named places, used when scope is listed." },
]

const FILTER_LIST_ROWS: readonly ListRow<FilterListName>[] = [
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

function SearchSection({ jobSearch, save }: { readonly jobSearch: JobSearch; readonly save: Save }) {
  const { busy, submit } = useCardSave("job_search.yaml", save)
  const [toggles, setToggles] = useState<Readonly<Record<ToggleGroupName, readonly Toggle[]>>>({
    workModel: jobSearch.workModel,
    jobTypes: jobSearch.jobTypes,
    datePosted: jobSearch.datePosted,
  })
  const [lists, setLists] = useState<Readonly<Record<SearchListName, string>>>({
    positions: toLines(jobSearch.positions),
    locations: toLines(jobSearch.locations),
  })
  const [scope, setScope] = useState(jobSearch.locationScope)

  // Empty is a profile gap scout reports for itself; a typo is not, and reaches
  // scout as a scope that matches neither branch.
  const scopeValid = SCOPES.includes(scope)

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

  const setList = (field: SearchListName, value: string): void =>
    setLists((current): Record<SearchListName, string> => ({ ...current, [field]: value }))

  const toggleEdits = TOGGLE_GROUPS.flatMap<Edit>((group) =>
    toggles[group.field].flatMap<Edit>((row, index) => {
      const before = jobSearch[group.field][index]
      if (before === undefined || before.on === row.on) return []
      return [{ op: "set", path: [group.key, row.key], value: row.on }]
    })
  )

  const listEdits = SEARCH_LIST_ROWS.flatMap<Edit>((row) => {
    const next = fromLines(lists[row.field])
    return sameList(next, jobSearch[row.field]) ? [] : [{ op: "set", path: row.path, value: [...next] }]
  })

  const edits: readonly Edit[] = [
    ...toggleEdits,
    ...listEdits,
    ...(scopeValid ? changed(["location_scope"], scope, jobSearch.locationScope) : []),
  ]

  return (
    <div className="space-y-2">
      <FieldGroup>
        {TOGGLE_GROUPS.map((group) => (
          <FieldSet key={group.field}>
            <FieldLegend variant="label" className={LABEL}>
              {group.label}
            </FieldLegend>
            {group.hint !== undefined && <FieldDescription className={HINT}>{group.hint}</FieldDescription>}
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

        {SEARCH_LIST_ROWS.map((row) => (
          <ListField
            key={row.field}
            id={`job-search-${row.field}`}
            label={row.label}
            value={lists[row.field]}
            hint={row.hint}
            onValueChange={(next) => setList(row.field, next)}
          />
        ))}

        <Field>
          <FieldLabel htmlFor="job-search-location-scope" className={LABEL}>
            Location scope
          </FieldLabel>
          <Input
            id="job-search-location-scope"
            value={scope}
            className="max-w-sm"
            aria-invalid={!scopeValid}
            onChange={(event) => setScope(event.target.value)}
          />
          {scopeValid ? (
            <FieldDescription className={HINT}>worldwide, or listed to use the locations above.</FieldDescription>
          ) : (
            <FieldError>Use worldwide or listed, or leave it empty.</FieldError>
          )}
        </Field>
      </FieldGroup>
      <SaveButton
        busy={busy}
        edits={edits}
        onSubmit={submit}
        onReset={() => {
          setToggles({
            workModel: jobSearch.workModel,
            jobTypes: jobSearch.jobTypes,
            datePosted: jobSearch.datePosted,
          })
          setLists({
            positions: toLines(jobSearch.positions),
            locations: toLines(jobSearch.locations),
          })
          setScope(jobSearch.locationScope)
        }}
      />
    </div>
  )
}

function FiltersSection({ jobSearch, save }: { readonly jobSearch: JobSearch; readonly save: Save }) {
  const { busy, submit } = useCardSave("job_search.yaml", save)
  const [lists, setLists] = useState<Readonly<Record<FilterListName, string>>>({
    excludeLocations: toLines(jobSearch.excludeLocations),
    excludeCompanies: toLines(jobSearch.excludeCompanies),
    directRegions: toLines(jobSearch.directRegions),
    marketCurrencies: toLines(jobSearch.marketCurrencies),
  })
  const [pruneText, setPruneText] = useState(String(jobSearch.pruneScoreMax))

  const prune = Number(pruneText)
  const pruneValid = pruneText.trim() !== "" && Number.isFinite(prune)

  const setList = (field: FilterListName, value: string): void =>
    setLists((current): Record<FilterListName, string> => ({ ...current, [field]: value }))

  const listEdits = FILTER_LIST_ROWS.flatMap<Edit>((row) => {
    const next = fromLines(lists[row.field])
    return sameList(next, jobSearch[row.field]) ? [] : [{ op: "set", path: row.path, value: [...next] }]
  })

  const edits: readonly Edit[] = [
    ...listEdits,
    // prune_score_max is a number in the file; a string here would retype the key.
    ...(pruneValid && prune !== jobSearch.pruneScoreMax
      ? [{ op: "set" as const, path: ["prune_score_max"], value: prune }]
      : []),
  ]

  return (
    <div className="space-y-2">
      <FieldGroup>
        {FILTER_LIST_ROWS.map((row) => (
          <ListField
            key={row.field}
            id={`job-search-${row.field}`}
            label={row.label}
            value={lists[row.field]}
            hint={row.hint}
            onValueChange={(next) => setList(row.field, next)}
          />
        ))}

        <Field>
          <FieldLabel htmlFor="job-search-prune-score-max" className={LABEL}>
            Prune score max
          </FieldLabel>
          <Input
            id="job-search-prune-score-max"
            type="number"
            inputMode="numeric"
            value={pruneText}
            className="max-w-sm"
            aria-invalid={!pruneValid}
            onChange={(event) => setPruneText(event.target.value)}
          />
          {pruneValid ? (
            <FieldDescription className={HINT}>The job-prune threshold; scout itself ignores it.</FieldDescription>
          ) : (
            <FieldError>Enter a number.</FieldError>
          )}
        </Field>
      </FieldGroup>
      <SaveButton
        busy={busy}
        edits={edits}
        onSubmit={submit}
        onReset={() => {
          setLists({
            excludeLocations: toLines(jobSearch.excludeLocations),
            excludeCompanies: toLines(jobSearch.excludeCompanies),
            directRegions: toLines(jobSearch.directRegions),
            marketCurrencies: toLines(jobSearch.marketCurrencies),
          })
          setPruneText(String(jobSearch.pruneScoreMax))
        }}
      />
    </div>
  )
}

type PackDraft = { readonly enabled: boolean; readonly formulations: string }

function PacksSection({ packs, save }: { readonly packs: readonly SearchPack[]; readonly save: Save }) {
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
    <div className="space-y-2">
      <FieldGroup>
        {packs.map((pack, position) => {
          const row = draft[position]
          if (row === undefined) return null
          return (
            <FieldSet key={pack.id}>
              <FieldLegend variant="label" className={cn(LABEL, "font-mono")}>
                {pack.id}
              </FieldLegend>
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
      <SaveButton
        busy={busy}
        edits={edits}
        onSubmit={submit}
        onReset={() =>
          setDraft(packs.map((pack) => ({ enabled: pack.enabled, formulations: toLines(pack.formulations) })))
        }
      />
    </div>
  )
}

// Theme lives here rather than in the account menu: the console keeps every
// per-user preference on one surface, and a segmented control shows which of
// the three is active where a submenu could not.
function Appearance() {
  const { theme, setTheme } = useTheme()

  return (
    <Block label="Appearance">
      {/* divide-x, not a border per button: the console's segments share one
          hairline between them. */}
      <div className="inline-flex divide-x divide-divider self-start overflow-hidden border border-divider">
        {THEMES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value as Theme)}
            data-active={theme === value}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              "bg-muted/40 text-ink-soft hover:bg-inset",
              "data-active:bg-accent-blue-soft data-active:text-accent-blue-strong"
            )}
          >
            <HugeiconsIcon icon={Icon} className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </Block>
  )
}

// The console's Profile page, part for part: an editable name/email form, a
// copyable monospace identifier, then the theme switch. The profile folder is
// our "User ID" — the one identifier that names this install.
function ProfileSection({
  label,
  basics,
  save,
}: {
  readonly label: string
  readonly basics: Basics
  readonly save: Save
}) {
  const [copied, setCopied] = useState(false)

  // StrictMode double-invokes effects, so the reset has to be cancellable —
  // same contract as ui/copy.tsx.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <>
      <BasicsForm rows={PROFILE_ROWS} basics={basics} save={save} />

      <Block label="Profile folder">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(label).then(
              () => setCopied(true),
              () => toast.error("Could not copy to the clipboard")
            )
          }}
          className="inline-flex cursor-pointer items-center gap-1 border-b border-dotted border-current font-mono text-xs text-ink-muted transition-colors hover:text-ink-strong"
        >
          {label}
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-3 opacity-60" aria-hidden="true" />
        </button>
      </Block>

      <Appearance />
    </>
  )
}

// A section's draft is seeded from props once, at mount. Keying it on its
// file's read stamp remounts exactly the section whose file the save rewrote,
// so it re-seeds from the reloaded profile.
function SettingsPanel({
  panel,
  profile,
  save,
}: {
  readonly panel: PanelId
  readonly profile: Profile
  readonly save: Save
}) {
  const stampOf = (file: string): number => profile.stamps[file] ?? 0
  const basics = stampOf("basics.yaml")
  const search = stampOf("job_search.yaml")

  // max-w-xl space-y-8: the console's measured body stack — 576px wide, 32px
  // between blocks, no card anywhere on the surface.
  return (
    <div className="max-w-xl space-y-8">
      {(() => {
        switch (panel) {
          case "profile":
            return <ProfileSection key={basics} label={profile.label} basics={profile.basics} save={save} />
          case "basics":
            return <BasicsSection key={basics} basics={profile.basics} save={save} />
          case "profiles":
            return <SocialsSection key={stampOf("profiles.yaml")} socials={profile.socials} save={save} />
          case "languages":
            return <LanguagesSection key={stampOf("languages.yaml")} languages={profile.languages} save={save} />
          case "search":
            return <SearchSection key={search} jobSearch={profile.jobSearch} save={save} />
          case "filters":
            return <FiltersSection key={search} jobSearch={profile.jobSearch} save={save} />
          case "packs":
            return <PacksSection key={stampOf("search_packs.yaml")} packs={profile.packs} save={save} />
          default:
            return assertNever(panel)
        }
      })()}
    </div>
  )
}
