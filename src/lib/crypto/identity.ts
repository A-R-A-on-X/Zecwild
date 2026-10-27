/**
 * Shielded Zcash Identity & Session Vault
 * Privacy-preserving client-side session management.
 * Stores keys locally in browser storage without transmitting private keys to any server.
 */

export interface ShieldedProfile {
  id: string;
  name: string;
  address: string; // Orchard (u1...) or Sapling (zs1...)
  addressType: "Orchard" | "Sapling";
  isDemo?: boolean;
  identityPubkey?: string; // Client-side device-bound public key for impersonation resistance
  createdAt?: number;
}

// Pre-seeded Demo Personas for instant hackathon evaluation and video demos
export const DEFAULT_DEMO_PERSONAS: ShieldedProfile[] = [
  {
    id: "persona_alice_seller",
    name: "Alice (Seller)",
    address:
      "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
    addressType: "Orchard",
    isDemo: true,
  },
  {
    id: "persona_bob_bidder",
    name: "Bob (High Bidder)",
    address:
      "u1zk3e5vh77r6w888v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829bb",
    addressType: "Orchard",
    isDemo: true,
  },
  {
    id: "persona_charlie_buyer",
    name: "Charlie (Market Buyer)",
    address:
      "u1zp994vh99r6w777v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829cc",
    addressType: "Orchard",
    isDemo: true,
  },
];

const STORAGE_KEY_PROFILE = "zecwild_active_profile";
const STORAGE_KEY_CUSTOM_PROFILES = "zecwild_custom_profiles";
const STORAGE_KEY_DELETED_PERSONAS = "zecwild_deleted_personas";
const STORAGE_KEY_AUCTION_KEYS = "zecwild_auction_private_keys";
const STORAGE_KEY_IDENTITY_KEYS = "zecwild_device_identity_keys";

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
  const addressType = cleanAddr.startsWith("u1") ? "Orchard" : "Sapling";
  const newProfile: ShieldedProfile = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `User (${cleanAddr.slice(0, 6)}...)`,
    address: cleanAddr,
    addressType,
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

export function generateRandomShieldedProfile(name = "Shielded User"): ShieldedProfile {
  const bytes = new Uint8Array(65);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const address = `u1${hex}`;

  return addCustomProfile(name, address);
}

/**
 * Delete any persona (both custom and demo personas)
 */
export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return;

  // 1. If it's a custom profile, remove from custom list
  const existingCustom = getCustomProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_CUSTOM_PROFILES, JSON.stringify(existingCustom));

  // 2. Mark as deleted in deleted personas list
  const deleted = getDeletedPersonaIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(STORAGE_KEY_DELETED_PERSONAS, JSON.stringify(deleted));
  }

  // 3. If deleting active profile, switch to next available profile or create burner
  const current = getActiveProfile();
  if (current.id === id) {
    const remaining = getAllProfiles();
    if (remaining.length > 0) {
      setActiveProfile(remaining[0]);
    } else {
      // Create a fresh default persona
      const fresh = generateRandomShieldedProfile("New Shielded User");
      setActiveProfile(fresh);
    }
  } else {
    // Notify components of updated profile list
    window.dispatchEvent(new CustomEvent("zecwild_profile_changed", { detail: getActiveProfile() }));
  }
}

/**
 * Restore original demo personas
 */
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

/**
 * Save an auction's unsealing private key in the seller's browser vault
 */
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

/**
 * Retrieve an auction's unsealing private key
 */
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
