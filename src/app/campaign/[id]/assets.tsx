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

import { PartyAsset } from "../../../models/Asset";

import {
    createAsset,
    deleteAsset,
    loadAssets,
    updateAsset,
} from "../../../services/AssetStorage";

export default function AssetsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, getActiveCampaignMember, getActiveSession } =
    useCampaigns();

  const campaign = getCampaignById(id);

  const activeMember = campaign
    ? getActiveCampaignMember(campaign.id)
    : undefined;

  const activeSession = campaign ? getActiveSession(campaign.id) : undefined;

  const [assets, setAssets] = useState<PartyAsset[]>([]);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [quantity, setQuantity] = useState("1");

  const [notes, setNotes] = useState("");

  const [isHidden, setIsHidden] = useState(false);

  const [assignedMemberId, setAssignedMemberId] = useState<string | undefined>(
    undefined,
  );

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function reloadAssets() {
        setIsLoading(true);

        try {
          const storedAssets = await loadAssets();

          if (cancelled) {
            return;
          }

          setAssets(storedAssets);

          setErrorMessage("");
        } catch (error) {
          console.error("Failed to load assets:", error);

          if (!cancelled) {
            setErrorMessage("Party Assets could not be loaded.");
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      }

      void reloadAssets();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const campaignAssets = useMemo(() => {
    if (!campaign) {
      return [];
    }

    return assets
      .filter((asset) => asset.campaignId === campaign.id)
      .filter((asset) => {
        if (campaign.campaignType === "solo") {
          return true;
        }

        if (activeMember?.role === "dm") {
          return true;
        }

        return !asset.isHidden;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [assets, campaign, activeMember]);

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
        </View>
      </SafeAreaView>
    );
  }

  const focusRestricted =
    campaign.campaignType === "multiplayer" &&
    Boolean(activeSession?.focusModeEnabled) &&
    activeMember.role !== "dm";

  const canManageAssets =
    campaign.campaignType === "solo" ||
    activeMember.role === "dm" ||
    activeMember.role === "party-leader" ||
    activeMember.role === "treasurer";

  const canControlHidden =
    campaign.campaignType === "solo" || activeMember.role === "dm";

  const assignableMembers = campaign.members.filter((member) =>
    Boolean(member.character),
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace({
      pathname: "/campaign/[id]",

      params: {
        id: campaign.id,
      },
    });
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function resetEditor() {
    setEditingAssetId(null);

    setName("");

    setDescription("");

    setQuantity("1");

    setNotes("");

    setIsHidden(false);

    setAssignedMemberId(undefined);
  }

  function handleEditAsset(asset: PartyAsset) {
    clearMessages();

    if (!canManageAssets) {
      setErrorMessage("You do not have permission to manage Party Assets.");

      return;
    }

    if (asset.isHidden && !canControlHidden) {
      setErrorMessage("Only the Dungeon Master can manage hidden assets.");

      return;
    }

    setEditingAssetId(asset.id);

    setName(asset.name);

    setDescription(asset.description);

    setQuantity(`${asset.quantity}`);

    setNotes(asset.notes);

    setIsHidden(asset.isHidden);

    setAssignedMemberId(asset.assignedMemberId);

    setDeleteConfirmationId(null);
  }

  function handleCancelEdit() {
    clearMessages();
    resetEditor();
  }

  async function handleSaveAsset() {
    clearMessages();

    if (!canManageAssets) {
      setErrorMessage("You do not have permission to manage Party Assets.");

      return;
    }

    const cleanedName = name.trim();

    const cleanedDescription = description.trim();

    const cleanedNotes = notes.trim();

    const numericQuantity = Number(quantity);

    if (!cleanedName) {
      setErrorMessage("Enter a name for the asset.");

      return;
    }

    if (cleanedName.length > 100) {
      setErrorMessage("Asset names are limited to 100 characters.");

      return;
    }

    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      setErrorMessage("Quantity must be a whole number greater than zero.");

      return;
    }

    if (numericQuantity > 999999) {
      setErrorMessage("Quantity is too large.");

      return;
    }

    if (cleanedDescription.length > 1000) {
      setErrorMessage("Descriptions are limited to 1,000 characters.");

      return;
    }

    if (cleanedNotes.length > 5000) {
      setErrorMessage("Asset notes are limited to 5,000 characters.");

      return;
    }

    if (isHidden && !canControlHidden) {
      setErrorMessage("Only the Dungeon Master can create hidden assets.");

      return;
    }

    if (
      assignedMemberId &&
      !assignableMembers.some((member) => member.id === assignedMemberId)
    ) {
      setErrorMessage("The selected character could not be found.");

      return;
    }

    try {
      if (editingAssetId) {
        const existingAsset = campaignAssets.find(
          (asset) => asset.id === editingAssetId,
        );

        if (!existingAsset) {
          setErrorMessage("The asset being edited could not be found.");

          return;
        }

        const updatedAssets = await updateAsset(editingAssetId, {
          name: cleanedName,

          description: cleanedDescription,

          quantity: numericQuantity,

          notes: cleanedNotes,

          isHidden,

          assignedMemberId,
        });

        setAssets(updatedAssets);

        setSuccessMessage("Party Asset updated.");
      } else {
        const result = await createAsset({
          campaignId: campaign.id,

          name: cleanedName,

          description: cleanedDescription,

          quantity: numericQuantity,

          notes: cleanedNotes,

          isHidden,

          assignedMemberId,

          createdByMemberId: activeMember.id,
        });

        setAssets(result.assets);

        setSuccessMessage(
          isHidden ? "Hidden Party Asset created." : "Party Asset created.",
        );
      }

      resetEditor();
    } catch (error) {
      console.error("Failed to save asset:", error);

      setErrorMessage("The Party Asset could not be saved.");
    }
  }

  async function handleDeleteAsset(assetId: string) {
    clearMessages();

    if (!canManageAssets) {
      setErrorMessage("You do not have permission to delete Party Assets.");

      return;
    }

    const asset = campaignAssets.find((candidate) => candidate.id === assetId);

    if (!asset) {
      setErrorMessage("The Party Asset could not be found.");

      return;
    }

    if (asset.isHidden && !canControlHidden) {
      setErrorMessage("Only the Dungeon Master can delete hidden assets.");

      return;
    }

    try {
      const updatedAssets = await deleteAsset(assetId);

      setAssets(updatedAssets);

      setDeleteConfirmationId(null);

      if (editingAssetId === assetId) {
        resetEditor();
      }

      setSuccessMessage("Party Asset deleted.");
    } catch (error) {
      console.error("Failed to delete asset:", error);

      setErrorMessage("The Party Asset could not be deleted.");
    }
  }

  function getAssignedLabel(asset: PartyAsset) {
    if (!asset.assignedMemberId) {
      return "Party Inventory";
    }

    const member = campaign.members.find(
      (candidate) => candidate.id === asset.assignedMemberId,
    );

    if (!member) {
      return "Unknown Character";
    }

    return member.character?.name ?? member.displayName;
  }

  if (focusRestricted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.focusBlockedContainer}>
          <Text style={styles.focusBlockedLabel}>FOCUS MODE</Text>

          <Text style={styles.focusBlockedTitle}>
            Party Assets are temporarily unavailable
          </Text>

          <Text style={styles.focusBlockedText}>
            Return to the campaign Focus Mode screen to continue the session.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: "/campaign/[id]",

                params: {
                  id: campaign.id,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Return to Focus Mode</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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

        <Text style={styles.title}>Party Assets</Text>

        <Text style={styles.subtitle}>{campaign.name}</Text>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>VISIBLE ASSETS</Text>

            <Text style={styles.summaryValue}>
              {campaignAssets.filter((asset) => !asset.isHidden).length}
            </Text>
          </View>

          {canControlHidden ? (
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>HIDDEN</Text>

              <Text style={styles.hiddenSummaryValue}>
                {campaignAssets.filter((asset) => asset.isHidden).length}
              </Text>
            </View>
          ) : null}
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

        {canManageAssets ? (
          <>
            <Text style={styles.sectionTitle}>
              {editingAssetId ? "Edit Asset" : "Add Asset"}
            </Text>

            <View style={styles.editorCard}>
              <Text style={styles.label}>Name</Text>

              <TextInput
                value={name}
                onChangeText={(value) => {
                  if (value.length <= 100) {
                    setName(value);
                  }

                  clearMessages();
                }}
                placeholder="Example: Potion of Healing"
                placeholderTextColor="#746D63"
                style={styles.input}
              />

              <Text style={styles.label}>Quantity</Text>

              <TextInput
                value={quantity}
                onChangeText={(value) => {
                  setQuantity(value);
                  clearMessages();
                }}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#746D63"
                style={styles.input}
              />

              <Text style={styles.label}>Description</Text>

              <TextInput
                value={description}
                onChangeText={(value) => {
                  if (value.length <= 1000) {
                    setDescription(value);
                  }

                  clearMessages();
                }}
                placeholder="What is this item?"
                placeholderTextColor="#746D63"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.descriptionInput]}
              />

              <Text style={styles.label}>Assigned To</Text>

              <View style={styles.assignmentGrid}>
                <AssignmentButton
                  label="Party Inventory"
                  selected={!assignedMemberId}
                  onPress={() => {
                    setAssignedMemberId(undefined);

                    clearMessages();
                  }}
                />

                {assignableMembers.map((member) => (
                  <AssignmentButton
                    key={member.id}
                    label={member.character?.name ?? member.displayName}
                    selected={assignedMemberId === member.id}
                    onPress={() => {
                      setAssignedMemberId(member.id);

                      clearMessages();
                    }}
                  />
                ))}
              </View>

              {canControlHidden ? (
                <>
                  <Text style={styles.label}>Visibility</Text>

                  <View style={styles.visibilityGrid}>
                    <AssignmentButton
                      label="Visible to Party"
                      selected={!isHidden}
                      onPress={() => {
                        setIsHidden(false);

                        clearMessages();
                      }}
                    />

                    <AssignmentButton
                      label="Hidden from Party"
                      selected={isHidden}
                      onPress={() => {
                        setIsHidden(true);

                        clearMessages();
                      }}
                    />
                  </View>

                  <Text style={styles.helperText}>
                    Hidden assets are visible only to the Dungeon Master.
                  </Text>
                </>
              ) : null}

              <Text style={styles.label}>Notes</Text>

              <TextInput
                value={notes}
                onChangeText={(value) => {
                  if (value.length <= 5000) {
                    setNotes(value);
                  }

                  clearMessages();
                }}
                placeholder="Optional details, effects, ownership notes, etc."
                placeholderTextColor="#746D63"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.notesInput]}
              />

              <Pressable style={styles.primaryButton} onPress={handleSaveAsset}>
                <Text style={styles.primaryButtonText}>
                  {editingAssetId ? "Save Changes" : "Add Party Asset"}
                </Text>
              </Pressable>

              {editingAssetId ? (
                <Pressable
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel Editing</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.viewOnlyCard}>
            <Text style={styles.viewOnlyTitle}>View Only</Text>

            <Text style={styles.viewOnlyText}>
              Party Assets are managed by the Dungeon Master, Party Leader, and
              Treasurer.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Party Inventory</Text>

        {isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading assets...</Text>
          </View>
        ) : campaignAssets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Party Assets yet.</Text>

            <Text style={styles.emptyText}>
              Shared items and assigned equipment will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.assetList}>
            {campaignAssets.map((asset) => (
              <View
                key={asset.id}
                style={[
                  styles.assetCard,

                  asset.isHidden ? styles.hiddenAssetCard : null,
                ]}
              >
                <View style={styles.assetHeader}>
                  <View style={styles.assetHeaderText}>
                    <Text style={styles.assetName}>{asset.name}</Text>

                    <Text style={styles.assetAssignment}>
                      {getAssignedLabel(asset)}
                    </Text>
                  </View>

                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityValue}>×{asset.quantity}</Text>
                  </View>
                </View>

                {asset.isHidden ? (
                  <View style={styles.hiddenBadge}>
                    <Text style={styles.hiddenBadgeText}>DM HIDDEN</Text>
                  </View>
                ) : null}

                {asset.description ? (
                  <Text style={styles.assetDescription}>
                    {asset.description}
                  </Text>
                ) : null}

                {asset.notes ? (
                  <View style={styles.assetNotesBox}>
                    <Text style={styles.assetNotesLabel}>NOTES</Text>

                    <Text style={styles.assetNotes}>{asset.notes}</Text>
                  </View>
                ) : null}

                <Text style={styles.assetUpdated}>
                  Updated {formatDate(asset.updatedAt)}
                </Text>

                {canManageAssets && (!asset.isHidden || canControlHidden) ? (
                  <View style={styles.assetActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEditAsset(asset)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </Pressable>

                    {deleteConfirmationId === asset.id ? (
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
                          onPress={() => handleDeleteAsset(asset.id)}
                        >
                          <Text style={styles.confirmDeleteButtonText}>
                            Delete
                          </Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => setDeleteConfirmationId(asset.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AssignmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.assignmentButton,

        selected ? styles.assignmentButtonSelected : null,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.assignmentButtonText,

          selected ? styles.assignmentButtonTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    maxWidth: 780,
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

  summaryCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryRight: {
    alignItems: "flex-end",
  },

  summaryLabel: {
    color: "#81786D",
    fontSize: 10,
    fontWeight: "800",
  },

  summaryValue: {
    color: "#D9A441",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },

  hiddenSummaryValue: {
    color: "#C96A6A",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
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
    marginTop: 15,
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

  descriptionInput: {
    minHeight: 90,
  },

  notesInput: {
    minHeight: 120,
  },

  helperText: {
    color: "#81786D",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  assignmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  visibilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  assignmentButton: {
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  assignmentButtonSelected: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  assignmentButtonText: {
    color: "#A99F91",
    fontSize: 12,
  },

  assignmentButtonTextSelected: {
    color: "#D9A441",
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 18,
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

  viewOnlyCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },

  viewOnlyTitle: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "700",
  },

  viewOnlyText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  assetList: {
    gap: 12,
  },

  assetCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  hiddenAssetCard: {
    backgroundColor: "#251717",
    borderColor: "#8B2E2E",
  },

  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  assetHeaderText: {
    flex: 1,
  },

  assetName: {
    color: "#F2E8D5",
    fontSize: 19,
    fontWeight: "700",
  },

  assetAssignment: {
    color: "#D9A441",
    fontSize: 12,
    marginTop: 4,
  },

  quantityBox: {
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  quantityValue: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "700",
  },

  hiddenBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3A1B1B",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 12,
  },

  hiddenBadgeText: {
    color: "#E08A8A",
    fontSize: 9,
    fontWeight: "800",
  },

  assetDescription: {
    color: "#CFC4B7",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },

  assetNotesBox: {
    backgroundColor: "#151310",
    borderRadius: 9,
    padding: 12,
    marginTop: 12,
  },

  assetNotesLabel: {
    color: "#81786D",
    fontSize: 9,
    fontWeight: "800",
  },

  assetNotes: {
    color: "#BFB4A7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  assetUpdated: {
    color: "#81786D",
    fontSize: 10,
    marginTop: 13,
  },

  assetActions: {
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

  focusBlockedContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  focusBlockedLabel: {
    color: "#C96A6A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  focusBlockedTitle: {
    color: "#D9A441",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },

  focusBlockedText: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
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
