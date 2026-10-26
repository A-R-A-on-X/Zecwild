import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memo, amountZat, amountZec, pool = "Orchard" } = body;

    if (!memo) {
      return NextResponse.json(
        { success: false, error: "Memo is required to simulate payment" },
        { status: 400 }
      );
    }

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const simulatedTxid = crypto.randomBytes(32).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000);

    const simulatedPayload = {
      event_id: `evt_sim_${timestamp}_${randomSuffix}`,
      event: "shielded_note.simulated",
      data: {
        note_id: Math.floor(Math.random() * 9000) + 1000,
        key_id: 1,
        txid: simulatedTxid,
        output_index: 0,
        block_height: 4535432,
        block_time: timestamp,
        pool: pool,
        amount_zat: Number(amountZat) || 100000000,
        amount_zec: Number(amountZec) || 1.0,
        transfer_type: "incoming",
        memo: memo,
        is_simulated: true,
        verification_status: "simulated",
      },
      timestamp: timestamp,
    };

    // Forward to our actual webhook handler route internally
    const url = new URL("/api/webhooks/zechack", req.url);
    const webhookRes = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(simulatedPayload),
    });

    const result = await webhookRes.json();
    return NextResponse.json({
      success: true,
      simulatedPayload,
      webhookResult: result,
    });
  } catch (error: any) {
    console.error("Failed to run webhook simulation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed simulation" },
      { status: 500 }
    );
  }
}
