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

// Pre-seeded Demo Personas for instant Mainnet and Testnet evaluation
export const DEFAULT_DEMO_PERSONAS: ShieldedProfile[] = [
  {
    id: "persona_alice_seller",
    name: "Alice (Seller - Ironwood Mainnet)",
    address:
      "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
    addressType: "Ironwood",
    network: "mainnet",
    isDemo: true,
  },
  {
    id: "persona_bob_testnet",
    name: "Bob (Bidder - Ironwood Testnet)",
    address:
      "utest1zk3e5vh77r6w888v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829bb",
    addressType: "Ironwood",
    network: "testnet",
    isDemo: true,
  },
  {
    id: "persona_charlie_buyer",
    name: "Charlie (Buyer - Sapling Mainnet)",
    address:
      "zs1zp994vh99r6w777v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829cc",
    addressType: "Sapling",
    network: "mainnet",
    isDemo: true,
  },
  {
    id: "persona_dana_testnet",
    name: "Dana (Buyer - Sapling Testnet)",
    address:
      "ztestsapling1076f8e4e7e6f9829df739a82e7492c8e90726f5e82719a84e629f738a92e8471927492a83f982a",
    addressType: "Sapling",
    network: "testnet",
    isDemo: true,
  },
];

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
  const activeDemos = DEFAULT_DEMO_PERSONAS.filter((p) => !deleted.has(p.id));
  const custom = getCustomProfiles().filter((p) => !deleted.has(p.id));
  return [...activeDemos, ...custom];
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
 * Delete any persona (both custom and demo personas)
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
  if (current.id === id) {
    const remaining = getAllProfiles();
    if (remaining.length > 0) {
      setActiveProfile(remaining[0]);
    } else {
      const fresh = generateRandomShieldedProfile("New Shielded User");
      setActiveProfile(fresh);
    }
  } else {
    window.dispatchEvent(new CustomEvent("zecwild_profile_changed", { detail: getActiveProfile() }));
  }
}

export function restoreDemoPersonas(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_DELETED_PERSONAS);
  const all = getAllProfiles();
  if (all.length > 0) {
    setActiveProfile(all[0]);
  }
}

export function getActiveProfile(): ShieldedProfile {
  if (typeof window === "undefined") return DEFAULT_DEMO_PERSONAS[0];
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
  return available[0] || DEFAULT_DEMO_PERSONAS[0];
}

export function setActiveProfile(profile: ShieldedProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
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
