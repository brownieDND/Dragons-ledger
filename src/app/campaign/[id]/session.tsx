import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useEffect, useState } from "react";

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

import { CampaignQuest } from "../../../models/Quest";

import { DEFAULT_FOCUS_MODE_MESSAGE } from "../../../models/Session";

import { FocusModePrompt } from "../../../models/FocusPrompt";

import {
  acknowledgeFocusPrompt,
  acknowledgePendingSessionFocusPrompts,
  addFocusPrompt,
  loadFocusPrompts,
} from "../../../services/FocusPromptStorage";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    getCampaignById,
    getActiveCampaignMember,
    getActiveSession,
    getCampaignQuests,
    startSession,
    endSession,
    setFocusMode,
    createQuest,
    completeQuest,
  } = useCampaigns();

  const campaign = getCampaignById(id);

  const activeMember = campaign
    ? getActiveCampaignMember(campaign.id)
    : undefined;

  const activeSession = campaign ? getActiveSession(campaign.id) : undefined;

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [currencyId, setCurrencyId] = useState("gold");

  const [rewardAmount, setRewardAmount] = useState("");

  const [partyFundPercentage, setPartyFundPercentage] = useState("");

  const [focusMessage, setFocusMessage] = useState(DEFAULT_FOCUS_MODE_MESSAGE);

  const [focusPrompts, setFocusPrompts] = useState<FocusModePrompt[]>([]);

  const [playerPrompt, setPlayerPrompt] = useState("");

  const [promptError, setPromptError] = useState("");

  const [promptSuccess, setPromptSuccess] = useState("");

  const [confirmationQuestId, setConfirmationQuestId] = useState<string | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
   * Reload Focus Mode prompts every
   * time this screen becomes active.
   *
   * This is especially useful while
   * testing different campaign members.
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function reloadPrompts() {
        try {
          const loadedPrompts = await loadFocusPrompts();

          if (cancelled) {
            return;
          }

          setFocusPrompts(
            loadedPrompts.filter((prompt) => prompt.campaignId === id),
          );

          setPromptError("");
        } catch (error) {
          console.error("Failed to load Focus Mode prompts:", error);

          if (!cancelled) {
            setPromptError("Focus Mode prompts could not be loaded.");
          }
        }
      }

      void reloadPrompts();

      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  useEffect(() => {
    if (activeSession?.focusMessage) {
      setFocusMessage(activeSession.focusMessage);

      return;
    }

    setFocusMessage(DEFAULT_FOCUS_MODE_MESSAGE);
  }, [activeSession?.id, activeSession?.focusMessage]);

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
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

  const quests = getCampaignQuests(campaign.id);

  const activeQuests = quests.filter((quest) => quest.status === "active");

  const completedQuests = quests.filter(
    (quest) => quest.status === "completed",
  );

  const canManageSession =
    campaign.campaignType === "solo" || activeMember?.role === "dm";

  const canManageFocus =
    campaign.campaignType === "multiplayer" && activeMember?.role === "dm";

  const focusModeActive = Boolean(activeSession?.focusModeEnabled);

  const displayedFocusMessage =
    activeSession?.focusMessage?.trim() || DEFAULT_FOCUS_MODE_MESSAGE;

  const currentSessionPrompts = activeSession
    ? focusPrompts.filter((prompt) => prompt.sessionId === activeSession.id)
    : [];

  const pendingPrompts = currentSessionPrompts.filter(
    (prompt) => prompt.status === "pending",
  );

  const acknowledgedPrompts = currentSessionPrompts.filter(
    (prompt) => prompt.status === "acknowledged",
  );

  const activeMemberPendingPrompt = activeMember
    ? pendingPrompts.find(
        (prompt) => prompt.requesterMemberId === activeMember.id,
      )
    : undefined;

  const activeMemberPromptHistory = activeMember
    ? currentSessionPrompts.filter(
        (prompt) => prompt.requesterMemberId === activeMember.id,
      )
    : [];

  const currencies = [...campaign.currencySystem.currencies].sort(
    (a, b) => b.displayOrder - a.displayOrder,
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace({
      pathname: "/campaign/[id]",

      params: {
        id: campaign.id,
      },
    });
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function clearPromptMessages() {
    setPromptError("");
    setPromptSuccess("");
  }

  function handleStartSession() {
    clearMessages();

    const result = startSession(campaign.id);

    if (!result.success) {
      setErrorMessage(result.message ?? "The session could not be started.");

      return;
    }

    setSuccessMessage("Session started.");
  }

  async function handleEndSession() {
    clearMessages();
    clearPromptMessages();

    const endingSession = activeSession;

    const result = endSession(campaign.id);

    if (!result.success) {
      setErrorMessage(result.message ?? "The session could not be ended.");

      return;
    }

    /*
     * Close any unanswered Focus Mode
     * prompts when the session ends.
     */
    if (endingSession && activeMember) {
      try {
        const updatedPrompts = await acknowledgePendingSessionFocusPrompts(
          endingSession.id,
          activeMember.id,
        );

        setFocusPrompts(
          updatedPrompts.filter((prompt) => prompt.campaignId === campaign.id),
        );
      } catch (error) {
        console.error("Failed to close Focus Mode prompts:", error);
      }
    }

    setSuccessMessage("Session ended. Focus Mode was also disabled.");

    setConfirmationQuestId(null);
  }

  function handleEnableFocusMode() {
    clearMessages();

    const result = setFocusMode(campaign.id, true, focusMessage);

    if (!result.success) {
      setErrorMessage(result.message ?? "Focus Mode could not be enabled.");

      return;
    }

    setSuccessMessage("Focus Mode enabled.");
  }

  function handleDisableFocusMode() {
    clearMessages();

    const result = setFocusMode(campaign.id, false, focusMessage);

    if (!result.success) {
      setErrorMessage(result.message ?? "Focus Mode could not be disabled.");

      return;
    }

    setSuccessMessage("Focus Mode disabled.");
  }

  function handleSaveFocusMessage() {
    clearMessages();

    const result = setFocusMode(campaign.id, true, focusMessage);

    if (!result.success) {
      setErrorMessage(
        result.message ?? "The Focus Mode message could not be saved.",
      );

      return;
    }

    setSuccessMessage("Focus Mode message updated.");
  }

  async function handleSendFocusPrompt() {
    clearPromptMessages();

    if (!activeMember) {
      setPromptError("Active campaign member not found.");

      return;
    }

    if (activeMember.role === "dm") {
      setPromptError(
        "The Dungeon Master does not need to send a Focus Mode prompt.",
      );

      return;
    }

    if (!activeSession) {
      setPromptError("There is no active session.");

      return;
    }

    if (!focusModeActive) {
      setPromptError("Focus Mode is not active.");

      return;
    }

    if (activeMemberPendingPrompt) {
      setPromptError(
        "You already have a prompt waiting for the Dungeon Master.",
      );

      return;
    }

    const cleanedPrompt = playerPrompt.trim();

    if (!cleanedPrompt) {
      setPromptError("Enter a message for the Dungeon Master.");

      return;
    }

    if (cleanedPrompt.length > 280) {
      setPromptError("Focus Mode prompts are limited to 280 characters.");

      return;
    }

    const prompt: FocusModePrompt = {
      id: createPromptId(),

      campaignId: campaign.id,

      sessionId: activeSession.id,

      requesterMemberId: activeMember.id,

      message: cleanedPrompt,

      status: "pending",

      createdAt: new Date().toISOString(),
    };

    try {
      const updatedPrompts = await addFocusPrompt(prompt);

      setFocusPrompts(
        updatedPrompts.filter(
          (storedPrompt) => storedPrompt.campaignId === campaign.id,
        ),
      );

      setPlayerPrompt("");

      setPromptSuccess("Your message was sent to the Dungeon Master.");
    } catch (error) {
      console.error("Failed to send Focus Mode prompt:", error);

      setPromptError("Your Focus Mode prompt could not be saved.");
    }
  }

  async function handleAcknowledgePrompt(prompt: FocusModePrompt) {
    clearPromptMessages();

    if (activeMember?.role !== "dm") {
      setPromptError(
        "Only the Dungeon Master can acknowledge Focus Mode prompts.",
      );

      return;
    }

    try {
      const updatedPrompts = await acknowledgeFocusPrompt(
        prompt.id,
        activeMember.id,
      );

      setFocusPrompts(
        updatedPrompts.filter(
          (storedPrompt) => storedPrompt.campaignId === campaign.id,
        ),
      );

      setPromptSuccess("Player prompt acknowledged.");
    } catch (error) {
      console.error("Failed to acknowledge Focus Mode prompt:", error);

      setPromptError("The prompt could not be acknowledged.");
    }
  }

  function handleCreateQuest() {
    clearMessages();

    const numericReward = Number(rewardAmount);

    const numericPercentage = partyFundPercentage.trim()
      ? Number(partyFundPercentage)
      : campaign.partyFund.defaultContributionPercentage;

    const result = createQuest({
      campaignId: campaign.id,

      title,

      description,

      currencyId,

      rewardAmount: numericReward,

      partyFundPercentage: numericPercentage,
    });

    if (!result.success) {
      setErrorMessage(result.message ?? "The quest could not be created.");

      return;
    }

    setTitle("");
    setDescription("");
    setRewardAmount("");
    setPartyFundPercentage("");

    setSuccessMessage(`Quest "${result.quest?.title}" created.`);
  }

  function handleCompleteQuest(quest: CampaignQuest) {
    clearMessages();

    const result = completeQuest(campaign.id, quest.id);

    if (!result.success) {
      setErrorMessage(result.message ?? "The quest could not be completed.");

      return;
    }

    setConfirmationQuestId(null);

    const reward = result.reward;

    const abbreviation =
      campaign.currencySystem.currencies.find(
        (currency) => currency.id === reward?.currencyId,
      )?.abbreviation ?? "";

    setSuccessMessage(
      `${result.quest?.title} completed. ${reward?.grossAmount ?? 0} ${abbreviation} was distributed.`,
    );
  }

  function getPromptMember(prompt: FocusModePrompt) {
    return campaign.members.find(
      (member) => member.id === prompt.requesterMemberId,
    );
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

        <Text style={styles.title}>Session & Quests</Text>

        <Text style={styles.subtitle}>{campaign.name}</Text>

        <View
          style={[
            styles.sessionCard,

            activeSession ? styles.activeSessionCard : null,
          ]}
        >
          <Text style={styles.sessionStatusLabel}>Session Status</Text>

          <Text
            style={activeSession ? styles.activeStatus : styles.inactiveStatus}
          >
            {activeSession ? "ACTIVE" : "NOT ACTIVE"}
          </Text>

          {activeSession ? (
            <>
              <Text style={styles.sessionDetail}>
                Started {formatDate(activeSession.startedAt)}
              </Text>

              <Text style={styles.sessionDetail}>
                Active quests: {activeQuests.length}
              </Text>
            </>
          ) : (
            <Text style={styles.sessionDescription}>
              Start a session before creating or completing quests.
            </Text>
          )}

          {canManageSession ? (
            activeSession ? (
              <Pressable style={styles.endButton} onPress={handleEndSession}>
                <Text style={styles.endButtonText}>End Session</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryButton}
                onPress={handleStartSession}
              >
                <Text style={styles.primaryButtonText}>Start Session</Text>
              </Pressable>
            )
          ) : (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionText}>
                Only the Dungeon Master can control sessions and quests.
              </Text>
            </View>
          )}
        </View>

        {campaign.campaignType === "multiplayer" ? (
          <>
            <Text style={styles.sectionTitle}>Focus Mode</Text>

            <View
              style={[
                styles.focusCard,

                focusModeActive ? styles.focusCardActive : null,
              ]}
            >
              <Text style={styles.focusStatusLabel}>Focus Mode Status</Text>

              <Text
                style={
                  focusModeActive
                    ? styles.focusActiveText
                    : styles.focusInactiveText
                }
              >
                {focusModeActive ? "ACTIVE" : "INACTIVE"}
              </Text>

              {focusModeActive ? (
                <>
                  <Text style={styles.focusPlayerLabel}>
                    Message to Players
                  </Text>

                  <Text style={styles.focusDisplayedMessage}>
                    {displayedFocusMessage}
                  </Text>

                  {activeMember?.role !== "dm" ? (
                    <View style={styles.focusRestrictionBox}>
                      <Text style={styles.focusRestrictionText}>
                        Financial actions are temporarily restricted while Focus
                        Mode is active.
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.focusDescription}>
                  Focus Mode lets the DM temporarily restrict player financial
                  actions while the session is being run.
                </Text>
              )}

              {canManageFocus && activeSession ? (
                <>
                  <Text style={styles.focusInputLabel}>Player Message</Text>

                  <TextInput
                    value={focusMessage}
                    onChangeText={setFocusMessage}
                    multiline
                    placeholder={DEFAULT_FOCUS_MODE_MESSAGE}
                    placeholderTextColor="#746D63"
                    style={[styles.input, styles.focusMessageInput]}
                  />

                  {focusModeActive ? (
                    <>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={handleSaveFocusMessage}
                      >
                        <Text style={styles.secondaryButtonText}>
                          Save Message
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.focusDisableButton}
                        onPress={handleDisableFocusMode}
                      >
                        <Text style={styles.focusDisableButtonText}>
                          Disable Focus Mode
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={styles.primaryButton}
                      onPress={handleEnableFocusMode}
                    >
                      <Text style={styles.primaryButtonText}>
                        Enable Focus Mode
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : null}

              {!activeSession ? (
                <Text style={styles.focusHint}>
                  A session must be active before Focus Mode can be enabled.
                </Text>
              ) : null}

              {activeSession &&
              activeMember?.role !== "dm" &&
              focusModeActive ? (
                <View style={styles.playerPromptSection}>
                  <Text style={styles.promptSectionTitle}>Message the DM</Text>

                  <Text style={styles.promptHelpText}>
                    Send a short message if you need the DM's attention without
                    leaving Focus Mode.
                  </Text>

                  {activeMemberPendingPrompt ? (
                    <View style={styles.pendingPromptCard}>
                      <Text style={styles.pendingPromptLabel}>
                        WAITING FOR DM
                      </Text>

                      <Text style={styles.promptMessage}>
                        {activeMemberPendingPrompt.message}
                      </Text>

                      <Text style={styles.promptDate}>
                        Sent {formatDate(activeMemberPendingPrompt.createdAt)}
                      </Text>

                      <Text style={styles.pendingPromptHint}>
                        You can send another prompt after the DM acknowledges
                        this one.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        value={playerPrompt}
                        onChangeText={(value) => {
                          if (value.length <= 280) {
                            setPlayerPrompt(value);
                          }

                          clearPromptMessages();
                        }}
                        multiline
                        placeholder="Example: Can I make a perception check?"
                        placeholderTextColor="#746D63"
                        style={[styles.input, styles.playerPromptInput]}
                      />

                      <Text style={styles.characterCounter}>
                        {playerPrompt.length}
                        /280
                      </Text>

                      <Pressable
                        style={styles.promptSendButton}
                        onPress={handleSendFocusPrompt}
                      >
                        <Text style={styles.promptSendButtonText}>
                          Send to DM
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ) : null}

              {activeSession &&
              focusModeActive &&
              activeMember?.role !== "dm" &&
              activeMemberPromptHistory.some(
                (prompt) => prompt.status === "acknowledged",
              ) ? (
                <View style={styles.promptHistorySection}>
                  <Text style={styles.promptHistoryTitle}>Acknowledged</Text>

                  {activeMemberPromptHistory
                    .filter((prompt) => prompt.status === "acknowledged")
                    .slice(0, 3)
                    .map((prompt) => (
                      <View
                        key={prompt.id}
                        style={styles.acknowledgedPromptCard}
                      >
                        <Text style={styles.acknowledgedLabel}>
                          ACKNOWLEDGED
                        </Text>

                        <Text style={styles.promptMessage}>
                          {prompt.message}
                        </Text>
                      </View>
                    ))}
                </View>
              ) : null}

              {canManageFocus &&
              activeSession &&
              focusModeActive ? (
                <View style={styles.dmPromptSection}>
                  <Text style={styles.promptSectionTitle}>Player Prompts</Text>

                  <Text style={styles.promptHelpText}>
                    {pendingPrompts.length}{" "}
                    {pendingPrompts.length === 1 ? "player is" : "players are"}{" "}
                    waiting for your attention.
                  </Text>

                  {pendingPrompts.length === 0 ? (
                    <View style={styles.noPromptsCard}>
                      <Text style={styles.noPromptsText}>
                        No pending player prompts.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.promptList}>
                      {pendingPrompts.map((prompt) => {
                        const member = getPromptMember(prompt);

                        return (
                          <View key={prompt.id} style={styles.dmPromptCard}>
                            <Text style={styles.promptMemberName}>
                              {member?.displayName ?? "Unknown Player"}
                            </Text>

                            {member?.character ? (
                              <Text style={styles.promptCharacterName}>
                                {member.character.name}
                              </Text>
                            ) : null}

                            <Text style={styles.promptMessage}>
                              {prompt.message}
                            </Text>

                            <Text style={styles.promptDate}>
                              {formatDate(prompt.createdAt)}
                            </Text>

                            <Pressable
                              style={styles.acknowledgeButton}
                              onPress={() => handleAcknowledgePrompt(prompt)}
                            >
                              <Text style={styles.acknowledgeButtonText}>
                                Acknowledge
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {acknowledgedPrompts.length > 0 ? (
                    <View style={styles.dmPromptHistory}>
                      <Text style={styles.promptHistoryTitle}>
                        Recent Acknowledged
                      </Text>

                      {acknowledgedPrompts.slice(0, 5).map((prompt) => {
                        const member = getPromptMember(prompt);

                        return (
                          <View
                            key={prompt.id}
                            style={styles.acknowledgedPromptCard}
                          >
                            <Text style={styles.acknowledgedLabel}>
                              ACKNOWLEDGED
                            </Text>

                            <Text style={styles.promptMemberHistory}>
                              {member?.displayName ?? "Unknown Player"}
                            </Text>

                            <Text style={styles.promptMessage}>
                              {prompt.message}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {promptError ? (
                <View style={styles.promptErrorCard}>
                  <Text style={styles.promptErrorText}>{promptError}</Text>
                </View>
              ) : null}

              {promptSuccess ? (
                <View style={styles.promptSuccessCard}>
                  <Text style={styles.promptSuccessText}>{promptSuccess}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Action Failed</Text>

            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Success</Text>

            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Active Quests</Text>

        {activeQuests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active quests.</Text>

            <Text style={styles.emptyDescription}>
              New quests created by the DM will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.questList}>
            {activeQuests.map((quest) => {
              const currency = campaign.currencySystem.currencies.find(
                (item) => item.id === quest.currencyId,
              );

              const confirming = confirmationQuestId === quest.id;

              return (
                <View key={quest.id} style={styles.questCard}>
                  <Text style={styles.questTitle}>{quest.title}</Text>

                  {quest.description ? (
                    <Text style={styles.questDescription}>
                      {quest.description}
                    </Text>
                  ) : null}

                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardLabel}>Quest Reward</Text>

                    <Text style={styles.rewardValue}>
                      {quest.rewardAmount} {currency?.abbreviation ?? "?"}
                    </Text>

                    <Text style={styles.rewardFund}>
                      {quest.partyFundPercentage}% Party Fund
                    </Text>
                  </View>

                  {canManageSession && activeSession ? (
                    confirming ? (
                      <View style={styles.confirmCard}>
                        <Text style={styles.confirmTitle}>Complete Quest?</Text>

                        <Text style={styles.confirmText}>
                          Completing this quest will immediately distribute its
                          reward to eligible characters and the Party Fund.
                        </Text>

                        <View style={styles.confirmButtons}>
                          <Pressable
                            style={styles.cancelButton}
                            onPress={() => setConfirmationQuestId(null)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </Pressable>

                          <Pressable
                            style={styles.completeButton}
                            onPress={() => handleCompleteQuest(quest)}
                          >
                            <Text style={styles.completeButtonText}>
                              Complete & Distribute
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.completeButton}
                        onPress={() => setConfirmationQuestId(quest.id)}
                      >
                        <Text style={styles.completeButtonText}>
                          Complete Quest
                        </Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {canManageSession && activeSession ? (
          <>
            <Text style={styles.sectionTitle}>Create Quest</Text>

            <Text style={styles.label}>Quest Title</Text>

            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                clearMessages();
              }}
              placeholder="Example: Clear the Goblin Den"
              placeholderTextColor="#746D63"
              style={styles.input}
            />

            <Text style={styles.label}>Description</Text>

            <TextInput
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                clearMessages();
              }}
              placeholder="Optional quest details"
              placeholderTextColor="#746D63"
              multiline
              style={[styles.input, styles.descriptionInput]}
            />

            <Text style={styles.sectionLabel}>Reward Currency</Text>

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

            <Text style={styles.label}>Reward Amount</Text>

            <TextInput
              value={rewardAmount}
              onChangeText={(value) => {
                setRewardAmount(value);
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
              placeholder={`${campaign.partyFund.defaultContributionPercentage}`}
              placeholderTextColor="#746D63"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.helperText}>
              Leave this blank to use the campaign default of{" "}
              {campaign.partyFund.defaultContributionPercentage}
              %.
            </Text>

            <Pressable style={styles.primaryButton} onPress={handleCreateQuest}>
              <Text style={styles.primaryButtonText}>Create Quest</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Completed Quests</Text>

        {completedQuests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No completed quests yet.</Text>
          </View>
        ) : (
          <View style={styles.questList}>
            {completedQuests.map((quest) => {
              const currency = campaign.currencySystem.currencies.find(
                (item) => item.id === quest.currencyId,
              );

              return (
                <View key={quest.id} style={styles.completedQuestCard}>
                  <Text style={styles.questTitle}>{quest.title}</Text>

                  <Text style={styles.completedLabel}>COMPLETED</Text>

                  <Text style={styles.completedReward}>
                    {quest.rewardAmount} {currency?.abbreviation ?? "?"}{" "}
                    distributed
                  </Text>

                  {quest.completedAt ? (
                    <Text style={styles.completedDate}>
                      {formatDate(quest.completedAt)}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

function createPromptId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    paddingBottom: 60,
  },

  backText: {
    color: "#D9A441",
    fontSize: 15,
    marginBottom: 18,
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
    marginBottom: 20,
  },

  sessionCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 16,
    padding: 20,
  },

  activeSessionCard: {
    borderColor: "#D9A441",
  },

  sessionStatusLabel: {
    color: "#81786D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  activeStatus: {
    color: "#8FB573",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  inactiveStatus: {
    color: "#A99F91",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  sessionDetail: {
    color: "#F2E8D5",
    fontSize: 13,
    marginTop: 7,
  },

  sessionDescription: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  sectionTitle: {
    color: "#D9A441",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },

  focusCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 16,
    padding: 20,
  },

  focusCardActive: {
    backgroundColor: "#241B12",
    borderColor: "#D9A441",
  },

  focusStatusLabel: {
    color: "#81786D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  focusActiveText: {
    color: "#D9A441",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  focusInactiveText: {
    color: "#A99F91",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  focusDescription: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  focusPlayerLabel: {
    color: "#81786D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 16,
  },

  focusDisplayedMessage: {
    color: "#F2E8D5",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },

  focusRestrictionBox: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 10,
    padding: 13,
    marginTop: 16,
  },

  focusRestrictionText: {
    color: "#D8B5B5",
    fontSize: 13,
    lineHeight: 19,
  },

  focusInputLabel: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 18,
    marginBottom: 7,
  },

  focusMessageInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  focusHint: {
    color: "#81786D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  focusDisableButton: {
    borderWidth: 1,
    borderColor: "#C96A6A",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  focusDisableButtonText: {
    color: "#C96A6A",
    fontSize: 14,
    fontWeight: "700",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D9A441",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },

  secondaryButtonText: {
    color: "#D9A441",
    fontSize: 14,
    fontWeight: "700",
  },

  playerPromptSection: {
    borderTopWidth: 1,
    borderTopColor: "#594A32",
    marginTop: 24,
    paddingTop: 20,
  },

  dmPromptSection: {
    borderTopWidth: 1,
    borderTopColor: "#594A32",
    marginTop: 24,
    paddingTop: 20,
  },

  promptSectionTitle: {
    color: "#D9A441",
    fontSize: 18,
    fontWeight: "700",
  },

  promptHelpText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 12,
  },

  playerPromptInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  characterCounter: {
    color: "#81786D",
    fontSize: 11,
    textAlign: "right",
    marginTop: 5,
  },

  promptSendButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },

  promptSendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  pendingPromptCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#D9A441",
    borderRadius: 10,
    padding: 14,
  },

  pendingPromptLabel: {
    color: "#D9A441",
    fontSize: 11,
    fontWeight: "800",
  },

  pendingPromptHint: {
    color: "#81786D",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },

  promptList: {
    gap: 10,
  },

  dmPromptCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#8A6930",
    borderRadius: 10,
    padding: 14,
  },

  promptMemberName: {
    color: "#F2E8D5",
    fontSize: 15,
    fontWeight: "700",
  },

  promptCharacterName: {
    color: "#D9A441",
    fontSize: 12,
    marginTop: 3,
  },

  promptMessage: {
    color: "#F2E8D5",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },

  promptDate: {
    color: "#81786D",
    fontSize: 10,
    marginTop: 7,
  },

  acknowledgeButton: {
    backgroundColor: "#54734A",
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
  },

  acknowledgeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  noPromptsCard: {
    backgroundColor: "#171612",
    borderRadius: 10,
    padding: 13,
  },

  noPromptsText: {
    color: "#A99F91",
    fontSize: 13,
  },

  promptHistorySection: {
    borderTopWidth: 1,
    borderTopColor: "#3C352D",
    marginTop: 20,
    paddingTop: 16,
  },

  dmPromptHistory: {
    marginTop: 20,
    gap: 8,
  },

  promptHistoryTitle: {
    color: "#A99F91",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  acknowledgedPromptCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 9,
    padding: 12,
    marginTop: 7,
  },

  acknowledgedLabel: {
    color: "#8FB573",
    fontSize: 10,
    fontWeight: "800",
  },

  promptMemberHistory: {
    color: "#C3D7BB",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },

  promptErrorCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 9,
    padding: 12,
    marginTop: 15,
  },

  promptErrorText: {
    color: "#D8B5B5",
    fontSize: 12,
    lineHeight: 18,
  },

  promptSuccessCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 9,
    padding: 12,
    marginTop: 15,
  },

  promptSuccessText: {
    color: "#C3D7BB",
    fontSize: 12,
    lineHeight: 18,
  },

  emptyCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 12,
    padding: 18,
  },

  emptyTitle: {
    color: "#F2E8D5",
    fontSize: 16,
    fontWeight: "600",
  },

  emptyDescription: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  questList: {
    gap: 12,
  },

  questCard: {
    backgroundColor: "#1C1916",
    borderWidth: 1,
    borderColor: "#594A32",
    borderRadius: 14,
    padding: 18,
  },

  completedQuestCard: {
    backgroundColor: "#171612",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 14,
    padding: 18,
  },

  questTitle: {
    color: "#F2E8D5",
    fontSize: 18,
    fontWeight: "700",
  },

  questDescription: {
    color: "#A99F91",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  rewardCard: {
    backgroundColor: "#151310",
    borderWidth: 1,
    borderColor: "#3C352D",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },

  rewardLabel: {
    color: "#81786D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  rewardValue: {
    color: "#D9A441",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  rewardFund: {
    color: "#A99F91",
    fontSize: 12,
    marginTop: 4,
  },

  completeButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 14,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  confirmCard: {
    backgroundColor: "#241B12",
    borderWidth: 1,
    borderColor: "#8A6930",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },

  confirmTitle: {
    color: "#D9A441",
    fontSize: 15,
    fontWeight: "700",
  },

  confirmText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  confirmButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  cancelButton: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#81786D",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  cancelButtonText: {
    color: "#A99F91",
    fontSize: 14,
    fontWeight: "600",
  },

  label: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 16,
    marginBottom: 7,
  },

  sectionLabel: {
    color: "#F2E8D5",
    fontSize: 14,
    marginTop: 18,
    marginBottom: 8,
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
    minHeight: 90,
    textAlignVertical: "top",
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
    paddingVertical: 11,
  },

  optionButtonSelected: {
    backgroundColor: "#2A2115",
    borderColor: "#D9A441",
  },

  optionText: {
    color: "#B9AFA2",
    fontSize: 14,
  },

  optionTextSelected: {
    color: "#D9A441",
    fontWeight: "700",
  },

  helperText: {
    color: "#81786D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  primaryButton: {
    backgroundColor: "#8B2E2E",
    borderRadius: 11,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  endButton: {
    borderWidth: 1,
    borderColor: "#C96A6A",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  endButtonText: {
    color: "#C96A6A",
    fontSize: 15,
    fontWeight: "700",
  },

  permissionCard: {
    backgroundColor: "#171612",
    borderRadius: 10,
    padding: 13,
    marginTop: 14,
  },

  permissionText: {
    color: "#A99F91",
    fontSize: 13,
    lineHeight: 19,
  },

  errorCard: {
    backgroundColor: "#2B1717",
    borderWidth: 1,
    borderColor: "#8B2E2E",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },

  errorTitle: {
    color: "#E08A8A",
    fontSize: 14,
    fontWeight: "700",
  },

  errorText: {
    color: "#D8B5B5",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  successCard: {
    backgroundColor: "#182417",
    borderWidth: 1,
    borderColor: "#54734A",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },

  successTitle: {
    color: "#9CC58B",
    fontSize: 14,
    fontWeight: "700",
  },

  successText: {
    color: "#C3D7BB",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  completedLabel: {
    color: "#8FB573",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },

  completedReward: {
    color: "#D9A441",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
  },

  completedDate: {
    color: "#81786D",
    fontSize: 11,
    marginTop: 5,
  },

  centered: {
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


