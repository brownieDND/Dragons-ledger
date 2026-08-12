import { router } from "expo-router";

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

import { useState } from "react";

import { useCampaigns } from "../context/CampaignContext";

import { CampaignType, GameSystem } from "../models/Campaign";

import { CurrencySystem } from "../models/Currency";

import { GAME_SYSTEM_PROFILES } from "../models/GameSystemRegistry";

interface DraftCurrency {
  id: string;

  name: string;

  abbreviation: string;

  baseValue: string;
}

const initialCustomCurrencies: DraftCurrency[] = [
  {
    id: "base-unit",

    name: "Currency Unit",

    abbreviation: "CU",

    baseValue: "1",
  },
];

export default function CreateCampaignScreen() {
  const { createCampaign } = useCampaigns();

  const [campaignName, setCampaignName] = useState("");

  const [characterName, setCharacterName] = useState("");

  const [gameSystem, setGameSystem] = useState<GameSystem>("dnd-5e");

  const [campaignType, setCampaignType] = useState<CampaignType>("multiplayer");

  const [customSystemName, setCustomSystemName] = useState("");

  const [customCurrencies, setCustomCurrencies] = useState<DraftCurrency[]>(
    initialCustomCurrencies,
  );

  const [commonCurrencyDraftId, setCommonCurrencyDraftId] = useState<string>(
    initialCustomCurrencies[0].id,
  );

  const selectedProfile = GAME_SYSTEM_PROFILES.find(
    (profile) => profile.id === gameSystem,
  );

  const customBreakdownPreview = [...customCurrencies]
    .sort((a, b) => (Number(b.baseValue) || 0) - (Number(a.baseValue) || 0))
    .map(
      (currency) => currency.abbreviation.trim() || currency.name.trim() || "?",
    )
    .join(" → ");

  function handleCreateCampaign() {
    if (!campaignName.trim()) {
      Alert.alert(
        "Campaign Name Required",

        "Enter a name for your campaign.",
      );

      return;
    }

    if (!characterName.trim()) {
      Alert.alert(
        "Character Name Required",

        "Enter the name of your character.",
      );

      return;
    }

    let customCurrencySystem: CurrencySystem | undefined;

    let customGameSystemName: string | undefined;

    if (gameSystem === "custom") {
      customGameSystemName = customSystemName.trim();

      if (!customGameSystemName) {
        Alert.alert(
          "System Name Required",

          "Enter a name for your custom TTRPG system.",
        );

        return;
      }

      customCurrencySystem = buildCustomCurrencySystem();

      if (!customCurrencySystem) {
        return;
      }
    }

    createCampaign({
      name: campaignName.trim(),

      characterName: characterName.trim(),

      gameSystem,

      campaignType,

      currencySystem: customCurrencySystem,

      customGameSystemName,
    });

    router.replace("/");
  }

  function buildCustomCurrencySystem(): CurrencySystem | undefined {
    if (customCurrencies.length === 0) {
      Alert.alert(
        "Currency Required",

        "Create at least one currency denomination.",
      );

      return;
    }

    const cleaned = customCurrencies.map((currency) => ({
      ...currency,

      name: currency.name.trim(),

      abbreviation: currency.abbreviation.trim(),

      numericBaseValue: Number(currency.baseValue),
    }));

    if (cleaned.some((currency) => !currency.name)) {
      Alert.alert(
        "Currency Name Required",

        "Every denomination needs a name.",
      );

      return;
    }

    if (cleaned.some((currency) => !currency.abbreviation)) {
      Alert.alert(
        "Abbreviation Required",

        "Every denomination needs an abbreviation.",
      );

      return;
    }

    if (
      cleaned.some(
        (currency) =>
          !Number.isInteger(currency.numericBaseValue) ||
          currency.numericBaseValue <= 0,
      )
    ) {
      Alert.alert(
        "Invalid Currency Value",

        "Every denomination value must be a whole number greater than zero.",
      );

      return;
    }

    const abbreviationSet = new Set(
      cleaned.map((currency) => currency.abbreviation.toLowerCase()),
    );

    if (abbreviationSet.size !== cleaned.length) {
      Alert.alert(
        "Duplicate Abbreviation",

        "Each denomination must use a unique abbreviation.",
      );

      return;
    }

    const baseValues = cleaned.map((currency) => currency.numericBaseValue);

    if (new Set(baseValues).size !== baseValues.length) {
      Alert.alert(
        "Duplicate Currency Value",

        "Each denomination must have a different conversion value.",
      );

      return;
    }

    const baseCurrencies = cleaned.filter(
      (currency) => currency.numericBaseValue === 1,
    );

    if (baseCurrencies.length !== 1) {
      Alert.alert(
        "Smallest Unit Required",

        "Exactly one denomination must have a value of 1. That denomination is the smallest unit in this currency family.",
      );

      return;
    }

    if (!cleaned.some((currency) => currency.id === commonCurrencyDraftId)) {
      Alert.alert(
        "Common Currency Required",

        "Choose the denomination normally used to display wealth.",
      );

      return;
    }

    const sorted = [...cleaned].sort(
      (a, b) => b.numericBaseValue - a.numericBaseValue,
    );

    const idMap = new Map<string, string>();

    sorted.forEach((currency, index) => {
      const slug = createCurrencySlug(currency.abbreviation);

      idMap.set(
        currency.id,

        `${slug}-${index + 1}`,
      );
    });

    const currencies = sorted.map((currency, index) => ({
      id: idMap.get(currency.id) ?? `currency-${index + 1}`,

      name: currency.name,

      abbreviation: currency.abbreviation,

      baseValue: currency.numericBaseValue,

      displayOrder: sorted.length - index,
    }));

    const commonCurrencyId = idMap.get(commonCurrencyDraftId);

    const smallestDraft = sorted.find(
      (currency) => currency.numericBaseValue === 1,
    );

    const smallestCurrencyId = smallestDraft
      ? idMap.get(smallestDraft.id)
      : undefined;

    if (!commonCurrencyId || !smallestCurrencyId) {
      Alert.alert(
        "Currency Setup Error",

        "The custom currency configuration could not be created.",
      );

      return;
    }

    return {
      id: `custom-${Date.now()}`,

      name: `${customSystemName.trim()} Currency`,

      currencies,

      commonCurrencyId,

      smallestCurrencyId,

      automaticBreakdownCurrencyIds: currencies.map((currency) => currency.id),

      isCustom: true,
    };
  }

  function updateCurrency(
    id: string,

    field: "name" | "abbreviation" | "baseValue",

    value: string,
  ) {
    setCustomCurrencies((current) =>
      current.map((currency) =>
        currency.id === id
          ? {
              ...currency,

              [field]: value,
            }
          : currency,
      ),
    );
  }

  function addCurrency() {
    const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setCustomCurrencies((current) => [
      ...current,

      {
        id,

        name: "",

        abbreviation: "",

        baseValue: "",
      },
    ]);
  }

  function removeCurrency(id: string) {
    if (customCurrencies.length === 1) {
      Alert.alert(
        "Currency Required",

        "A custom currency system must contain at least one denomination.",
      );

      return;
    }

    const remaining = customCurrencies.filter((currency) => currency.id !== id);

    setCustomCurrencies(remaining);

    if (commonCurrencyDraftId === id) {
      setCommonCurrencyDraftId(remaining[0].id);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Create Campaign</Text>

        <Text style={styles.pageSubtitle}>
          Set up the campaign, system, and economy.
        </Text>

        <Text style={styles.sectionTitle}>Campaign Details</Text>

        <Text style={styles.label}>Campaign Name</Text>

        <TextInput
          value={campaignName}
          onChangeText={setCampaignName}
          placeholder="The Dawnbreakers"
          placeholderTextColor="#746D63"
          style={styles.input}
        />

        <Text style={styles.label}>Your Character</Text>

        <TextInput
          value={characterName}
          onChangeText={setCharacterName}
          placeholder="Character name"
          placeholderTextColor="#746D63"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Game System</Text>

        <Text style={styles.helperText}>
          Built-in systems come with their normal currency model already
          configured.
        </Text>

        {GAME_SYSTEM_PROFILES.map((profile) => (
          <SystemButton
            key={profile.id}
            title={profile.name}
            description={profile.description}
            currencySummary={
              profile.isCustom
                ? "Create your own economy"
                : profile.currencySystem.currencies
                    .slice()
                    .sort((a, b) => b.displayOrder - a.displayOrder)
                    .map((currency) => currency.abbreviation)
                    .join(" • ")
            }
            selected={gameSystem === profile.id}
            onPress={() => setGameSystem(profile.id)}
          />
        ))}

        {gameSystem === "custom" ? (
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>Custom TTRPG</Text>

            <Text style={styles.customDescription}>
              Define the currency family used by this campaign.
            </Text>

            <Text style={styles.label}>TTRPG System Name</Text>

            <TextInput
              value={customSystemName}
              onChangeText={setCustomSystemName}
              placeholder="Example: Crownfall"
              placeholderTextColor="#746D63"
              style={styles.input}
            />

            <Text style={styles.subsectionTitle}>Denominations</Text>

            <Text style={styles.helperText}>
              Value represents how many of the smallest units equal one of this
              denomination. Exactly one denomination must have a value of 1.
            </Text>

            {customCurrencies.map((currency, index) => (
              <View key={currency.id} style={styles.currencyEditor}>
                <View style={styles.currencyEditorHeader}>
                  <Text style={styles.currencyEditorTitle}>
                    Denomination {index + 1}
                  </Text>

                  <Pressable onPress={() => removeCurrency(currency.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallLabel}>Name</Text>

                <TextInput
                  value={currency.name}
                  onChangeText={(value) =>
                    updateCurrency(
                      currency.id,

                      "name",

                      value,
                    )
                  }
                  placeholder="Gold Crown"
                  placeholderTextColor="#746D63"
                  style={styles.input}
                />

                <Text style={styles.smallLabel}>Abbreviation</Text>

                <TextInput
                  value={currency.abbreviation}
                  onChangeText={(value) =>
                    updateCurrency(
                      currency.id,

                      "abbreviation",

                      value,
                    )
                  }
                  placeholder="GC"
                  placeholderTextColor="#746D63"
                  style={styles.input}
                  autoCapitalize="characters"
                />

                <Text style={styles.smallLabel}>Value in Smallest Units</Text>

                <TextInput
                  value={currency.baseValue}
                  onChangeText={(value) =>
                    updateCurrency(
                      currency.id,

                      "baseValue",

                      value,
                    )
                  }
                  placeholder={index === 0 ? "1" : "100"}
                  placeholderTextColor="#746D63"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            ))}

            <Pressable style={styles.addCurrencyButton} onPress={addCurrency}>
              <Text style={styles.addCurrencyButtonText}>
                + Add Denomination
              </Text>
            </Pressable>

            <Text style={styles.subsectionTitle}>Common Wealth Currency</Text>

            <Text style={styles.helperText}>
              Dragon's Ledger will use this denomination when presenting the
              campaign's normal wealth value.
            </Text>

            <View style={styles.commonCurrencyList}>
              {customCurrencies.map((currency) => (
                <OptionButton
                  key={currency.id}
                  label={
                    currency.name.trim() ||
                    currency.abbreviation.trim() ||
                    "Unnamed Currency"
                  }
                  selected={commonCurrencyDraftId === currency.id}
                  onPress={() => setCommonCurrencyDraftId(currency.id)}
                />
              ))}
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Automatic Breakdown</Text>

              <Text style={styles.breakdownValue}>
                {customBreakdownPreview || "Add denomination values"}
              </Text>

              <Text style={styles.breakdownHelp}>
                Rewards will eventually work downward through these
                denominations before an indivisible remainder reaches the Party
                Fund.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.systemSummary}>
            <Text style={styles.systemSummaryTitle}>
              {selectedProfile?.currencySystem.name}
            </Text>

            <Text style={styles.systemSummaryText}>
              Common wealth currency:{" "}
              {selectedProfile?.currencySystem.currencies.find(
                (currency) =>
                  currency.id ===
                  selectedProfile.currencySystem.commonCurrencyId,
              )?.abbreviation ?? "Unknown"}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Campaign Type</Text>

        <OptionButton
          label="Multiplayer"
          selected={campaignType === "multiplayer"}
          onPress={() => setCampaignType("multiplayer")}
        />

        <OptionButton
          label="Personal / Solo"
          selected={campaignType === "solo"}
          onPress={() => setCampaignType("solo")}
        />

        <Pressable style={styles.createButton} onPress={handleCreateCampaign}>
          <Text style={styles.createButtonText}>Create Campaign</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createCurrencySlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "currency";
}

interface SystemButtonProps {
  title: string;

  description: string;

  currencySummary: string;

  selected: boolean;

  onPress: () => void;
}

function SystemButton({
  title,
  description,
  currencySummary,
  selected,
  onPress,
}: SystemButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.systemButton,

        selected ? styles.systemButtonSelected : null,
      ]}
    >
      <Text
        style={[
          styles.systemButtonTitle,

          selected ? styles.systemButtonTitleSelected : null,
        ]}
      >
        {title}
      </Text>

      <Text style={styles.systemButtonDescription}>{description}</Text>

      <Text style={styles.systemButtonCurrency}>{currencySummary}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#12100E",
  },

  content: {
    padding: 24,

    paddingBottom: 50,

    width: "100%",

    maxWidth: 700,

    alignSelf: "center",
  },

  pageTitle: {
    color: "#D9A441",

    fontSize: 30,

    fontWeight: "700",
  },

  pageSubtitle: {
    color: "#A99F91",

    fontSize: 15,

    marginTop: 5,

    marginBottom: 8,
  },

  sectionTitle: {
    color: "#D9A441",

    fontSize: 20,

    fontWeight: "700",

    marginTop: 25,

    marginBottom: 12,
  },

  subsectionTitle: {
    color: "#D9A441",

    fontSize: 17,

    fontWeight: "700",

    marginTop: 22,

    marginBottom: 8,
  },

  label: {
    color: "#F2E8D5",

    fontSize: 15,

    marginBottom: 7,

    marginTop: 4,
  },

  smallLabel: {
    color: "#B9AFA2",

    fontSize: 12,

    marginBottom: 6,
  },

  helperText: {
    color: "#81786D",

    fontSize: 12,

    lineHeight: 18,

    marginBottom: 12,
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

    marginBottom: 16,
  },

  systemButton: {
    borderWidth: 1,

    borderColor: "#4B4339",

    backgroundColor: "#1C1916",

    borderRadius: 12,

    padding: 15,

    marginBottom: 10,
  },

  systemButtonSelected: {
    borderColor: "#D9A441",

    backgroundColor: "#2A2115",
  },

  systemButtonTitle: {
    color: "#F2E8D5",

    fontSize: 16,

    fontWeight: "700",
  },

  systemButtonTitleSelected: {
    color: "#D9A441",
  },

  systemButtonDescription: {
    color: "#A99F91",

    fontSize: 12,

    lineHeight: 18,

    marginTop: 4,
  },

  systemButtonCurrency: {
    color: "#81786D",

    fontSize: 11,

    marginTop: 7,
  },

  systemSummary: {
    backgroundColor: "#171612",

    borderWidth: 1,

    borderColor: "#3C352D",

    borderRadius: 12,

    padding: 14,

    marginTop: 6,
  },

  systemSummaryTitle: {
    color: "#F2E8D5",

    fontSize: 14,

    fontWeight: "700",
  },

  systemSummaryText: {
    color: "#A99F91",

    fontSize: 12,

    marginTop: 5,
  },

  customSection: {
    backgroundColor: "#171612",

    borderWidth: 1,

    borderColor: "#594A32",

    borderRadius: 14,

    padding: 16,

    marginTop: 8,
  },

  customTitle: {
    color: "#D9A441",

    fontSize: 20,

    fontWeight: "700",
  },

  customDescription: {
    color: "#A99F91",

    fontSize: 13,

    lineHeight: 19,

    marginTop: 5,

    marginBottom: 18,
  },

  currencyEditor: {
    backgroundColor: "#1C1916",

    borderWidth: 1,

    borderColor: "#3C352D",

    borderRadius: 12,

    padding: 14,

    marginBottom: 12,
  },

  currencyEditorHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 12,
  },

  currencyEditorTitle: {
    color: "#F2E8D5",

    fontSize: 14,

    fontWeight: "700",
  },

  removeText: {
    color: "#C96A6A",

    fontSize: 12,

    fontWeight: "600",
  },

  addCurrencyButton: {
    borderWidth: 1,

    borderColor: "#D9A441",

    borderRadius: 10,

    alignItems: "center",

    paddingVertical: 12,

    marginTop: 4,
  },

  addCurrencyButtonText: {
    color: "#D9A441",

    fontSize: 14,

    fontWeight: "700",
  },

  commonCurrencyList: {
    gap: 8,
  },

  breakdownCard: {
    backgroundColor: "#151310",

    borderRadius: 10,

    padding: 14,

    marginTop: 16,
  },

  breakdownLabel: {
    color: "#81786D",

    fontSize: 10,

    fontWeight: "800",
  },

  breakdownValue: {
    color: "#D9A441",

    fontSize: 16,

    fontWeight: "700",

    marginTop: 6,
  },

  breakdownHelp: {
    color: "#81786D",

    fontSize: 11,

    lineHeight: 17,

    marginTop: 6,
  },

  optionButton: {
    borderWidth: 1,

    borderColor: "#4B4339",

    backgroundColor: "#1C1916",

    borderRadius: 10,

    padding: 15,

    marginBottom: 10,
  },

  optionButtonSelected: {
    borderColor: "#D9A441",

    backgroundColor: "#2A2115",
  },

  optionText: {
    color: "#B9AFA2",

    fontSize: 16,
  },

  optionTextSelected: {
    color: "#D9A441",

    fontWeight: "600",
  },

  createButton: {
    backgroundColor: "#8B2E2E",

    borderRadius: 12,

    paddingVertical: 16,

    alignItems: "center",

    marginTop: 30,
  },

  createButtonText: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "700",
  },
});
