import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isShieldedAddress, zecToZat } from "@/lib/crypto/zcash";

export async function GET() {
  try {
    const now = new Date();

    // Auto-advance any open auctions whose deadline has passed to CLOSED_AWAITING_REVEAL
    await prisma.auction.updateMany({
      where: {
        status: "OPEN",
        endTime: { lte: now },
      },
      data: {
        status: "CLOSED_AWAITING_REVEAL",
      },
    });

    const auctions = await prisma.auction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bids: {
          select: {
            id: true,
            commitmentHash: true,
            sealedCiphertext: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    });

    // Sanitize: Do not expose secretPayload until settled and paid
    const sanitized = auctions.map((a) => ({
      ...a,
      secretPayload: a.status === "SETTLED_PAID" ? a.secretPayload : null,
      bids: a.bids || [],
      bidsCount: a._count.bids,
      _count: undefined,
    }));

    return NextResponse.json({ success: true, auctions: sanitized });
  } catch (error: any) {
    console.error("Failed to fetch auctions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      itemType,
      secretPayload,
      reservePriceZec,
      sellerAddress,
      sellerIdentityPubkey,
      sealingPublicKey,
      durationMinutes,
      endTime: customEndTime,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Auction title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!sellerAddress || !isShieldedAddress(sellerAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid shielded Zcash address (Orchard u1... or Sapling zs1...) is required",
        },
        { status: 400 }
      );
    }

    if (!sealingPublicKey || typeof sealingPublicKey !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Auction sealing public key is required for client-side cryptographic sealing",
        },
        { status: 400 }
      );
    }

    // Determine end time
    let endTimeDate: Date;
    if (customEndTime) {
      endTimeDate = new Date(customEndTime);
    } else {
      const minutes = typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : 15;
      endTimeDate = new Date(Date.now() + minutes * 60 * 1000);
    }

    if (endTimeDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: "Auction end time must be in the future" },
        { status: 400 }
      );
    }

    const type = itemType === "PHYSICAL" ? "PHYSICAL" : "DIGITAL";
    const reserveZec = typeof reservePriceZec === "number" && reservePriceZec >= 0 ? reservePriceZec : 0;
    const reserveZat = zecToZat(reserveZec);

    const auction = await prisma.auction.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        imageUrl: imageUrl?.trim() || "/images/placeholder.svg",
        itemType: type,
        secretPayload: type === "DIGITAL" && secretPayload ? secretPayload.trim() : null,
        reservePriceZec: reserveZec,
        reservePriceZat: reserveZat,
        sellerAddress: sellerAddress.trim(),
        sellerIdentityPubkey: sellerIdentityPubkey || null,
        sealingPublicKey: sealingPublicKey.trim(),
        endTime: endTimeDate,
        status: "OPEN",
        shippingStatus: type === "PHYSICAL" ? "PENDING_SHIPMENT" : "NOT_APPLICABLE",
      },
    });

    return NextResponse.json({ success: true, auction }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create auction:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create auction" },
      { status: 500 }
    );
  }
}
