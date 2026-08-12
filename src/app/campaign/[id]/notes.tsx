import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useMemo, useState } from "react";

import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useCampaigns } from "../../../context/CampaignContext";

import { CampaignNote } from "../../../models/Note";

import {
    createNote,
    deleteNote,
    loadNotes,
    updateNote,
} from "../../../services/NoteStorage";

export default function NotesScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, getActiveCampaignMember } = useCampaigns();

  const campaign = getCampaignById(id);

  const activeMember = campaign
    ? getActiveCampaignMember(campaign.id)
    : undefined;

  const [notes, setNotes] = useState<CampaignNote[]>([]);

  const [selectedSection, setSelectedSection] = useState("All");

  const [section, setSection] = useState("General");

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function reloadNotes() {
        setIsLoading(true);

        try {
          const storedNotes = await loadNotes();

          if (cancelled) {
            return;
          }

          setNotes(storedNotes);

          setErrorMessage("");
        } catch (error) {
          console.error("Failed to load notes:", error);

          if (!cancelled) {
            setErrorMessage("Notes could not be loaded.");
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      }

      void reloadNotes();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const memberNotes = useMemo(() => {
    if (!campaign || !activeMember) {
      return [];
    }

    return notes
      .filter(
        (note) =>
          note.campaignId === campaign.id &&
          note.ownerMemberId === activeMember.id,
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [notes, campaign, activeMember]);

  const sections = useMemo(() => {
    const sectionNames = Array.from(
      new Set(memberNotes.map((note) => note.section)),
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...sectionNames];
  }, [memberNotes]);

  const visibleNotes =
    selectedSection === "All"
      ? memberNotes
      : memberNotes.filter((note) => note.section === selectedSection);

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>Campaign not found</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>Return to Campaigns</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>Active member not found</Text>

          <Pressable style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Return to Campaign</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace({
      pathname: "/campaign/[id]",

      params: {
        id: campaign!.id,
      },
    });
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function resetEditor() {
    setEditingNoteId(null);
    setSection("General");
    setTitle("");
    setContent("");
  }

  function handleEditNote(note: CampaignNote) {
    clearMessages();

    setEditingNoteId(note.id);

    setSection(note.section);

    setTitle(note.title);

    setContent(note.content);

    setDeleteConfirmationId(null);
  }

  function handleCancelEdit() {
    clearMessages();
    resetEditor();
  }

  async function handleSaveNote() {
    clearMessages();

    const cleanedTitle = title.trim();

    const cleanedContent = content.trim();

    const cleanedSection = section.trim() || "General";

    if (!cleanedTitle) {
      setErrorMessage("Enter a title for the note.");

      return;
    }

    if (!cleanedContent) {
      setErrorMessage("Enter some content for the note.");

      return;
    }

    if (cleanedTitle.length > 100) {
      setErrorMessage("Note titles are limited to 100 characters.");

      return;
    }

    if (cleanedSection.length > 50) {
      setErrorMessage("Section names are limited to 50 characters.");

      return;
    }

    if (cleanedContent.length > 10000) {
      setErrorMessage("Notes are limited to 10,000 characters.");

      return;
    }

    try {
      if (editingNoteId) {
        const existingNote = memberNotes.find(
          (note) => note.id === editingNoteId,
        );

        if (!existingNote) {
          setErrorMessage("The note being edited could not be found.");

          return;
        }

        const updatedNotes = await updateNote(
          editingNoteId,
          cleanedSection,
          cleanedTitle,
          cleanedContent,
        );

        setNotes(updatedNotes);

        setSuccessMessage("Note updated.");
      } else {
        const result = await createNote({
          campaignId: campaign.id,

          ownerMemberId: activeMember.id,

          section: cleanedSection,

          title: cleanedTitle,

          content: cleanedContent,
        });

        setNotes(result.notes);

        setSuccessMessage("Note created.");
      }

      resetEditor();
    } catch (error) {
      console.error("Failed to save note:", error);

      setErrorMessage("The note could not be saved.");
    }
  }

  async function handleDeleteNote(noteId: string) {
    clearMessages();

    const note = memberNotes.find((candidate) => candidate.id === noteId);

    if (!note) {
      setErrorMessage("The note could not be found.");

      return;
    }

    try {
      const updatedNotes = await deleteNote(noteId);

      setNotes(updatedNotes);

      setDeleteConfirmationId(null);

      if (editingNoteId === noteId) {
        resetEditor();
      }

      setSuccessMessage("Note deleted.");
    } catch (error) {
      console.error("Failed to delete note:", error);

      setErrorMessage("The note could not be deleted.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={handleBack}>
          <Text style={styles.backText}>← Campaign</Text>
        </Pressable>

        <Text style={styles.title}>Notes</Text>

        <Text style={styles.subtitle}>{campaign.name}</Text>

        <View style={styles.identityCard}>
          <Text style={styles.identityLabel}>NOTES FOR</Text>

          <Text style={styles.identityName}>{activeMember.displayName}</Text>

          {activeMember.character ? (
            <Text style={styles.identityCharacter}>
              {activeMember.character.name}
            </Text>
          ) : null}

          <Text style={styles.identityHint}>
            These notes are currently private to this campaign member.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {editingNoteId ? "Edit Note" : "New Note"}
        </Text>

        <View style={styles.editorCard}>
          <Text style={styles.label}>Section</Text>

          <TextInput
            value={section}
            onChangeText={(value) => {
              if (value.length <= 50) {
                setSection(value);
              }

              clearMessages();
            }}
            placeholder="General"
            placeholderTextColor="#746D63"
            style={styles.input}
          />

          <Text style={styles.helperText}>
            Examples: General, Character, Session Notes, NPCs, Loot, Plans
          </Text>

          <Text style={styles.label}>Title</Text>

          <TextInput
            value={title}
            onChangeText={(value) => {
              if (value.length <= 100) {
                setTitle(value);
              }

              clearMessages();
            }}
            placeholder="Note title"
            placeholderTextColor="#746D63"
            style={styles.input}
          />

          <Text style={styles.label}>Note</Text>

          <TextInput
            value={content}
            onChangeText={(value) => {
              if (value.length <= 10000) {
                setContent(value);
              }

              clearMessages();
            }}
            placeholder="Write your notes here..."
            placeholderTextColor="#746D63"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.noteInput]}
          />

          <Text style={styles.characterCounter}>{content.length}/10000</Text>

          <Pressable style={styles.primaryButton} onPress={handleSaveNote}>
            <Text style={styles.primaryButtonText}>
              {editingNoteId ? "Save Changes" : "Create Note"}
            </Text>
          </Pressable>

          {editingNoteId ? (
            <Pressable style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel Editing</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Your Notes</Text>

        {sections.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionFilters}
          >
            {sections.map((sectionName) => (
              <Pressable
                key={sectionName}
                style={[
                  styles.sectionFilterButton,

                  selectedSection === sectionName
                    ? styles.sectionFilterButtonActive
                    : null,
                ]}
                onPress={() => setSelectedSection(sectionName)}
              >
                <Text
                  style={[
                    styles.sectionFilterText,

                    selectedSection === sectionName
                      ? styles.sectionFilterTextActive
                      : null,
                  ]}
                >
                  {sectionName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading notes...</Text>
          </View>
        ) : visibleNotes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No notes yet.</Text>

            <Text style={styles.emptyText}>
              Create a note above and it will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.noteList}>
            {visibleNotes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteHeaderText}>
                    <Text style={styles.noteSection}>{note.section}</Text>

                    <Text style={styles.noteTitle}>{note.title}</Text>
                  </View>

                  <Text style={styles.privateBadge}>PRIVATE</Text>
                </View>

                <Text style={styles.noteContent}>{note.content}</Text>

                <Text style={styles.noteUpdated}>
                  Updated {formatDate(note.updatedAt)}
                </Text>

                <View style={styles.noteActions}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => handleEditNote(note)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>

                  {deleteConfirmationId === note.id ? (
                    <>
                      <Pressable
                        style={styles.cancelDeleteButton}
                        onPress={() => setDeleteConfirmationId(null)}
                      >
                        <Text style={styles.cancelDeleteButtonText}>
                          Cancel
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.confirmDeleteButton}
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Text style={styles.confirmDeleteButtonText}>
                          Delete
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => setDeleteConfirmationId(note.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12100E",
  },

  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 60,
  },

  backText: {
    color: "#D9A441",
    fontSize: 15,
    marginBottom: 18,
  },

  title: {
    color: "#D9A441",
    fontSize: 30,
    fontWeight: "700",
  },

  subtitle: {
    color: "#A99F91",
    fontSize: 16,
    marginTop: 5,
    marginBottom: 18,
  },

  identityCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 16,
  },

  identityLabel: {
    color: "#81786D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  identityName: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  identityCharacter: {
    color: "#D9A441",
    fontSize: 13,
    marginTop: 3,
  },

  identityHint: {
    color: "#81786D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 12,
  },

  editorCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 14,
    padding: 18,
  },

  label: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 14,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 10,
    color: "#F2E8D5",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  noteInput: {
    minHeight: 180,
  },

  helperText: {
    color: "#81786D",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  characterCounter: {
    color: "#81786D",
    fontSize: 11,
    textAlign: "right",
    marginTop: 5,
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#81786D",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#A99F91",
    fontSize: 14,
    fontWeight: "600",
  },

  sectionFilters: {
    gap: 8,
    paddingBottom: 12,
  },

  sectionFilterButton: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  sectionFilterButtonActive: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  sectionFilterText: {
    color: "#A99F91",
    fontSize: 12,
  },

  sectionFilterTextActive: {
    color: "#D9A441",
    fontWeight: "700",
  },

  noteList: {
    gap: 12,
  },

  noteCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  noteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  noteHeaderText: {
    flex: 1,
  },

  noteSection: {
    color: "#D9A441",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  noteTitle: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  privateBadge: {
    color: "#81786D",
    fontSize: 9,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  noteContent: {
    color: "#CFC4B7",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 13,
  },

  noteUpdated: {
    color: "#81786D",
    fontSize: 10,
    marginTop: 14,
  },

  noteActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  editButton: {
    borderWidth: 1,
    borderColor: "#D9A441",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  editButtonText: {
    color: "#D9A441",
    fontSize: 13,
    fontWeight: "700",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  deleteButtonText: {
    color: "#C96A6A",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelDeleteButton: {
    borderWidth: 1,
    borderColor: "#81786D",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  cancelDeleteButtonText: {
    color: "#A99F91",
    fontSize: 13,
    fontWeight: "700",
  },

  confirmDeleteButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  confirmDeleteButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 18,
  },

  emptyTitle: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  errorCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 10,
    padding: 13,
    marginTop: 14,
  },

  errorText: {
    color: "#D8B5B5",
    fontSize: 13,
  },

  successCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 10,
    padding: 13,
    marginTop: 14,
  },

  successText: {
    color: "#C3D7BB",
    fontSize: 13,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  notFoundTitle: {
    color: "#F2E8D5",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
