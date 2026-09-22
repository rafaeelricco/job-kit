import { endpoint as note_createNote } from "@be/domain/note/command/createNote.api"
import { endpoint as note_updateNote } from "@be/domain/note/command/updateNote.api"
import { endpoint as note_deleteNote } from "@be/domain/note/command/deleteNote.api"
import { endpoint as note_query_note } from "@be/domain/note/query/getNote.api"
import { endpoint as note_query_notes } from "@be/domain/note/query/listNotes.api"

export const api = {
  command: { note_createNote, note_updateNote, note_deleteNote },
  query: { note_query_note, note_query_notes },
}
