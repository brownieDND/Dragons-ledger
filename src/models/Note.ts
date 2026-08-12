export interface CampaignNote {
  id: string;

  campaignId: string;

  ownerMemberId: string;

  section: string;

  title: string;

  content: string;

  isShared: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface NewCampaignNote {
  campaignId: string;

  ownerMemberId: string;

  section: string;

  title: string;

  content: string;
}
