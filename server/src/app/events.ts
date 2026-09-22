import { CSchema, Schemas, TSchema } from "@be/lib/event-sourcing/store"
import { NoteCreated } from "@be/domain/note/events/note/noteCreated"
import { NoteUpdated } from "@be/domain/note/events/note/noteUpdated"
import { NoteDeleted } from "@be/domain/note/events/note/noteDeleted"
import { UserRegistered } from "@be/domain/user/events/user/userRegistered"

/** Registers every event class with the event store's schema registry, so it can encode/decode them by type name. */
export const schemas = new Schemas([
  new CSchema(NoteCreated.aggregate, NoteCreated.schema, NoteCreated.type),
  new TSchema(NoteUpdated.aggregate, NoteUpdated.schema, NoteUpdated.type),
  new TSchema(NoteDeleted.aggregate, NoteDeleted.schema, NoteDeleted.type),
  new CSchema(UserRegistered.aggregate, UserRegistered.schema, UserRegistered.type),
])
