import QRCode from "qrcode";

/**
 * Zcash Conversion & Cryptographic Constants
 * 1 ZEC = 100,000,000 Zatoshis (10^8)
 */
export const ZATOSHIS_PER_ZEC = BigInt(100_000_000);

export type ZecNetwork = "mainnet" | "testnet";
export type ShieldedPool = "Ironwood" | "Orchard" | "Sapling";

/**
 * Convert ZEC float or string to exact Zatoshis string
 * Guarantees no floating-point rounding errors
 */
export function zecToZat(zec: number | string): string {
  const zecStr = typeof zec === "number" ? zec.toFixed(8) : zec;
  const parts = zecStr.split(".");
  const whole = BigInt(parts[0] || "0");
  const fracStr = (parts[1] || "").slice(0, 8).padEnd(8, "0");
  const frac = BigInt(fracStr);
  return (whole * ZATOSHIS_PER_ZEC + frac).toString();
}

/**
 * Convert Zatoshis string to ZEC float
 */
export function zatToZec(zat: string | bigint): number {
  const b = typeof zat === "bigint" ? zat : BigInt(zat || "0");
  const whole = b / ZATOSHIS_PER_ZEC;
  const rem = b % ZATOSHIS_PER_ZEC;
  return Number(whole) + Number(rem) / 100_000_000;
}

/**
 * Validate Zcash Shielded Addresses
 * - Mainnet Unified (Ironwood / Orchard): starts with "u1", 80+ chars
 * - Testnet Unified (Ironwood / Orchard): starts with "utest1", 80+ chars
 * - Mainnet Sapling: starts with "zs1", exactly 78 chars
 * - Testnet Sapling: starts with "ztestsapling1", 78+ chars
 */
export function isShieldedAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();

  // Mainnet
  if (trimmed.startsWith("u1") && trimmed.length >= 80) return true;
  if (trimmed.startsWith("zs1") && trimmed.length === 78) return true;

  // Testnet
  if (trimmed.startsWith("utest1") && trimmed.length >= 80) return true;
  if (trimmed.startsWith("ztestsapling1") && trimmed.length >= 78) return true;

  return false;
}

export function detectNetwork(address: string): ZecNetwork {
  if (!address || typeof address !== "string") return "mainnet";
  const trimmed = address.trim();
  if (
    trimmed.startsWith("utest1") ||
    trimmed.startsWith("ztestsapling1") ||
    trimmed.startsWith("tm") ||
    trimmed.startsWith("t2")
  ) {
    return "testnet";
  }
  return "mainnet";
}

export function getAddressDetails(address: string): {
  network: ZecNetwork;
  pool: "Ironwood/Orchard" | "Sapling" | "Transparent" | "Invalid";
  isShielded: boolean;
  poolLabel: string;
} {
  if (!address || typeof address !== "string") {
    return {
      network: "mainnet",
      pool: "Invalid",
      isShielded: false,
      poolLabel: "Invalid Address",
    };
  }

  const trimmed = address.trim();
  const network = detectNetwork(trimmed);

  if (trimmed.startsWith("u1") || trimmed.startsWith("utest1")) {
    return {
      network,
      pool: "Ironwood/Orchard",
      isShielded: true,
      poolLabel: network === "testnet" ? "Testnet Unified (Ironwood)" : "Unified (Ironwood / NU6.3)",
    };
  }

  if (trimmed.startsWith("zs1") || trimmed.startsWith("ztestsapling1")) {
    return {
      network,
      pool: "Sapling",
      isShielded: true,
      poolLabel: network === "testnet" ? "Testnet Sapling" : "Sapling Shielded",
    };
  }

  if (
    trimmed.startsWith("t1") ||
    trimmed.startsWith("t3") ||
    trimmed.startsWith("tm") ||
    trimmed.startsWith("t2")
  ) {
    return {
      network,
      pool: "Transparent",
      isShielded: false,
      poolLabel: network === "testnet" ? "Testnet Transparent" : "Transparent (Public)",
    };
  }

  return {
    network,
    pool: "Invalid",
    isShielded: false,
    poolLabel: "Invalid Address",
  };
}

export function getAddressType(
  address: string
): "Ironwood" | "Orchard" | "Sapling" | "Transparent" | "Invalid" {
  const details = getAddressDetails(address);
  if (details.pool === "Ironwood/Orchard") return "Ironwood";
  if (details.pool === "Sapling") return "Sapling";
  if (details.pool === "Transparent") return "Transparent";
  return "Invalid";
}

export function formatAddress(address: string, start = 8, end = 6): string {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Return appropriate Block Explorer URL for Mainnet vs Testnet
 */
export function getBlockExplorerUrl(txid?: string | null, network: ZecNetwork = "mainnet"): string {
  const isTest = network === "testnet";
  const baseUrl = isTest
    ? "https://testnet.zcashblockexplorer.com"
    : "https://zcashblockexplorer.com";

  if (!txid) return baseUrl;
  return `${baseUrl}/transactions/${txid}`;
}

/**
 * Generate standard Zcash ZIP-321 payment URI
 * Format: zcash:<address>?amount=<zec>&memo=<base64_memo>
 */
export function generateZip321Uri({
  address,
  amountZec,
  memo,
}: {
  address?: string;
  amountZec?: number;
  memo?: string;
}): string {
  if (!address) return "zcash:";
  const cleanAddress = address.trim();
  const params = new URLSearchParams();
  const zecVal = typeof amountZec === "number" && !isNaN(amountZec) ? amountZec : 0;
  params.set("amount", zecVal.toFixed(8).replace(/\.?0+$/, ""));
  if (memo) {
    // Cross-platform safe base64url encoding (supported in both Browser and Node.js)
    let b64 = "";
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      try {
        b64 = window.btoa(unescape(encodeURIComponent(memo)));
      } catch {
        b64 = Buffer.from(memo, "utf8").toString("base64");
      }
    } else {
      b64 = Buffer.from(memo, "utf8").toString("base64");
    }
    const b64url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    params.set("memo", b64url);
  }
  return `zcash:${cleanAddress}?${params.toString()}`;
}

/**
 * Generate QR code Data URL for instant rendering in modal
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: {
      dark: "#1A1816",
      light: "#ffffff",
    },
  });
}

/**
 * Generate a cryptographically secure single-use invoice memo
 * Format: ZECWILD:V1:<random_16_hex>
 */
export function generateInvoiceMemo(prefix = "inv"): string {
  const bytes = new Uint8Array(8);
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
  return `ZECWILD:V1:${prefix}_${hex}`;
}
