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

import {
    getWalletBalance,
    getWalletTotalBaseValue,
} from "../../models/Currency";

export default function CampaignDashboardScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById } = useCampaigns();

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

  const character = campaign.activeCharacter;

  const currencies = [...campaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  const totalBaseValue = getWalletTotalBaseValue(
    character.wallet,
    campaign.currencySystem,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.campaignName}>{campaign.name}</Text>

          <Text style={styles.characterName}>Playing as {character.name}</Text>
        </View>

        <Text style={styles.sectionTitle}>Character Wallet</Text>

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

              <Text style={styles.wealthValue}>{totalBaseValue}</Text>
            </View>
          </View>

          <View style={styles.currencyGrid}>
            {currencies.map((currency) => {
              const balance = getWalletBalance(character.wallet, currency.id);

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
        </View>

        <View style={styles.grid}>
          <DashboardCard
            title="Party Fund"
            value="0"
            description="Shared party currency"
          />

          <DashboardCard
            title="Active Quest"
            value="None"
            description="No active quest"
          />

          <DashboardCard
            title="Pending Actions"
            value="0"
            description="Nothing needs your attention"
          />
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <View style={styles.activityCard}>
          <Text style={styles.activityEmpty}>No transactions yet.</Text>

          <Text style={styles.activityDescription}>
            Rewards, purchases, trades, and transfers will appear here.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Campaign</Text>

        <View style={styles.navigation}>
          <NavigationButton
            title="Ledger"
            description="View campaign transactions"
          />

          <NavigationButton title="Assets" description="View valuable items" />

          <NavigationButton title="Notes" description="View campaign notes" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
}

function NavigationButton({ title, description }: NavigationButtonProps) {
  return (
    <Pressable style={styles.navigationButton}>
      <View>
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

  characterName: {
    color: "#A99F91",
    fontSize: 16,
    marginTop: 6,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 12,
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
