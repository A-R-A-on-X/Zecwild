import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { event_id, event, data } = payload || {};

    if (!event_id || !data) {
      return NextResponse.json(
        { success: false, error: "Missing event_id or data in webhook payload" },
        { status: 400 }
      );
    }

    const {
      txid,
      output_index,
      pool,
      amount_zat,
      amount_zec,
      memo,
      verification_status,
    } = data;

    // 1. Idempotency Check: Prevent duplicate processing of the same event
    const existingLog = await prisma.settlementLog.findUnique({
      where: { eventId: event_id },
    });

    if (existingLog) {
      return NextResponse.json({
        success: true,
        message: "Webhook event already processed (idempotent ACK)",
        alreadyProcessed: true,
      });
    }

    // 2. Extract Memo & Match Entity
    const incomingMemo = typeof memo === "string" ? memo.trim() : "";
    let matchedEntityType: "LISTING" | "AUCTION" | null = null;
    let matchedEntityId: string | null = null;

    // Try finding matching Listing
    const matchingListing = await prisma.listing.findFirst({
      where: {
        OR: [
          { invoiceMemo: incomingMemo },
          // Allow memo to be embedded inside a larger memo string
          { invoiceMemo: { not: "" } },
        ],
      },
    });

    let foundListing = null;
    if (matchingListing && incomingMemo.includes(matchingListing.invoiceMemo)) {
      foundListing = matchingListing;
    } else {
      // Direct query if exact
      foundListing = await prisma.listing.findUnique({
        where: { invoiceMemo: incomingMemo },
      });
    }

    if (foundListing) {
      // Validate payment amount (strict Zatoshis check)
      const paidZat = BigInt(amount_zat || 0);
      const requiredZat = BigInt(foundListing.priceZat || 0);

      if (paidZat < requiredZat) {
        console.warn(
          `[Webhook] Underpayment detected for listing ${foundListing.id}: received ${paidZat} zat, required ${requiredZat} zat`
        );
      } else {
        // Atomic status transition to SOLD
        await prisma.listing.update({
          where: { id: foundListing.id },
          data: {
            status: "SOLD",
            txid: txid || "simulated_shielded_txid",
            pool: pool || "Orchard",
            paidAt: new Date(),
          },
        });
        matchedEntityType = "LISTING";
        matchedEntityId = foundListing.id;
      }
    } else {
      // Check if it's an Auction settlement
      const matchingAuction = await prisma.auction.findFirst({
        where: {
          invoiceMemo: { not: null },
        },
      });

      let foundAuction = null;
      if (matchingAuction && matchingAuction.invoiceMemo && incomingMemo.includes(matchingAuction.invoiceMemo)) {
        foundAuction = matchingAuction;
      } else if (incomingMemo) {
        foundAuction = await prisma.auction.findUnique({
          where: { invoiceMemo: incomingMemo },
        });
      }

      if (foundAuction) {
        const paidZat = BigInt(amount_zat || 0);
        const requiredZat = BigInt(foundAuction.winningAmountZat || 0);

        if (paidZat >= requiredZat) {
          await prisma.auction.update({
            where: { id: foundAuction.id },
            data: {
              status: "SETTLED_PAID",
              txid: txid || "simulated_shielded_txid",
              pool: pool || "Orchard",
              paidAt: new Date(),
            },
          });
          matchedEntityType = "AUCTION";
          matchedEntityId = foundAuction.id;
        }
      }
    }

    // 3. Record Audit Log for Replay Protection
    await prisma.settlementLog.create({
      data: {
        eventId: event_id,
        txid: txid || "unknown_txid",
        outputIndex: typeof output_index === "number" ? output_index : null,
        pool: pool || "Orchard",
        amountZat: String(amount_zat || "0"),
        amountZec: Number(amount_zec || 0),
        memo: incomingMemo,
        verificationStatus: verification_status || "simulated",
        matchedEntityType,
        matchedEntityId,
        processed: true,
      },
    });

    return NextResponse.json({
      success: true,
      event_id,
      matched: matchedEntityType !== null,
      entityType: matchedEntityType,
      entityId: matchedEntityId,
      message:
        matchedEntityType !== null
          ? `Payment settled for ${matchedEntityType} ${matchedEntityId}`
          : "Webhook received and logged, but no matching invoice memo was open.",
    });
  } catch (error: any) {
    console.error("[Webhook Error] zechack handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
