"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  Key,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  Truck,
  RotateCcw,
  Unlock,
  Copy,
  Check,
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface ActivityViewProps {
  onOpenPaymentModal: (item: any, type: "listing" | "auction") => void;
  onOpenUnsealModal: (auction: any) => void;
}

export default function ActivityView({
  onOpenPaymentModal,
  onOpenUnsealModal,
}: ActivityViewProps) {
  const [profile, setProfile] = useState(getActiveProfile());
  const [subTab, setSubTab] = useState<"seller" | "buyer" | "audits">("seller");
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getActiveProfile());
    const handler = (e: any) => {
      if (e.detail) setProfile(e.detail);
    };
    window.addEventListener("zecwild_profile_changed", handler);
    return () => window.removeEventListener("zecwild_profile_changed", handler);
  }, []);

  const fetchData = async () => {
    try {
      const [listRes, auctRes, logRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/auctions"),
        fetch("/api/settlements"),
      ]);
      const listData = await listRes.json();
      const auctData = await auctRes.json();
      const logData = await logRes.json();

      if (listData.listings) setListings(listData.listings);
      if (auctData.auctions) setAuctions(auctData.auctions);
      if (logData.logs) setLogs(logData.logs);
    } catch (e) {
      console.error("Failed to fetch activity:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateShipping = async (listingId: string) => {
    const tracking = trackingInputs[listingId];
    setActionLoading(listingId);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_shipping",
          shippingStatus: "SHIPPED",
          shippingTracking: tracking || "USPS-ZEC-TRACK-99824",
        }),
      });
      fetchData();
    } catch (e) {
      console.error("Failed to update shipping:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectRunnerUp = async (auctionId: string) => {
    setActionLoading(auctionId);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/runner-up`, {
        method: "POST",
      });
      const data = await res.json();
      alert(data.message || "Runner-up selected!");
      fetchData();
    } catch (e) {
      console.error("Failed to select runner-up:", e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubTab("seller")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            subTab === "seller"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Seller Management View
        </button>
        <button
          onClick={() => setSubTab("buyer")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            subTab === "buyer"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Buyer Unlocked Vault
        </button>
        <button
          onClick={() => setSubTab("audits")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            subTab === "audits"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Shielded Settlement Audit Trail
        </button>
      </div>

      {/* SELLER VIEW */}
      {subTab === "seller" && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Marketplace Listings (Fulfillment & Settlement)</span>
            </h3>

            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <img src={l.imageUrl} alt={l.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <div className="font-semibold text-sm text-slate-100">{l.title}</div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-emerald-400 font-bold">{l.priceZec} ZEC</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{l.invoiceMemo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        l.status === "SOLD"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {l.status}
                    </span>

                    {/* Physical Goods Fulfillment Action */}
                    {l.itemType === "PHYSICAL" && l.status === "SOLD" && (
                      <div className="flex items-center space-x-2">
                        {l.shippingStatus === "SHIPPED" ? (
                          <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Shipped ({l.shippingTracking || "Tracked"})</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              placeholder="Tracking Code"
                              value={trackingInputs[l.id] || ""}
                              onChange={(e) =>
                                setTrackingInputs({ ...trackingInputs, [l.id]: e.target.value })
                              }
                              className="px-2 py-1 rounded bg-black/60 border border-slate-700 text-xs font-mono text-white"
                            />
                            <button
                              onClick={() => handleUpdateShipping(l.id)}
                              disabled={actionLoading === l.id}
                              className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                            >
                              Dispatch
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sealed Auctions Seller Controls */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Sealed Auctions (Close & Reveal Controls)</span>
            </h3>

            <div className="space-y-3">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <img src={a.imageUrl} alt={a.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <div className="font-semibold text-sm text-slate-100">{a.title}</div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="text-amber-400 font-mono font-bold">
                          {a.bidsCount} Sealed Bids Received
                        </span>
                        <span>•</span>
                        <span>Status: {a.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Unseal Button if Closed Awaiting Reveal */}
                    {a.status === "CLOSED_AWAITING_REVEAL" && (
                      <button
                        onClick={() => onOpenUnsealModal(a)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unseal & Reveal Winner</span>
                      </button>
                    )}

                    {/* Defaulted Winner Fallback: Select Runner-Up */}
                    {a.status === "WINNER_DECLARED" && (
                      <button
                        onClick={() => handleSelectRunnerUp(a.id)}
                        disabled={actionLoading === a.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center space-x-1.5"
                        title="If winning bidder defaults or does not pay, offer to the next highest bidder"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Select Runner-Up</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BUYER UNLOCKED VAULT */}
      {subTab === "buyer" && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Unlocked Digital Items & Confirmed Purchases</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Items unlocked automatically once your shielded ZEC payment is confirmed by the indexer.
          </p>

          <div className="space-y-3">
            {listings
              .filter((l) => l.status === "SOLD")
              .map((l) => (
                <div key={l.id} className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={l.imageUrl} alt={l.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold text-sm text-slate-100">{l.title}</div>
                        <div className="text-xs text-emerald-400 font-mono">Paid {l.priceZec} ZEC</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      Settled
                    </span>
                  </div>

                  {l.secretPayload && (
                    <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/20 flex items-center justify-between">
                      <div className="font-mono text-xs text-emerald-200 truncate max-w-[450px]">
                        {l.secretPayload}
                      </div>
                      <button
                        onClick={() => copyToClipboard(l.secretPayload, l.id)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        {copiedKey === l.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TRAIL */}
      {subTab === "audits" && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Shielded Webhook Settlement Log (zechack Indexer)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-mono">
            Idempotent on-chain detection logs ensuring double-spend and replay immunity.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-cyan-300 font-bold">{log.eventId}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="truncate max-w-[340px] text-slate-300">
                    txid: {formatAddress(log.txid, 12, 10)}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {log.amountZec} ZEC ({log.pool || "Orchard"})
                  </span>
                </div>
                <div className="text-[11px] text-amber-300/90 truncate">
                  Memo: {log.memo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
