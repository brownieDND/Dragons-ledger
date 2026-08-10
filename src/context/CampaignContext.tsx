import { createContext, ReactNode, useContext, useState } from "react";

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
} from "../models/Transaction";

import {
  NewRewardDistribution,
  RewardDistribution,
  RewardDistributionResult,
} from "../models/Reward";

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

interface CampaignContextType {
  campaigns: Campaign[];

  transactions: Transaction[];

  rewards: RewardDistribution[];

  createCampaign: (campaign: NewCampaign) => Campaign;

  getCampaignById: (id: string) => Campaign | undefined;

  addCampaignMember: (newMember: NewCampaignMember) => CampaignMemberResult;

  createTransaction: (transaction: NewTransaction) => TransactionResult;

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

    if (campaign.activeCharacter.id !== newTransaction.characterId) {
      return {
        success: false,
        message: "Character not found.",
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

    const currentBalance = campaign.activeCharacter.wallet.balances.find(
      (balance) => balance.currencyId === newTransaction.currencyId,
    );

    if (!currentBalance) {
      return {
        success: false,
        message: "Wallet balance not found.",
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

        message: `Not enough ${currency.abbreviation}.`,
      };
    }

    const transaction: Transaction = {
      id: createId(),

      campaignId: campaign.id,

      accountType: "character",

      characterId: campaign.activeCharacter.id,

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

        const updatedActiveCharacter = {
          ...currentCampaign.activeCharacter,

          wallet: {
            ...currentCampaign.activeCharacter.wallet,

            balances: currentCampaign.activeCharacter.wallet.balances.map(
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
        };

        return {
          ...currentCampaign,

          activeCharacter: updatedActiveCharacter,

          members: currentCampaign.members.map((member) => {
            if (member.character?.id !== updatedActiveCharacter.id) {
              return member;
            }

            return {
              ...member,

              character: updatedActiveCharacter,
            };
          }),
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

    const characterBalance = campaign.activeCharacter.wallet.balances.find(
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

        message: `Insufficient funds. ${campaign.activeCharacter.name} only has ${characterBalance.amount} ${currency.abbreviation}, but this contribution requires ${amount} ${currency.abbreviation}.`,
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

      characterId: campaign.activeCharacter.id,

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

      description: `${campaign.activeCharacter.name} contribution: ${
        description.trim() || "Party Fund contribution"
      }`,

      createdAt,
    };

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        const updatedActiveCharacter = {
          ...currentCampaign.activeCharacter,

          wallet: {
            ...currentCampaign.activeCharacter.wallet,

            balances: currentCampaign.activeCharacter.wallet.balances.map(
              (balance) => {
                if (balance.currencyId !== currencyId) {
                  return balance;
                }

                return {
                  ...balance,

                  amount: balance.amount - amount,
                };
              },
            ),
          },
        };

        return {
          ...currentCampaign,

          activeCharacter: updatedActiveCharacter,

          members: currentCampaign.members.map((member) => {
            if (member.character?.id !== updatedActiveCharacter.id) {
              return member;
            }

            return {
              ...member,

              character: updatedActiveCharacter,
            };
          }),

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
    const campaign = campaigns.find((item) => item.id === newReward.campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found.",
      };
    }

    if (
      !Number.isFinite(newReward.amount) ||
      newReward.amount <= 0 ||
      !Number.isInteger(newReward.amount)
    ) {
      return {
        success: false,

        message: "Reward amount must be a whole number greater than zero.",
      };
    }

    if (
      !Number.isFinite(newReward.partyFundPercentage) ||
      newReward.partyFundPercentage < 0 ||
      newReward.partyFundPercentage > 100
    ) {
      return {
        success: false,

        message: "Party Fund percentage must be between 0 and 100.",
      };
    }

    const currency = campaign.currencySystem.currencies.find(
      (item) => item.id === newReward.currencyId,
    );

    if (!currency) {
      return {
        success: false,
        message: "Currency not found.",
      };
    }

    /*
     * Any member with a character is currently
     * eligible for reward distribution.
     *
     * A DM without a character is automatically
     * excluded.
     *
     * Later this can support targeted rewards,
     * opt-outs, companions, and inactive players.
     */
    const recipients = campaign.members.filter(
      (
        member,
      ): member is CampaignMember & {
        character: NonNullable<CampaignMember["character"]>;
      } => Boolean(member.character),
    );

    if (recipients.length === 0) {
      return {
        success: false,

        message: "There are no eligible characters to receive this reward.",
      };
    }

    const recipientCount = recipients.length;

    const percentagePartyFundAmount = Math.floor(
      newReward.amount * (newReward.partyFundPercentage / 100),
    );

    const afterPartyFund = newReward.amount - percentagePartyFundAmount;

    const amountPerRecipient = Math.floor(afterPartyFund / recipientCount);

    const distributedAmount = amountPerRecipient * recipientCount;

    const remainderAmount = afterPartyFund - distributedAmount;

    const totalPartyFundAmount = percentagePartyFundAmount + remainderAmount;

    const createdAt = new Date().toISOString();

    const rewardId = createId();

    const description = newReward.description.trim() || "Campaign reward";

    const reward: RewardDistribution = {
      id: rewardId,

      campaignId: campaign.id,

      currencyId: newReward.currencyId,

      grossAmount: newReward.amount,

      partyFundPercentage: newReward.partyFundPercentage,

      percentagePartyFundAmount,

      remainderAmount,

      totalPartyFundAmount,

      distributedAmount,

      recipientCount,

      amountPerRecipient,

      description,

      createdAt,
    };

    const newTransactions: Transaction[] = [];

    if (amountPerRecipient > 0) {
      recipients.forEach((member) => {
        newTransactions.push({
          id: `${rewardId}-${member.character.id}`,

          campaignId: campaign.id,

          accountType: "character",

          characterId: member.character.id,

          type: "income",

          currencyId: newReward.currencyId,

          amount: amountPerRecipient,

          description: `Reward: ${description}`,

          createdAt,
        });
      });
    }

    if (totalPartyFundAmount > 0) {
      newTransactions.push({
        id: `${rewardId}-party-fund`,

        campaignId: campaign.id,

        accountType: "party-fund",

        type: "income",

        currencyId: newReward.currencyId,

        amount: totalPartyFundAmount,

        description: `Reward allocation: ${description}`,

        createdAt,
      });
    }

    setCampaigns((currentCampaigns) =>
      currentCampaigns.map((currentCampaign) => {
        if (currentCampaign.id !== campaign.id) {
          return currentCampaign;
        }

        const updatedMembers = currentCampaign.members.map((member) => {
          if (!member.character) {
            return member;
          }

          const isRecipient = recipients.some(
            (recipient) => recipient.character.id === member.character?.id,
          );

          if (!isRecipient) {
            return member;
          }

          return {
            ...member,

            character: {
              ...member.character,

              wallet: {
                ...member.character.wallet,

                balances: member.character.wallet.balances.map((balance) => {
                  if (balance.currencyId !== newReward.currencyId) {
                    return balance;
                  }

                  return {
                    ...balance,

                    amount: balance.amount + amountPerRecipient,
                  };
                }),
              },
            },
          };
        });

        const activeMember = updatedMembers.find(
          (member) => member.id === currentCampaign.activeMemberId,
        );

        const updatedActiveCharacter =
          activeMember?.character ?? currentCampaign.activeCharacter;

        return {
          ...currentCampaign,

          members: updatedMembers,

          activeCharacter: updatedActiveCharacter,

          partyFund: {
            ...currentCampaign.partyFund,

            wallet: {
              ...currentCampaign.partyFund.wallet,

              balances: currentCampaign.partyFund.wallet.balances.map(
                (balance) => {
                  if (balance.currencyId !== newReward.currencyId) {
                    return balance;
                  }

                  return {
                    ...balance,

                    amount: balance.amount + totalPartyFundAmount,
                  };
                },
              ),
            },
          },
        };
      }),
    );

    setTransactions((currentTransactions) => [
      ...newTransactions,
      ...currentTransactions,
    ]);

    setRewards((currentRewards) => [reward, ...currentRewards]);

    return {
      success: true,
      reward,
    };
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

  return (
    <CampaignContext.Provider
      value={{
        campaigns,

        transactions,

        rewards,

        createCampaign,

        getCampaignById,

        addCampaignMember,

        createTransaction,

        createPartyFundTransaction,

        contributeToPartyFund,

        distributeReward,

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
