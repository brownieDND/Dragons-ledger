import { router, useLocalSearchParams } from "expo-router";

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCampaigns } from "../../context/CampaignContext";

import { getWalletTotalBaseValue } from "../../models/Currency";

import { CampaignMemberRole } from "../../models/Campaign";

export default function CampaignDashboardScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    getCampaignById,

    getActiveCampaignMember,

    getCampaignTransactions,

    getCampaignRewards,

    getActiveSession,

    getCampaignQuests,
  } = useCampaigns();

  const campaign = getCampaignById(id);

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Campaign not found</Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.backButtonText}>Return to Campaigns</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const activeMember = getActiveCampaignMember(campaign.id);

  const character = activeMember?.character;

  const activeSession = getActiveSession(campaign.id);

  const campaignQuests = getCampaignQuests(campaign.id);

  const activeQuests = campaignQuests.filter(
    (quest) => quest.status === "active",
  );

  const currencies = [...campaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  const characterTotal = character
    ? getWalletTotalBaseValue(character.wallet, campaign.currencySystem)
    : null;

  const partyFundTotal = getWalletTotalBaseValue(
    campaign.partyFund.wallet,
    campaign.currencySystem,
  );

  const recentTransactions = getCampaignTransactions(campaign.id).slice(0, 5);

  const recentRewards = getCampaignRewards(campaign.id);

  const latestReward = recentRewards[0];

  function getCurrencyAbbreviation(currencyId: string) {
    return (
      campaign.currencySystem.currencies.find(
        (currency) => currency.id === currencyId,
      )?.abbreviation ?? "?"
    );
  }

  function getTransactionAccountLabel(characterId?: string) {
    if (!characterId) {
      return "Character";
    }

    const member = campaign.members.find(
      (campaignMember) => campaignMember.character?.id === characterId,
    );

    return member?.character?.name ?? member?.displayName ?? "Character";
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.campaignName}>{campaign.name}</Text>

          <Text style={styles.memberName}>
            Active as {activeMember?.displayName ?? "Unknown Member"}
          </Text>

          <Text style={styles.roleText}>
            {activeMember ? formatRole(activeMember.role) : "No active role"}

            {character ? ` • ${character.name}` : " • No character"}
          </Text>

          <Text style={styles.modeText}>
            {campaign.campaignType === "solo"
              ? "Solo Campaign"
              : `Multiplayer Campaign • ${campaign.members.length} members`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Session</Text>

        <Pressable
          style={[
            styles.sessionCard,

            activeSession ? styles.sessionCardActive : null,
          ]}
          onPress={() =>
            router.push({
              pathname: "/campaign/[id]/session",

              params: {
                id: campaign.id,
              },
            })
          }
        >
          <View style={styles.cardText}>
            <Text
              style={
                activeSession
                  ? styles.sessionActiveTitle
                  : styles.sessionInactiveTitle
              }
            >
              {activeSession ? "Session Active" : "No Active Session"}
            </Text>

            <Text style={styles.sessionDescription}>
              {activeSession
                ? `${activeQuests.length} active ${
                    activeQuests.length === 1 ? "quest" : "quests"
                  }`
                : "Start or view campaign sessions and quests"}
            </Text>
          </View>

          <Text style={styles.navigationArrow}>→</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Character Wallet</Text>

        {character ? (
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View>
                <Text style={styles.walletCharacter}>{character.name}</Text>

                <Text style={styles.walletSystem}>
                  {campaign.currencySystem.name}
                </Text>
              </View>

              <View style={styles.wealthBox}>
                <Text style={styles.wealthLabel}>Base Value</Text>

                <Text style={styles.wealthValue}>{characterTotal}</Text>
              </View>
            </View>

            <View style={styles.currencyGrid}>
              {currencies.map((currency) => {
                const balance =
                  character.wallet.balances.find(
                    (walletBalance) => walletBalance.currencyId === currency.id,
                  )?.amount ?? 0;

                return (
                  <View key={currency.id} style={styles.currencyItem}>
                    <Text style={styles.currencyAmount}>{balance}</Text>

                    <Text style={styles.currencyAbbreviation}>
                      {currency.abbreviation}
                    </Text>

                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                );
              })}
            </View>

            <Pressable
              style={styles.transactionButton}
              onPress={() =>
                router.push({
                  pathname: "/campaign/[id]/transaction",

                  params: {
                    id: campaign.id,
                  },
                })
              }
            >
              <Text style={styles.transactionButtonText}>
                Record Transaction
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.noCharacterCard}>
            <Text style={styles.noCharacterTitle}>No Character Wallet</Text>

            <Text style={styles.noCharacterDescription}>
              {activeMember?.displayName ?? "This member"} does not currently
              have a character attached to this campaign.
            </Text>

            {activeMember?.role === "dm" ? (
              <Text style={styles.noCharacterHint}>
                Dungeon Masters do not need a character to manage campaign
                features.
              </Text>
            ) : null}
          </View>
        )}

        <Text style={styles.sectionTitle}>Rewards</Text>

        <Pressable
          style={styles.rewardCard}
          onPress={() =>
            router.push({
              pathname: "/campaign/[id]/reward",

              params: {
                id: campaign.id,
              },
            })
          }
        >
          <View style={styles.cardText}>
            <Text style={styles.rewardTitle}>Distribute Reward</Text>

            <Text style={styles.rewardDescription}>
              Split rewards between characters and the Party Fund
            </Text>
          </View>

          <Text style={styles.navigationArrow}>→</Text>
        </Pressable>

        {latestReward ? (
          <View style={styles.latestRewardCard}>
            <Text style={styles.latestRewardLabel}>Latest Reward</Text>

            <Text style={styles.latestRewardDescription}>
              {latestReward.description}
            </Text>

            <Text style={styles.latestRewardAmount}>
              {latestReward.grossAmount}{" "}
              {getCurrencyAbbreviation(latestReward.currencyId)}
            </Text>

            <Text style={styles.latestRewardSplit}>
              {latestReward.amountPerRecipient}{" "}
              {getCurrencyAbbreviation(latestReward.currencyId)} each to{" "}
              {latestReward.recipientCount}{" "}
              {latestReward.recipientCount === 1 ? "character" : "characters"} •{" "}
              {latestReward.totalPartyFundAmount}{" "}
              {getCurrencyAbbreviation(latestReward.currencyId)} to Party Fund
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Party Fund</Text>

        <Pressable
          style={styles.partyFundCard}
          onPress={() =>
            router.push({
              pathname: "/campaign/[id]/party-fund",

              params: {
                id: campaign.id,
              },
            })
          }
        >
          <View style={styles.cardText}>
            <Text style={styles.partyFundTitle}>Shared Treasury</Text>

            <Text style={styles.partyFundDescription}>
              View and manage shared party currency
            </Text>
          </View>

          <View style={styles.partyFundValueBox}>
            <Text style={styles.partyFundValue}>{partyFundTotal}</Text>

            <Text style={styles.partyFundBaseLabel}>base value</Text>
          </View>
        </Pressable>

        <View style={styles.grid}>
          <DashboardCard
            title="Members"
            value={`${campaign.members.length}`}
            description={
              campaign.campaignType === "solo"
                ? "Solo campaign"
                : "Campaign members"
            }
          />

          <DashboardCard
            title="Active Quests"
            value={`${activeQuests.length}`}
            description={
              activeSession ? "Current campaign quests" : "No session active"
            }
          />

          <DashboardCard
            title="Pending Actions"
            value="0"
            description="Nothing needs your attention"
          />
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <View style={styles.activityCard}>
          {recentTransactions.length === 0 ? (
            <>
              <Text style={styles.activityEmpty}>No transactions yet.</Text>

              <Text style={styles.activityDescription}>
                Rewards, purchases, Party Fund activity, trades, and transfers
                will appear here.
              </Text>
            </>
          ) : (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>

                  <Text style={styles.transactionType}>
                    {transaction.accountType === "party-fund"
                      ? "Party Fund"
                      : getTransactionAccountLabel(transaction.characterId)}
                    {" • "}
                    {formatTransactionType(transaction.type)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,

                    transaction.amount > 0
                      ? styles.positiveAmount
                      : styles.negativeAmount,
                  ]}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}{" "}
                  {getCurrencyAbbreviation(transaction.currencyId)}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Campaign</Text>

        <View style={styles.navigation}>
          <NavigationButton
            title="Session & Quests"
            description="Manage sessions and campaign quests"
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]/session",

                params: {
                  id: campaign.id,
                },
              })
            }
          />

          <NavigationButton
            title="Members"
            description="View players, characters, and roles"
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]/members",

                params: {
                  id: campaign.id,
                },
              })
            }
          />

          <NavigationButton
            title="Ledger"
            description="View campaign transactions"
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]/ledger",

                params: {
                  id: campaign.id,
                },
              })
            }
          />

          <NavigationButton title="Assets" description="View valuable items" />

          <NavigationButton title="Notes" description="View campaign notes" />
        </View>
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

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
}

function DashboardCard({ title, value, description }: DashboardCardProps) {
  return (
    <View style={styles.dashboardCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      <Text style={styles.cardValue}>{value}</Text>

      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

interface NavigationButtonProps {
  title: string;
  description: string;
  onPress?: () => void;
}

function NavigationButton({
  title,
  description,
  onPress,
}: NavigationButtonProps) {
  return (
    <Pressable style={styles.navigationButton} onPress={onPress}>
      <View style={styles.cardText}>
        <Text style={styles.navigationTitle}>{title}</Text>

        <Text style={styles.navigationDescription}>{description}</Text>
      </View>

      <Text style={styles.navigationArrow}>→</Text>
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
    maxWidth: 800,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 8,
  },

  campaignName: {
    color: "#D9A441",
    fontSize: 30,
    fontWeight: "700",
  },

  memberName: {
    color: "#F2E8D5",
    fontSize: 16,
    marginTop: 6,
  },

  roleText: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 4,
  },

  modeText: {
    color: "#81786D",
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 12,
  },

  sessionCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  sessionCardActive: {
    backgroundColor: "#1B2118",
    borderColor: "#54734A",
  },

  sessionActiveTitle: {
    color: "#8FB573",
    fontSize: 18,
    fontWeight: "700",
  },

  sessionInactiveTitle: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
  },

  sessionDescription: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 5,
  },

  walletCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 16,
    padding: 20,
  },

  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 22,
  },

  walletCharacter: {
    color: "#F2E8D5",
    fontSize: 20,
    fontWeight: "700",
  },

  walletSystem: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 5,
  },

  wealthBox: {
    alignItems: "flex-end",
  },

  wealthLabel: {
    color: "#A99F91",
    fontSize: 12,
  },

  wealthValue: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 3,
  },

  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  currencyItem: {
    flexGrow: 1,
    flexBasis: 110,
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },

  currencyAmount: {
    color: "#F2E8D5",
    fontSize: 24,
    fontWeight: "700",
  },

  currencyAbbreviation: {
    color: "#D9A441",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },

  currencyName: {
    color: "#81786D",
    fontSize: 11,
    marginTop: 4,
  },

  transactionButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  transactionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  noCharacterCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 20,
  },

  noCharacterTitle: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
  },

  noCharacterDescription: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  noCharacterHint: {
    color: "#D9A441",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  rewardCard: {
    backgroundColor: "#241B12",
    borderWidth: 1,
    borderColor: "#8A6930",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  rewardTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
  },

  rewardDescription: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 5,
  },

  latestRewardCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },

  latestRewardLabel: {
    color: "#81786D",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  latestRewardDescription: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
  },

  latestRewardAmount: {
    color: "#D9A441",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 7,
  },

  latestRewardSplit: {
    color: "#A99F91",
    fontSize: 12,
    marginTop: 4,
  },

  partyFundCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  cardText: {
    flex: 1,
  },

  partyFundTitle: {
    color: "#F2E8D5",
    fontSize: 17,
    fontWeight: "700",
  },

  partyFundDescription: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 5,
  },

  partyFundValueBox: {
    alignItems: "flex-end",
  },

  partyFundValue: {
    color: "#D9A441",
    fontSize: 24,
    fontWeight: "700",
  },

  partyFundBaseLabel: {
    color: "#81786D",
    fontSize: 11,
    marginTop: 3,
  },

  grid: {
    gap: 12,
    marginTop: 18,
  },

  dashboardCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  cardTitle: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "600",
  },

  cardValue: {
    color: "#D9A441",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 8,
  },

  cardDescription: {
    color: "#A99F91",
    fontSize: 14,
    marginTop: 5,
  },

  activityCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 20,
  },

  activityEmpty: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "600",
  },

  activityDescription: {
    color: "#A99F91",
    fontSize: 14,
    marginTop: 6,
  },

  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#302A24",
  },

  transactionDetails: {
    flex: 1,
  },

  transactionDescription: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "600",
  },

  transactionType: {
    color: "#81786D",
    fontSize: 12,
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },

  positiveAmount: {
    color: "#8FB573",
  },

  negativeAmount: {
    color: "#C96A6A",
  },

  navigation: {
    gap: 10,
  },

  navigationButton: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  navigationTitle: {
    color: "#F2E8D5",
    fontSize: 17,
    fontWeight: "600",
  },

  navigationDescription: {
    color: "#A99F91",
    fontSize: 13,
    marginTop: 4,
  },

  navigationArrow: {
    color: "#D9A441",
    fontSize: 22,
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

  backButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 20,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
