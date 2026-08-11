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

import { getWalletBalance } from "../../../models/Currency";

import { TransactionType } from "../../../models/Transaction";

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, getActiveCampaignMember, createTransaction } =
    useCampaigns();

  const campaign = getCampaignById(id);

  const [transactionType, setTransactionType] =
    useState<TransactionType>("income");

  const [currencyId, setCurrencyId] = useState("gold");

  const [amount, setAmount] = useState("");

  const [description, setDescription] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

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

  const character = activeMember?.character;

  if (!activeMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Active member not found</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Return to Campaign</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>No Character Wallet</Text>

          <Text style={styles.notFoundText}>
            {activeMember.displayName} does not have a character attached to
            this campaign.
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Return to Campaign</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const selectedCurrency = campaign.currencySystem.currencies.find(
    (currency) => currency.id === currencyId,
  );

  const currentBalance = getWalletBalance(character.wallet, currencyId);

  function clearError() {
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handleTypeChange(type: TransactionType) {
    setTransactionType(type);
    clearError();
  }

  function handleCurrencyChange(newCurrencyId: string) {
    setCurrencyId(newCurrencyId);
    clearError();
  }

  function handleSubmit() {
    setErrorMessage("");

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      setErrorMessage("Enter an amount greater than zero.");

      return;
    }

    if (transactionType !== "adjustment" && numericAmount < 0) {
      setErrorMessage(
        "Income and expense amounts must be entered as positive numbers.",
      );

      return;
    }

    if (!description.trim()) {
      setErrorMessage(
        "Enter a description explaining why this transaction is being recorded.",
      );

      return;
    }

    if (
      transactionType === "expense" &&
      Math.abs(numericAmount) > currentBalance
    ) {
      const abbreviation = selectedCurrency?.abbreviation ?? "";

      setErrorMessage(
        `Insufficient funds. ${character.name} only has ${currentBalance} ${abbreviation} available, but this expense requires ${Math.abs(
          numericAmount,
        )} ${abbreviation}.`,
      );

      return;
    }

    if (
      transactionType === "adjustment" &&
      numericAmount < 0 &&
      currentBalance + numericAmount < 0
    ) {
      const abbreviation = selectedCurrency?.abbreviation ?? "";

      setErrorMessage(
        `This adjustment would reduce the balance below zero. ${character.name} currently has ${currentBalance} ${abbreviation}.`,
      );

      return;
    }

    let transactionAmount = Math.abs(numericAmount);

    if (transactionType === "adjustment" && numericAmount < 0) {
      transactionAmount = numericAmount;
    }

    const result = createTransaction({
      campaignId: campaign.id,
      characterId: character.id,
      type: transactionType,
      currencyId,
      amount: transactionAmount,
      description: description.trim(),
    });

    if (!result.success) {
      setErrorMessage(
        result.message ?? "The transaction could not be completed.",
      );

      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>New Transaction</Text>

        <Text style={styles.member}>{activeMember.displayName}</Text>

        <Text style={styles.character}>{character.name}</Text>

        <Text style={styles.sectionTitle}>Transaction Type</Text>

        <View style={styles.optionGroup}>
          <OptionButton
            label="Income"
            selected={transactionType === "income"}
            onPress={() => handleTypeChange("income")}
          />

          <OptionButton
            label="Expense"
            selected={transactionType === "expense"}
            onPress={() => handleTypeChange("expense")}
          />

          <OptionButton
            label="Adjustment"
            selected={transactionType === "adjustment"}
            onPress={() => handleTypeChange("adjustment")}
          />
        </View>

        <Text style={styles.sectionTitle}>Currency</Text>

        <View style={styles.currencyGroup}>
          {campaign.currencySystem.currencies
            .slice()
            .sort((a, b) => b.displayOrder - a.displayOrder)
            .map((currency) => (
              <OptionButton
                key={currency.id}
                label={currency.abbreviation}
                selected={currencyId === currency.id}
                onPress={() => handleCurrencyChange(currency.id)}
              />
            ))}
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>

          <Text style={styles.balanceAmount}>
            {currentBalance} {selectedCurrency?.abbreviation ?? ""}
          </Text>
        </View>

        <Text style={styles.label}>Amount</Text>

        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            clearError();
          }}
          placeholder={
            transactionType === "adjustment"
              ? "Example: 50 or -50"
              : "Example: 100"
          }
          placeholderTextColor="#746D63"
          keyboardType="numeric"
          style={styles.input}
        />

        {transactionType === "adjustment" ? (
          <Text style={styles.helperText}>
            Use a positive number to add currency or a negative number to remove
            it.
          </Text>
        ) : null}

        <Text style={styles.label}>Description</Text>

        <TextInput
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearError();
          }}
          placeholder="Example: Bought healing potions"
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

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Record Transaction</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
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
    maxWidth: 650,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 50,
  },

  heading: {
    color: "#D9A441",
    fontSize: 28,
    fontWeight: "700",
  },

  member: {
    color: "#F2E8D5",
    fontSize: 16,
    marginTop: 5,
  },

  character: {
    color: "#A99F91",
    fontSize: 14,
    marginTop: 3,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
  },

  optionGroup: {
    gap: 8,
  },

  currencyGroup: {
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

  balanceAmount: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 3,
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

  helperText: {
    color: "#81786D",
    fontSize: 12,
    marginTop: 7,
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
    textAlign: "center",
  },

  notFoundText: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 400,
  },
});
