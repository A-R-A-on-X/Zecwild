"use client";

import React, { useState, useEffect } from "react";
import { X, Zap, RefreshCw, CheckCircle2, Shield, AlertCircle, ArrowRight, Layers, Globe } from "lucide-react";
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
  const [selectedPool, setSelectedPool] = useState<"Ironwood" | "Orchard" | "Sapling">("Ironwood");
  const [selectedNetwork, setSelectedNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [isFiring, setIsFiring] = useState(false);
  const [responseLog, setResponseLog] = useState<any | null>(null);

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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
          pool: selectedPool,
          network: selectedNetwork,
        }),
      });

      const data = await res.json();
      setResponseLog(data);
      if (onWebhookFired) onWebhookFired();
      window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
      fetchPending();
    } catch (err: any) {
      setResponseLog({ error: err.message || "Simulation request failed" });
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white border border-black/[0.08] p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] space-y-4 text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCEFE7] text-[#D96522] flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1A1816]">
                  ZecShield Gateway Testbed
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FCEFE7] text-[#A7430B] font-mono font-bold">
                  Ironwood & Testnet Ready
                </span>
              </div>
              <p className="text-xs text-[#66635F]">
                Simulates real-time shielded note events from the zechack indexer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#949089] hover:text-[#1A1816] hover:bg-black/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & Pool Configurations Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06]">
          {/* Network Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#949089] flex items-center space-x-1">
              <Globe className="w-3 h-3 text-[#D96522]" />
              <span>Zcash Network</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedNetwork("testnet")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedNetwork === "testnet"
                    ? "bg-[#FCEFE7] border border-[#D96522]/30 text-[#A7430B] shadow-xs"
                    : "bg-white border border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
              >
                🧪 Testnet
              </button>
              <button
                type="button"
                onClick={() => setSelectedNetwork("mainnet")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedNetwork === "mainnet"
                    ? "bg-[#FCEFE7] border border-[#D96522]/30 text-[#A7430B] shadow-xs"
                    : "bg-white border border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
              >
                🔒 Mainnet
              </button>
            </div>
          </div>

          {/* Shielded Pool Selector (Ironwood / Orchard / Sapling) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#949089] flex items-center space-x-1">
              <Layers className="w-3 h-3 text-[#D96522]" />
              <span>Shielded Privacy Pool</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setSelectedPool("Ironwood")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  selectedPool === "Ironwood"
                    ? "bg-[#D96522] text-white shadow-xs"
                    : "bg-white border border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
                title="Active NU6.3 shielded privacy pool with corrected circuit"
              >
                🌲 Ironwood
              </button>
              <button
                type="button"
                onClick={() => setSelectedPool("Orchard")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  selectedPool === "Orchard"
                    ? "bg-[#D96522] text-white shadow-xs"
                    : "bg-white border border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
                title="Legacy Orchard pool (Migration turnstile)"
              >
                Orchard
              </button>
              <button
                type="button"
                onClick={() => setSelectedPool("Sapling")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  selectedPool === "Sapling"
                    ? "bg-[#D96522] text-white shadow-xs"
                    : "bg-white border border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
                title="Sapling shielded pool"
              >
                Sapling
              </button>
            </div>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1A1816] uppercase tracking-wider">
              Pending Shielded Invoices:
            </label>
            <button
              onClick={fetchPending}
              className="text-xs text-[#D96522] hover:text-[#A7430B] font-bold flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-[#66635F] text-xs">
              No pending listings or winning auctions currently awaiting payment. Create a listing or declare an auction winner to test note settlement.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    selectedItem?.id === item.id
                      ? "bg-[#FCEFE7] border-[#D96522]/30 text-[#1A1816] shadow-xs"
                      : "bg-[#F8F7F4] border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white border border-black/[0.06] text-[#A7430B]">
                        {item.type}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-[#1A1816] truncate">{item.title}</span>
                    </div>
                    <div className="font-mono text-xs text-[#C85A17] font-semibold mt-1 truncate">
                      Memo: {item.memo}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black font-mono text-[#1A1816]">{item.amountZec} ZEC</div>
                    <div className="text-[10px] text-[#949089] font-mono">{item.amountZat} zat</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleFireWebhook}
            disabled={isFiring || !selectedItem}
            className="w-full py-3 rounded-full btn-orange-primary text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isFiring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Simulating Note on {selectedNetwork.toUpperCase()} ({selectedPool})...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>
                  Simulate {selectedNetwork.toUpperCase()} {selectedPool} Note Confirmation
                </span>
              </>
            )}
          </button>

          {/* Response Inspector */}
          {responseLog && (
            <div className="p-4 rounded-2xl bg-[#1A1816] text-[#F3F2EE] font-mono text-xs space-y-2 border border-black/[0.1]">
              <div className="text-[#949089] font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
                <span>Webhook Ingestion Log & Response:</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <pre className="text-[#F3F2EE] overflow-x-auto text-[11px] leading-relaxed p-1">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
