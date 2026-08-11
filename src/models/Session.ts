export type CampaignSessionStatus = "active" | "ended";

export interface CampaignSession {
  id: string;

  campaignId: string;

  status: CampaignSessionStatus;

  startedByMemberId: string;

  startedAt: string;

  endedAt?: string;
}
