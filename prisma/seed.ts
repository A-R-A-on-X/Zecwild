import { PrismaClient } from "@prisma/client";
import { generateAuctionKeypair } from "../src/lib/crypto/sealing";
import { zecToZat, generateInvoiceMemo } from "../src/lib/crypto/zcash";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ZecWild marketplace and sealed auctions...");

  // Clear existing items
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.settlementLog.deleteMany();

  // 1. Marketplace Listings
  await prisma.listing.createMany({
    data: [
      {
        title: "Private AI Inference API Key (10M Shielded Compute Tokens)",
        description:
          "Zero-log private AI access hosted on confidential enclave hardware. Fast LLM completions via shielded endpoints.",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        itemType: "DIGITAL",
        secretPayload: "sk_orchard_priv_ai_9921_token_cluster_auth_verified_key",
        priceZec: 0.15,
        priceZat: zecToZat(0.15),
        sellerAddress:
          "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
        status: "AVAILABLE",
        invoiceMemo: "ZECWILD:V1:inv_ai_tokens_01",
        shippingStatus: "NOT_APPLICABLE",
      },
      {
        title: "Cypherpunk Shielded Hardware Vault (Titanium Dual-Element)",
        description:
          "Custom air-gapped hardware wallet with hardware-isolated Orchard signature accelerator and tamper-evident casing.",
        imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
        itemType: "PHYSICAL",
        secretPayload: null,
        priceZec: 0.65,
        priceZat: zecToZat(0.65),
        sellerAddress:
          "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
        status: "AVAILABLE",
        invoiceMemo: "ZECWILD:V1:inv_hw_vault_02",
        shippingStatus: "PENDING_SHIPMENT",
      },
      {
        title: "Zero-Knowledge Circuit Optimization Compendium (2026 Master PDF)",
        description:
          "Definitive engineering guide on Halo 2 proving performance, recursive SNARK optimizations, and Orchard circuit internals.",
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
        itemType: "DIGITAL",
        secretPayload: "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/zk_handbook.pdf",
        priceZec: 0.08,
        priceZat: zecToZat(0.08),
        sellerAddress:
          "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
        status: "AVAILABLE",
        invoiceMemo: "ZECWILD:V1:inv_zk_pdf_03",
        shippingStatus: "NOT_APPLICABLE",
      },
    ],
  });

  // 2. Sealed-Bid Auctions
  const auctionKeypair1 = await generateAuctionKeypair();
  const auction1EndTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

  const auction1 = await prisma.auction.create({
    data: {
      title: "Ultra-Rare Genesis Orchard Shielded Artifact #001",
      description:
        "The premier sealed digital collectible commemorating the first Orchard transaction block with verifiable Halo 2 zk-proof.",
      imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
      itemType: "DIGITAL",
      secretPayload: "https://arweave.net/genesis_orchard_artifact_001_master_proof_pack.zip",
      reservePriceZec: 0.5,
      reservePriceZat: zecToZat(0.5),
      sellerAddress:
        "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
      sealingPublicKey: auctionKeypair1.publicKeyBase64,
      endTime: auction1EndTime,
      status: "OPEN",
    },
  });

  // Seed a ready-to-reveal auction for demonstration
  const auctionKeypair2 = await generateAuctionKeypair();
  const pastEndTime = new Date(Date.now() - 5 * 60 * 1000); // 5 mins in the past (closed)

  const auction2 = await prisma.auction.create({
    data: {
      title: "Antique Cypherpunk Manifesto Print (Hand-Stamped ZEC #42)",
      description:
        "Limited edition physical print of Eric Hughes' 1993 Cypherpunk Manifesto, encased in UV-protected museum glass.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      itemType: "PHYSICAL",
      secretPayload: null,
      reservePriceZec: 0.2,
      reservePriceZat: zecToZat(0.2),
      sellerAddress:
        "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
      sealingPublicKey: auctionKeypair2.publicKeyBase64,
      endTime: pastEndTime,
      status: "CLOSED_AWAITING_REVEAL",
      shippingStatus: "PENDING_SHIPMENT",
    },
  });

  console.log("Seeding complete! Auctions created:", {
    openAuctionId: auction1.id,
    closedAuctionId: auction2.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
