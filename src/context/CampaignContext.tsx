import { createContext, ReactNode, useContext, useState } from "react";

import { Campaign, CampaignType, GameSystem } from "../models/Campaign";

import {
    createEmptyWallet,
    CurrencySystem,
    DND_5E_CURRENCY_SYSTEM,
} from "../models/Currency";

import { NewTransaction, Transaction } from "../models/Transaction";

interface NewCampaign {
  name: string;

  characterName: string;

  gameSystem: GameSystem;

  campaignType: CampaignType;
}

interface TransactionResult {
  success: boolean;
  message?: string;
  transaction?: Transaction;
}

interface CampaignContextType {
  campaigns: Campaign[];

  transactions: Transaction[];

  createCampaign: (campaign: NewCampaign) => Campaign;

  getCampaignById: (id: string) => Campaign | undefined;

  createTransaction: (transaction: NewTransaction) => TransactionResult;

  getCampaignTransactions: (campaignId: string) => Transaction[];
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  function createCampaign(newCampaign: NewCampaign): Campaign {
    const currencySystem = getDefaultCurrencySystem(newCampaign.gameSystem);

    const campaign: Campaign = {
      id: createId(),

      name: newCampaign.name,

      gameSystem: newCampaign.gameSystem,

      campaignType: newCampaign.campaignType,

      currencySystem,

      activeCharacter: {
        id: createId(),

        name: newCampaign.characterName,

        wallet: createEmptyWallet(currencySystem),
      },

      createdAt: new Date().toISOString(),
    };

    setCampaigns((currentCampaigns) => [...currentCampaigns, campaign]);

    return campaign;
  }

  function getCampaignById(id: string) {
    return campaigns.find((campaign) => campaign.id === id);
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

    let signedAmount = Math.abs(newTransaction.amount);

    if (newTransaction.type === "expense") {
      signedAmount = -Math.abs(newTransaction.amount);
    }

    if (newTransaction.type === "adjustment") {
      signedAmount = newTransaction.amount;
    }

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

        return {
          ...currentCampaign,

          activeCharacter: {
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

  function getCampaignTransactions(campaignId: string) {
    return transactions
      .filter((transaction) => transaction.campaignId === campaignId)
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
        createCampaign,
        getCampaignById,
        createTransaction,
        getCampaignTransactions,
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
