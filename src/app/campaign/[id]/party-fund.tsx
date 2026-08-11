import { router, useLocalSearchParams } from "expo-router";

import { useState } from "react";

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

import {
  getWalletBalance,
  getWalletTotalBaseValue,
} from "../../../models/Currency";

type PartyFundAction = "contribute" | "withdraw";

export default function PartyFundScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    getCampaignById,
    getActiveCampaignMember,
    contributeToPartyFund,
    createPartyFundTransaction,
  } = useCampaigns();

  const campaign = getCampaignById(id);

  const [action, setAction] = useState<PartyFundAction>("contribute");

  const [currencyId, setCurrencyId] = useState("gold");

  const [amount, setAmount] = useState("");

  const [description, setDescription] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

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

  const activeMember = getActiveCampaignMember(campaign.id);

  const activeCharacter = activeMember?.character;

  const canManagePartyFund =
    campaign.campaignType === "solo" ||
    activeMember?.role === "party-leader" ||
    activeMember?.role === "treasurer";

  const currencies = [...campaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  const selectedCurrency = campaign.currencySystem.currencies.find(
    (currency) => currency.id === currencyId,
  );

  const partyFundBalance = getWalletBalance(
    campaign.partyFund.wallet,
    currencyId,
  );

  const characterBalance = activeCharacter
    ? getWalletBalance(activeCharacter.wallet, currencyId)
    : 0;

  const totalBaseValue = getWalletTotalBaseValue(
    campaign.partyFund.wallet,
    campaign.currencySystem,
  );

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleActionChange(newAction: PartyFundAction) {
    setAction(newAction);
    clearMessages();
  }

  function handleCurrencyChange(newCurrencyId: string) {
    setCurrencyId(newCurrencyId);
    clearMessages();
  }

  function handleSubmit() {
    clearMessages();

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Enter an amount greater than zero.");

      return;
    }

    if (!description.trim()) {
      setErrorMessage(
        "Enter a description explaining why this Party Fund transaction is being recorded.",
      );

      return;
    }

    const abbreviation = selectedCurrency?.abbreviation ?? "";

    if (action === "contribute") {
      if (!activeCharacter) {
        setErrorMessage(
          `${activeMember?.displayName ?? "This member"} does not have a character wallet to contribute from.`,
        );

        return;
      }

      if (numericAmount > characterBalance) {
        setErrorMessage(
          `Insufficient funds. ${activeCharacter.name} only has ${characterBalance} ${abbreviation}, but this contribution requires ${numericAmount} ${abbreviation}.`,
        );

        return;
      }

      const result = contributeToPartyFund(
        campaign.id,
        currencyId,
        numericAmount,
        description.trim(),
      );

      if (!result.success) {
        setErrorMessage(
          result.message ?? "The contribution could not be completed.",
        );

        return;
      }

      setSuccessMessage(
        `${numericAmount} ${abbreviation} was transferred from ${activeCharacter.name} to the Party Fund.`,
      );
    } else {
      if (!canManagePartyFund) {
        setErrorMessage(
          "Only the Party Leader or Treasurer can withdraw directly from the Party Fund.",
        );

        return;
      }

      if (numericAmount > partyFundBalance) {
        setErrorMessage(
          `Insufficient Party Fund balance. The fund currently has ${partyFundBalance} ${abbreviation}, but this withdrawal requires ${numericAmount} ${abbreviation}.`,
        );

        return;
      }

      const result = createPartyFundTransaction({
        campaignId: campaign.id,
        type: "expense",
        currencyId,
        amount: numericAmount,
        description: description.trim(),
      });

      if (!result.success) {
        setErrorMessage(
          result.message ?? "The withdrawal could not be completed.",
        );

        return;
      }

      setSuccessMessage(
        `${numericAmount} ${abbreviation} was withdrawn from the Party Fund.`,
      );
    }

    setAmount("");
    setDescription("");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Party Fund</Text>

          <Text style={styles.subtitle}>{campaign.name}</Text>

          <Text style={styles.modeLabel}>
            Active as {activeMember?.displayName ?? "Unknown Member"}
          </Text>

          <Text style={styles.roleLabel}>
            {activeMember ? formatRole(activeMember.role) : "No active role"}
          </Text>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletTitle}>Shared Treasury</Text>

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
              const balance = getWalletBalance(
                campaign.partyFund.wallet,
                currency.id,
              );

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

        <Text style={styles.sectionTitle}>Party Fund Action</Text>

        <View style={styles.actionRow}>
          <OptionButton
            label="Contribute"
            selected={action === "contribute"}
            onPress={() => handleActionChange("contribute")}
          />

          <OptionButton
            label="Withdraw"
            selected={action === "withdraw"}
            onPress={() => handleActionChange("withdraw")}
          />
        </View>

        {action === "withdraw" && !canManagePartyFund ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Restricted Action</Text>

            <Text style={styles.permissionText}>
              Direct Party Fund spending is limited to the Party Leader and
              Treasurer.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Currency</Text>

        <View style={styles.currencySelector}>
          {currencies.map((currency) => (
            <OptionButton
              key={currency.id}
              label={currency.abbreviation}
              selected={currencyId === currency.id}
              onPress={() => handleCurrencyChange(currency.id)}
            />
          ))}
        </View>

        {action === "contribute" ? (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Character Balance</Text>

            {activeCharacter ? (
              <>
                <Text style={styles.balanceCharacter}>
                  {activeCharacter.name}
                </Text>

                <Text style={styles.balanceAmount}>
                  {characterBalance} {selectedCurrency?.abbreviation ?? ""}
                </Text>
              </>
            ) : (
              <Text style={styles.noCharacterText}>
                No character wallet available.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available in Party Fund</Text>

            <Text style={styles.balanceAmount}>
              {partyFundBalance} {selectedCurrency?.abbreviation ?? ""}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Amount</Text>

        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            clearMessages();
          }}
          placeholder="Example: 25"
          placeholderTextColor="#746D63"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>

        <TextInput
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearMessages();
          }}
          placeholder={
            action === "contribute"
              ? "Example: Party contribution"
              : "Example: Purchased party supplies"
          }
          placeholderTextColor="#746D63"
          style={[styles.input, styles.descriptionInput]}
          multiline
        />

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Transaction Failed</Text>

            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Transaction Complete</Text>

            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {action === "contribute"
              ? "Contribute to Party Fund"
              : "Withdraw from Party Fund"}
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Party Fund Permissions</Text>

          <Text style={styles.infoText}>
            Any member with a character can contribute currency they own. Direct
            Party Fund withdrawals are restricted to the Party Leader and
            Treasurer in multiplayer campaigns.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRole(role: string) {
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

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
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

  modeLabel: {
    color: "#F2E8D5",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },

  roleLabel: {
    color: "#81786D",
    fontSize: 12,
    marginTop: 3,
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

  walletTitle: {
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

  sectionTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 10,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  currencySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  optionButtonSelected: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  optionText: {
    color: "#B9AFA2",
    fontSize: 15,
  },

  optionTextSelected: {
    color: "#D9A441",
    fontWeight: "700",
  },

  permissionCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },

  permissionTitle: {
    color: "#E08A8A",
    fontSize: 14,
    fontWeight: "700",
  },

  permissionText: {
    color: "#D8B5B5",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  balanceCard: {
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },

  balanceLabel: {
    color: "#A99F91",
    fontSize: 12,
  },

  balanceCharacter: {
    color: "#F2E8D5",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  balanceAmount: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 3,
  },

  noCharacterText: {
    color: "#C96A6A",
    fontSize: 14,
    marginTop: 6,
  },

  label: {
    color: "#F2E8D5",
    fontSize: 15,
    marginTop: 22,
    marginBottom: 7,
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
  },

  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  errorCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },

  errorTitle: {
    color: "#E08A8A",
    fontSize: 15,
    fontWeight: "700",
  },

  errorText: {
    color: "#D8B5B5",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  successCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },

  successTitle: {
    color: "#9CC58B",
    fontSize: 15,
    fontWeight: "700",
  },

  successText: {
    color: "#C3D7BB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 24,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
  },

  infoTitle: {
    color: "#D9A441",
    fontSize: 14,
    fontWeight: "700",
  },

  infoText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  notFound: {
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
