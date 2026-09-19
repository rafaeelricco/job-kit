---
description: TypeScript conventions — required terminology, type-driven modeling, functional primitives, boundary-safe domain design, and numeric presentation in tables.
globs: "*.ts, *.tsx"
alwaysApply: false
---

Favour static types, explicit data flow, immutability, pure functions, composition, exhaustive matching, monadic error handling, strict generics, and branded values over raw primitives; make illegal states unrepresentable and normalize transport/DTO shapes into domain types at boundaries.

## Terminology

### "Premises", never "premise"

**A _premise_ is the foundation of an argument. It has nothing to do with a building or a location.
A _premises_ is a building or location. "Premise" is NOT the singular of "premises".**

Legacy MyHEMS/HEMS data and older code use "premise" for the location sense throughout. That usage is
**incorrect**. New code, new UI copy, new identifiers, and new docs use only:

- **`premises`** — `On-Premises`, `Off-Premises`, `premisesType`, `ProfiledPremises`
- **`prem`** — the accepted abbreviation, as in `On-Prem` / `Off-Prem`, `alcohol_on_prem`

```ts
// ✗ never
const ON_PREMISE_LABEL = "On-Premise"
type PremiseType = "OnPremise" | "OffPremise"
/** On-premise events carry a bar spend. */

// ✓
const ON_PREMISES_LABEL = "On-Premises"
type PremisesType = "on_prem" | "off_prem"
/** On-premises events carry a bar spend. */
```

This applies to display labels, CSV/export headers, enum members, type and variable names, test
names, and comment prose alike.

**The one exception is a string frozen outside our control**, where renaming would change meaning or
break decoding. Leave these verbatim and do not "fix" them:

- Literals persisted in the event store — the `"OnPremise"` / `"OffPremise"` values of the retired
  `PremisesType` and of `ProfiledPremises`, which are frozen inside historical events.
- Deterministic aggregate seeds — e.g. `venue_types_on_premise`, which derives an aggregate id.
  Renaming one silently repoints the aggregate; **the test suite cannot catch this**, because tests
  seed their own store.
- Verbatim legacy data and quoted source text — MyHEMS table/row values, imported SQL dumps, meeting
  transcripts under `docs/background/`.

When new code must name one of those frozen literals, keep the literal exact and use correct spelling
in the surrounding prose and identifiers.

## Type Design

- Use a **reusable `Id<Tag>` class** for entity IDs, tagged with a string literal. Don't use `string & { __brand }` intersections — they allow name collisions, leak `__brand` into intellisense, and accept raw strings without constructors. Don't tag with the entity class itself (`Id<Foo>`): two classes with the same shape are structurally identical, so `Id<Foo>` would still assign to `Id<Bar>`. A literal tag is nominal; `declare` keeps the phantom field out of the emitted class; `readonly value` keeps an identity from changing after construction.

  ```ts
  // reusable ID class
  class Id<Tag extends string> {
    declare private readonly _tag: Tag // phantom, never assigned
    constructor(readonly value: string) {}
    // ...other useful methods
  }

  // Id<Tag> in use
  class Foo {
    constructor(readonly id: Id<"Foo">) {}
  }
  class Bar {
    constructor(readonly id: Id<"Bar">) {}
  }
  const barId: Id<"Bar"> = new Id<"Foo">("f") // ✗ error: "Foo" is not assignable to "Bar"
  ```

- Use **discriminated unions** to make invalid states unrepresentable. Don't use bags of optional properties when combinations create impossible states.
  ```ts
  type State = { status: "loading" } | { status: "error"; error: Error } | { status: "success"; data: { id: string } }
  ```
- **Group correlated nullable fields into a single nullable object**, so "all present or all absent" is enforced by the type rather than by convention. Two parallel `X | null` fields that must travel together admit nonsense combinations (one set, the other null); one nullable object doesn't. Applies to aggregate fields, event/projection schemas, and DTOs alike.
  ```ts
  // ✗ id without a name (or vice versa) is representable
  invoiceGroupId: string | null; invoiceGroupName: string | null;
  // ✓ both or neither
  invoiceGroup: { id: string; name: string } | null;
  // schema form: s.optionalDefault(null, s.nullable(s.object({ id: s.string, name: s.string })))
  ```
- Use **exhaustive `switch`** with a `never` default on discriminated unions, or **`match` from [ts-pattern](https://github.com/gvergnaud/ts-pattern)**. Both force handling new variants at compile time.

  ```ts
  // switch with never default
  default: {
    const _exhaustiveCheck: never = config;
    throw new Error(`Unknown: ${JSON.stringify(_exhaustiveCheck)}`);
  }

  // ts-pattern
  import { match } from "ts-pattern";
  const result = match(state)
    .with({ status: "loading" }, () => "Loading...")
    .with({ status: "error" }, ({ error }) => error.message)
    .with({ status: "success" }, ({ data }) => data.id)
    .exhaustive();
  ```

- Don't use **empty objects** (e.g. `ConversationId.empty()`) to represent absence. Use `Maybe<T>` with `Nothing()` instead.
- Use **`as const` tuples** instead of `enum`. Derive the type with `type X = (typeof X)[number]`.
  ```ts
  const PACK_STATUSES = ["Draft", "Approved", "Shipped"] as const
  type PackStatus = (typeof PACK_STATUSES)[number]
  ```
- **Declare return types** on top-level module functions. Exception: JSX components returning JSX.
- **Don't use `any`**. Use strict generics to preserve type information:
  ```ts
  function parse<T>(data: { result: T }): T {
    return data.result
  }
  ```
- **Default the message on custom `Error` subclasses** that have a single canonical message, so call sites don't repeat the string. Keep `message` a parameter (defaulted) so a caller can still override with contextual detail; leave it required only when the message is always dynamic.
  ```ts
  class ActivityBillingNotFoundError extends Error {
    constructor(message = "No billing record for this activity.") {
      super(message)
      this.name = "ActivityBillingNotFoundError"
    }
  }
  throw new ActivityBillingNotFoundError() // uses the canonical message
  ```

## Domain Modeling

- Co-locate a `static schema` factory on the generic `Id<T>` class for native serialization/deserialization, then expose a typed `schema` per domain class.

  ```ts
  class Id<T> {
    // @ts-expect-error the existence of _tag prevents structural comparison
    private readonly _tag: T | null = null
    constructor(public value: string) {}
    static schema<T>() {
      return idSchema<T>()
    }
  }

  class Message {
    static schema = Id.schema<Message>()
    constructor(readonly id: Id<Message>) {}
  }
  ```

- Model rich content (LLM outputs, conversation events) with `s.discriminatedUnion` + `s.variant`. Don't use giant bags of optional properties.
  ```ts
  const schema_AgentExecutionTrace = s.discriminatedUnion([
    s.variant({ type: "text", text: s.string }),
    s.variant({ type: "tool_call", name: s.string, input: s.json, result: schema_Result(schema_Error, s.json) }),
    s.variant({ type: "error", message: s.string, code: s.optional(s.string) }),
  ])
  ```
- Bundle related state into **union-driven state machines**. Don't use loose boolean flags (`isStreaming`, `isError`, `isLoading`) spread across stores.

  ```ts
  type Stream<E, R> =
    | { type: "not_started" }
    | { type: "streaming"; results: R[] }
    | { type: "done"; results: R[] }
    | { type: "error"; error: E }

  type VoiceConnection =
    | { type: "disconnected" }
    | { type: "connecting" }
    | { type: "transcribing"; transcription: string }
    | { type: "error"; error: FetchErrorResponse }

  type UserInput = { type: "text"; content: string } | { type: "voice"; connection: VoiceConnection }

  interface ActiveConversation {
    id: ConversationId
    messages: Array<Message>
    inputMode: UserInput
    streamingResponse: Stream<Error, string>
  }
  ```

---

## Maybe — Representing Absence

- Use `Maybe<T>` instead of `null`/`undefined` for return values, entity fields, and persisted shapes. Construct with `Just(value)` or `Nothing()`.

- Pattern match with `instanceof Just` / `instanceof Nothing` + `satisfies never` in default. Don't use `isJust()`/`isNothing()` — they don't narrow types.
  ```ts
  switch (true) {
    case maybeUser instanceof Just:
      console.log(maybeUser.value)
      break
    case maybeUser instanceof Nothing:
      console.log("No user")
      break
    default:
      maybeUser satisfies never
  }
  ```
- Use `.map(fn)` for transforms. Use `.chain(fn)` (flatMap) when `fn` returns `Maybe<T>` — avoids `Maybe<Maybe<T>>`.
- Use `.withDefault(fallback)` or `.maybe(default, fn)` for default values.
- Use `.alt(other)` to chain fallback Maybe values: `primary.alt(secondary).alt(fallback)`.
- Use `fromNullable()` for `null` and `fromOptional()` for `undefined` at system boundaries.
- Use `catMaybes(arr)` to filter out `Nothing` values, `mapMaybe(arr, fn)` to map+filter in one pass.
- Don't use `.expect()` for recoverable absence — it throws. Use `.withDefault()` or `.maybe()`.
- Don't mix `fromNullable` and `fromOptional` — they handle different nullish types.

---

## Result — Typed Error Handling

Use `Result<E, T>` for fallible operations. Return `Failure(error)` instead of throwing. Don't `throw` for recoverable domain failures — a missing record, invalid input, a rejected request — and don't make callers `try/catch` your code. `throw` is reserved for programmer errors that should never happen (the `never` default of an exhaustive `switch`, `Result.unwrap` / `Maybe.expect` on a value the code path already guarantees), and `try/catch` for the boundaries where a browser or platform API throws — `JSON.parse`, File System Access, `fetch` — converted to a `Result` at that boundary.

- Construct with `Success<E, T>(value)` or `Failure<E, T>(error)` — callable without `new`.
- Use `.either(onError, onSuccess)` for exhaustive fold.
  ```ts
  const handle = (result: Result<Error, User>): string =>
    result.either(
      (e) => e.message,
      (user) => user.name
    )
  ```
- Use `.chain(fn)` for monadic sequencing — short-circuits on first `Failure`.
  ```ts
  parseJson(input).chain(validate).chain(transform)
  ```
- Use `.map(fn)` for pure transforms on `Success`, `.mapFailure(fn)` to transform error types.
- Don't mix `Result` with `try/catch`. Don't use `.unwrap()` outside boundaries — it throws on `Failure`.
- `traverse` works with `List`, `traverse_` works with `Array`. Both short-circuit on first `Failure`.

---

## RemoteData — UI State Machine

Prefer `RemoteData<E, T>` to model async UI state.

- States: `NotAsked()`, `Loading()`, `Failed(error)`, `Ready(value)`.
- Pattern match with `instanceof` + `satisfies never`.
  ```ts
  switch (true) {
    case state instanceof Ready:
      render(state.value)
      break
    case state instanceof Failed:
      showError(state.error)
      break
    case state instanceof Loading:
      showSpinner()
      break
    case state instanceof NotAsked:
      break
    default:
      state satisfies never
  }
  ```
- `.map(fn)` transforms only `Ready`; preserves `Loading`/`Failed`/`NotAsked`.
- `.chain(fn)` for `RemoteData`-returning functions — avoids double wrapping.
- `NotAsked` means "haven't asked yet". For "asked but empty", use `Ready([])`.
- Don't check `isReady` without `instanceof` — boolean flags don't narrow types.

---

## Future — Lazy Async Computation

Prefer `Future<E, T>` over `Promise` for lazy, cancelable async.

- Create with `Future.create<E, T>((reject, resolve) => { ... return cancelFn })`. Return the cancel function.
  ```ts
  const future = Future.create<never, number>((reject, resolve) => {
    const timer = setTimeout(() => resolve(42), 1000)
    return () => clearTimeout(timer)
  })
  ```
- Use `Future.createUncancellable` for inherently uncancellable operations.
- Nothing executes until `.fork(onError, onSuccess)` is called. `fork` returns a cancel function — store it if cancellation is needed.
- Don't use `Future.attemptP` for cancellable operations — it loses cancellation semantics. Use it only for wrapping simple Promises: `Future.attemptP(() => someAsyncFn())`.
- Don't double-wrap Promises: `Future.attemptP(() => fn())`, not `Future.attemptP(async () => { const r = await fn(); return r; })`.
- Use `.chain(fn)` for sequential async composition.
  ```ts
  fetchUser(id)
    .chain((user) => fetchPosts(user.id).map((posts) => ({ user, posts })))
    .fork(handleError, ({ user, posts }) => render(user, posts))
  ```
- Use `Future.parallel(limit, futures)` for bounded concurrency. Use `Future.concurrently({...})` for named concurrent operations.
- Use `.chainRej(fn)` to recover from errors. `.mapRej(fn)` transforms errors but stays rejected.
- Use `Future.bracket(acquire, release, use)` for guaranteed resource cleanup (locks, connections, file descriptors).
- Use `Future.race(a, b)` for timeouts.
- Convert to Promise with `await future.promise(e => new Error(String(e.message)))`.
- `attemptP` always produces `Future<Error, T>` — use `.mapRej()` to narrow the error type.

---

## Collections

### List — Singly Linked List

- Use `List<T>` for O(1) prepend and immutable functional sequences. Import from `@ambarltd/core/list`:
  ```ts
  import { List } from "@ambarltd/core/list"
  ```
- Don't append onto linked lists — O(n²). Build with `List.cons(item, list)` + `.reverse()` at the end, or `List.from(arr)`.
- `.head()` returns `Maybe<T>` — always handle `Nothing`.

### TreeMap / TreeSet — Ordered Collections

- Use `TreeMap`/`TreeSet` with explicit comparators for ordered collections. Reach for them instead of JS `Map`/`Set` when you want an ordering other than insertion order.
  ```ts
  const map = TreeMap.new<string, number>((x, y) => (x > y ? 1 : x < y ? -1 : 0))
  // Or use stringMap factory / Comparable interface
  const map = stringMap<User>()
  const map = TreeMap.new_<UserId, User>()
  ```
- **`TreeMap.new()` and `TreeSet.new()` return the mutable variants.** `.set()`, `.remove()`, `.setEntries()`, `.insert()` modify the receiver. Don't share one across state snapshots — an update mutates every snapshot holding it. For persistent, structurally shared values use `ImmutableTreeMap` / `ImmutableTreeSet`: every update returns a new collection and the receiver is untouched.
- `.get(key)` returns `Maybe<T>` — always handle `Nothing`.
- **`.union()`, `.unionWith(other, mergeFn)`, `.difference(other)` and `.intersectionWith(other, fn)` never mutate the receiver**, on either variant — they clone and return the merged collection. `set.union(other)` as a statement discards the result; always assign it.
- Comparator must return `-1 | 0 | 1`. Boolean won't work.
- `TreeMap` is sorted by comparator, not insertion order.
- Use `TreeSet.from(set)` to clone a mutable set before mutating it.
- Use `.has()` for O(log n) membership. Don't use `.values().includes()` — that's O(n).

### MVar & BoundedBuffer — Async Coordination

- Use `MVar<T>` for async synchronization. `put(v)` blocks if full, `take()` blocks if empty. Resolves in FIFO order.
- Use `BoundedBuffer<T>` for backpressure queues with max capacity. `enqueue(v)` blocks if full, `dequeue()` blocks if empty.

  ```ts
  const textBuffer = new BoundedBuffer<string>(100)
  const endSignal = MVar.newEmpty<null>()

  model.onToken((token) => {
    textBuffer.enqueue(token)
  })
  model.onDone(() => {
    endSignal.put(null)
  })

  for await (const text of iterable) {
    await ttsService.synthesize(text)
  }
  ```

- Don't use unbounded arrays for streaming — memory leak risk. Don't use boolean flags for "done" state — use `MVar` to block until populated.

---

## Parsing & Validation

### Decoders — Validating Incoming Data

- Never cast `JSON.parse(x) as T`. Validate with a decoder returning `Result<string, T>`. Don't call `JSON.parse` yourself either — it throws on malformed text before any decoder runs. `Decoder.stringified(inner)` parses the string and turns a syntax error into a `Failure`.
  ```ts
  const result = Decoder.decode(input, Decoder.stringified(userDecoder)) // Result<string, User>
  ```
- Build object decoders with `Decoder.object({ ... })`.
- Use `Decoder.optional()` for fields that may not exist (`V | undefined`).
- Use `Decoder.nullable()` for fields where value may be `null` (`V | null`).
- Use `Decoder.optionalNullable()` for fields that may be absent OR null.
- Use `Decoder.optionalMaybe()` for missing → `Maybe<V>`.
- Use `Decoder.oneOf()` + `Decoder.stringLiteral()` for discriminated JSON unions.
- Always derive types from decoders: `type User = Decoder.Infer<typeof userDecoder>`. Don't cast with `as` after decode.
- Use `.chain()` for version-dependent decoding.
- Use `Decoder.objectMap()` for `{ [key: string]: T }` shapes. Don't use `Decoder.object()` for dynamic keys.

### Encoders — Formatting Output Data

- Use `E.object<T>({...})` for structured serialization.
- Use `E.optional(encoder)` to omit fields when `undefined`.
- Transform inputs with `.rmap(fn)` (contravariant — transforms input before encoding).
  ```ts
  const dateEncoder = E.string.rmap((d: Date) => d.toISOString())
  const userIdEncoder = E.string.rmap((id: UserId) => id.value)
  ```
- Use `E.oneOf<T>(selector)` for dynamic encoder selection.
- Use `E.both(enc1, enc2)` to merge encoder outputs.
- Must call `.run(value)` to execute — `Encoder<A>` is a description, not a result.
- Don't use `E.maybe()` for optional fields — it produces `{ just: V }` structure. Use `E.optional()`.
- `E.EncoderOptional` only works within `E.object()` field definitions.

### Schemas — Bidirectional Mapping

- A `Schema` is a combined `Decoder` + `Encoder`. Build with `s.string.dimap(decode, encode)`.
- Keep schemas as `static schema` on domain classes (and on the generic `Id<T>`) — co-location keeps the schema and the type it describes in sync as the class evolves.

  ```ts
  class Id<T> {
    // @ts-expect-error the existence of _tag prevents structural comparison
    private readonly _tag: T | null = null
    constructor(public value: string) {}
    static schema<T>() {
      return s.string.dimap(
        (v) => new Id<T>(v),
        (id) => id.value
      )
    }
  }

  class Message {
    static schema = Id.schema<Message>()
    constructor(readonly id: Id<Message>) {}
  }
  ```

- Use `s.discriminatedUnion` + `s.variant` for sum types.
  ```ts
  const Message = s.discriminatedUnion([
    s.variant({ type: "error", code: s.number, message: s.string }),
    s.variant({ type: "success", value: s.string }),
  ])
  type Message = s.Infer<typeof Message>
  ```
- Use `s.optional()` for missing keys. Use `s.nullable()` for present-but-null values. Don't combine into `s.optional(s.maybe(x))` — that's `SchemaOptional<Maybe<T> | undefined>`, so a missing key still surfaces as `undefined` next to `Nothing`. Use `s.optionalMaybe(x)` when a missing key should decode straight to `Maybe<T>`.

---

## API Response Compatibility

**A shipped mobile build decodes every response against the schema it was compiled with.** The web app
recompiles against the backend on every deploy, so it cannot skew; an installed app on someone's phone
can be months behind. Changing a response schema is therefore a change to a contract you have already
shipped and cannot recall.

**Nothing checks this for you.** CI runs eslint plus a mobile typecheck, and that typecheck compiles
_current_ mobile against _current_ backend — it proves the repo is self-consistent at HEAD and says
nothing about the builds in the field. A backend-only PR skips the mobile jobs entirely. This section
is the check.

### What breaks an installed build

Verified against the decoder, not assumed:

| Change to a response schema                                 | Effect on an older build                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| **Add** a field                                             | Safe — unknown keys are stripped during decode               |
| **Remove** or **rename** a field                            | **Breaks** — the field it requires is now absent             |
| **Add a member to an enum**                                 | **Breaks** — the value is not in the set it compiled against |
| **Narrow** a type (`nullable` → required, widen → restrict) | **Breaks**                                                   |

Array decoding is **all-or-nothing**: one row carrying an unknown enum member fails the _entire list_,
not just that row. The offline layer then degrades the failed read into stale cache, so the user sees
old data with nothing to act on rather than an error.

**Adding an enum member is the trap.** It reads as purely additive, reviews as harmless, and is the
single most likely way to break the fleet.

```ts
// ✗ breaks every installed build the moment one activity uses the new member
const schema_activityChannel = s.stringEnum(["alcohol_on_prem", "alcohol_off_prem", "cannabis", "perfume"])

// ✓ additive: old builds strip what they don't know, new builds read it
const schema_activityView = s.object({
  activityChannel: schema_activityChannel,
  fragranceCategory: s.optionalNullable(s.string), // new field, not a new member
})
```

### What to do when a change is breaking

Three options, in order of preference:

1. **Make it additive instead.** A new optional field beside the old one, rather than a change to the
   old one. Costs a deprecated field; costs no upgrade.
2. **Send a compatibility view.** Derive the retired shape per request so old builds still decode, and
   document it as ignorable — `schema_activityVenueSnapshotView` and `toVenueSnapshotView` are the
   worked example (IMP-1722). **Never write filler into an event to achieve this**: a response is
   discarded the moment it decodes, but a permanent log poisons what history can later be asked.
3. **Raise the version floor.** `MIN_MOBILE_VERSION_IOS` / `MIN_MOBILE_VERSION_ANDROID` in the three
   ambar manifests, enforced by `backend/src/app/clientVersion.ts`, which turns older builds away with
   `426 Upgrade Required`. This is a real cost to users — a forced store update before the app works
   again — so it needs a shipped build to upgrade _to_, and `MOBILE_STORE_URL` set, before it is
   raised.

A request carrying **no** version headers is always allowed, deliberately: every build shipped before
the headers existed sends none, and treating their absence as a failure would lock out the whole fleet
at once. So the floor cannot protect you from a build older than the handshake itself — only options 1
and 2 can.

### Which endpoints this applies to

Only what mobile actually consumes — check `mobile/src/api/endpoints.ts` before assuming. Web-only
endpoints may change freely, because the web app recompiles with the backend. When in doubt, grep;
"probably not used by mobile" is not a finding.

---

## Numeric Data in Tables

Numbers in a table are read by scanning down a column and comparing them. Ragged decimals and left edges defeat that: a column where `8` sits above `12.5` above `4` forces the reader to align the digits themselves, and two columns that round differently are read as a discrepancy rather than as a formatting choice. Format and align every figure the same way so the column does that work.

- **Format every quantity through `@fe/lib/format/numeric`.** `formatMoney(money)` → two decimals (`$1,250.00`); `formatHours(n)` → one decimal (`8` → `"8.0"`). Don't hand-roll with `toFixed`, template literals, or a local `Intl.NumberFormat` — a second formatter is a second rounding rule.

  ```tsx
  import { formatMoney, formatHours } from "@fe/lib/format/numeric"
  ```

  One decimal for hours is deliberate: pay is scheduled in half- and quarter-hours, so a second decimal is false precision while a whole number hides the half-hour that got paid.

- **Right-align numeric quantities** with `align: "right"` on the `ColumnDef`, and pair it with `tabular-nums` on the cell so digits sit in fixed-width columns.

  ```tsx
  regHours: new ColumnDef({
    label: "Reg Hours",
    sortFun: (a: PayrollSummaryRow, b: PayrollSummaryRow) => a.regHours - b.regHours,
    align: "right",
  }),
  // contents:
  regHours: <span className="tabular-nums">{formatHours(row.regHours)}</span>,
  ```

- **Identifiers that happen to be digits stay left-aligned** — employee numbers, invoice numbers, ZIPs, job ids. They are labels, not measures; nobody sums them, and right-aligning them makes a column of unrelated strings look like a total. Right-align only what could sensibly be added up: money, hours, counts, sizes, durations.

- **Sort on the underlying number, never the formatted string.** `sortFun` reads the typed row value (`a.regHours - b.regHours`, `a.total.amountInMinorUnits - b.total.amountInMinorUnits`), so `"10.0"` doesn't sort before `"9.0"`.

- **Distinguish "no value" from a real zero.** Render absent figures as an em dash (`—`), not `$0.00` or `0.0` — a promoter who worked no shifts reads differently from one who worked and earned nothing.

- **Composite durations keep their own format.** An event window renders as `2h 30m` via `formatDurationMinutes` — it is a span of time, not a decimal quantity of hours. Right-align it like any other measure, but don't push it through `formatHours`.

- **Drop unit suffixes that the header already carries.** A count column titled "Activities" renders `12`, not `12 activities` — and a suffix whose length varies with the value (`1 activity` / `12 activities`) puts the digits back out of line, defeating the alignment it sits in.

- **Composite and interactive cells are exempt.** A cell that is really a control (an editable rate with a pencil affordance) or a stack (an amount above an amendment note, beside a warning icon and a badge) has no single right edge to align on; forcing one drags icons, badges and prose to the wrong side. Keep the figure itself formatted and `tabular-nums`, but leave the column's default alignment. The rule is for columns of plain figures.

- **Exports are not tables.** CSV columns are an interchange contract with the receiving system (ADP, accounting), so their precision is fixed by that contract, not by this rule. Don't "align" a CSV to match a screen.
