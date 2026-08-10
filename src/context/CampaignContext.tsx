import { createContext, ReactNode, useContext, useState } from "react";

import { Campaign } from "../models/Campaign";

type NewCampaign = Omit<Campaign, "id" | "createdAt">;

interface CampaignContextType {
  campaigns: Campaign[];
  createCampaign: (campaign: NewCampaign) => Campaign;
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  function createCampaign(newCampaign: NewCampaign): Campaign {
    const campaign: Campaign = {
      ...newCampaign,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };

    setCampaigns((currentCampaigns) => [...currentCampaigns, campaign]);

    return campaign;
  }

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        createCampaign,
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
