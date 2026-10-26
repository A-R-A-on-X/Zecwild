# ZecWild 🐆🛡️
### Shielded Sealed-Bid Auctions & Open Marketplace on Zcash

> **Wallet-to-Wallet Shielded Settlement • Zero Platform Custody • Client-Side Cryptographic Bid Sealing**

ZecWild is a hybrid commerce and auction platform built natively for **Shielded Zcash (Orchard & Sapling)**. It eliminates third-party fund escrow, prevents price-discovery manipulation in sealed auctions, and automates settlement verification via the **ZecShield Gateway** (`zechack`) indexer engine.

---

## 🌟 Key Architecture & Capabilities

### 1. Cryptographically Sealed-Bid Auctions (Option B)
* **Zero Bid Leakage:** Bidders submit bids without knowing competing bids or a live price.
* **Hybrid Asymmetric Encryption:** When an auction is created, an ephemeral **RSA-OAEP 2048-bit + AES-256-GCM** keypair is generated in the seller's browser using the native **WebCrypto API**.
* **Client-Side Sealing:** The bidder's browser encrypts `{ amountZat, bidderAddress, salt, timestamp }` using the auction's public key. The server only receives opaque ciphertext and a **SHA-256 commitment hash** $H(\text{ciphertext})$.
* **Auditable Unsealing:** After deadline expiration, the seller unseals the bids client-side using their private key. The server verifies integrity, deterministically ranks bids, declares the winner, and issues a single-use payment invoice.
* **Anti-Griefing Fallback:** If the winning bidder defaults or fails to settle within the grace period, the seller has a one-click control to **"Select Runner-Up"** (cascades to rank #2) or **"Relist"**.

### 2. Peer-to-Peer Open Marketplace
* **Direct Wallet-to-Wallet:** Buyers pay sellers directly to their shielded Orchard (`u1...`) or Sapling (`zs1...`) addresses. The platform never holds custody of funds.
* **ZIP-321 Payment Invoices:** Generates standardized Zcash payment URIs and scannable QR codes (`zcash:<seller_address>?amount=<zec>&memo=ZECWILD:V1:<invoice_id>`).
* **Compatible Wallets:** Instant 1-click scanning and deep-linking in **Zashi, YWallet, and Zingo!**.
* **Dual Fulfillment Modes:**
  * **Digital Goods:** Secret payloads (API keys, download links, license codes) remain locked and are decrypted/revealed to the buyer immediately upon verified payment.
  * **Physical Goods:** Seller fulfillment dashboard with shipping and tracking updates.

### 3. ZecShield Gateway (`zechack`) Webhook Ingestion Engine
* Ingests incoming note events (`shielded_note.simulated`, `shielded_note.confirmed`, `shielded_note.detected`).
* **Cryptographic Memo Matching:** Extracts `ZECWILD:V1:<invoice_id>` nonces.
* **Zatoshis Exact Match:** Verifies `amount_zat >= required_zat` using integer math (zero floating-point precision loss).
* **Replay & Double-Spend Immunity:** Atomic database transactions and unique `eventId` indexing enforce strict idempotency.
* **Embedded Webhook Testbed:** Built-in developer modal to simulate incoming `zechack` webhook notes on localhost for demonstration.

### 4. Shielded Identity & Persona Switcher
* **No Leaky Web2 Logins:** Zero emails, passwords, or KYC.
* **Pre-configured Hackathon Personas:**
  * ⚡ **Alice (Seller):** Publishes listings, unseals closed auctions, tracks shipments.
  * ⚡ **Bob (High Bidder):** Submits sealed bids, pays for won auctions.
  * ⚡ **Charlie (Marketplace Buyer):** Buys digital/physical goods, unlocks private secrets.
* **Custom Wallet:** Connect any Orchard (`u1...`) or Sapling (`zs1...`) address with client-side identity key generation.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js v20+ or v22+
- npm v10+

### 2. Installation
```bash
git clone https://github.com/TheWebDevEhi/Zecwild.git
cd Zecwild
npm install
```

### 3. Database Initialization (SQLite Zero-Config Default)
```bash
# Push Prisma schema to local SQLite database
npx prisma db push

# Seed demo listings and sealed auctions
node prisma/seed.mjs
```

### 4. Launch the Dev Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Free-Tier Cloud Deployment Guide

ZecWild is built to run on 100% free-tier infrastructure:

### Database (Neon PostgreSQL)
1. Create a free PostgreSQL instance at [neon.tech](https://neon.tech).
2. Copy your connection string: `postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require`.
3. In `prisma/schema.prisma`, update provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run `npx prisma db push`.

### Hosting (Vercel)
1. Push to your GitHub repo.
2. Import project into [Vercel](https://vercel.com) (free tier).
3. Set environment variable: `DATABASE_URL` pointing to your Neon database.
4. Deploy!

---

## 🎥 Hackathon Demo Video Flow

For your short submission video, showcase both flows in under 3 minutes:

### Scene 1: Open Marketplace Flow
1. Open the **Marketplace** tab as **Charlie (Buyer)**.
2. Click **"Buy Now"** on "Private AI Inference API Key".
3. Show the **ZIP-321 QR Code**, exact ZEC amount, seller's shielded address, and mandatory memo `ZECWILD:V1:...`.
4. Click **"⚡ Quick Simulate"** (or fire a webhook from `zechack`).
5. **Confetti triggers!** Status transitions to **"Payment Confirmed!"**, txid appears, and the private API key secret is unlocked on screen.

### Scene 2: Sealed-Bid Auction Flow
1. Switch to **Bob (High Bidder)** in the top-right persona switcher.
2. Open the **Sealed-Bid Auctions** tab.
3. Observe the live countdown timer and **"X Bids Received (Cryptographically Sealed)"** counter.
4. Click **"Place Cryptographically Sealed Bid"** on "Ultra-Rare Genesis Orchard Shielded Artifact".
5. Enter `0.85` ZEC $\rightarrow$ Click **"Submit Sealed Bid"**.
6. Show the **SHA-256 cryptographic commitment hash** generated in Bob's browser.
7. Switch persona back to **Alice (Seller)**.
8. Click **"Unseal Bids & Declare Winner"** on the closed auction.
9. Alice's browser decrypts the bids with her local private key, ranks the bidders, and declares Bob the winner with a new payment invoice memo!

---

## 🔒 Security & Audit Summary

| Attack Vector | Threat Mitigated | Technical Countermeasure |
| :--- | :--- | :--- |
| **Bid Sniping / Leakage** | Malicious DB admin or competing bidder peeking at bids before close | Asymmetric RSA-OAEP + AES-GCM client encryption. Server only holds opaque ciphertext + commitment hash. |
| **Winner Default / Griefing** | High bidder refuses to pay; item stuck in limbo | Seller has one-click "Select Runner-Up" to cascade to Rank #2 bidder with a fresh payment deadline. |
| **Webhook Spoofing / Forgery** | Attacker calls `/api/webhooks/zechack` with fake payments | Triple-factor validation: memo nonce match + exact zatoshis check + destination shielded address check. |
| **Replay Attacks** | Attacker replays old txid or memo to claim an item | `SettlementLog` records `eventId` and `txid` with unique database constraints. |
| **Precision Loss** | Rounding errors with ZEC floating point numbers | All financial settlement comparisons are strictly calculated in integer **Zatoshis** (`10^8` per ZEC). |
| **Off-Chain Surveillance** | Linking email / IP to shielded addresses | Zero web2 accounts required. Browser-side Ed25519 session identity keys. |

---

Built for the **Zcash Shielded Hackathon**.
