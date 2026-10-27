import http from "node:http";

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
  console.log("=== STARTING FULL SUITE TESTS ===");

  // 1. GET /api/listings
  const l1 = await request({ hostname: "localhost", port: 3000, path: "/api/listings", method: "GET" });
  console.log("1. GET /api/listings:", l1.status, "Count:", l1.data.listings?.length);

  // 2. GET /api/auctions
  const a1 = await request({ hostname: "localhost", port: 3000, path: "/api/auctions", method: "GET" });
  console.log("2. GET /api/auctions:", a1.status, "Count:", a1.data.auctions?.length);

  // 3. GET /api/settlements
  const s1 = await request({ hostname: "localhost", port: 3000, path: "/api/settlements", method: "GET" });
  console.log("3. GET /api/settlements:", s1.status, "Logs count:", s1.data.logs?.length);

  // 4. Test Single Listing Retrieval
  if (l1.data.listings?.length > 0) {
    const first = l1.data.listings[0];
    const single = await request({ hostname: "localhost", port: 3000, path: `/api/listings/${first.id}`, method: "GET" });
    console.log("4. GET /api/listings/[id]:", single.status, "Found:", single.data.listing?.title, "isSecretUnlocked:", single.data.listing?.isSecretUnlocked);
  }

  // 5. Test Single Auction Retrieval
  if (a1.data.auctions?.length > 0) {
    const firstA = a1.data.auctions[0];
    const singleA = await request({ hostname: "localhost", port: 3000, path: `/api/auctions/${firstA.id}`, method: "GET" });
    console.log("5. GET /api/auctions/[id]:", singleA.status, "Found:", singleA.data.auction?.title, "Status:", singleA.data.auction?.status);
  }

  // 6. Test Webhook Simulation
  const availableListing = l1.data.listings?.find(l => l.status === "AVAILABLE");
  if (availableListing) {
    console.log("6. Testing Webhook simulation for listing:", availableListing.title, "Memo:", availableListing.invoiceMemo);
    const simRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/simulate",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        memo: availableListing.invoiceMemo,
        amountZat: availableListing.priceZat,
        amountZec: availableListing.priceZec,
        pool: "Orchard",
      }
    );
    console.log("   Simulation response:", simRes.status, simRes.data.success);

    // Verify listing is now SOLD and secret is unlocked
    const checkSold = await request({ hostname: "localhost", port: 3000, path: `/api/listings/${availableListing.id}`, method: "GET" });
    console.log("   Post-simulation listing status:", checkSold.data.listing?.status, "Secret revealed:", !!checkSold.data.listing?.secretPayload, "txid:", checkSold.data.listing?.txid);
  }

  console.log("=== TESTS COMPLETE ===");
}

run().catch(console.error);
