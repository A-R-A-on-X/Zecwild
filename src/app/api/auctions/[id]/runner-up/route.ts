import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInvoiceMemo } from "@/lib/crypto/zcash";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        bids: {
          where: { revealed: true },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: "Auction not found" },
        { status: 404 }
      );
    }

    if (auction.status !== "WINNER_DECLARED") {
      return NextResponse.json(
        {
          success: false,
          error: "Runner-up can only be selected when an unpaid winner is declared",
        },
        { status: 400 }
      );
    }

    // Find current winner rank
    const currentWinnerBid = auction.bids.find((b) => b.id === auction.winnerBidId);
    const currentRank = currentWinnerBid?.rank || 1;

    // Find next bidder
    const runnerUp = auction.bids.find((b) => b.rank === currentRank + 1);

    if (!runnerUp) {
      // No more bidders available
      await prisma.auction.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({
        success: true,
        message: "No runner-up available. Auction has been marked cancelled/relistable.",
        hasRunnerUp: false,
      });
    }

    // Unset old winner flag and set new winner flag
    await prisma.bid.update({
      where: { id: currentWinnerBid?.id },
      data: { isWinner: false },
    });
    await prisma.bid.update({
      where: { id: runnerUp.id },
      data: { isWinner: true },
    });

    // Generate new settlement invoice memo for runner-up
    const invoiceMemo = generateInvoiceMemo("ZECWILD:V1");
    const paymentDeadline = new Date(Date.now() + 6 * 3600 * 1000);

    const updated = await prisma.auction.update({
      where: { id },
      data: {
        winnerBidId: runnerUp.id,
        winnerAddress: runnerUp.revealedBidderAddress,
        winningAmountZec: runnerUp.revealedAmountZec,
        winningAmountZat: runnerUp.revealedAmountZat,
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
      message: `Runner-up (Rank ${runnerUp.rank}) selected! Fresh invoice generated.`,
      auction: updated,
      hasRunnerUp: true,
    });
  } catch (error: any) {
    console.error("Failed to select runner-up:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to select runner-up" },
      { status: 500 }
    );
  }
}
