/**
 * Cryptographic Sealing Engine for Sealed-Bid Auctions
 * Hybrid Cryptosystem: RSA-OAEP (2048-bit, SHA-256) + AES-256-GCM
 * Works seamlessly in both Modern Browsers and Node.js runtime via WebCrypto API.
 */

export interface BidPayload {
  amountZat: string;
  amountZec: number;
  bidderAddress: string;
  refundAddress?: string;
  salt: string;
  timestamp: number;
}

export interface SealedBidPackage {
  sealedCiphertext: string;
  commitmentHash: string;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  try {
    const nodeCrypto = require("crypto");
    if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
      return nodeCrypto.webcrypto.subtle;
    }
  } catch {}
  throw new Error("WebCrypto SubtleCrypto is not available in this environment.");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binary = "";
  if (typeof atob !== "undefined") {
    binary = atob(base64);
  } else {
    binary = Buffer.from(base64, "base64").toString("binary");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate an ephemeral RSA-OAEP keypair for a sealed-bid auction.
 * The public key is published with the auction.
 * The private key stays strictly in the seller's browser vault until closing.
 */
export async function generateAuctionKeypair(): Promise<{
  publicKeyBase64: string;
  privateKeyBase64: string;
}> {
  const subtle = getSubtleCrypto();
  const keyPair = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublic = await subtle.exportKey("spki", keyPair.publicKey);
  const exportedPrivate = await subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKeyBase64: arrayBufferToBase64(exportedPublic),
    privateKeyBase64: arrayBufferToBase64(exportedPrivate),
  };
}

/**
 * Compute SHA-256 digest of a string formatted as hex
 */
export async function computeSha256(text: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Seal a bid payload using Hybrid Encryption:
 * 1. Generate an ephemeral 256-bit AES-GCM key.
 * 2. Encrypt the bid JSON payload with AES-GCM (12-byte IV).
 * 3. Encrypt the AES key with the Auction's RSA-OAEP public key.
 * 4. Compute the SHA-256 commitment hash of the ciphertext package.
 */
export async function sealBid(
  auctionPublicKeyBase64: string,
  payload: BidPayload
): Promise<SealedBidPackage> {
  const subtle = getSubtleCrypto();

  // 1. Import Auction Public Key
  const spkiBuffer = base64ToArrayBuffer(auctionPublicKeyBase64);
  const rsaPublicKey = await subtle.importKey(
    "spki",
    spkiBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  // 2. Generate Ephemeral AES-GCM Key (256-bit)
  const aesKey = await subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Encrypt Bid JSON with AES-GCM
  const iv = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(iv);
  } else {
    const nodeCrypto = require("crypto");
    nodeCrypto.randomFillSync(iv);
  }

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));

  const encryptedData = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    payloadBytes
  );

  // 4. Export Raw AES key and encrypt with RSA-OAEP Public Key
  const rawAesKey = await subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    rsaPublicKey,
    rawAesKey
  );

  // 5. Serialize Hybrid Ciphertext Package
  const packageObj = {
    encKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encryptedData),
  };
  const sealedCiphertext = JSON.stringify(packageObj);

  // 6. Compute Cryptographic Commitment Hash
  const commitmentHash = await computeSha256(sealedCiphertext);

  return {
    sealedCiphertext,
    commitmentHash,
  };
}

/**
 * Unseal a bid using the Seller's RSA-OAEP private key
 */
export async function unsealBid(
  sellerPrivateKeyBase64: string,
  sealedCiphertext: string
): Promise<BidPayload> {
  const subtle = getSubtleCrypto();

  const packageObj = JSON.parse(sealedCiphertext);
  if (!packageObj.encKey || !packageObj.iv || !packageObj.data) {
    throw new Error("Invalid sealed bid format.");
  }

  // 1. Import Private Key
  const pkcs8Buffer = base64ToArrayBuffer(sellerPrivateKeyBase64);
  const rsaPrivateKey = await subtle.importKey(
    "pkcs8",
    pkcs8Buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  // 2. Decrypt AES Key
  const encKeyBuffer = base64ToArrayBuffer(packageObj.encKey);
  const rawAesKey = await subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    rsaPrivateKey,
    encKeyBuffer
  );

  // 3. Import AES Key
  const aesKey = await subtle.importKey(
    "raw",
    rawAesKey,
    {
      name: "AES-GCM",
    },
    false,
    ["decrypt"]
  );

  // 4. Decrypt Payload
  const ivBuffer = base64ToArrayBuffer(packageObj.iv);
  const dataBuffer = base64ToArrayBuffer(packageObj.data);

  const decryptedBytes = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    aesKey,
    dataBuffer
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBytes);
  const payload = JSON.parse(jsonStr) as BidPayload;

  return payload;
}

/**
 * Verify that a sealed ciphertext matches its committed SHA-256 hash
 */
export async function verifyCommitment(
  sealedCiphertext: string,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await computeSha256(sealedCiphertext);
  return actualHash === expectedHash;
}
