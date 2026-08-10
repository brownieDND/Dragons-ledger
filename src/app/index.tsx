import { Link } from "expo-router";

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCampaigns } from "../context/CampaignContext";

export default function CampaignsScreen() {
  const { campaigns } = useCampaigns();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dragon's Ledger</Text>

        <Text style={styles.subtitle}>Your Campaigns</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No campaigns yet</Text>

            <Text style={styles.emptyText}>
              Create a campaign or join one to begin your adventure.
            </Text>
          </View>
        ) : (
          <View style={styles.campaignList}>
            {campaigns.map((campaign) => (
              <View key={campaign.id} style={styles.campaignCard}>
                <Text style={styles.campaignName}>{campaign.name}</Text>

                <Text style={styles.characterName}>
                  {campaign.characterName}
                </Text>

                <Text style={styles.campaignInfo}>
                  {formatGameSystem(campaign.gameSystem)}
                  {" • "}
                  {campaign.campaignType === "solo"
                    ? "Personal"
                    : "Multiplayer"}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Link href="/create-campaign" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Create Campaign</Text>
            </Pressable>
          </Link>

          <Link href="/join-campaign" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Join Campaign</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatGameSystem(gameSystem: string) {
  switch (gameSystem) {
    case "dnd-5e":
      return "D&D 5e";

    case "pathfinder-2e":
      return "Pathfinder 2e";

    default:
      return "Custom";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12100E",
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 15,
  },

  title: {
    color: "#D9A441",
    fontSize: 30,
    fontWeight: "700",
  },

  subtitle: {
    color: "#F2E8D5",
    fontSize: 18,
    marginTop: 4,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  emptyState: {
    flex: 1,
    minHeight: 400,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    color: "#F2E8D5",
    fontSize: 22,
    fontWeight: "600",
  },

  emptyText: {
    color: "#A99F91",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },

  campaignList: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    gap: 12,
    paddingVertical: 20,
  },

  campaignCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  campaignName: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
  },

  characterName: {
    color: "#F2E8D5",
    fontSize: 16,
    marginTop: 6,
  },

  campaignInfo: {
    color: "#A99F91",
    fontSize: 14,
    marginTop: 8,
  },

  actions: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    gap: 12,
    marginTop: "auto",
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D9A441",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#D9A441",
    fontSize: 17,
    fontWeight: "600",
  },
});
