import { router, useLocalSearchParams } from "expo-router";

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCampaigns } from "../../../context/CampaignContext";

export default function LedgerScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, getCampaignTransactions } = useCampaigns();

  const campaign = getCampaignById(id);

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

  const transactions = getCampaignTransactions(campaign.id);

  function getCurrencyAbbreviation(currencyId: string) {
    return (
      campaign.currencySystem.currencies.find(
        (currency) => currency.id === currencyId,
      )?.abbreviation ?? "?"
    );
  }

  function getAccountLabel(accountType: string, characterId?: string) {
    if (accountType === "party-fund") {
      return "Party Fund";
    }

    const member = campaign.members.find(
      (campaignMember) => campaignMember.character?.id === characterId,
    );

    if (member?.character) {
      return member.character.name;
    }

    return "Character";
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Ledger</Text>

          <Text style={styles.subtitle}>{campaign.name}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]/transaction",

                params: {
                  id: campaign.id,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Character Transaction</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]/party-fund",

                params: {
                  id: campaign.id,
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Party Fund</Text>
          </Pressable>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>The ledger is empty.</Text>

            <Text style={styles.emptyDescription}>
              Character and Party Fund transactions will be recorded here.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {transactions.map((transaction) => {
              const abbreviation = getCurrencyAbbreviation(
                transaction.currencyId,
              );

              const accountLabel = getAccountLabel(
                transaction.accountType,
                transaction.characterId,
              );

              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>

                    <Text
                      style={[
                        styles.transactionAmount,

                        transaction.amount > 0
                          ? styles.positiveAmount
                          : styles.negativeAmount,
                      ]}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount} {abbreviation}
                    </Text>
                  </View>

                  <View style={styles.metadataRow}>
                    <Text style={styles.accountBadge}>{accountLabel}</Text>

                    <Text style={styles.transactionType}>
                      {formatTransactionType(transaction.type)}
                    </Text>
                  </View>

                  <Text style={styles.date}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTransactionType(type: string) {
  switch (type) {
    case "income":
      return "Income";

    case "expense":
      return "Expense";

    case "adjustment":
      return "Manual Adjustment";

    default:
      return "Transaction";
  }
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
    maxWidth: 750,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 20,
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
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  primaryButton: {
    flexGrow: 1,
    backgroundColor: "#8B2E2E",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#D9A441",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#D9A441",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 20,
    marginTop: 20,
  },

  emptyTitle: {
    color: "#F2E8D5",
    fontSize: 17,
    fontWeight: "600",
  },

  emptyDescription: {
    color: "#A99F91",
    fontSize: 14,
    marginTop: 6,
  },

  transactionList: {
    gap: 12,
    marginTop: 20,
  },

  transactionCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  transactionDescription: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  transactionAmount: {
    fontSize: 17,
    fontWeight: "700",
  },

  positiveAmount: {
    color: "#8FB573",
  },

  negativeAmount: {
    color: "#C96A6A",
  },

  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  accountBadge: {
    color: "#D9A441",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "#2A2115",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  transactionType: {
    color: "#A99F91",
    fontSize: 12,
  },

  date: {
    color: "#81786D",
    fontSize: 12,
    marginTop: 8,
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
