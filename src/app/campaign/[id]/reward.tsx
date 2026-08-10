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

export default function RewardScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, distributeReward } = useCampaigns();

  const campaign = getCampaignById(id);

  const [currencyId, setCurrencyId] = useState("gold");

  const [amount, setAmount] = useState("");

  const [partyFundPercentage, setPartyFundPercentage] = useState(
    campaign ? String(campaign.partyFund.defaultContributionPercentage) : "10",
  );

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

  const currencies = [...campaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  const selectedCurrency = campaign.currencySystem.currencies.find(
    (currency) => currency.id === currencyId,
  );

  /*
   * For now, every campaign member with a character
   * is eligible for whole-party rewards.
   *
   * A DM without a character is automatically excluded.
   */
  const eligibleMembers = campaign.members.filter((member) =>
    Boolean(member.character),
  );

  const recipientCount = eligibleMembers.length;

  const numericAmount = Number(amount);

  const numericPercentage = Number(partyFundPercentage);

  const previewValid =
    Number.isInteger(numericAmount) &&
    numericAmount > 0 &&
    Number.isFinite(numericPercentage) &&
    numericPercentage >= 0 &&
    numericPercentage <= 100 &&
    recipientCount > 0;

  /*
   * This calculation intentionally mirrors the
   * distribution logic inside CampaignContext.
   */

  const previewPercentagePartyFund = previewValid
    ? Math.floor(numericAmount * (numericPercentage / 100))
    : 0;

  const previewAfterPartyFund = previewValid
    ? numericAmount - previewPercentagePartyFund
    : 0;

  const previewPerRecipient = previewValid
    ? Math.floor(previewAfterPartyFund / recipientCount)
    : 0;

  const previewDistributedAmount = previewValid
    ? previewPerRecipient * recipientCount
    : 0;

  const previewRemainder = previewValid
    ? previewAfterPartyFund - previewDistributedAmount
    : 0;

  const previewTotalPartyFund = previewValid
    ? previewPercentagePartyFund + previewRemainder
    : 0;

  const previewAccountedFor = previewValid
    ? previewDistributedAmount + previewTotalPartyFund
    : 0;

  const abbreviation = selectedCurrency?.abbreviation ?? "";

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleSubmit() {
    clearMessages();

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setErrorMessage(
        "Reward amount must be a whole number greater than zero.",
      );

      return;
    }

    if (
      !Number.isFinite(numericPercentage) ||
      numericPercentage < 0 ||
      numericPercentage > 100
    ) {
      setErrorMessage("Party Fund percentage must be between 0 and 100.");

      return;
    }

    if (recipientCount === 0) {
      setErrorMessage(
        "There are no eligible characters to receive this reward.",
      );

      return;
    }

    if (!description.trim()) {
      setErrorMessage("Enter a description for the reward.");

      return;
    }

    const result = distributeReward({
      campaignId: campaign.id,

      currencyId,

      amount: numericAmount,

      partyFundPercentage: numericPercentage,

      description: description.trim(),
    });

    if (!result.success || !result.reward) {
      setErrorMessage(result.message ?? "The reward could not be distributed.");

      return;
    }

    const reward = result.reward;

    const characterWord =
      reward.recipientCount === 1 ? "character" : "characters";

    setSuccessMessage(
      `Reward distributed. ${reward.amountPerRecipient} ${abbreviation} went to each of ${reward.recipientCount} ${characterWord}, and ${reward.totalPartyFundAmount} ${abbreviation} went to the Party Fund.`,
    );

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
          <Text style={styles.title}>Distribute Reward</Text>

          <Text style={styles.subtitle}>{campaign.name}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Reward Distribution</Text>

          <Text style={styles.infoText}>
            Enter the total reward and choose how much should be allocated to
            the Party Fund. The remaining currency is divided evenly between all
            eligible characters.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Currency</Text>

        <View style={styles.currencySelector}>
          {currencies.map((currency) => (
            <OptionButton
              key={currency.id}
              label={currency.abbreviation}
              selected={currencyId === currency.id}
              onPress={() => {
                setCurrencyId(currency.id);

                clearMessages();
              }}
            />
          ))}
        </View>

        <Text style={styles.label}>Total Reward</Text>

        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            clearMessages();
          }}
          placeholder="Example: 1000"
          placeholderTextColor="#746D63"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Party Fund Percentage</Text>

        <TextInput
          value={partyFundPercentage}
          onChangeText={(value) => {
            setPartyFundPercentage(value);

            clearMessages();
          }}
          placeholder="10"
          placeholderTextColor="#746D63"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Reward Description</Text>

        <TextInput
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearMessages();
          }}
          placeholder="Example: Defeated the goblin chief"
          placeholderTextColor="#746D63"
          style={[styles.input, styles.descriptionInput]}
          multiline
        />

        <Text style={styles.sectionTitle}>Distribution Preview</Text>

        <View style={styles.previewCard}>
          <PreviewRow
            label="Total Reward"
            value={previewValid ? `${numericAmount} ${abbreviation}` : "—"}
          />

          <PreviewRow
            label={`Party Fund (${previewValid ? numericPercentage : 0}%)`}
            value={
              previewValid
                ? `${previewPercentagePartyFund} ${abbreviation}`
                : "—"
            }
          />

          <View style={styles.previewDivider} />

          <Text style={styles.recipientSectionLabel}>
            Character Distribution
          </Text>

          {eligibleMembers.length > 0 ? (
            eligibleMembers.map((member) => (
              <PreviewRow
                key={member.id}
                label={member.character?.name ?? member.displayName}
                value={
                  previewValid ? `${previewPerRecipient} ${abbreviation}` : "—"
                }
              />
            ))
          ) : (
            <Text style={styles.noRecipientsText}>No eligible characters</Text>
          )}

          {previewValid && previewRemainder > 0 ? (
            <>
              <View style={styles.previewDivider} />

              <PreviewRow
                label="Uneven Remainder → Party Fund"
                value={`${previewRemainder} ${abbreviation}`}
              />
            </>
          ) : null}

          <View style={styles.previewDivider} />

          <PreviewRow
            label="Party Fund Total"
            value={
              previewValid ? `${previewTotalPartyFund} ${abbreviation}` : "—"
            }
            emphasized
          />

          <PreviewRow
            label="Accounted For"
            value={
              previewValid ? `${previewAccountedFor} ${abbreviation}` : "—"
            }
            emphasized
          />
        </View>

        <View style={styles.recipientCard}>
          <Text style={styles.recipientCardTitle}>Eligible Recipients</Text>

          <Text style={styles.recipientCardValue}>{recipientCount}</Text>

          <Text style={styles.recipientCardText}>
            {recipientCount === 1
              ? "1 character will receive this reward."
              : `${recipientCount} characters will receive an equal share of this reward.`}
          </Text>

          {campaign.members.some((member) => !member.character) ? (
            <Text style={styles.excludedText}>
              Members without characters are excluded from the distribution.
            </Text>
          ) : null}
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Distribution Failed</Text>

            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Reward Distributed</Text>

            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Distribute Reward</Text>
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

interface PreviewRowProps {
  label: string;

  value: string;

  emphasized?: boolean;
}

function PreviewRow({ label, value, emphasized = false }: PreviewRowProps) {
  return (
    <View style={styles.previewRow}>
      <Text
        style={[styles.previewLabel, emphasized && styles.previewEmphasized]}
      >
        {label}
      </Text>

      <Text
        style={[styles.previewValue, emphasized && styles.previewEmphasized]}
      >
        {value}
      </Text>
    </View>
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

  infoCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
  },

  infoTitle: {
    color: "#D9A441",
    fontSize: 16,
    fontWeight: "700",
  },

  infoText: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 10,
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

  previewCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 14,
    padding: 18,
  },

  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },

  previewLabel: {
    color: "#A99F91",
    fontSize: 14,
    flex: 1,
  },

  previewValue: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "600",
  },

  previewDivider: {
    height: 1,
    backgroundColor: "#3C352D",
    marginVertical: 8,
  },

  previewEmphasized: {
    color: "#D9A441",
    fontWeight: "700",
  },

  recipientSectionLabel: {
    color: "#81786D",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  noRecipientsText: {
    color: "#C96A6A",
    fontSize: 14,
    paddingVertical: 8,
  },

  recipientCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },

  recipientCardTitle: {
    color: "#A99F91",
    fontSize: 13,
    fontWeight: "600",
  },

  recipientCardValue: {
    color: "#D9A441",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 5,
  },

  recipientCardText: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 4,
  },

  excludedText: {
    color: "#81786D",
    fontSize: 12,
    lineHeight: 18,
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
  },
});
