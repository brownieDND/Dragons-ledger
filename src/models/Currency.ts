export interface CurrencyDefinition {
  id: string;

  name: string;

  abbreviation: string;

  /**
   * Value compared to the currency
   * system's smallest base unit.
   *
   * Example for D&D:
   *
   * 1 CP = 1
   * 1 SP = 10
   * 1 EP = 50
   * 1 GP = 100
   * 1 PP = 1000
   */
  baseValue: number;

  /**
   * Higher numbers display first
   * in wallets and selectors.
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

  /**
   * Currency normally used when showing
   * the player's overall wealth.
   *
   * Examples:
   * D&D 5e -> GP
   * Pathfinder 2e -> SP
   */
  commonCurrencyId: string;

  /**
   * Smallest currency unit supported by
   * this system.
   *
   * Reward calculations eventually use
   * this denomination to avoid losing
   * divisible value to rounding.
   */
  smallestCurrencyId: string;

  /**
   * Denominations Dragon's Ledger should
   * use when automatically breaking value
   * into smaller units.
   *
   * Ordered from largest to smallest.
   *
   * A supported denomination may be
   * intentionally omitted.
   *
   * D&D Electrum, for example, remains
   * supported but is not used during
   * automatic breakdown.
   */
  automaticBreakdownCurrencyIds: string[];

  /**
   * True for user-created currency
   * systems that may be edited.
   */
  isCustom: boolean;
}

/*
 * ------------------------------------------------
 * D&D 5e
 * ------------------------------------------------
 */

export const DND_5E_CURRENCY_SYSTEM: CurrencySystem = {
  id: "dnd-5e-standard",

  name: "D&D 5e Standard Currency",

  commonCurrencyId: "gold",

  smallestCurrencyId: "copper",

  automaticBreakdownCurrencyIds: ["platinum", "gold", "silver", "copper"],

  isCustom: false,

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

/*
 * ------------------------------------------------
 * Pathfinder 2e
 * ------------------------------------------------
 */

export const PATHFINDER_2E_CURRENCY_SYSTEM: CurrencySystem = {
  id: "pathfinder-2e-standard",

  name: "Pathfinder 2e Standard Currency",

  commonCurrencyId: "silver",

  smallestCurrencyId: "copper",

  automaticBreakdownCurrencyIds: ["platinum", "gold", "silver", "copper"],

  isCustom: false,

  currencies: [
    {
      id: "platinum",

      name: "Platinum",

      abbreviation: "PP",

      baseValue: 1000,

      displayOrder: 4,
    },

    {
      id: "gold",

      name: "Gold",

      abbreviation: "GP",

      baseValue: 100,

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

/*
 * ------------------------------------------------
 * Daggerheart
 * ------------------------------------------------
 */

export const DAGGERHEART_CURRENCY_SYSTEM: CurrencySystem = {
  id: "daggerheart-standard",

  name: "Daggerheart Gold",

  commonCurrencyId: "handful",

  smallestCurrencyId: "handful",

  automaticBreakdownCurrencyIds: ["chest", "bag", "handful"],

  isCustom: false,

  currencies: [
    {
      id: "chest",

      name: "Chest of Gold",

      abbreviation: "Chest",

      baseValue: 100,

      displayOrder: 3,
    },

    {
      id: "bag",

      name: "Bag of Gold",

      abbreviation: "Bag",

      baseValue: 10,

      displayOrder: 2,
    },

    {
      id: "handful",

      name: "Handful of Gold",

      abbreviation: "Handful",

      baseValue: 1,

      displayOrder: 1,
    },
  ],
};

/*
 * ------------------------------------------------
 * Starfinder 2e
 * ------------------------------------------------
 */

export const STARFINDER_2E_CURRENCY_SYSTEM: CurrencySystem = {
  id: "starfinder-2e-standard",

  name: "Starfinder 2e Credits",

  commonCurrencyId: "credit",

  smallestCurrencyId: "credit",

  automaticBreakdownCurrencyIds: ["credit"],

  isCustom: false,

  currencies: [
    {
      id: "credit",

      name: "Credit",

      abbreviation: "Credits",

      baseValue: 1,

      displayOrder: 1,
    },
  ],
};

/*
 * ------------------------------------------------
 * Cyberpunk RED
 * ------------------------------------------------
 */

export const CYBERPUNK_RED_CURRENCY_SYSTEM: CurrencySystem = {
  id: "cyberpunk-red-standard",

  name: "Cyberpunk RED Eurobucks",

  commonCurrencyId: "eurobuck",

  smallestCurrencyId: "eurobuck",

  automaticBreakdownCurrencyIds: ["eurobuck"],

  isCustom: false,

  currencies: [
    {
      id: "eurobuck",

      name: "Eurobuck",

      abbreviation: "eb",

      baseValue: 1,

      displayOrder: 1,
    },
  ],
};

/*
 * ------------------------------------------------
 * Custom TTRPG
 * ------------------------------------------------
 *
 * This is only the starting template.
 *
 * The custom-system editor will replace
 * these values with whatever denominations
 * the campaign creator defines.
 */

export const CUSTOM_CURRENCY_SYSTEM_TEMPLATE: CurrencySystem = {
  id: "custom-currency",

  name: "Custom Currency",

  commonCurrencyId: "unit",

  smallestCurrencyId: "unit",

  automaticBreakdownCurrencyIds: ["unit"],

  isCustom: true,

  currencies: [
    {
      id: "unit",

      name: "Currency Unit",

      abbreviation: "Unit",

      baseValue: 1,

      displayOrder: 1,
    },
  ],
};

/*
 * ------------------------------------------------
 * Wallet helpers
 * ------------------------------------------------
 */

export function createEmptyWallet(currencySystem: CurrencySystem): Wallet {
  return {
    balances: currencySystem.currencies.map((currency) => ({
      currencyId: currency.id,

      amount: 0,
    })),
  };
}

export function getWalletBalance(
  wallet: Wallet,

  currencyId: string,
): number {
  return (
    wallet.balances.find((balance) => balance.currencyId === currencyId)
      ?.amount ?? 0
  );
}

export function getCurrencyDefinition(
  currencySystem: CurrencySystem,

  currencyId: string,
) {
  return currencySystem.currencies.find(
    (currency) => currency.id === currencyId,
  );
}

export function getCommonCurrency(currencySystem: CurrencySystem) {
  return getCurrencyDefinition(
    currencySystem,

    currencySystem.commonCurrencyId,
  );
}

export function getSmallestCurrency(currencySystem: CurrencySystem) {
  return getCurrencyDefinition(
    currencySystem,

    currencySystem.smallestCurrencyId,
  );
}

export function getWalletTotalBaseValue(
  wallet: Wallet,

  currencySystem: CurrencySystem,
): number {
  return wallet.balances.reduce(
    (total, balance) => {
      const currency = currencySystem.currencies.find(
        (item) => item.id === balance.currencyId,
      );

      if (!currency) {
        return total;
      }

      return total + balance.amount * currency.baseValue;
    },

    0,
  );
}

/**
 * Produces a fresh CurrencySystem object.
 *
 * Campaigns should receive their own copy
 * instead of sharing the registry constant.
 *
 * This becomes especially important once
 * custom currency editing exists.
 */
export function cloneCurrencySystem(
  currencySystem: CurrencySystem,
): CurrencySystem {
  return {
    ...currencySystem,

    currencies: currencySystem.currencies.map((currency) => ({
      ...currency,
    })),

    automaticBreakdownCurrencyIds: [
      ...currencySystem.automaticBreakdownCurrencyIds,
    ],
  };
}
