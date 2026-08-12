import { TransactionType } from "./Transaction";

export type WalletRequestStatus = "pending" | "approved" | "declined";

export interface WalletTransactionRequest {
  id: string;

  campaignId: string;

  requesterMemberId: string;

  characterId: string;

  transactionType: TransactionType;

  currencyId: string;

  amount: number;

  description: string;

  status: WalletRequestStatus;

  createdAt: string;

  resolvedAt?: string;

  resolvedByMemberId?: string;

  transactionId?: string;
}
