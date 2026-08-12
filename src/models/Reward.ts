export type RewardTargetMode = "whole-party" | "selected" | "finder";

export interface RewardDistribution {
  id: string;

  campaignId: string;

  currencyId: string;

  /**
   * Original reward before anything
   * is sent to the Party Fund.
   */
  grossAmount: number;

  /**
   * Percentage of the original reward
   * assigned to the Party Fund.
   *
   * Example:
   * 10 = 10%
   */
  partyFundPercentage: number;

  /**
   * Amount generated directly by the
   * Party Fund percentage.
   */
  percentagePartyFundAmount: number;

  /**
   * Any whole-unit remainder that could
   * not be divided evenly between the
   * selected recipients.
   *
   * The remainder is added to the
   * Party Fund.
   */
  remainderAmount: number;

  /**
   * Total amount actually placed into
   * the Party Fund.
   *
   * This includes the percentage amount
   * plus any uneven remainder.
   */
  totalPartyFundAmount: number;

  /**
   * Total amount distributed to
   * character wallets.
   */
  distributedAmount: number;

  /**
   * Number of characters who received
   * a share.
   */
  recipientCount: number;

  /**
   * Amount received by each selected
   * recipient.
   */
  amountPerRecipient: number;

  /**
   * How the DM chose the recipients.
   *
   * Optional for backward compatibility
   * with rewards created before targeted
   * reward distribution existed.
   */
  targetMode?: RewardTargetMode;

  /**
   * Campaign member IDs that actually
   * received the reward.
   *
   * Optional for older persisted rewards.
   */
  recipientMemberIds?: string[];

  /**
   * The finder for Discovery/Finder
   * rewards.
   *
   * Only populated when targetMode is
   * "finder".
   */
  finderMemberId?: string;

  description: string;

  createdAt: string;
}

export interface NewRewardDistribution {
  campaignId: string;

  currencyId: string;

  amount: number;

  partyFundPercentage: number;

  description: string;

  /**
   * Defaults to whole-party so existing
   * calls, including existing quest
   * completion code, continue working.
   */
  targetMode?: RewardTargetMode;

  /**
   * Used when targetMode is "selected".
   */
  recipientMemberIds?: string[];

  /**
   * Used when targetMode is "finder".
   */
  finderMemberId?: string;
}

export interface RewardDistributionResult {
  success: boolean;

  message?: string;

  reward?: RewardDistribution;
}
