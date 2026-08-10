import { CurrencySystem, Wallet } from "./Currency";

export type GameSystem = "dnd-5e" | "pathfinder-2e" | "custom";

export type CampaignType = "solo" | "multiplayer";

export interface CampaignCharacter {
  id: string;
  name: string;
  wallet: Wallet;
}

export interface Campaign {
  id: string;
  name: string;

  gameSystem: GameSystem;
  campaignType: CampaignType;

  currencySystem: CurrencySystem;

  activeCharacter: CampaignCharacter;

  createdAt: string;
}
