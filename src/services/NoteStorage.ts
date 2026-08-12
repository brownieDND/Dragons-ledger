import AsyncStorage from "@react-native-async-storage/async-storage";

import { CampaignNote, NewCampaignNote } from "../models/Note";

const STORAGE_KEY = "@dragons-ledger/notes";

export async function loadNotes(): Promise<CampaignNote[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  const parsed = JSON.parse(storedValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as CampaignNote[];
}

export async function saveNotes(notes: CampaignNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export async function createNote(newNote: NewCampaignNote) {
  const notes = await loadNotes();

  const now = new Date().toISOString();

  const note: CampaignNote = {
    id: createNoteId(),

    campaignId: newNote.campaignId,

    ownerMemberId: newNote.ownerMemberId,

    section: normalizeSection(newNote.section),

    title: newNote.title.trim(),

    content: newNote.content.trim(),

    isShared: false,

    createdAt: now,

    updatedAt: now,
  };

  const updatedNotes = [note, ...notes];

  await saveNotes(updatedNotes);

  return {
    note,
    notes: updatedNotes,
  };
}

export async function updateNote(
  noteId: string,
  section: string,
  title: string,
  content: string,
) {
  const notes = await loadNotes();

  const updatedAt = new Date().toISOString();

  const updatedNotes = notes.map((note) => {
    if (note.id !== noteId) {
      return note;
    }

    return {
      ...note,

      section: normalizeSection(section),

      title: title.trim(),

      content: content.trim(),

      updatedAt,
    };
  });

  await saveNotes(updatedNotes);

  return updatedNotes;
}

export async function deleteNote(noteId: string) {
  const notes = await loadNotes();

  const updatedNotes = notes.filter((note) => note.id !== noteId);

  await saveNotes(updatedNotes);

  return updatedNotes;
}

function normalizeSection(section: string) {
  const cleaned = section.trim();

  return cleaned || "General";
}

function createNoteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
