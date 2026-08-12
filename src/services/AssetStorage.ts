import AsyncStorage from "@react-native-async-storage/async-storage";

import { NewPartyAsset, PartyAsset, UpdatePartyAsset } from "../models/Asset";

const STORAGE_KEY = "@dragons-ledger/party-assets";

export async function loadAssets(): Promise<PartyAsset[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  const parsed = JSON.parse(storedValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as PartyAsset[];
}

export async function saveAssets(assets: PartyAsset[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export async function createAsset(newAsset: NewPartyAsset) {
  const assets = await loadAssets();

  const now = new Date().toISOString();

  const asset: PartyAsset = {
    id: createAssetId(),

    campaignId: newAsset.campaignId,

    name: newAsset.name.trim(),

    description: newAsset.description.trim(),

    quantity: newAsset.quantity,

    notes: newAsset.notes.trim(),

    isHidden: newAsset.isHidden,

    assignedMemberId: newAsset.assignedMemberId,

    createdByMemberId: newAsset.createdByMemberId,

    createdAt: now,

    updatedAt: now,
  };

  const updatedAssets = [asset, ...assets];

  await saveAssets(updatedAssets);

  return {
    asset,
    assets: updatedAssets,
  };
}

export async function updateAsset(assetId: string, update: UpdatePartyAsset) {
  const assets = await loadAssets();

  const updatedAt = new Date().toISOString();

  const updatedAssets = assets.map((asset) => {
    if (asset.id !== assetId) {
      return asset;
    }

    return {
      ...asset,

      name: update.name.trim(),

      description: update.description.trim(),

      quantity: update.quantity,

      notes: update.notes.trim(),

      isHidden: update.isHidden,

      assignedMemberId: update.assignedMemberId,

      updatedAt,
    };
  });

  await saveAssets(updatedAssets);

  return updatedAssets;
}

export async function deleteAsset(assetId: string) {
  const assets = await loadAssets();

  const updatedAssets = assets.filter((asset) => asset.id !== assetId);

  await saveAssets(updatedAssets);

  return updatedAssets;
}

function createAssetId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
