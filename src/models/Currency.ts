export interface CurrencyDefinition {
  id: string;
  name: string;
  abbreviation: string;

  /**
   * Value compared to the campaign's base currency.
   *
   * For D&D 5e, copper is treated as the base unit:
   *
   * 1 CP = 1
   * 1 SP = 10
   * 1 EP = 50
   * 1 GP = 100
   * 1 PP = 1000
   */
  baseValue: number;

  /**
   * Higher numbers display first in the wallet.
   */
  displayOrder: number;
}

export interface CurrencyBalance {
  currencyId: string;
  amount: number;
}

export interface Wallet {
  balances: CurrencyBalance[];
}

export interface CurrencySystem {
  id: string;
  name: string;
  currencies: CurrencyDefinition[];
}

export const DND_5E_CURRENCY_SYSTEM: CurrencySystem = {
  id: "dnd-5e-standard",
  name: "D&D 5e Standard Currency",

  currencies: [
    {
      id: "platinum",
      name: "Platinum",
      abbreviation: "PP",
      baseValue: 1000,
      displayOrder: 5,
    },

    {
      id: "gold",
      name: "Gold",
      abbreviation: "GP",
      baseValue: 100,
      displayOrder: 4,
    },

    {
      id: "electrum",
      name: "Electrum",
      abbreviation: "EP",
      baseValue: 50,
      displayOrder: 3,
    },

    {
      id: "silver",
      name: "Silver",
      abbreviation: "SP",
      baseValue: 10,
      displayOrder: 2,
    },

    {
      id: "copper",
      name: "Copper",
      abbreviation: "CP",
      baseValue: 1,
      displayOrder: 1,
    },
  ],
};

export function createEmptyWallet(currencySystem: CurrencySystem): Wallet {
  return {
    balances: currencySystem.currencies.map((currency) => ({
      currencyId: currency.id,
      amount: 0,
    })),
  };
}

export function getWalletBalance(wallet: Wallet, currencyId: string): number {
  return (
    wallet.balances.find((balance) => balance.currencyId === currencyId)
      ?.amount ?? 0
  );
}

export function getWalletTotalBaseValue(
  wallet: Wallet,
  currencySystem: CurrencySystem,
): number {
  return wallet.balances.reduce((total, balance) => {
    const currency = currencySystem.currencies.find(
      (item) => item.id === balance.currencyId,
    );

    if (!currency) {
      return total;
    }

    return total + balance.amount * currency.baseValue;
  }, 0);
}
