export type TransactionType = "income" | "expense" | "adjustment";

export interface Transaction {
  id: string;

  campaignId: string;
  characterId: string;

  type: TransactionType;

  currencyId: string;

  /**
   * Signed amount.
   *
   * Income:
   * +100
   *
   * Expense:
   * -25
   *
   * Adjustment:
   * Can be positive or negative.
   */
  amount: number;

  description: string;

  createdAt: string;
}

export interface NewTransaction {
  campaignId: string;
  characterId: string;

  type: TransactionType;

  currencyId: string;

  amount: number;

  description: string;
}
