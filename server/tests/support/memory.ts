import { Future } from "@lib/future"
import { Aggregate, Id, type IdOf } from "@be/lib/event-sourcing/event"
import {
  DatabaseEntry,
  EventStoreDatabase,
  WithEventStore,
  createEventStore,
  evaluate,
} from "@be/lib/event-sourcing/store"
import { schemas } from "@be/app/events"

/** Exercises the real encoder/hydrator; only persistence is replaced. */
export class MemoryEventDatabase implements EventStoreDatabase {
  readonly entries: DatabaseEntry[] = []

  async exists(id: Id<"Event">): Promise<boolean> {
    return this.entries.some((entry) => entry.event_id.value === id.value)
  }

  async findAll<T extends Aggregate<string>>(id: IdOf<T>): Promise<DatabaseEntry[]> {
    return this.entries
      .filter((entry) => entry.aggregate_id.value === id.value)
      .sort((a, b) => a.aggregate_version - b.aggregate_version)
  }

  async insert(entry: DatabaseEntry): Promise<void> {
    if (
      this.entries.some(
        (saved) =>
          saved.event_id.value === entry.event_id.value ||
          (saved.aggregate_id.value === entry.aggregate_id.value && saved.aggregate_version === entry.aggregate_version)
      )
    ) {
      throw new Error("Duplicate event or aggregate version")
    }
    this.entries.push({
      ...entry,
      payload: JSON.parse(JSON.stringify(entry.payload)),
    })
  }

  readonly withEventStore: WithEventStore = (onError, procedure) =>
    Future.attemptP(() => evaluate(createEventStore(this, schemas), procedure)).mapRej(onError)
}
