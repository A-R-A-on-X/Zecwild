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
}

// Pre-seeded Demo Personas for instant hackathon evaluation and video demos
export const DEMO_PERSONAS: ShieldedProfile[] = [
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
const STORAGE_KEY_AUCTION_KEYS = "zecwild_auction_private_keys";

export function getActiveProfile(): ShieldedProfile {
  if (typeof window === "undefined") return DEMO_PERSONAS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read profile from localStorage:", e);
  }
  return DEMO_PERSONAS[0];
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
    console.error("Failed to retrieve auction private key:", e);
    return null;
  }
}
