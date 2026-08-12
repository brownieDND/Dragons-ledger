export const DEFAULT_FOCUS_MODE_MESSAGE =
  "The Dungeon Master is currently running the session. Please stay focused on the game until Focus Mode is disabled.";

export type CampaignSessionStatus = "active" | "ended";

export interface CampaignSession {
  id: string;

  campaignId: string;

  status: CampaignSessionStatus;

  startedByMemberId: string;

  startedAt: string;

  endedAt?: string;

  /*
   * Optional for backward compatibility with
   * sessions saved before Focus Mode existed.
   */
  focusModeEnabled?: boolean;

  focusMessage?: string;

  focusUpdatedAt?: string;
}
