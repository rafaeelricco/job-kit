export { FilterBar }
export type { FilterBarProps }

import {
  Columns3Icon,
  LayoutGridIcon,
  ListFilterIcon,
  Rows3Icon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ColumnId, View } from "@/module/scout/helpers/columns"
import {
  COLUMNS,
  VIEWS,
  columnLabel,
  isView,
} from "@/module/scout/helpers/columns"
import type { Filter, Segment } from "@/module/scout/helpers/select"
import { SEGMENTS } from "@/module/scout/helpers/select"
import type { Bucket, Channel, Lifecycle } from "@/module/scout/types"
import { BUCKETS, CHANNELS, LIFECYCLES } from "@/module/scout/types"

type FilterBarProps = {
  readonly filter: Filter
  readonly onFilter: (next: Filter) => void
  readonly view: View
  readonly onView: (next: View) => void
  readonly columns: readonly ColumnId[]
  readonly onColumns: (next: readonly ColumnId[]) => void
  readonly total: number
  readonly shown: number
}

// The one score threshold the toolbar offers; the model keeps a full number.
const HIGH_SCORE = 8

const SEGMENT_LABELS: Readonly<Record<Segment, string>> = {
  all: "All",
  new: "New",
  applied: "Applied",
  dead: "Dead",
}

const VIEW_LABELS: Readonly<Record<View, string>> = {
  table: "Table",
  cards: "Cards",
}

const isSegment = (raw: unknown): raw is Segment =>
  typeof raw === "string" && (SEGMENTS as readonly string[]).includes(raw)

// Never mutates: the parent still holds the array we were handed.
function toggled<T>(chosen: readonly T[], value: T): readonly T[] {
  return chosen.includes(value)
    ? chosen.filter((one) => one !== value)
    : [...chosen, value]
}

// A removable facet value, flattened so the chip row does not branch per facet.
type Chip = {
  readonly key: string
  readonly label: string
  readonly remove: () => void
}

function FilterBar(props: FilterBarProps) {
  const { columns, filter, onColumns, onFilter, onView, shown, total, view } =
    props

  const setBuckets = (value: Bucket) =>
    onFilter({ ...filter, buckets: toggled(filter.buckets, value) })
  const setChannels = (value: Channel) =>
    onFilter({ ...filter, channels: toggled(filter.channels, value) })
  const setStatuses = (value: Lifecycle) =>
    onFilter({ ...filter, statuses: toggled(filter.statuses, value) })
  const setMinScore = (value: number) =>
    onFilter({ ...filter, minScore: value })

  const highOnly = filter.minScore >= HIGH_SCORE

  // Rebuilt from COLUMNS so re-adding a column restores its table position.
  const toggleColumn = (id: ColumnId) => {
    const next = columns.includes(id)
      ? columns.filter((one) => one !== id)
      : COLUMNS.filter((one) => one === id || columns.includes(one))
    if (next.length === 0) return
    onColumns(next)
  }

  const chips: readonly Chip[] = [
    ...filter.buckets.map((value) => ({
      key: `bucket:${value}`,
      label: `Route: ${value}`,
      remove: () => setBuckets(value),
    })),
    ...filter.channels.map((value) => ({
      key: `channel:${value}`,
      label: `Channel: ${value}`,
      remove: () => setChannels(value),
    })),
    ...filter.statuses.map((value) => ({
      key: `status:${value}`,
      label: `Status: ${value}`,
      remove: () => setStatuses(value),
    })),
    ...(filter.minScore > 0
      ? [
          {
            key: "min-score",
            label: `Score ${filter.minScore}+`,
            remove: () => setMinScore(0),
          },
        ]
      : []),
  ]

  const clearAll = () =>
    onFilter({
      ...filter,
      minScore: 0,
      buckets: [],
      channels: [],
      statuses: [],
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-56 sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter.query}
            onChange={(event) =>
              onFilter({ ...filter, query: event.target.value })
            }
            placeholder="Search company, role, stack"
            aria-label="Search company, role, stack"
            className="pl-8"
          />
        </div>

        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <ListFilterIcon />
            Filter
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <Command>
              <CommandList>
                <CommandGroup heading="Route">
                  {BUCKETS.map((value) => (
                    <CommandItem
                      key={value}
                      value={`route ${value}`}
                      data-checked={filter.buckets.includes(value)}
                      onSelect={() => setBuckets(value)}
                    >
                      {value}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Channel">
                  {CHANNELS.map((value) => (
                    <CommandItem
                      key={value}
                      value={`channel ${value}`}
                      data-checked={filter.channels.includes(value)}
                      onSelect={() => setChannels(value)}
                    >
                      {value}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Status">
                  {LIFECYCLES.map((value) => (
                    <CommandItem
                      key={value}
                      value={`status ${value}`}
                      data-checked={filter.statuses.includes(value)}
                      onSelect={() => setStatuses(value)}
                    >
                      {value}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Score">
                  <CommandItem
                    value="score 8 plus"
                    data-checked={highOnly}
                    onSelect={() => setMinScore(highOnly ? 0 : HIGH_SCORE)}
                  >
                    Score 8+
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <Columns3Icon />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {/* Base UI requires a label to sit inside a group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map((id) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={columns.includes(id)}
                  onCheckedChange={() => toggleColumn(id)}
                >
                  {columnLabel(id)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToggleGroup
          variant="outline"
          spacing={0}
          value={[view]}
          onValueChange={(next) => {
            const first = next[0]
            // An empty array means the user unpressed the active view; a list
            // always needs one, so keep the current one.
            if (first !== undefined && isView(first)) onView(first)
          }}
          aria-label="View"
        >
          {VIEWS.map((id) => (
            <ToggleGroupItem
              key={id}
              value={id}
              aria-label={VIEW_LABELS[id]}
              title={VIEW_LABELS[id]}
            >
              {id === "table" ? <Rows3Icon /> : <LayoutGridIcon />}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Tabs
          value={filter.segment}
          onValueChange={(next: unknown) => {
            if (isSegment(next)) onFilter({ ...filter, segment: next })
          }}
        >
          <TabsList>
            {SEGMENTS.map((segment) => (
              <TabsTrigger key={segment} value={segment}>
                {SEGMENT_LABELS[segment]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="outline" className="pr-1">
              {chip.label}
              <button
                type="button"
                onClick={chip.remove}
                aria-label={`Remove ${chip.label}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="link" size="xs" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {shown.toLocaleString()} of {total.toLocaleString()}
      </p>
    </div>
  )
}
