import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Security: Only expose secretPayload if item is confirmed SOLD
    const sanitized = {
      ...listing,
      secretPayload: listing.status === "SOLD" ? listing.secretPayload : null,
      isSecretUnlocked: listing.status === "SOLD",
    };

    return NextResponse.json({ success: true, listing: sanitized });
  } catch (error: any) {
    console.error("Failed to fetch listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, shippingStatus, shippingTracking } = body;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (action === "update_shipping") {
      const updated = await prisma.listing.update({
        where: { id },
        data: {
          shippingStatus: shippingStatus || listing.shippingStatus,
          shippingTracking: shippingTracking || listing.shippingTracking,
        },
      });
      return NextResponse.json({ success: true, listing: updated });
    }

    if (action === "cancel") {
      if (listing.status === "SOLD") {
        return NextResponse.json(
          { success: false, error: "Cannot cancel a sold listing" },
          { status: 400 }
        );
      }
      const updated = await prisma.listing.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ success: true, listing: updated });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Failed to update listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update listing" },
      { status: 500 }
    );
  }
}
