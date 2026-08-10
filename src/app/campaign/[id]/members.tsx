import { router, useLocalSearchParams } from "expo-router";

import { useState } from "react";

import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useCampaigns } from "../../../context/CampaignContext";

import { CampaignMemberRole } from "../../../models/Campaign";

import { getWalletTotalBaseValue } from "../../../models/Currency";

export default function CampaignMembersScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, addCampaignMember } = useCampaigns();

  const campaign = getCampaignById(id);

  const [displayName, setDisplayName] = useState("");

  const [characterName, setCharacterName] = useState("");

  const [role, setRole] = useState<CampaignMemberRole>("player");

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
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

  function handleAddMember() {
    const result = addCampaignMember({
      campaignId: campaign.id,

      displayName,

      characterName,

      role,
    });

    if (!result.success) {
      Alert.alert(
        "Unable to Add Member",
        result.message ?? "The member could not be added.",
      );

      return;
    }

    setDisplayName("");

    setCharacterName("");

    setRole("player");

    Alert.alert(
      "Member Added",
      `${result.member?.displayName} joined the campaign.`,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Campaign</Text>
        </Pressable>

        <Text style={styles.title}>Campaign Members</Text>

        <Text style={styles.subtitle}>
          {campaign.members.length}{" "}
          {campaign.members.length === 1 ? "member" : "members"}
        </Text>

        <View style={styles.memberList}>
          {campaign.members.map((member) => {
            const characterTotal = member.character
              ? getWalletTotalBaseValue(
                  member.character.wallet,
                  campaign.currencySystem,
                )
              : null;

            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.displayName}</Text>

                    {member.character ? (
                      <Text style={styles.characterName}>
                        {member.character.name}
                      </Text>
                    ) : (
                      <Text style={styles.noCharacter}>No character</Text>
                    )}
                  </View>

                  {member.character ? (
                    <View style={styles.wealthBox}>
                      <Text style={styles.wealthLabel}>Wealth</Text>

                      <Text style={styles.wealthValue}>{characterTotal}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.badges}>
                  {member.isOwner ? (
                    <RoleBadge label="Owner" highlighted />
                  ) : null}

                  <RoleBadge label={formatRole(member.role)} />
                </View>
              </View>
            );
          })}
        </View>

        {campaign.campaignType === "multiplayer" ? (
          <>
            <Text style={styles.sectionTitle}>Add Test Member</Text>

            <Text style={styles.helperText}>
              This is temporary development functionality. Real multiplayer
              joining will replace it later.
            </Text>

            <Text style={styles.label}>Player Name</Text>

            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Player name"
              placeholderTextColor="#746D63"
              style={styles.input}
            />

            <Text style={styles.label}>Character Name</Text>

            <TextInput
              value={characterName}
              onChangeText={setCharacterName}
              placeholder={role === "dm" ? "Optional for DM" : "Character name"}
              placeholderTextColor="#746D63"
              style={styles.input}
            />

            <Text style={styles.label}>Role</Text>

            <RoleOption
              label="Player"
              selected={role === "player"}
              onPress={() => setRole("player")}
            />

            <RoleOption
              label="Dungeon Master"
              selected={role === "dm"}
              onPress={() => setRole("dm")}
            />

            <RoleOption
              label="Party Leader"
              selected={role === "party-leader"}
              onPress={() => setRole("party-leader")}
            />

            <RoleOption
              label="Treasurer"
              selected={role === "treasurer"}
              onPress={() => setRole("treasurer")}
            />

            <Pressable style={styles.primaryButton} onPress={handleAddMember}>
              <Text style={styles.primaryButtonText}>Add Member</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.soloCard}>
            <Text style={styles.soloTitle}>Solo Campaign</Text>

            <Text style={styles.soloDescription}>
              You have full access to campaign management features. Multiplayer
              roles are not required.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRole(role: CampaignMemberRole) {
  switch (role) {
    case "dm":
      return "Dungeon Master";

    case "party-leader":
      return "Party Leader";

    case "treasurer":
      return "Treasurer";

    default:
      return "Player";
  }
}

function RoleBadge({
  label,
  highlighted = false,
}: {
  label: string;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.badge, highlighted && styles.highlightedBadge]}>
      <Text
        style={[styles.badgeText, highlighted && styles.highlightedBadgeText]}
      >
        {label}
      </Text>
    </View>
  );
}

function RoleOption({
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
      onPress={onPress}
      style={[styles.roleOption, selected && styles.roleOptionSelected]}
    >
      <Text
        style={[
          styles.roleOptionText,
          selected && styles.roleOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12100E",
  },

  content: {
    width: "100%",
    maxWidth: 700,
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
    fontSize: 14,
    marginTop: 5,
    marginBottom: 22,
  },

  memberList: {
    gap: 12,
  },

  memberCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
  },

  characterName: {
    color: "#D9A441",
    fontSize: 15,
    marginTop: 5,
  },

  noCharacter: {
    color: "#81786D",
    fontSize: 14,
    marginTop: 5,
    fontStyle: "italic",
  },

  wealthBox: {
    alignItems: "flex-end",
  },

  wealthLabel: {
    color: "#81786D",
    fontSize: 11,
  },

  wealthValue: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 3,
  },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 14,
  },

  badge: {
    backgroundColor: "#25211C",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  highlightedBadge: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  badgeText: {
    color: "#B9AFA2",
    fontSize: 11,
    fontWeight: "600",
  },

  highlightedBadgeText: {
    color: "#D9A441",
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 32,
    marginBottom: 7,
  },

  helperText: {
    color: "#81786D",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },

  label: {
    color: "#F2E8D5",
    fontSize: 14,
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 10,
    color: "#F2E8D5",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },

  roleOption: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },

  roleOptionSelected: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  roleOptionText: {
    color: "#B9AFA2",
    fontSize: 15,
  },

  roleOptionTextSelected: {
    color: "#D9A441",
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 11,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  soloCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 14,
    padding: 18,
    marginTop: 28,
  },

  soloTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
  },

  soloDescription: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  notFoundTitle: {
    color: "#F2E8D5",
    fontSize: 24,
    fontWeight: "700",
  },
});
