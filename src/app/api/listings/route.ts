import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isShieldedAddress, zecToZat, generateInvoiceMemo } from "@/lib/crypto/zcash";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        itemType: true,
        priceZec: true,
        priceZat: true,
        sellerAddress: true,
        status: true,
        invoiceMemo: true,
        txid: true,
        pool: true,
        paidAt: true,
        shippingStatus: true,
        shippingTracking: true,
        createdAt: true,
        // Exclude secretPayload from public listing overview
      },
    });
    return NextResponse.json({ success: true, listings });
  } catch (error: any) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
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
      priceZec,
      sellerAddress,
      sellerIdentityPubkey,
    } = body;

    // Strict validation
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!priceZec || typeof priceZec !== "number" || priceZec <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be a positive number in ZEC" },
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

    const type = itemType === "PHYSICAL" ? "PHYSICAL" : "DIGITAL";
    if (type === "DIGITAL" && (!secretPayload || typeof secretPayload !== "string")) {
      return NextResponse.json(
        { success: false, error: "Digital items must include a secret payload / download link" },
        { status: 400 }
      );
    }

    const priceZat = zecToZat(priceZec);
    const invoiceMemo = generateInvoiceMemo("ZECWILD:V1");

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        imageUrl: imageUrl?.trim() || "/images/placeholder.svg",
        itemType: type,
        secretPayload: type === "DIGITAL" ? secretPayload.trim() : null,
        priceZec,
        priceZat,
        sellerAddress: sellerAddress.trim(),
        sellerIdentityPubkey: sellerIdentityPubkey || null,
        status: "AVAILABLE",
        invoiceMemo,
        shippingStatus: type === "PHYSICAL" ? "PENDING_SHIPMENT" : "NOT_APPLICABLE",
      },
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create listing" },
      { status: 500 }
    );
  }
}
