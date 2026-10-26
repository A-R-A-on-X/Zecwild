import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.settlementLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Failed to fetch settlement logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settlement logs" },
      { status: 500 }
    );
  }
}
