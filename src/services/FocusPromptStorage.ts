import AsyncStorage from "@react-native-async-storage/async-storage";

import { FocusModePrompt } from "../models/FocusPrompt";

const STORAGE_KEY = "@dragons-ledger/focus-prompts";

export async function loadFocusPrompts(): Promise<FocusModePrompt[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  const parsed = JSON.parse(storedValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as FocusModePrompt[];
}

export async function saveFocusPrompts(prompts: FocusModePrompt[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export async function addFocusPrompt(prompt: FocusModePrompt) {
  const currentPrompts = await loadFocusPrompts();

  const updatedPrompts = [prompt, ...currentPrompts];

  await saveFocusPrompts(updatedPrompts);

  return updatedPrompts;
}

export async function acknowledgeFocusPrompt(
  promptId: string,
  resolvedByMemberId: string,
) {
  const currentPrompts = await loadFocusPrompts();

  const resolvedAt = new Date().toISOString();

  const updatedPrompts = currentPrompts.map((prompt) => {
    if (prompt.id !== promptId || prompt.status !== "pending") {
      return prompt;
    }

    return {
      ...prompt,

      status: "acknowledged" as const,

      resolvedAt,

      resolvedByMemberId,
    };
  });

  await saveFocusPrompts(updatedPrompts);

  return updatedPrompts;
}

export async function acknowledgePendingSessionFocusPrompts(
  sessionId: string,
  resolvedByMemberId: string,
) {
  const currentPrompts = await loadFocusPrompts();

  const resolvedAt = new Date().toISOString();

  const updatedPrompts = currentPrompts.map((prompt) => {
    if (prompt.sessionId !== sessionId || prompt.status !== "pending") {
      return prompt;
    }

    return {
      ...prompt,

      status: "acknowledged" as const,

      resolvedAt,

      resolvedByMemberId,
    };
  });

  await saveFocusPrompts(updatedPrompts);

  return updatedPrompts;
}
