import { createContext, ReactNode, useContext, useState } from "react";

import { Campaign, CampaignType, GameSystem } from "../models/Campaign";

import {
    createEmptyWallet,
    CurrencySystem,
    DND_5E_CURRENCY_SYSTEM,
} from "../models/Currency";

interface NewCampaign {
  name: string;

  characterName: string;

  gameSystem: GameSystem;

  campaignType: CampaignType;
}

interface CampaignContextType {
  campaigns: Campaign[];

  createCampaign: (campaign: NewCampaign) => Campaign;

  getCampaignById: (id: string) => Campaign | undefined;
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        createCampaign,
        getCampaignById,
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
      /*
       * Temporary fallback.
       *
       * Pathfinder will receive its own
       * currency preset once we implement
       * additional systems.
       */
      return DND_5E_CURRENCY_SYSTEM;

    case "custom":
      /*
       * Custom currency creation will be
       * implemented as its own setup flow.
       */
      return DND_5E_CURRENCY_SYSTEM;

    default:
      return DND_5E_CURRENCY_SYSTEM;
  }
}
