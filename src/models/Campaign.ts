export type GameSystem = "dnd-5e" | "pathfinder-2e" | "custom";

export type CampaignType = "solo" | "multiplayer";

export interface Campaign {
  id: string;
  name: string;
  gameSystem: GameSystem;
  campaignType: CampaignType;
  characterName: string;
  createdAt: string;
}
