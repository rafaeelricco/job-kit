# Pages

A page is a thin route component in `app/src/pages/`. It picks a **gate** that owns every state before the data is
usable (access, loading, failure, wrong folder) and the page chrome (title + icon), then hands the resolved value to a
**presentational surface**. The page itself holds no loading state and no error branches.

Pages read the local profile folder today, through `StoreGate` and `ProfileGate`; no page reads from the server yet.
When one does (the hosted migration, R1C-248), its gate or surface holds one **`RemoteData`** cell that a
**`Future.fork`** fills inside `useEffect`, renders it **exhaustively**, and builds the read as a **composed
`Future`**. Section 3 shows that shape.

Table a page renders: `./tables.md`. Write that mutates its data: `./forms.md`. Visual constraints:
`./design-system.md`. Nearby pages: `app/src/pages/resumes.tsx` (smallest), `app/src/pages/dossiers.tsx` (full).

## Audit

- Find the gate the data needs (`StoreGate`, `ProfileGate`, or plain `AccessGate`) and the page it already serves.
- Read one nearby page before editing — match its gate, its `Surface` split, and how actions reach the surface.

Report the audit briefly:

```md
Page Audit:

- Gate (and its title / icon):
- Data the surface receives (and actions: save, trash, reload):
- Server reads, if any (api.*), and their composition (map / concurrently / chain / mapConcurrently):
- Container/presentational boundary:
- Nearby pages referenced:
```

## Canonical references (by role)

- **`@module/access/access-gate`** — `AccessGate` (folder consent, page `Shell` with title + icon), `LoadingRows`.
- **`@module/scout/components/store-gate`** — `StoreGate`: dossier store, render prop `(store, actions) => …`.
- **`@module/profile/components/profile-gate`** — `ProfileGate`: parsed profile, render prop `(profile, save) => …`.
- **`@lib/remote-data`** — `RemoteData`, `NotAsked` / `Loading` / `Failed` / `Ready`.
- **`@lib/future`** — `Future`, `Future.concurrently`, `Future.mapConcurrently`, `.chain`, `.map`, `.fork`.
- **`@api/endpoints` / `@api/request`** — typed `api.*`, `call`, `FetchError`, `fetchErrorToString` (see `./forms.md`).
- **`@ui/datatable`** — `DataTable` (see `./tables.md`).

## 1. Gate → surface

The route component names the page and chooses the gate; everything it renders is the gate's resolved value. Keep it
this small:

```tsx
export default ResumesPage

import { File01Icon } from "@hugeicons/core-free-icons"
import { ProfileGate } from "@module/profile/components/profile-gate"
import { ResumeList } from "@module/profile/components/resume"

function ResumesPage() {
  return (
    <ProfileGate title="Resumes" Icon={File01Icon}>
      {(profile, save) => (
        <ResumeList resumes={profile.resumes} adaptPerVacancy={profile.adaptPerVacancy} save={save} />
      )}
    </ProfileGate>
  )
}
```

A gate is the place for a new pre-data state. Gates switch on their state's `kind` and end in `assertNever`, so a new
state is a compile error until every gate renders it (`store-gate.tsx`, `profile-gate.tsx`).

## 2. Container / presentational split

When a page needs view state (filter, sort, selection, pagination), put it in a `Surface` component below the gate
that receives the ready value as a prop, as `dossiers.tsx` does. The route component stays gate-only; `Surface` owns
the view state and composes the feature components from `app/src/module/<feature>/components/`. Keep each child
small and prop-typed.

## 3. Server reads: `RemoteData` cell + `Future.fork`

Model the read as one `RemoteData<FetchError, T>` cell. Seed `NotAsked()`, set `Loading()` inside the effect, then
`.fork(onError → Failed, onSuccess → Ready)`. `fork` returns a cancel function — return it from the effect so an
in-flight read is cancelled on unmount or when an input changes (`app.tsx` does the same for `reloadSession`):

```tsx
import * as s from "@lib/json/schema"
import { api } from "@api/endpoints"

type WhoAmI = s.Infer<typeof api.whoAmI.response>

const [state, setState] = useState<RemoteData<FetchError, WhoAmI>>(NotAsked())

useEffect(() => {
  setState(Loading())
  return call(api.whoAmI, {}).fork(
    (error) => setState(Failed(error)),
    (value) => setState(Ready(value))
  )
}, [])
```

Branch every case with `instanceof` and end in `(state satisfies never)`, so a new variant is a compile error.
`Ready` → content; the rest → status surfaces from the design system (`LoadingRows`, `Alert variant="destructive"`):

```tsx
{
  state instanceof Ready ? <Content value={state.value} />
  : state instanceof Loading || state instanceof NotAsked ? <LoadingRows />
  : state instanceof Failed ?
    <Alert variant="destructive">
      <AlertDescription>{fetchErrorToString(state.error)}</AlertDescription>
    </Alert>
  : (state satisfies never)
}
```

A **status-only cell** (`RemoteData<E, void>`, e.g. a save in flight) has no content to render on `Ready`;
`useCardSave` in `settings-surface.tsx` is the example.

## 4. Composed `Future` reads

Build a multi-request read as one composition, not nested forks:

- `.map` projects a field off a response.
- `Future.concurrently({ a, b })` runs independent reads together and joins them into one object.
- `.chain` sequences a dependent step (list → per-row detail).
- `Future.mapConcurrently(fn, list)` fans out over a list.

Only the effect forks; the composition stays lazy until then.

## Do / Do not

- Do: choose a gate in the route component and pass its resolved value to a presentational surface.
- Do: add a pre-data state to the gate, not to the page.
- Do: for a server read, seed `NotAsked()`, set `Loading()` then `.fork` inside `useEffect`, and return the cancel.
- Do: end every state match exhaustively (`assertNever` or `satisfies never`).
- Do: compose the read (`concurrently` / `mapConcurrently` / `chain` / `map`) and fork once.
- Do not: put loading or error branches in the route component, nest `.fork` calls, fire reads outside
  `useEffect`, or drop the cancel return.
