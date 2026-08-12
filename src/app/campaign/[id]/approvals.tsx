import { router, useLocalSearchParams } from "expo-router";

import { useState } from "react";

import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useCampaigns } from "../../../context/CampaignContext";

import { WalletTransactionRequest } from "../../../models/WalletRequest";

export default function ApprovalsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    getCampaignById,

    getActiveCampaignMember,

    getCampaignWalletRequests,

    approveWalletRequest,

    declineWalletRequest,
  } = useCampaigns();

  const campaign = getCampaignById(id);

  const [message, setMessage] = useState("");

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

  const activeMember = getActiveCampaignMember(campaign.id);

  const allRequests = getCampaignWalletRequests(campaign.id);

  const isDm = activeMember?.role === "dm";

  const visibleRequests = isDm
    ? allRequests
    : allRequests.filter(
        (request) => request.requesterMemberId === activeMember?.id,
      );

  const pendingRequests = visibleRequests.filter(
    (request) => request.status === "pending",
  );

  const resolvedRequests = visibleRequests.filter(
    (request) => request.status !== "pending",
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

  function handleApprove(request: WalletTransactionRequest) {
    setMessage("");

    const result = approveWalletRequest(campaign.id, request.id);

    if (!result.success) {
      setMessage(result.message ?? "The request could not be approved.");

      return;
    }

    setMessage("Wallet request approved and added to the ledger.");
  }

  function handleDecline(request: WalletTransactionRequest) {
    setMessage("");

    const result = declineWalletRequest(campaign.id, request.id);

    if (!result.success) {
      setMessage(result.message ?? "The request could not be declined.");

      return;
    }

    setMessage("Wallet request declined.");
  }

  function getMemberName(request: WalletTransactionRequest) {
    const member = campaign.members.find(
      (item) => item.id === request.requesterMemberId,
    );

    return member?.displayName ?? "Unknown Member";
  }

  function getCharacterName(request: WalletTransactionRequest) {
    const member = campaign.members.find(
      (item) => item.character?.id === request.characterId,
    );

    return member?.character?.name ?? "Unknown Character";
  }

  function getCurrency(request: WalletTransactionRequest) {
    return (
      campaign.currencySystem.currencies.find(
        (currency) => currency.id === request.currencyId,
      )?.abbreviation ?? "?"
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={handleBack}>
          <Text style={styles.backText}>← Campaign</Text>
        </Pressable>

        <Text style={styles.title}>
          {isDm ? "Pending Actions" : "Wallet Requests"}
        </Text>

        <Text style={styles.subtitle}>
          {isDm
            ? "Review player wallet additions"
            : "Track requests sent to your Dungeon Master"}
        </Text>

        {message ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Pending</Text>

        {pendingRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No pending requests.</Text>

            <Text style={styles.emptyText}>
              {isDm
                ? "Nothing currently needs DM approval."
                : "You do not have any wallet additions waiting for approval."}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.requestMember}>
                  {getMemberName(request)}
                </Text>

                <Text style={styles.requestCharacter}>
                  {getCharacterName(request)}
                </Text>

                <Text style={styles.requestAmount}>
                  +{request.amount} {getCurrency(request)}
                </Text>

                <Text style={styles.requestDescription}>
                  {request.description}
                </Text>

                <Text style={styles.requestDate}>
                  Requested {new Date(request.createdAt).toLocaleString()}
                </Text>

                {isDm ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.declineButton}
                      onPress={() => handleDecline(request)}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </Pressable>

                    <Pressable
                      style={styles.approveButton}
                      onPress={() => handleApprove(request)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>History</Text>

        {resolvedRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No request history yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {resolvedRequests.map((request) => (
              <View key={request.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    {getCharacterName(request)}
                  </Text>

                  <Text
                    style={[
                      styles.statusText,

                      request.status === "approved"
                        ? styles.approvedText
                        : styles.declinedText,
                    ]}
                  >
                    {request.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.historyAmount}>
                  +{request.amount} {getCurrency(request)}
                </Text>

                <Text style={styles.historyDescription}>
                  {request.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 20,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 12,
  },

  list: {
    gap: 12,
  },

  requestCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#8A6930",
    borderRadius: 14,
    padding: 18,
  },

  requestMember: {
    color: "#F2E8D5",
    fontSize: 17,
    fontWeight: "700",
  },

  requestCharacter: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 3,
  },

  requestAmount: {
    color: "#D9A441",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 13,
  },

  requestDescription: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 7,
  },

  requestDate: {
    color: "#81786D",
    fontSize: 11,
    marginTop: 8,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  approveButton: {
    flex: 1,
    backgroundColor: "#54734A",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  approveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C96A6A",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  declineButtonText: {
    color: "#C96A6A",
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
    fontWeight: "600",
  },

  emptyText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  historyCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  historyTitle: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "600",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  approvedText: {
    color: "#8FB573",
  },

  declinedText: {
    color: "#C96A6A",
  },

  historyAmount: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  historyDescription: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 5,
  },

  messageCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 10,
    padding: 14,
  },

  messageText: {
    color: "#C3D7BB",
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 11,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  notFoundTitle: {
    color: "#F2E8D5",
    fontSize: 24,
    fontWeight: "700",
  },
});
