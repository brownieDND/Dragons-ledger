export type FocusPromptStatus = "pending" | "acknowledged";

export interface FocusModePrompt {
  id: string;

  campaignId: string;

  sessionId: string;

  requesterMemberId: string;

  message: string;

  status: FocusPromptStatus;

  createdAt: string;

  resolvedAt?: string;

  resolvedByMemberId?: string;
}
