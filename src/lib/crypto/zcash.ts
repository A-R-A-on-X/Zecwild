import QRCode from "qrcode";

/**
 * Zcash Conversion & Cryptographic Constants
 * 1 ZEC = 100,000,000 Zatoshis (10^8)
 */
export const ZATOSHIS_PER_ZEC = BigInt(100_000_000);

/**
 * Convert ZEC float or string to exact Zatoshis string
 * Guarantees no floating-point rounding errors
 */
export function zecToZat(zec: number | string): string {
  const zecStr = typeof zec === "number" ? zec.toFixed(8) : zec;
  const parts = zecStr.split(".");
  const whole = BigInt(parts[0] || "0");
  let fracStr = (parts[1] || "").slice(0, 8).padEnd(8, "0");
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
 * - Orchard Unified: starts with "u1", typically 140+ characters
 * - Sapling: starts with "zs1", exactly 78 characters
 */
export function isShieldedAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  if (trimmed.startsWith("u1") && trimmed.length >= 80) return true;
  if (trimmed.startsWith("zs1") && trimmed.length === 78) return true;
  return false;
}

export function getAddressType(address: string): "Orchard" | "Sapling" | "Transparent" | "Invalid" {
  if (!address || typeof address !== "string") return "Invalid";
  const trimmed = address.trim();
  if (trimmed.startsWith("u1")) return "Orchard";
  if (trimmed.startsWith("zs1")) return "Sapling";
  if (trimmed.startsWith("t1") || trimmed.startsWith("t3")) return "Transparent";
  return "Invalid";
}

export function formatAddress(address: string, start = 8, end = 6): string {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
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
  address: string;
  amountZec: number;
  memo: string;
}): string {
  const cleanAddress = address.trim();
  const params = new URLSearchParams();
  params.set("amount", amountZec.toFixed(8).replace(/\.?0+$/, ""));
  if (memo) {
    // Standard ZIP-321 memo encoding: base64url or plain string
    params.set("memo", Buffer.from(memo, "utf8").toString("base64url"));
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
      dark: "#050811",
      light: "#ffffff",
    },
  });
}

/**
 * Generate a cryptographically secure single-use invoice memo
 * Format: ZECWILD:V1:<random_16_hex>
 */
export function generateInvoiceMemo(prefix = "ZECWILD:V1"): string {
  const randomBytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for Node environments without global crypto
    const nodeCrypto = require("crypto");
    const buf = nodeCrypto.randomBytes(8);
    return `${prefix}:${buf.toString("hex")}`;
  }
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}:${hex}`;
}

/**
 * Parse an invoice memo and extract the clean invoice ID
 */
export function parseInvoiceMemo(memo: string): { valid: boolean; invoiceId?: string } {
  if (!memo || typeof memo !== "string") return { valid: false };
  const trimmed = memo.trim();
  const match = trimmed.match(/^ZECWILD:V1:([a-zA-Z0-9_-]+)/);
  if (match) {
    return { valid: true, invoiceId: match[1] };
  }
  return { valid: false };
}
