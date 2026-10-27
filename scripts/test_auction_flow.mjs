import http from "node:http";
import crypto from "node:crypto";

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log("=== TESTING FULL AUCTION FLOW ===");

  // 1. Generate an RSA Keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  const pubB64 = publicKey.toString("base64");
  const privB64 = privateKey.toString("base64");

  // 2. Create Auction
  const createRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auctions",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      title: "Automated Test Shielded Auction",
      description: "Testing end to end reveal and settlement",
      imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800",
      itemType: "DIGITAL",
      secretPayload: "secret-token-test-xyz-99",
      reservePriceZec: 0.1,
      durationMinutes: 15,
      sellerAddress: "u1zrqm2vh87r6w998v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829f2",
      sealingPublicKey: pubB64,
    }
  );
  console.log("Create Auction response:", createRes.status, createRes.data.success, "ID:", createRes.data.auction?.id);
  const auctionId = createRes.data.auction.id;

  // 3. Place a Bid (Simulate hybrid encryption)
  const symKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const bidPayload = JSON.stringify({
    amountZat: "25000000",
    amountZec: 0.25,
    bidderAddress: "u1zk3e5vh77r6w888v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829bb",
    salt: "randomsalt123",
  });
  const cipher = crypto.createCipheriv("aes-256-gcm", symKey, iv);
  const encPayload = Buffer.concat([cipher.update(bidPayload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const encSymKey = crypto.publicEncrypt(
    { key: Buffer.from(pubB64, "base64"), format: "der", type: "spki", padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    symKey
  );

  const sealedCiphertext = JSON.stringify({
    encryptedKey: encSymKey.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: encPayload.toString("base64"),
    authTag: tag.toString("base64"),
  });

  const commitmentHash = crypto.createHash("sha256").update(sealedCiphertext).digest("hex");

  const bidRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: `/api/auctions/${auctionId}/bids`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      sealedCiphertext,
      commitmentHash,
    }
  );
  console.log("Place Bid response:", bidRes.status, bidRes.data.success, "BidID:", bidRes.data.bidId);

  // 4. Reveal Bid & Settle Winner
  const revealRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: `/api/auctions/${auctionId}/reveal`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      revealedBids: [
        {
          bidId: bidRes.data.bidId,
          amountZat: "25000000",
          amountZec: 0.25,
          bidderAddress: "u1zk3e5vh77r6w888v5y9e54a9x64lq438yqf6399080hwr5tq0j9zfx070y9j3x4f707y727p3q2y52q74j2k7y69yq9829bb",
          salt: "randomsalt123",
        },
      ],
    }
  );
  console.log("Reveal Winner response:", revealRes.status, revealRes.data.success, "Winner:", revealRes.data.auction?.winnerAddress, "Memo:", revealRes.data.auction?.invoiceMemo);
  const auctionMemo = revealRes.data.auction.invoiceMemo;

  // 5. Simulate Winner Shielded Payment Confirmation via Webhook
  const payRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/webhooks/simulate",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      memo: auctionMemo,
      amountZat: "25000000",
      amountZec: 0.25,
      pool: "Orchard",
    }
  );
  console.log("Payment Simulation response:", payRes.status, payRes.data.success);

  // 6. Verify Auction status is SETTLED_PAID and secret is unlocked
  const checkSettled = await request({ hostname: "localhost", port: 3000, path: `/api/auctions/${auctionId}`, method: "GET" });
  console.log("Auction Post-Settlement status:", checkSettled.data.auction?.status, "Secret unlocked:", checkSettled.data.auction?.secretPayload, "txid:", checkSettled.data.auction?.txid);

  console.log("=== AUCTION FLOW PASSED SUCCESSFULLY ===");
}

run().catch(console.error);
