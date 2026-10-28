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

    // Deterministically extract invoice nonce (e.g. "ZECWILD:V1:<invoice_id>")
    const memoMatch = incomingMemo.match(/(ZECWILD:V1:[a-zA-Z0-9_-]+)/i);
    const targetMemo = memoMatch ? memoMatch[1] : incomingMemo;

    // 1. Try finding matching Listing by unique invoiceMemo
    const foundListing = await prisma.listing.findUnique({
      where: { invoiceMemo: targetMemo },
    });

    if (foundListing) {
      if (foundListing.status === "SOLD") {
        console.warn(`[Webhook] Listing ${foundListing.id} is already marked SOLD. Flagged as duplicate payment.`);
        matchedEntityType = "LISTING";
        matchedEntityId = foundListing.id;
      } else {
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
              pool: pool || "Ironwood",
              paidAt: new Date(),
            },
          });
          matchedEntityType = "LISTING";
          matchedEntityId = foundListing.id;
        }
      }
    } else {
      // 2. Try finding matching Auction by unique invoiceMemo
      const foundAuction = await prisma.auction.findUnique({
        where: { invoiceMemo: targetMemo },
      });

      if (foundAuction) {
        if (foundAuction.status === "SETTLED_PAID") {
          console.warn(`[Webhook] Auction ${foundAuction.id} is already marked SETTLED_PAID.`);
          matchedEntityType = "AUCTION";
          matchedEntityId = foundAuction.id;
        } else {
          const paidZat = BigInt(amount_zat || 0);
          const requiredZat = BigInt(foundAuction.winningAmountZat || 0);

          if (paidZat >= requiredZat) {
            await prisma.auction.update({
              where: { id: foundAuction.id },
              data: {
                status: "SETTLED_PAID",
                txid: txid || "simulated_shielded_txid",
                pool: pool || "Ironwood",
                paidAt: new Date(),
              },
            });
            matchedEntityType = "AUCTION";
            matchedEntityId = foundAuction.id;
          }
        }
      }
    }

    // 3. Record Audit Log for Replay Protection
    await prisma.settlementLog.create({
      data: {
        eventId: event_id,
        txid: txid || "unknown_txid",
        outputIndex: typeof output_index === "number" ? output_index : null,
        pool: pool || "Ironwood",
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
