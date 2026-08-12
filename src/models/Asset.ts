export interface PartyAsset {
  id: string;

  campaignId: string;

  name: string;

  description: string;

  quantity: number;

  notes: string;

  isHidden: boolean;

  assignedMemberId?: string;

  createdByMemberId: string;

  createdAt: string;

  updatedAt: string;
}

export interface NewPartyAsset {
  campaignId: string;

  name: string;

  description: string;

  quantity: number;

  notes: string;

  isHidden: boolean;

  assignedMemberId?: string;

  createdByMemberId: string;
}

export interface UpdatePartyAsset {
  name: string;

  description: string;

  quantity: number;

  notes: string;

  isHidden: boolean;

  assignedMemberId?: string;
}
