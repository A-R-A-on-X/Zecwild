import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInvoiceMemo } from "@/lib/crypto/zcash";

interface RevealedBidInput {
  bidId: string;
  amountZat: string;
  amountZec: number;
  bidderAddress: string;
  salt: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { revealedBids } = body as { revealedBids: RevealedBidInput[] };

    if (!Array.isArray(revealedBids) || revealedBids.length === 0) {
      return NextResponse.json(
        { success: false, error: "revealedBids must be a non-empty array" },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: "Auction not found" },
        { status: 404 }
      );
    }

    if (auction.status !== "CLOSED_AWAITING_REVEAL" && auction.status !== "OPEN") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reveal auction in status '${auction.status}'`,
        },
        { status: 400 }
      );
    }

    // Verify all bid IDs belong to this auction
    const bidMap = new Map(auction.bids.map((b) => [b.id, b]));
    for (const rb of revealedBids) {
      if (!bidMap.has(rb.bidId)) {
        return NextResponse.json(
          { success: false, error: `Bid ID ${rb.bidId} does not belong to this auction` },
          { status: 400 }
        );
      }
    }

    // Sort revealed bids descending by exact Zatoshis, tie-breaker: earliest created
    const sorted = [...revealedBids].sort((a, b) => {
      const zatA = BigInt(a.amountZat || "0");
      const zatB = BigInt(b.amountZat || "0");
      if (zatA > zatB) return -1;
      if (zatA < zatB) return 1;
      const timeA = bidMap.get(a.bidId)?.createdAt.getTime() || 0;
      const timeB = bidMap.get(b.bidId)?.createdAt.getTime() || 0;
      return timeA - timeB;
    });

    const reserveZat = BigInt(auction.reservePriceZat || "0");
    const winningBid = sorted[0];
    const isReserveMet = BigInt(winningBid.amountZat) >= reserveZat;

    if (!isReserveMet) {
      // Reserve not met: auction closes without winner
      await prisma.auction.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({
        success: true,
        message: "Auction closed. Highest bid did not meet the reserve price.",
        reserveMet: false,
      });
    }

    // Batch update bids with ranks and winner flag
    for (let index = 0; index < sorted.length; index++) {
      const item = sorted[index];
      await prisma.bid.update({
        where: { id: item.bidId },
        data: {
          revealed: true,
          revealedAmountZat: item.amountZat,
          revealedAmountZec: item.amountZec,
          revealedBidderAddress: item.bidderAddress,
          revealedSalt: item.salt,
          rank: index + 1,
          isWinner: index === 0,
        },
      });
    }

    // Generate settlement invoice memo for winning bidder
    const invoiceMemo = generateInvoiceMemo("auct");
    // 6-hour payment grace period
    const paymentDeadline = new Date(Date.now() + 6 * 3600 * 1000);

    const updatedAuction = await prisma.auction.update({
      where: { id },
      data: {
        status: "WINNER_DECLARED",
        winnerBidId: winningBid.bidId,
        winnerAddress: winningBid.bidderAddress,
        winningAmountZec: winningBid.amountZec,
        winningAmountZat: winningBid.amountZat,
        invoiceMemo,
        paymentDeadline,
      },
      include: {
        bids: {
          orderBy: { rank: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Auction bids unsealed and winner declared successfully!",
      auction: updatedAuction,
    });
  } catch (error: any) {
    console.error("Failed to reveal auction:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reveal auction" },
      { status: 500 }
    );
  }
}
