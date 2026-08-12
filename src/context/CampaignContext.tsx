import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Campaign,
  CampaignMember,
  CampaignMemberRole,
  CampaignType,
  GameSystem,
} from "../models/Campaign";

import {
  createEmptyWallet,
  CurrencySystem,
  DND_5E_CURRENCY_SYSTEM,
} from "../models/Currency";

import {
  NewPartyFundTransaction,
  NewTransaction,
  Transaction,
  TransactionType,
} from "../models/Transaction";

import {
  NewRewardDistribution,
  RewardDistribution,
  RewardDistributionResult,
} from "../models/Reward";

import { CampaignSession, DEFAULT_FOCUS_MODE_MESSAGE } from "../models/Session";

import { CampaignQuest, NewCampaignQuest } from "../models/Quest";

import { WalletTransactionRequest } from "../models/WalletRequest";

const STORAGE_KEY = "@dragons-ledger/app-state";

const STORAGE_VERSION = 1;

interface PersistedCampaignState {
  version: number;

  campaigns: Campaign[];

  transactions: Transaction[];

  rewards: RewardDistribution[];

  sessions: CampaignSession[];

  quests: CampaignQuest[];

  walletRequests: WalletTransactionRequest[];
}

interface NewCampaign {
  name: string;

  characterName: string;

  gameSystem: GameSystem;

  campaignType: CampaignType;
}

interface NewCampaignMember {
  campaignId: string;

  displayName: string;

  characterName?: string;

  role: CampaignMemberRole;
}

interface TransactionResult {
  success: boolean;

  message?: string;

  transaction?: Transaction;
}

interface PartyFundContributionResult {
  success: boolean;

  message?: string;

  characterTransaction?: Transaction;

  partyFundTransaction?: Transaction;
}

interface CampaignMemberResult {
  success: boolean;

  message?: string;

  member?: CampaignMember;
}

interface ActiveMemberResult {
  success: boolean;

  message?: string;

  member?: CampaignMember;
}

interface SessionResult {
  success: boolean;

  message?: string;

  session?: CampaignSession;
}

interface QuestResult {
  success: boolean;

  message?: string;

  quest?: CampaignQuest;
}

interface QuestCompletionResult {
  success: boolean;

  message?: string;

  quest?: CampaignQuest;

  reward?: RewardDistribution;
}

interface WalletRequestResult {
  success: boolean;

  message?: string;

  request?: WalletTransactionRequest;

  transaction?: Transaction;
}

interface CampaignContextType {
  campaigns: Campaign[];

  transactions: Transaction[];

  rewards: RewardDistribution[];

  sessions: CampaignSession[];

  quests: CampaignQuest[];

  walletRequests: WalletTransactionRequest[];

  storageError: string | null;

  createCampaign: (campaign: NewCampaign) => Campaign;

  getCampaignById: (id: string) => Campaign | undefined;

  getActiveCampaignMember: (campaignId: string) => CampaignMember | undefined;

  setActiveMember: (campaignId: string, memberId: string) => ActiveMemberResult;

  addCampaignMember: (newMember: NewCampaignMember) => CampaignMemberResult;

  createTransaction: (transaction: NewTransaction) => TransactionResult;

  requestWalletTransaction: (
    transaction: NewTransaction,
  ) => WalletRequestResult;

  approveWalletRequest: (
    campaignId: string,
    requestId: string,
  ) => WalletRequestResult;

  declineWalletRequest: (
    campaignId: string,
    requestId: string,
  ) => WalletRequestResult;

  getCampaignWalletRequests: (campaignId: string) => WalletTransactionRequest[];

  createPartyFundTransaction: (
    transaction: NewPartyFundTransaction,
  ) => TransactionResult;

  contributeToPartyFund: (
    campaignId: string,
    currencyId: string,
    amount: number,
    description: string,
  ) => PartyFundContributionResult;

  distributeReward: (reward: NewRewardDistribution) => RewardDistributionResult;

  startSession: (campaignId: string) => SessionResult;

  endSession: (campaignId: string) => SessionResult;

  setFocusMode: (
    campaignId: string,
    enabled: boolean,
    message?: string,
  ) => SessionResult;

  getActiveSession: (campaignId: string) => CampaignSession | undefined;

  getCampaignSessions: (campaignId: string) => CampaignSession[];

  createQuest: (quest: NewCampaignQuest) => QuestResult;

  completeQuest: (campaignId: string, questId: string) => QuestCompletionResult;

  getCampaignQuests: (campaignId: string) => CampaignQuest[];

  getCampaignTransactions: (campaignId: string) => Transaction[];

  getCampaignRewards: (campaignId: string) => RewardDistribution[];
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [rewards, setRewards] = useState<RewardDistribution[]>([]);

  const [sessions, setSessions] = useState<CampaignSession[]>([]);

  const [quests, setQuests] = useState<CampaignQuest[]>([]);

  const [walletRequests, setWalletRequests] = useState<
    WalletTransactionRequest[]
  >([]);

  const [isHydrated, setIsHydrated] = useState(false);

  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateState() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          return;
        }

        const parsed = JSON.parse(
          storedValue,
        ) as Partial<PersistedCampaignState>;

        if (parsed.version !== STORAGE_VERSION) {
          throw new Error(
            `Unsupported Dragon's Ledger storage version: ${String(
              parsed.version,
            )}`,
          );
        }

        if (cancelled) {
          return;
        }

        setCampaigns(Array.isArray(parsed.campaigns) ? parsed.campaigns : []);

        setTransactions(
          Array.isArray(parsed.transactions) ? parsed.transactions : [],
        );

        setRewards(Array.isArray(parsed.rewards) ? parsed.rewards : []);

        setSessions(Array.isArray(parsed.sessions) ? parsed.sessions : []);

        setQuests(Array.isArray(parsed.quests) ? parsed.quests : []);

        setWalletRequests(
          Array.isArray(parsed.walletRequests) ? parsed.walletRequests : [],
        );

        setStorageError(null);
      } catch (error) {
        console.error("Failed to load Dragon's Ledger data:", error);

        if (!cancelled) {
          setStorageError("Saved Dragon's Ledger data could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const savedState: PersistedCampaignState = {
      version: STORAGE_VERSION,

      campaigns,

      transactions,

      rewards,

      sessions,

      quests,

      walletRequests,
    };

    const saveTimer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedState))
        .then(() => {
          setStorageError(null);
        })
        .catch((error) => {
          console.error("Failed to save Dragon's Ledger data:", error);

          setStorageError(
            "Dragon's Ledger could not save your latest changes.",
          );
        });
    }, 100);

    return () => {
      clearTimeout(saveTimer);
    };
  }, [
    isHydrated,
    campaigns,
    transactions,
    rewards,
    sessions,
    quests,
    walletRequests,
  ]);

  function createCampaign(newCampaign: NewCampaign): Campaign {
    const currencySystem = getDefaultCurrencySystem(newCampaign.gameSystem);

    const createdAt = new Date().toISOString();

    const character = {
      id: createId(),

      name: newCampaign.characterName,

      wallet: createEmptyWallet(currencySystem),
    };

    const ownerMember: CampaignMember = {
      id: createId(),

      displayName: "Campaign Owner",

      role: newCampaign.campaignType === "solo" ? "party-leader" : "player",

      isOwner: true,

      character,

      joinedAt: createdAt,
    };

    const campaign: Campaign = {
      id: createId(),

      name: newCampaign.name,

      gameSystem: newCampaign.gameSystem,

      campaignType: newCampaign.campaignType,

      currencySystem,

      activeCharacter: character,

      members: [ownerMember],

      activeMemberId: ownerMember.id,

      partyFund: {
        id: createId(),

        wallet: createEmptyWallet(currencySystem),

        defaultContributionPercentage: 10,
      },

      createdAt,
    };

    setCampaigns((currentCampaigns) => [...currentCampaigns, campaign]);

    return campaign;
  }

  function getCampaignById(id: string) {
    return campaigns.find((campaign) => campaign.id === id);
  }

  function getActiveCampaignMember(campaignId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return undefined;
    }

    return campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );
  }

  function getActiveSession(campaignId: string) {
    return sessions.find(
      (session) =>
        session.campaignId === campaignId && session.status === "active",
    );
  }

  function getFocusModeBlockMessage(
    campaign: Campaign,
    activeMember: CampaignMember,
  ) {
    if (campaign.campaignType !== "multiplayer" || activeMember.role === "dm") {
      return null;
    }

    const activeSession = getActiveSession(campaign.id);

    if (!activeSession?.focusModeEnabled) {
      return null;
    }

    return activeSession.focusMessage?.trim() || DEFAULT_FOCUS_MODE_MESSAGE;
  }

  function setActiveMember(
    campaignId: string,
    memberId: string,
  ): ActiveMemberResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const member = campaign.members.find((item) => item.id === memberId);

    if (!member) {
      return {
        success: false,
        message: "Campaign member not found.",
      };
    }

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaignId) {
          return currentCampaign;
        }

        return {
          ...currentCampaign,

          activeMemberId: member.id,

          activeCharacter: member.character ?? currentCampaign.activeCharacter,
        };
      }),
    );

    return {
      success: true,
      member,
    };
  }

  function addCampaignMember(
    newMember: NewCampaignMember,
  ): CampaignMemberResult {
    const campaign = campaigns.find((item) => item.id === newMember.campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    if (campaign.campaignType === "solo") {
      return {
        success: false,
        message: "Members cannot be added to a solo campaign.",
      };
    }

    const displayName = newMember.displayName.trim();

    const characterName = newMember.characterName?.trim() ?? "";

    if (!displayName) {
      return {
        success: false,
        message: "Enter a player name.",
      };
    }

    if (newMember.role !== "dm" && !characterName) {
      return {
        success: false,
        message: "Players must have a character name.",
      };
    }

    if (
      newMember.role === "dm" &&
      campaign.members.some((member) => member.role === "dm")
    ) {
      return {
        success: false,
        message: "This campaign already has a DM.",
      };
    }

    if (
      newMember.role === "party-leader" &&
      campaign.members.some((member) => member.role === "party-leader")
    ) {
      return {
        success: false,
        message: "This campaign already has a Party Leader.",
      };
    }

    if (
      newMember.role === "treasurer" &&
      campaign.members.some((member) => member.role === "treasurer")
    ) {
      return {
        success: false,
        message: "This campaign already has a Treasurer.",
      };
    }

    const member: CampaignMember = {
      id: createId(),

      displayName,

      role: newMember.role,

      isOwner: false,

      character:
        newMember.role === "dm" && !characterName
          ? undefined
          : {
              id: createId(),

              name: characterName,

              wallet: createEmptyWallet(campaign.currencySystem),
            },

      joinedAt: new Date().toISOString(),
    };

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        return {
          ...currentCampaign,

          members: [...currentCampaign.members, member],
        };
      }),
    );

    return {
      success: true,
      member,
    };
  }

  function applyCharacterTransaction(
    campaign: Campaign,
    characterId: string,
    type: TransactionType,
    currencyId: string,
    amount: number,
    description: string,
  ): TransactionResult {
    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Currency not found.",
      };
    }

    const member = campaign.members.find(
      (item) => item.character?.id === characterId,
    );

    if (!member?.character) {
      return {
        success: false,
        message: "Character wallet not found.",
      };
    }

    const currentBalance = member.character.wallet.balances.find(
      (balance) => balance.currencyId === currencyId,
    );

    if (!currentBalance) {
      return {
        success: false,
        message: "Wallet balance not found.",
      };
    }

    const signedAmount = normalizeTransactionAmount(type, amount);

    const newBalance = currentBalance.amount + signedAmount;

    if (newBalance < 0) {
      return {
        success: false,
        message: `Not enough ${currency.abbreviation}.`,
      };
    }

    const transaction: Transaction = {
      id: createId(),

      campaignId: campaign.id,

      accountType: "character",

      characterId,

      type,

      currencyId,

      amount: signedAmount,

      description: description.trim(),

      createdAt: new Date().toISOString(),
    };

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        const updatedMembers = currentCampaign.members.map((currentMember) => {
          if (currentMember.character?.id !== characterId) {
            return currentMember;
          }

          return {
            ...currentMember,

            character: {
              ...currentMember.character,

              wallet: {
                ...currentMember.character.wallet,

                balances: currentMember.character.wallet.balances.map(
                  (balance) => {
                    if (balance.currencyId !== currencyId) {
                      return balance;
                    }

                    return {
                      ...balance,

                      amount: balance.amount + signedAmount,
                    };
                  },
                ),
              },
            },
          };
        });

        const updatedActiveMember = updatedMembers.find(
          (currentMember) =>
            currentMember.id === currentCampaign.activeMemberId,
        );

        return {
          ...currentCampaign,

          members: updatedMembers,

          activeCharacter:
            updatedActiveMember?.character ?? currentCampaign.activeCharacter,
        };
      }),
    );

    setTransactions((currentTransactions) => [
      transaction,

      ...currentTransactions,
    ]);

    return {
      success: true,
      transaction,
    };
  }

  function createTransaction(
    newTransaction: NewTransaction,
  ): TransactionResult {
    const campaign = campaigns.find(
      (item) => item.id === newTransaction.campaignId,
    );

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    const focusMessage = getFocusModeBlockMessage(campaign, activeMember);

    if (focusMessage) {
      return {
        success: false,
        message: `Focus Mode is active. ${focusMessage}`,
      };
    }

    if (!activeMember.character) {
      return {
        success: false,
        message: "The active member does not have a character wallet.",
      };
    }

    if (activeMember.character.id !== newTransaction.characterId) {
      return {
        success: false,
        message:
          "You can only record transactions for the active member's character.",
      };
    }

    const signedAmount = normalizeTransactionAmount(
      newTransaction.type,
      newTransaction.amount,
    );

    if (
      campaign.campaignType === "multiplayer" &&
      activeMember.role !== "dm" &&
      signedAmount > 0
    ) {
      return {
        success: false,
        message:
          "Wallet additions require Dungeon Master approval in multiplayer campaigns.",
      };
    }

    return applyCharacterTransaction(
      campaign,
      activeMember.character.id,
      newTransaction.type,
      newTransaction.currencyId,
      newTransaction.amount,
      newTransaction.description,
    );
  }

  function requestWalletTransaction(
    newTransaction: NewTransaction,
  ): WalletRequestResult {
    const campaign = campaigns.find(
      (item) => item.id === newTransaction.campaignId,
    );

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    const focusMessage = getFocusModeBlockMessage(campaign, activeMember);

    if (focusMessage) {
      return {
        success: false,
        message: `Focus Mode is active. ${focusMessage}`,
      };
    }

    if (campaign.campaignType !== "multiplayer") {
      return {
        success: false,
        message:
          "Wallet approval requests are only required in multiplayer campaigns.",
      };
    }

    if (activeMember.role === "dm") {
      return {
        success: false,
        message: "The Dungeon Master does not need to request approval.",
      };
    }

    if (!activeMember.character) {
      return {
        success: false,
        message: "The active member does not have a character wallet.",
      };
    }

    if (activeMember.character.id !== newTransaction.characterId) {
      return {
        success: false,
        message:
          "You can only request wallet changes for your active character.",
      };
    }

    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === newTransaction.currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Currency not found.",
      };
    }

    const signedAmount = normalizeTransactionAmount(
      newTransaction.type,
      newTransaction.amount,
    );

    if (!Number.isFinite(signedAmount) || signedAmount <= 0) {
      return {
        success: false,
        message: "Only wallet additions require DM approval.",
      };
    }

    if (!newTransaction.description.trim()) {
      return {
        success: false,
        message: "Enter a description for the request.",
      };
    }

    const duplicatePending = walletRequests.find(
      (request) =>
        request.campaignId === campaign.id &&
        request.requesterMemberId === activeMember.id &&
        request.characterId === activeMember.character?.id &&
        request.transactionType === newTransaction.type &&
        request.currencyId === newTransaction.currencyId &&
        request.amount === signedAmount &&
        request.description === newTransaction.description.trim() &&
        request.status === "pending",
    );

    if (duplicatePending) {
      return {
        success: false,
        message:
          "An identical wallet request is already waiting for DM approval.",
      };
    }

    const request: WalletTransactionRequest = {
      id: createId(),

      campaignId: campaign.id,

      requesterMemberId: activeMember.id,

      characterId: activeMember.character.id,

      transactionType: newTransaction.type,

      currencyId: newTransaction.currencyId,

      amount: signedAmount,

      description: newTransaction.description.trim(),

      status: "pending",

      createdAt: new Date().toISOString(),
    };

    setWalletRequests((currentRequests) => [request, ...currentRequests]);

    return {
      success: true,
      request,
    };
  }

  function approveWalletRequest(
    campaignId: string,
    requestId: string,
  ): WalletRequestResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can approve wallet requests.",
      };
    }

    const request = walletRequests.find(
      (item) => item.id === requestId && item.campaignId === campaignId,
    );

    if (!request) {
      return {
        success: false,
        message: "Wallet request not found.",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "This wallet request has already been resolved.",
      };
    }

    const result = applyCharacterTransaction(
      campaign,
      request.characterId,
      request.transactionType,
      request.currencyId,
      request.amount,
      request.description,
    );

    if (!result.success || !result.transaction) {
      return {
        success: false,
        message:
          result.message ?? "The approved transaction could not be applied.",
      };
    }

    const resolvedAt = new Date().toISOString();

    const approvedRequest: WalletTransactionRequest = {
      ...request,

      status: "approved",

      resolvedAt,

      resolvedByMemberId: activeMember.id,

      transactionId: result.transaction.id,
    };

    setWalletRequests((currentRequests) =>
      currentRequests.map((currentRequest) =>
        currentRequest.id === request.id ? approvedRequest : currentRequest,
      ),
    );

    return {
      success: true,
      request: approvedRequest,
      transaction: result.transaction,
    };
  }

  function declineWalletRequest(
    campaignId: string,
    requestId: string,
  ): WalletRequestResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can decline wallet requests.",
      };
    }

    const request = walletRequests.find(
      (item) => item.id === requestId && item.campaignId === campaignId,
    );

    if (!request) {
      return {
        success: false,
        message: "Wallet request not found.",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "This wallet request has already been resolved.",
      };
    }

    const declinedRequest: WalletTransactionRequest = {
      ...request,

      status: "declined",

      resolvedAt: new Date().toISOString(),

      resolvedByMemberId: activeMember.id,
    };

    setWalletRequests((currentRequests) =>
      currentRequests.map((currentRequest) =>
        currentRequest.id === request.id ? declinedRequest : currentRequest,
      ),
    );

    return {
      success: true,
      request: declinedRequest,
    };
  }

  function getCampaignWalletRequests(campaignId: string) {
    return walletRequests
      .filter((request) => request.campaignId === campaignId)
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "pending") {
            return -1;
          }

          if (b.status === "pending") {
            return 1;
          }
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }

  function createPartyFundTransaction(
    newTransaction: NewPartyFundTransaction,
  ): TransactionResult {
    const campaign = campaigns.find(
      (item) => item.id === newTransaction.campaignId,
    );

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    const focusMessage = getFocusModeBlockMessage(campaign, activeMember);

    if (focusMessage) {
      return {
        success: false,
        message: `Focus Mode is active. ${focusMessage}`,
      };
    }

    if (
      campaign.campaignType === "multiplayer" &&
      activeMember.role !== "party-leader" &&
      activeMember.role !== "treasurer"
    ) {
      return {
        success: false,
        message:
          "Only the Party Leader or Treasurer can directly manage the Party Fund.",
      };
    }

    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === newTransaction.currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Currency not found.",
      };
    }

    const currentBalance = campaign.partyFund.wallet.balances.find(
      (balance) => balance.currencyId === newTransaction.currencyId,
    );

    if (!currentBalance) {
      return {
        success: false,
        message: "Party Fund balance not found.",
      };
    }

    const signedAmount = normalizeTransactionAmount(
      newTransaction.type,
      newTransaction.amount,
    );

    const newBalance = currentBalance.amount + signedAmount;

    if (newBalance < 0) {
      return {
        success: false,
        message: `The Party Fund only has ${currentBalance.amount} ${currency.abbreviation} available.`,
      };
    }

    const transaction: Transaction = {
      id: createId(),

      campaignId: campaign.id,

      accountType: "party-fund",

      type: newTransaction.type,

      currencyId: newTransaction.currencyId,

      amount: signedAmount,

      description: newTransaction.description.trim(),

      createdAt: new Date().toISOString(),
    };

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        return {
          ...currentCampaign,

          partyFund: {
            ...currentCampaign.partyFund,

            wallet: {
              ...currentCampaign.partyFund.wallet,

              balances: currentCampaign.partyFund.wallet.balances.map(
                (balance) => {
                  if (balance.currencyId !== newTransaction.currencyId) {
                    return balance;
                  }

                  return {
                    ...balance,

                    amount: balance.amount + signedAmount,
                  };
                },
              ),
            },
          },
        };
      }),
    );

    setTransactions((currentTransactions) => [
      transaction,

      ...currentTransactions,
    ]);

    return {
      success: true,
      transaction,
    };
  }

  function contributeToPartyFund(
    campaignId: string,
    currencyId: string,
    amount: number,
    description: string,
  ): PartyFundContributionResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    const focusMessage = getFocusModeBlockMessage(campaign, activeMember);

    if (focusMessage) {
      return {
        success: false,
        message: `Focus Mode is active. ${focusMessage}`,
      };
    }

    if (!activeMember.character) {
      return {
        success: false,
        message:
          "The active member does not have a character wallet to contribute from.",
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Contribution amount must be greater than zero.",
      };
    }

    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Currency not found.",
      };
    }

    const characterBalance = activeMember.character.wallet.balances.find(
      (balance) => balance.currencyId === currencyId,
    );

    if (!characterBalance) {
      return {
        success: false,
        message: "Character wallet balance not found.",
      };
    }

    if (characterBalance.amount < amount) {
      return {
        success: false,
        message: `Insufficient funds. ${activeMember.character.name} only has ${characterBalance.amount} ${currency.abbreviation}, but this contribution requires ${amount} ${currency.abbreviation}.`,
      };
    }

    const partyFundBalance = campaign.partyFund.wallet.balances.find(
      (balance) => balance.currencyId === currencyId,
    );

    if (!partyFundBalance) {
      return {
        success: false,
        message: "Party Fund balance not found.",
      };
    }

    const transferId = createId();

    const createdAt = new Date().toISOString();

    const characterTransaction: Transaction = {
      id: `${transferId}-character`,

      campaignId: campaign.id,

      accountType: "character",

      characterId: activeMember.character.id,

      type: "expense",

      currencyId,

      amount: -amount,

      description: description.trim() || "Party Fund contribution",

      createdAt,
    };

    const partyFundTransaction: Transaction = {
      id: `${transferId}-party-fund`,

      campaignId: campaign.id,

      accountType: "party-fund",

      type: "income",

      currencyId,

      amount,

      description: `${activeMember.character.name} contribution: ${
        description.trim() || "Party Fund contribution"
      }`,

      createdAt,
    };

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        const updatedMembers = currentCampaign.members.map((member) => {
          if (
            member.id !== currentCampaign.activeMemberId ||
            !member.character
          ) {
            return member;
          }

          return {
            ...member,

            character: {
              ...member.character,

              wallet: {
                ...member.character.wallet,

                balances: member.character.wallet.balances.map((balance) => {
                  if (balance.currencyId !== currencyId) {
                    return balance;
                  }

                  return {
                    ...balance,

                    amount: balance.amount - amount,
                  };
                }),
              },
            },
          };
        });

        const updatedActiveMember = updatedMembers.find(
          (member) => member.id === currentCampaign.activeMemberId,
        );

        return {
          ...currentCampaign,

          members: updatedMembers,

          activeCharacter:
            updatedActiveMember?.character ?? currentCampaign.activeCharacter,

          partyFund: {
            ...currentCampaign.partyFund,

            wallet: {
              ...currentCampaign.partyFund.wallet,

              balances: currentCampaign.partyFund.wallet.balances.map(
                (balance) => {
                  if (balance.currencyId !== currencyId) {
                    return balance;
                  }

                  return {
                    ...balance,

                    amount: balance.amount + amount,
                  };
                },
              ),
            },
          },
        };
      }),
    );

    setTransactions((currentTransactions) => [
      partyFundTransaction,

      characterTransaction,

      ...currentTransactions,
    ]);

    return {
      success: true,

      characterTransaction,

      partyFundTransaction,
    };
  }

  function distributeReward(
    newReward: NewRewardDistribution,
  ): RewardDistributionResult {
    const campaign = campaigns.find(
      (item) =>
        item.id ===
        newReward.campaignId,
    );

    if (!campaign) {
      return {
        success: false,

        message:
          "Campaign not found.",
      };
    }

    const activeMember =
      campaign.members.find(
        (member) =>
          member.id ===
          campaign.activeMemberId,
      );

    if (!activeMember) {
      return {
        success: false,

        message:
          "Active campaign member not found.",
      };
    }

    if (
      campaign.campaignType ===
        "multiplayer" &&
      activeMember.role !== "dm"
    ) {
      return {
        success: false,

        message:
          "Only the Dungeon Master can distribute campaign rewards.",
      };
    }

    if (
      !Number.isFinite(
        newReward.amount,
      ) ||
      newReward.amount <= 0 ||
      !Number.isInteger(
        newReward.amount,
      )
    ) {
      return {
        success: false,

        message:
          "Reward amount must be a whole number greater than zero.",
      };
    }

    if (
      !Number.isFinite(
        newReward.partyFundPercentage,
      ) ||
      newReward.partyFundPercentage <
        0 ||
      newReward.partyFundPercentage >
        100
    ) {
      return {
        success: false,

        message:
          "Party Fund percentage must be between 0 and 100.",
      };
    }

    const currency =
      campaign.currencySystem.currencies.find(
        (item) =>
          item.id ===
          newReward.currencyId,
      );

    if (!currency) {
      return {
        success: false,

        message:
          "Currency not found.",
      };
    }

    const eligibleRecipients =
      campaign.members.filter(
        (
          member,
        ): member is CampaignMember & {
          character: NonNullable<
            CampaignMember["character"]
          >;
        } =>
          Boolean(
            member.character,
          ),
      );

    if (
      eligibleRecipients.length ===
      0
    ) {
      return {
        success: false,

        message:
          "There are no eligible characters to receive this reward.",
      };
    }

    const targetMode =
      newReward.targetMode ??
      "whole-party";

    let recipients: Array<
      CampaignMember & {
        character: NonNullable<
          CampaignMember["character"]
        >;
      }
    > = [];

    if (
      targetMode ===
      "whole-party"
    ) {
      recipients =
        eligibleRecipients;
    } else if (
      targetMode === "selected"
    ) {
      const selectedIds =
        Array.from(
          new Set(
            newReward.recipientMemberIds ??
              [],
          ),
        );

      if (
        selectedIds.length === 0
      ) {
        return {
          success: false,

          message:
            "Select at least one character to receive this reward.",
        };
      }

      recipients =
        eligibleRecipients.filter(
          (member) =>
            selectedIds.includes(
              member.id,
            ),
        );

      if (
        recipients.length !==
        selectedIds.length
      ) {
        return {
          success: false,

          message:
            "One or more selected reward recipients are no longer eligible.",
        };
      }
    } else if (
      targetMode === "finder"
    ) {
      if (
        !newReward.finderMemberId
      ) {
        return {
          success: false,

          message:
            "Select the character who found this reward.",
        };
      }

      const finder =
        eligibleRecipients.find(
          (member) =>
            member.id ===
            newReward.finderMemberId,
        );

      if (!finder) {
        return {
          success: false,

          message:
            "The selected finder is no longer eligible to receive this reward.",
        };
      }

      recipients = [finder];
    } else {
      return {
        success: false,

        message:
          "Reward target mode is invalid.",
      };
    }

    const recipientCount =
      recipients.length;

    const percentagePartyFundAmount =
      Math.floor(
        newReward.amount *
          (newReward.partyFundPercentage /
            100),
      );

    const afterPartyFund =
      newReward.amount -
      percentagePartyFundAmount;

    const amountPerRecipient =
      Math.floor(
        afterPartyFund /
          recipientCount,
      );

    const distributedAmount =
      amountPerRecipient *
      recipientCount;

    const remainderAmount =
      afterPartyFund -
      distributedAmount;

    const totalPartyFundAmount =
      percentagePartyFundAmount +
      remainderAmount;

    const createdAt =
      new Date().toISOString();

    const rewardId =
      createId();

    const description =
      newReward.description.trim() ||
      "Campaign reward";

    const recipientMemberIds =
      recipients.map(
        (member) =>
          member.id,
      );

    const reward: RewardDistribution =
      {
        id: rewardId,

        campaignId:
          campaign.id,

        currencyId:
          newReward.currencyId,

        grossAmount:
          newReward.amount,

        partyFundPercentage:
          newReward.partyFundPercentage,

        percentagePartyFundAmount,

        remainderAmount,

        totalPartyFundAmount,

        distributedAmount,

        recipientCount,

        amountPerRecipient,

        targetMode,

        recipientMemberIds,

        finderMemberId:
          targetMode === "finder"
            ? recipients[0]?.id
            : undefined,

        description,

        createdAt,
      };

    const newTransactions: Transaction[] =
      [];

    if (
      amountPerRecipient > 0
    ) {
      recipients.forEach(
        (member) => {
          newTransactions.push({
            id: `${rewardId}-${member.character.id}`,

            campaignId:
              campaign.id,

            accountType:
              "character",

            characterId:
              member.character.id,

            type: "income",

            currencyId:
              newReward.currencyId,

            amount:
              amountPerRecipient,

            description:
              targetMode ===
              "finder"
                ? `Discovery Reward: ${description}`
                : `Reward: ${description}`,

            createdAt,
          });
        },
      );
    }

    if (
      totalPartyFundAmount > 0
    ) {
      newTransactions.push({
        id: `${rewardId}-party-fund`,

        campaignId:
          campaign.id,

        accountType:
          "party-fund",

        type: "income",

        currencyId:
          newReward.currencyId,

        amount:
          totalPartyFundAmount,

        description:
          `Reward allocation: ${description}`,

        createdAt,
      });
    }

    setCampaigns(
      (currentCampaigns) =>
        currentCampaigns.map(
          (currentCampaign) => {
            if (
              currentCampaign.id !==
              campaign.id
            ) {
              return currentCampaign;
            }

            const updatedMembers =
              currentCampaign.members.map(
                (member) => {
                  if (
                    !member.character
                  ) {
                    return member;
                  }

                  const isRecipient =
                    recipients.some(
                      (recipient) =>
                        recipient.character
                          .id ===
                        member.character
                          ?.id,
                    );

                  if (
                    !isRecipient
                  ) {
                    return member;
                  }

                  return {
                    ...member,

                    character: {
                      ...member.character,

                      wallet: {
                        ...member
                          .character
                          .wallet,

                        balances:
                          member.character.wallet.balances.map(
                            (
                              balance,
                            ) => {
                              if (
                                balance.currencyId !==
                                newReward.currencyId
                              ) {
                                return balance;
                              }

                              return {
                                ...balance,

                                amount:
                                  balance.amount +
                                  amountPerRecipient,
                              };
                            },
                          ),
                      },
                    },
                  };
                },
              );

            const updatedActiveMember =
              updatedMembers.find(
                (member) =>
                  member.id ===
                  currentCampaign.activeMemberId,
              );

            return {
              ...currentCampaign,

              members:
                updatedMembers,

              activeCharacter:
                updatedActiveMember?.character ??
                currentCampaign.activeCharacter,

              partyFund: {
                ...currentCampaign.partyFund,

                wallet: {
                  ...currentCampaign
                    .partyFund.wallet,

                  balances:
                    currentCampaign.partyFund.wallet.balances.map(
                      (balance) => {
                        if (
                          balance.currencyId !==
                          newReward.currencyId
                        ) {
                          return balance;
                        }

                        return {
                          ...balance,

                          amount:
                            balance.amount +
                            totalPartyFundAmount,
                        };
                      },
                    ),
                },
              },
            };
          },
        ),
    );

    setTransactions(
      (currentTransactions) => [
        ...newTransactions,

        ...currentTransactions,
      ],
    );

    setRewards(
      (currentRewards) => [
        reward,

        ...currentRewards,
      ],
    );

    return {
      success: true,

      reward,
    };
  }

  function startSession(campaignId: string): SessionResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can start a session.",
      };
    }

    const existingSession = getActiveSession(campaignId);

    if (existingSession) {
      return {
        success: false,
        message: "This campaign already has an active session.",
      };
    }

    const session: CampaignSession = {
      id: createId(),

      campaignId,

      status: "active",

      startedByMemberId: activeMember.id,

      startedAt: new Date().toISOString(),

      focusModeEnabled: false,

      focusMessage: DEFAULT_FOCUS_MODE_MESSAGE,
    };

    setSessions((currentSessions) => [session, ...currentSessions]);

    return {
      success: true,
      session,
    };
  }

  function endSession(campaignId: string): SessionResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can end a session.",
      };
    }

    const activeSession = getActiveSession(campaignId);

    if (!activeSession) {
      return {
        success: false,
        message: "There is no active session to end.",
      };
    }

    const now = new Date().toISOString();

    const endedSession: CampaignSession = {
      ...activeSession,

      status: "ended",

      endedAt: now,

      focusModeEnabled: false,

      focusUpdatedAt: now,
    };

    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === activeSession.id ? endedSession : session,
      ),
    );

    return {
      success: true,
      session: endedSession,
    };
  }

  function setFocusMode(
    campaignId: string,
    enabled: boolean,
    message?: string,
  ): SessionResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    if (campaign.campaignType !== "multiplayer") {
      return {
        success: false,
        message: "Focus Mode is only used in multiplayer campaigns.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can control Focus Mode.",
      };
    }

    const activeSession = getActiveSession(campaign.id);

    if (!activeSession) {
      return {
        success: false,
        message: "Start a session before using Focus Mode.",
      };
    }

    const cleanedMessage =
      message?.trim() ||
      activeSession.focusMessage?.trim() ||
      DEFAULT_FOCUS_MODE_MESSAGE;

    const updatedSession: CampaignSession = {
      ...activeSession,

      focusModeEnabled: enabled,

      focusMessage: cleanedMessage,

      focusUpdatedAt: new Date().toISOString(),
    };

    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === activeSession.id ? updatedSession : session,
      ),
    );

    return {
      success: true,
      session: updatedSession,
    };
  }

  function getCampaignSessions(campaignId: string) {
    return sessions
      .filter((session) => session.campaignId === campaignId)
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
  }

  function createQuest(newQuest: NewCampaignQuest): QuestResult {
    const campaign = campaigns.find((item) => item.id === newQuest.campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can create quests.",
      };
    }

    const activeSession = getActiveSession(campaign.id);

    if (!activeSession) {
      return {
        success: false,
        message: "Start a session before creating a quest.",
      };
    }

    const title = newQuest.title.trim();

    if (!title) {
      return {
        success: false,
        message: "Enter a quest title.",
      };
    }

    if (
      !Number.isInteger(newQuest.rewardAmount) ||
      newQuest.rewardAmount <= 0
    ) {
      return {
        success: false,
        message: "Quest reward must be a whole number greater than zero.",
      };
    }

    if (
      !Number.isFinite(newQuest.partyFundPercentage) ||
      newQuest.partyFundPercentage < 0 ||
      newQuest.partyFundPercentage > 100
    ) {
      return {
        success: false,
        message: "Party Fund percentage must be between 0 and 100.",
      };
    }

    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === newQuest.currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Quest reward currency not found.",
      };
    }

    const quest: CampaignQuest = {
      id: createId(),

      campaignId: campaign.id,

      sessionId: activeSession.id,

      title,

      description: newQuest.description.trim(),

      currencyId: newQuest.currencyId,

      rewardAmount: newQuest.rewardAmount,

      partyFundPercentage: newQuest.partyFundPercentage,

      status: "active",

      createdByMemberId: activeMember.id,

      createdAt: new Date().toISOString(),
    };

    setQuests((currentQuests) => [quest, ...currentQuests]);

    return {
      success: true,
      quest,
    };
  }

  function completeQuest(
    campaignId: string,
    questId: string,
  ): QuestCompletionResult {
    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    const activeMember = campaign.members.find(
      (member) => member.id === campaign.activeMemberId,
    );

    if (!activeMember) {
      return {
        success: false,
        message: "Active campaign member not found.",
      };
    }

    if (campaign.campaignType === "multiplayer" && activeMember.role !== "dm") {
      return {
        success: false,
        message: "Only the Dungeon Master can complete quests.",
      };
    }

    const activeSession = getActiveSession(campaignId);

    if (!activeSession) {
      return {
        success: false,
        message: "A session must be active before completing a quest.",
      };
    }

    const quest = quests.find(
      (item) => item.id === questId && item.campaignId === campaignId,
    );

    if (!quest) {
      return {
        success: false,
        message: "Quest not found.",
      };
    }

    if (quest.status === "completed") {
      return {
        success: false,
        message: "This quest has already been completed.",
      };
    }

    const rewardResult = distributeReward({
      campaignId,

      currencyId: quest.currencyId,

      amount: quest.rewardAmount,

      partyFundPercentage: quest.partyFundPercentage,

      description: `Quest Complete: ${quest.title}`,
    });

    if (!rewardResult.success || !rewardResult.reward) {
      return {
        success: false,
        message:
          rewardResult.message ?? "The quest reward could not be distributed.",
      };
    }

    const completedQuest: CampaignQuest = {
      ...quest,

      status: "completed",

      completedAt: new Date().toISOString(),

      rewardDistributionId: rewardResult.reward.id,
    };

    setQuests((currentQuests) =>
      currentQuests.map((currentQuest) =>
        currentQuest.id === quest.id ? completedQuest : currentQuest,
      ),
    );

    return {
      success: true,

      quest: completedQuest,

      reward: rewardResult.reward,
    };
  }

  function getCampaignQuests(campaignId: string) {
    return quests
      .filter((quest) => quest.campaignId === campaignId)
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "active" ? -1 : 1;
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }

  function getCampaignTransactions(campaignId: string) {
    return transactions
      .filter((transaction) => transaction.campaignId === campaignId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  function getCampaignRewards(campaignId: string) {
    return rewards
      .filter((reward) => reward.campaignId === campaignId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <CampaignContext.Provider
      value={{
        campaigns,

        transactions,

        rewards,

        sessions,

        quests,

        walletRequests,

        storageError,

        createCampaign,

        getCampaignById,

        getActiveCampaignMember,

        setActiveMember,

        addCampaignMember,

        createTransaction,

        requestWalletTransaction,

        approveWalletRequest,

        declineWalletRequest,

        getCampaignWalletRequests,

        createPartyFundTransaction,

        contributeToPartyFund,

        distributeReward,

        startSession,

        endSession,

        setFocusMode,

        getActiveSession,

        getCampaignSessions,

        createQuest,

        completeQuest,

        getCampaignQuests,

        getCampaignTransactions,

        getCampaignRewards,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);

  if (!context) {
    throw new Error("useCampaigns must be used inside a CampaignProvider");
  }

  return context;
}

function normalizeTransactionAmount(
  type: "income" | "expense" | "adjustment",
  amount: number,
) {
  if (type === "income") {
    return Math.abs(amount);
  }

  if (type === "expense") {
    return -Math.abs(amount);
  }

  return amount;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDefaultCurrencySystem(gameSystem: GameSystem): CurrencySystem {
  switch (gameSystem) {
    case "dnd-5e":
      return DND_5E_CURRENCY_SYSTEM;

    case "pathfinder-2e":
      return DND_5E_CURRENCY_SYSTEM;

    case "custom":
      return DND_5E_CURRENCY_SYSTEM;

    default:
      return DND_5E_CURRENCY_SYSTEM;
  }
}

