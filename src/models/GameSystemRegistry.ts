import { GameSystem } from "./Campaign";

import {
    cloneCurrencySystem,
    CurrencySystem,
    CUSTOM_CURRENCY_SYSTEM_TEMPLATE,
    CYBERPUNK_RED_CURRENCY_SYSTEM,
    DAGGERHEART_CURRENCY_SYSTEM,
    DND_5E_CURRENCY_SYSTEM,
    PATHFINDER_2E_CURRENCY_SYSTEM,
    STARFINDER_2E_CURRENCY_SYSTEM,
} from "./Currency";

export interface GameSystemProfile {
  id: GameSystem;

  name: string;

  description: string;

  currencySystem: CurrencySystem;

  /**
   * Custom systems will eventually
   * expose the full currency editor.
   */
  isCustom: boolean;
}

export const GAME_SYSTEM_PROFILES: GameSystemProfile[] = [
  {
    id: "dnd-5e",

    name: "Dungeons & Dragons 5e",

    description:
      "Standard D&D coinage using copper, silver, electrum, gold, and platinum.",

    currencySystem: DND_5E_CURRENCY_SYSTEM,

    isCustom: false,
  },

  {
    id: "pathfinder-2e",

    name: "Pathfinder 2e",

    description: "Pathfinder coinage using copper, silver, gold, and platinum.",

    currencySystem: PATHFINDER_2E_CURRENCY_SYSTEM,

    isCustom: false,
  },

  {
    id: "daggerheart",

    name: "Daggerheart",

    description: "Gold wealth tracked as handfuls, bags, and chests.",

    currencySystem: DAGGERHEART_CURRENCY_SYSTEM,

    isCustom: false,
  },

  {
    id: "starfinder-2e",

    name: "Starfinder 2e",

    description: "Science-fantasy economy using Credits.",

    currencySystem: STARFINDER_2E_CURRENCY_SYSTEM,

    isCustom: false,
  },

  {
    id: "cyberpunk-red",

    name: "Cyberpunk RED",

    description: "Night City economy using Eurobucks.",

    currencySystem: CYBERPUNK_RED_CURRENCY_SYSTEM,

    isCustom: false,
  },

  {
    id: "custom",

    name: "Custom TTRPG",

    description: "Build your own currency system and denomination rules.",

    currencySystem: CUSTOM_CURRENCY_SYSTEM_TEMPLATE,

    isCustom: true,
  },
];

export function getGameSystemProfile(
  gameSystem: GameSystem,
): GameSystemProfile {
  return (
    GAME_SYSTEM_PROFILES.find((profile) => profile.id === gameSystem) ??
    GAME_SYSTEM_PROFILES[GAME_SYSTEM_PROFILES.length - 1]
  );
}

/**
 * Returns a fresh copy for a new campaign.
 *
 * The registry templates themselves should
 * never be mutated by campaign data.
 */
export function createCurrencySystemForGameSystem(
  gameSystem: GameSystem,
): CurrencySystem {
  const profile = getGameSystemProfile(gameSystem);

  return cloneCurrencySystem(profile.currencySystem);
}

export function getGameSystemDisplayName(gameSystem: GameSystem): string {
  return getGameSystemProfile(gameSystem).name;
}
