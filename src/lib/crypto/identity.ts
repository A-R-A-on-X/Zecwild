/**
 * Shielded Zcash Identity & Session Vault
 * Privacy-preserving client-side session management.
 * Stores keys locally in browser storage without transmitting private keys to any server.
 * Supports Mainnet, Testnet, and Ironwood (NU6.3) / Sapling pools.
 */

import { detectNetwork, getAddressDetails, ZecNetwork, ShieldedPool } from "./zcash";

export interface ShieldedProfile {
  id: string;
  name: string;
  address: string; // Orchard/Ironwood (u1..., utest1...) or Sapling (zs1..., ztestsapling1...)
  addressType: "Ironwood" | "Orchard" | "Sapling";
  network: ZecNetwork;
  isDemo?: boolean;
  identityPubkey?: string; // Client-side device-bound public key for impersonation resistance
  createdAt?: number;
}

// Empty default personas — no mock/placeholder users
export const DEFAULT_DEMO_PERSONAS: ShieldedProfile[] = [];

const STORAGE_KEY_PROFILE = "zecwild_active_profile";
const STORAGE_KEY_CUSTOM_PROFILES = "zecwild_custom_profiles";
const STORAGE_KEY_DELETED_PERSONAS = "zecwild_deleted_personas";
const STORAGE_KEY_AUCTION_KEYS = "zecwild_auction_private_keys";
const STORAGE_KEY_NETWORK = "zecwild_active_network";

export function getActiveNetwork(): ZecNetwork {
  if (typeof window === "undefined") return "mainnet";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NETWORK);
    if (stored === "testnet" || stored === "mainnet") return stored;
  } catch (e) {
    console.error("Failed to read active network:", e);
  }
  return "mainnet";
}

export function setActiveNetwork(network: ZecNetwork): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_NETWORK, network);
    window.dispatchEvent(new CustomEvent("zecwild_network_changed", { detail: network }));
  } catch (e) {
    console.error("Failed to save active network:", e);
  }
}

export function getDeletedPersonaIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_PERSONAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read deleted personas:", e);
  }
  return [];
}

export function getCustomProfiles(): ShieldedProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PROFILES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read custom profiles:", e);
  }
  return [];
}

export function getAllProfiles(): ShieldedProfile[] {
  const deleted = new Set(getDeletedPersonaIds());
  const custom = getCustomProfiles().filter((p) => !deleted.has(p.id));
  return custom;
}

export function addCustomProfile(name: string, address: string): ShieldedProfile {
  const cleanAddr = address.trim();
  const details = getAddressDetails(cleanAddr);
  const addressType: "Ironwood" | "Orchard" | "Sapling" =
    details.pool === "Sapling" ? "Sapling" : "Ironwood";

  const newProfile: ShieldedProfile = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `User (${cleanAddr.slice(0, 8)}...)`,
    address: cleanAddr,
    addressType,
    network: details.network,
    isDemo: false,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    const existing = getCustomProfiles();
    const updated = [newProfile, ...existing];
    localStorage.setItem(STORAGE_KEY_CUSTOM_PROFILES, JSON.stringify(updated));
  }

  setActiveProfile(newProfile);
  return newProfile;
}

export function generateRandomShieldedProfile(
  name = "Shielded User",
  network: ZecNetwork = "mainnet"
): ShieldedProfile {
  const bytes = new Uint8Array(65);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Testnet vs Mainnet Unified Ironwood Address prefix
  const prefix = network === "testnet" ? "utest1" : "u1";
  const address = `${prefix}${hex}`;

  return addCustomProfile(`${name} (${network === "testnet" ? "Testnet" : "Mainnet"})`, address);
}

/**
 * Delete any persona
 */
export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return;

  const existingCustom = getCustomProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_CUSTOM_PROFILES, JSON.stringify(existingCustom));

  const deleted = getDeletedPersonaIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(STORAGE_KEY_DELETED_PERSONAS, JSON.stringify(deleted));
  }

  const current = getActiveProfile();
  if (current && current.id === id) {
    const remaining = getAllProfiles();
    if (remaining.length > 0) {
      setActiveProfile(remaining[0]);
    } else {
      setActiveProfile(null);
    }
  } else {
    window.dispatchEvent(new CustomEvent("zecwild_profile_changed", { detail: getActiveProfile() }));
  }
}

export function disconnectProfile(): void {
  if (typeof window === "undefined") return;
  setActiveProfile(null);
}

export function restoreDemoPersonas(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_DELETED_PERSONAS);
  const all = getAllProfiles();
  if (all.length > 0) {
    setActiveProfile(all[0]);
  }
}

export function getActiveProfile(): ShieldedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const deleted = new Set(getDeletedPersonaIds());
      if (!deleted.has(parsed.id)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read profile from localStorage:", e);
  }
  const available = getAllProfiles();
  return available[0] || null;
}

export function setActiveProfile(profile: ShieldedProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    }
    window.dispatchEvent(new CustomEvent("zecwild_profile_changed", { detail: profile }));
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

export function storeAuctionPrivateKey(auctionId: string, privateKeyBase64: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUCTION_KEYS) || "{}";
    const map = JSON.parse(raw);
    map[auctionId] = privateKeyBase64;
    localStorage.setItem(STORAGE_KEY_AUCTION_KEYS, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to store auction private key:", e);
  }
}

export function getAuctionPrivateKey(auctionId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUCTION_KEYS) || "{}";
    const map = JSON.parse(raw);
    return map[auctionId] || null;
  } catch (e) {
    console.error("Failed to read auction private key:", e);
    return null;
  }
}

export const DEMO_PERSONAS = DEFAULT_DEMO_PERSONAS;
export const removeCustomProfile = deleteProfile;
