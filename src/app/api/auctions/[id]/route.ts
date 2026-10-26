import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();

    let auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        bids: {
          select: {
            id: true,
            commitmentHash: true,
            sealedCiphertext: true,
            revealed: true,
            revealedAmountZec: true,
            revealedAmountZat: true,
            revealedBidderAddress: true,
            rank: true,
            isWinner: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: "Auction not found" },
        { status: 404 }
      );
    }

    // Auto-advance if deadline passed
    if (auction.status === "OPEN" && auction.endTime.getTime() <= now.getTime()) {
      auction = await prisma.auction.update({
        where: { id },
        data: { status: "CLOSED_AWAITING_REVEAL" },
        include: {
          bids: {
            select: {
              id: true,
              commitmentHash: true,
              sealedCiphertext: true,
              revealed: true,
              revealedAmountZec: true,
              revealedAmountZat: true,
              revealedBidderAddress: true,
              rank: true,
              isWinner: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // Security check: While OPEN, do NOT expose bid ciphertexts to general public
    // Only return the count of bids
    const isOpen = auction.status === "OPEN";
    const sanitizedBids = isOpen
      ? []
      : auction.bids.map((b) => ({
          ...b,
          // If revealed, bidder details are visible; if awaiting reveal, ciphertexts are available for seller to unseal
          revealedAmountZec: b.revealed ? b.revealedAmountZec : null,
          revealedBidderAddress: b.revealed ? b.revealedBidderAddress : null,
        }));

    const result = {
      ...auction,
      secretPayload: auction.status === "SETTLED_PAID" ? auction.secretPayload : null,
      isSecretUnlocked: auction.status === "SETTLED_PAID",
      bidsCount: auction.bids.length,
      bids: sanitizedBids,
    };

    return NextResponse.json({ success: true, auction: result });
  } catch (error: any) {
    console.error("Failed to fetch auction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch auction" },
      { status: 500 }
    );
  }
}
