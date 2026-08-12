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

import { RewardTargetMode } from "../../../models/Reward";

export default function RewardScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { getCampaignById, getActiveCampaignMember, distributeReward } =
    useCampaigns();

  const campaign = getCampaignById(id);

  const activeMember = campaign
    ? getActiveCampaignMember(campaign.id)
    : undefined;

  const [currencyId, setCurrencyId] = useState("gold");

  const [amount, setAmount] = useState("");

  const [partyFundPercentage, setPartyFundPercentage] = useState(
    campaign ? String(campaign.partyFund.defaultContributionPercentage) : "10",
  );

  const [description, setDescription] = useState("");

  const [targetMode, setTargetMode] = useState<RewardTargetMode>("whole-party");

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [finderMemberId, setFinderMemberId] = useState<string | undefined>(
    undefined,
  );

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

  const currentCampaign = campaign;

  const currencies = [...currentCampaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  const selectedCurrency = currentCampaign.currencySystem.currencies.find(
    (currency) => currency.id === currencyId,
  );

  const eligibleMembers = currentCampaign.members.filter(
    (
      member,
    ): member is typeof member & {
      character: NonNullable<typeof member.character>;
    } => Boolean(member.character),
  );

  const selectedRecipients = eligibleMembers.filter((member) =>
    selectedMemberIds.includes(member.id),
  );

  const finderRecipient = eligibleMembers.find(
    (member) => member.id === finderMemberId,
  );

  const targetRecipients =
    targetMode === "whole-party"
      ? eligibleMembers
      : targetMode === "selected"
        ? selectedRecipients
        : finderRecipient
          ? [finderRecipient]
          : [];

  const recipientCount = targetRecipients.length;

  const numericAmount = Number(amount);

  const numericPercentage = Number(partyFundPercentage);

  const previewValid =
    Number.isInteger(numericAmount) &&
    numericAmount > 0 &&
    Number.isFinite(numericPercentage) &&
    numericPercentage >= 0 &&
    numericPercentage <= 100 &&
    recipientCount > 0;

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

  const canDistribute =
    currentCampaign.campaignType === "solo" || activeMember?.role === "dm";

  function handleBack() {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace({
      pathname: "/campaign/[id]",

      params: {
        id: currentCampaign.id,
      },
    });
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleTargetModeChange(mode: RewardTargetMode) {
    setTargetMode(mode);

    clearMessages();
  }

  function toggleSelectedMember(memberId: string) {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );

    clearMessages();
  }

  function handleSubmit() {
    clearMessages();

    if (!canDistribute) {
      setErrorMessage(
        "Only the Dungeon Master can distribute campaign rewards.",
      );

      return;
    }

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

    if (targetMode === "selected" && selectedMemberIds.length === 0) {
      setErrorMessage("Select at least one character to receive the reward.");

      return;
    }

    if (targetMode === "finder" && !finderMemberId) {
      setErrorMessage("Select the character who found the reward.");

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
      campaignId: currentCampaign.id,

      currencyId,

      amount: numericAmount,

      partyFundPercentage: numericPercentage,

      description: description.trim(),

      targetMode,

      recipientMemberIds:
        targetMode === "selected" ? selectedMemberIds : undefined,

      finderMemberId: targetMode === "finder" ? finderMemberId : undefined,
    });

    if (!result.success || !result.reward) {
      setErrorMessage(result.message ?? "The reward could not be distributed.");

      return;
    }

    const reward = result.reward;

    const characterWord =
      reward.recipientCount === 1 ? "character" : "characters";

    const modeDescription =
      reward.targetMode === "finder"
        ? "Finder reward distributed."
        : reward.targetMode === "selected"
          ? "Targeted reward distributed."
          : "Party reward distributed.";

    setSuccessMessage(
      `${modeDescription} ${reward.amountPerRecipient} ${abbreviation} went to each of ${reward.recipientCount} ${characterWord}, and ${reward.totalPartyFundAmount} ${abbreviation} went to the Party Fund.`,
    );

    setAmount("");
    setDescription("");

    setSelectedMemberIds([]);

    setFinderMemberId(undefined);

    setTargetMode("whole-party");
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

        <View style={styles.header}>
          <Text style={styles.title}>Distribute Reward</Text>

          <Text style={styles.subtitle}>{currentCampaign.name}</Text>
        </View>

        {!canDistribute ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>DM Control</Text>

            <Text style={styles.permissionText}>
              Only the Dungeon Master can distribute rewards in a multiplayer
              campaign.
            </Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Reward Distribution</Text>

          <Text style={styles.infoText}>
            Choose who receives the reward, calculate the Party Fund
            contribution, and preview the final distribution before confirming
            it.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Distribution Mode</Text>

        <View style={styles.modeSelector}>
          <ModeButton
            title="Whole Party"
            description="Split between every eligible character."
            selected={targetMode === "whole-party"}
            onPress={() => handleTargetModeChange("whole-party")}
          />

          <ModeButton
            title="Selected Characters"
            description="Choose exactly which characters receive a share."
            selected={targetMode === "selected"}
            onPress={() => handleTargetModeChange("selected")}
          />

          <ModeButton
            title="Finder"
            description="Give the player portion to one character who found it."
            selected={targetMode === "finder"}
            onPress={() => handleTargetModeChange("finder")}
          />
        </View>

        {targetMode === "selected" ? (
          <>
            <Text style={styles.sectionTitle}>Select Recipients</Text>

            <View style={styles.recipientSelector}>
              {eligibleMembers.map((member) => (
                <RecipientButton
                  key={member.id}
                  name={member.character.name}
                  memberName={member.displayName}
                  selected={selectedMemberIds.includes(member.id)}
                  onPress={() => toggleSelectedMember(member.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        {targetMode === "finder" ? (
          <>
            <Text style={styles.sectionTitle}>Who Found It?</Text>

            <View style={styles.recipientSelector}>
              {eligibleMembers.map((member) => (
                <RecipientButton
                  key={member.id}
                  name={member.character.name}
                  memberName={member.displayName}
                  selected={finderMemberId === member.id}
                  onPress={() => {
                    setFinderMemberId(member.id);

                    clearMessages();
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

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
          placeholder={
            targetMode === "finder"
              ? "Example: Found gold hidden behind the altar"
              : "Example: Defeated the goblin chief"
          }
          placeholderTextColor="#746D63"
          style={[styles.input, styles.descriptionInput]}
          multiline
        />

        <Text style={styles.sectionTitle}>Distribution Preview</Text>

        <View style={styles.previewCard}>
          <PreviewRow
            label="Mode"
            value={
              targetMode === "whole-party"
                ? "Whole Party"
                : targetMode === "selected"
                  ? "Selected"
                  : "Finder"
            }
          />

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

          {targetRecipients.length > 0 ? (
            targetRecipients.map((member) => (
              <PreviewRow
                key={member.id}
                label={member.character.name}
                value={
                  previewValid ? `${previewPerRecipient} ${abbreviation}` : "—"
                }
              />
            ))
          ) : (
            <Text style={styles.noRecipientsText}>
              Select at least one recipient.
            </Text>
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
          <Text style={styles.recipientCardTitle}>Selected Recipients</Text>

          <Text style={styles.recipientCardValue}>{recipientCount}</Text>

          <Text style={styles.recipientCardText}>
            {targetMode === "finder"
              ? recipientCount === 1
                ? "The selected finder will receive the player portion of this reward."
                : "Select the character who found the reward."
              : recipientCount === 1
                ? "1 character will receive this reward."
                : `${recipientCount} characters will receive an equal share of this reward.`}
          </Text>

          {currentCampaign.members.some((member) => !member.character) ? (
            <Text style={styles.excludedText}>
              Members without characters cannot receive currency rewards.
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

        {canDistribute ? (
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Distribute Reward</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ModeButtonProps {
  title: string;

  description: string;

  selected: boolean;

  onPress: () => void;
}

function ModeButton({
  title,
  description,
  selected,
  onPress,
}: ModeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, selected ? styles.modeButtonSelected : null]}
    >
      <Text
        style={[
          styles.modeButtonTitle,

          selected ? styles.modeButtonTitleSelected : null,
        ]}
      >
        {title}
      </Text>

      <Text style={styles.modeButtonDescription}>{description}</Text>
    </Pressable>
  );
}

interface RecipientButtonProps {
  name: string;

  memberName: string;

  selected: boolean;

  onPress: () => void;
}

function RecipientButton({
  name,
  memberName,
  selected,
  onPress,
}: RecipientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.recipientButton,

        selected ? styles.recipientButtonSelected : null,
      ]}
    >
      <Text
        style={[
          styles.recipientButtonName,

          selected ? styles.recipientButtonNameSelected : null,
        ]}
      >
        {name}
      </Text>

      <Text style={styles.recipientButtonMember}>{memberName}</Text>
    </Pressable>
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
      style={[
        styles.optionButton,

        selected ? styles.optionButtonSelected : null,
      ]}
    >
      <Text
        style={[styles.optionText, selected ? styles.optionTextSelected : null]}
      >
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
        style={[
          styles.previewLabel,

          emphasized ? styles.previewEmphasized : null,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.previewValue,

          emphasized ? styles.previewEmphasized : null,
        ]}
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
    maxWidth: 720,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 50,
  },

  backText: {
    color: "#D9A441",
    fontSize: 15,
    marginBottom: 18,
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

  permissionCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },

  permissionTitle: {
    color: "#E08A8A",
    fontSize: 15,
    fontWeight: "700",
  },

  permissionText: {
    color: "#D8B5B5",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 10,
  },

  modeSelector: {
    gap: 10,
  },

  modeButton: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 15,
  },

  modeButtonSelected: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  modeButtonTitle: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "700",
  },

  modeButtonTitleSelected: {
    color: "#D9A441",
  },

  modeButtonDescription: {
    color: "#A99F91",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  recipientSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  recipientButton: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#4B4339",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 130,
  },

  recipientButtonSelected: {
    backgroundColor: "#1B2118",
    borderColor: "#8FB573",
  },

  recipientButtonName: {
    color: "#F2E8D5",
    fontSize: 14,
    fontWeight: "700",
  },

  recipientButtonNameSelected: {
    color: "#8FB573",
  },

  recipientButtonMember: {
    color: "#81786D",
    fontSize: 10,
    marginTop: 3,
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
    lineHeight: 20,
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
  },
});
