import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeSha256 } from "@/lib/crypto/sealing";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { sealedCiphertext, commitmentHash } = body;

    if (!sealedCiphertext || typeof sealedCiphertext !== "string") {
      return NextResponse.json(
        { success: false, error: "sealedCiphertext is required" },
        { status: 400 }
      );
    }

    if (!commitmentHash || typeof commitmentHash !== "string") {
      return NextResponse.json(
        { success: false, error: "commitmentHash is required" },
        { status: 400 }
      );
    }

    // Cryptographic validation: Verify commitment hash integrity
    const computedHash = await computeSha256(sealedCiphertext);
    if (computedHash.toLowerCase() !== commitmentHash.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Commitment hash mismatch! Ciphertext integrity compromised.",
        },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: "Auction not found" },
        { status: 404 }
      );
    }

    if (auction.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: `Auction is not open for bidding (Status: ${auction.status})` },
        { status: 400 }
      );
    }

    if (auction.endTime.getTime() <= Date.now()) {
      // Mark closed
      await prisma.auction.update({
        where: { id },
        data: { status: "CLOSED_AWAITING_REVEAL" },
      });
      return NextResponse.json(
        { success: false, error: "Auction deadline has passed" },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.create({
      data: {
        auctionId: id,
        commitmentHash: computedHash,
        sealedCiphertext,
        revealed: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sealed bid accepted cryptographically",
        bidId: bid.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to submit bid:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit sealed bid" },
      { status: 500 }
    );
  }
}
