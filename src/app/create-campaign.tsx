import { router } from "expo-router";

import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput
} from "react-native";

import { useState } from "react";

import { useCampaigns } from "../context/CampaignContext";

import { CampaignType, GameSystem } from "../models/Campaign";

export default function CreateCampaignScreen() {
  const { createCampaign } = useCampaigns();

  const [campaignName, setCampaignName] = useState("");
  const [characterName, setCharacterName] = useState("");

  const [gameSystem, setGameSystem] = useState<GameSystem>("dnd-5e");

  const [campaignType, setCampaignType] = useState<CampaignType>("multiplayer");

  function handleCreateCampaign() {
    if (!campaignName.trim()) {
      Alert.alert("Campaign Name Required", "Enter a name for your campaign.");

      return;
    }

    if (!characterName.trim()) {
      Alert.alert(
        "Character Name Required",
        "Enter the name of your character.",
      );

      return;
    }

    createCampaign({
      name: campaignName.trim(),
      characterName: characterName.trim(),
      gameSystem,
      campaignType,
    });

    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

        <OptionButton
          label="Dungeons & Dragons 5e"
          selected={gameSystem === "dnd-5e"}
          onPress={() => setGameSystem("dnd-5e")}
        />

        <OptionButton
          label="Pathfinder 2e"
          selected={gameSystem === "pathfinder-2e"}
          onPress={() => setGameSystem("pathfinder-2e")}
        />

        <OptionButton
          label="Custom / Other"
          selected={gameSystem === "custom"}
          onPress={() => setGameSystem("custom")}
        />

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
    padding: 24,
    paddingBottom: 50,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },

  label: {
    color: "#F2E8D5",
    fontSize: 15,
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
    marginBottom: 16,
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
