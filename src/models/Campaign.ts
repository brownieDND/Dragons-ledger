import { CurrencySystem, Wallet } from "./Currency";

export type GameSystem = "dnd-5e" | "pathfinder-2e" | "custom";

export type CampaignType = "solo" | "multiplayer";

export type CampaignMemberRole = "player" | "dm" | "party-leader" | "treasurer";

export interface CampaignCharacter {
  id: string;
  name: string;
  wallet: Wallet;
}

export interface CampaignMember {
  id: string;

  displayName: string;

  role: CampaignMemberRole;

  isOwner: boolean;

  character?: CampaignCharacter;

  joinedAt: string;
}

export interface PartyFund {
  id: string;

  wallet: Wallet;

  /**
   * Default percentage taken from
   * distributed rewards.
   *
   * Example:
   * 10 = 10%
   */
  defaultContributionPercentage: number;
}

export interface Campaign {
  id: string;

  name: string;

  gameSystem: GameSystem;

  campaignType: CampaignType;

  currencySystem: CurrencySystem;

  /**
   * Temporary compatibility field.
   *
   * Existing wallet and transaction screens
   * currently depend on activeCharacter.
   *
   * As the member system is expanded, those
   * screens will migrate to member characters.
   */
  activeCharacter: CampaignCharacter;

  members: CampaignMember[];

  activeMemberId: string;

  partyFund: PartyFund;

  createdAt: string;
}
