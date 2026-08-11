export type CampaignQuestStatus = "active" | "completed";

export interface CampaignQuest {
  id: string;

  campaignId: string;

  /**
   * The session in which this quest was created.
   *
   * A quest may remain active after that session ends.
   */
  sessionId: string;

  title: string;

  description: string;

  currencyId: string;

  rewardAmount: number;

  partyFundPercentage: number;

  status: CampaignQuestStatus;

  createdByMemberId: string;

  createdAt: string;

  completedAt?: string;

  rewardDistributionId?: string;
}

export interface NewCampaignQuest {
  campaignId: string;

  title: string;

  description: string;

  currencyId: string;

  rewardAmount: number;

  partyFundPercentage: number;
}
