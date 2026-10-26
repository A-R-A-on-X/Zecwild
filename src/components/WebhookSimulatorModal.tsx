"use client";

import React, { useState, useEffect } from "react";
import { X, Zap, RefreshCw, CheckCircle2, Shield, AlertCircle, ArrowRight } from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";

interface WebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWebhookFired?: () => void;
}

export default function WebhookSimulatorModal({
  isOpen,
  onClose,
  onWebhookFired,
}: WebhookSimulatorModalProps) {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isFiring, setIsFiring] = useState(false);
  const [responseLog, setResponseLog] = useState<any | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const [listRes, auctRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/auctions"),
      ]);
      const listData = await listRes.json();
      const auctData = await auctRes.json();

      const items: any[] = [];
      if (listData.listings) {
        listData.listings
          .filter((l: any) => l.status === "AVAILABLE")
          .forEach((l: any) => {
            items.push({
              type: "Listing",
              id: l.id,
              title: l.title,
              memo: l.invoiceMemo,
              amountZec: l.priceZec,
              amountZat: l.priceZat,
              sellerAddress: l.sellerAddress,
              status: l.status,
            });
          });
      }

      if (auctData.auctions) {
        auctData.auctions
          .filter((a: any) => a.status === "WINNER_DECLARED" && a.invoiceMemo)
          .forEach((a: any) => {
            items.push({
              type: "Auction",
              id: a.id,
              title: a.title,
              memo: a.invoiceMemo,
              amountZec: a.winningAmountZec,
              amountZat: a.winningAmountZat,
              sellerAddress: a.sellerAddress,
              status: a.status,
            });
          });
      }

      setPendingItems(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
      }
    } catch (e) {
      console.error("Failed to fetch pending items for simulation:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPending();
      setResponseLog(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFireWebhook = async () => {
    if (!selectedItem) return;
    setIsFiring(true);
    setResponseLog(null);

    try {
      const res = await fetch("/api/webhooks/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo: selectedItem.memo,
          amountZat: selectedItem.amountZat,
          amountZec: selectedItem.amountZec,
          pool: "Orchard",
        }),
      });

      const data = await res.json();
      setResponseLog(data);
      if (onWebhookFired) onWebhookFired();
      fetchPending();
    } catch (err: any) {
      setResponseLog({ error: err.message || "Simulation request failed" });
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-amber-500/40 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>ZecShield Gateway Webhook Testbed</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Dev Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Simulates real-time shielded note events from the zechack indexer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select Pending Invoice to Settle:
            </label>
            <button
              onClick={fetchPending}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
              No pending listings or winning auctions currently awaiting payment.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    selectedItem?.id === item.id
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                      <span className="font-semibold text-sm truncate max-w-[260px]">{item.title}</span>
                    </div>
                    <div className="font-mono text-xs text-amber-300/80 mt-1">
                      Memo: {item.memo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-white">{item.amountZec} ZEC</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.amountZat} zat</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleFireWebhook}
            disabled={isFiring || !selectedItem}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isFiring ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Dispatching Webhook from Indexer...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Simulate Shielded Payment Confirmation</span>
              </>
            )}
          </button>

          {/* Response Inspector */}
          {responseLog && (
            <div className="p-3.5 rounded-xl bg-black/90 border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
                <span>Webhook Ingestion Log & Response:</span>
                <span className="text-emerald-400">200 OK</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
