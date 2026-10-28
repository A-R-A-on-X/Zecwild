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
  Lock,
  Copy,
  Check,
  TrendingUp,
  FileText,
  Trophy,
} from "lucide-react";
import { formatAddress, getBlockExplorerUrl } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface ActivityViewProps {
  onOpenPaymentModal: (item: any, type: "listing" | "auction") => void;
  onOpenUnsealModal: (auction: any) => void;
  onOpenReceiptModal?: (item: any, type: "listing" | "auction") => void;
}

export default function ActivityView({
  onOpenPaymentModal,
  onOpenUnsealModal,
  onOpenReceiptModal,
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
      const res = await fetch(`/api/auctions/${auctionId}/runner-up`, { method: "POST" });
      const data = await res.json();
      alert(data.message || "Runner-up selected!");
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Combine purchased listings & settled won auctions for Buyer Vault
  const settledListings = listings.filter((l) => l.status === "SOLD");
  const settledAuctions = auctions.filter((a) => a.status === "SETTLED_PAID");

  return (
    <div className="space-y-6">
      {/* Sub-navigation Strip (Inspired by Image 1's segmented tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-[#EAE9E4] p-1.5 rounded-full border border-black/[0.04] self-start">
          <button
            onClick={() => setSubTab("seller")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              subTab === "seller"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            Seller Management View
          </button>
          <button
            onClick={() => setSubTab("buyer")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              subTab === "buyer"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            Buyer Vault ({settledListings.length + settledAuctions.length})
          </button>
          <button
            onClick={() => setSubTab("audits")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              subTab === "audits"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            Shielded Audit Trail
          </button>
        </div>

        <div className="text-xs text-[#949089] font-mono ml-auto hidden sm:block">
          Active: <strong className="text-[#1A1816]">{profile.name}</strong> ({formatAddress(profile.address, 6, 4)})
        </div>
      </div>

      {/* SELLER VIEW */}
      {subTab === "seller" && (
        <div className="space-y-6">
          {/* Marketplace Orders */}
          <div className="card-static p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1A1816] flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#D96522]" />
                <span>Marketplace Listings (Fulfillment & Settlement)</span>
              </h3>
              <span className="text-xs text-[#949089]">
                {listings.length} item{listings.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <img src={l.imageUrl} alt={l.title} className="w-14 h-14 rounded-xl object-cover border border-black/[0.06]" />
                    <div>
                      <div className="font-bold text-sm text-[#1A1816]">{l.title}</div>
                      <div className="text-xs text-[#66635F] flex items-center space-x-2 mt-1">
                        <span className="font-mono text-[#D96522] font-black">{l.priceZec} ZEC</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-full border border-black/[0.05]">
                          {l.invoiceMemo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        l.status === "SOLD"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {l.status}
                    </span>

                    {/* View Receipt for Seller */}
                    {l.status === "SOLD" && onOpenReceiptModal && (
                      <button
                        onClick={() => onOpenReceiptModal(l, "listing")}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* Physical Goods Fulfillment Action */}
                    {l.itemType === "PHYSICAL" && l.status === "SOLD" && (
                      <div className="flex items-center space-x-2">
                        {l.shippingStatus === "SHIPPED" ? (
                          <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
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
                              className="px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono text-[#1A1816] focus:outline-none focus:border-[#D96522]"
                            />
                            <button
                              onClick={() => handleUpdateShipping(l.id)}
                              disabled={actionLoading === l.id}
                              className="px-3 py-1.5 rounded-xl btn-orange-primary text-xs font-bold transition-all shadow-xs"
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
          <div className="card-static p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1A1816] flex items-center space-x-2">
                <Lock className="w-5 h-5 text-[#D96522]" />
                <span>Sealed Auctions (Close & Reveal Controls)</span>
              </h3>
              <span className="text-xs text-[#949089]">
                {auctions.length} auction{auctions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-3">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <img src={a.imageUrl} alt={a.title} className="w-14 h-14 rounded-xl object-cover border border-black/[0.06]" />
                    <div>
                      <div className="font-bold text-sm text-[#1A1816]">{a.title}</div>
                      <div className="text-xs text-[#66635F] flex items-center space-x-2 mt-1">
                        <span className="font-mono text-[#D96522] font-bold">
                          {a.bids?.length || 0} sealed bids
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-full border border-black/[0.05]">
                          Reserve: {a.reservePriceZec} ZEC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        a.status === "SETTLED_PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : a.status === "WINNER_DECLARED"
                          ? "bg-[#FCEFE7] text-[#A7430B]"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {a.status}
                    </span>

                    {/* Receipt for Settled Auction */}
                    {a.status === "SETTLED_PAID" && onOpenReceiptModal && (
                      <button
                        onClick={() => onOpenReceiptModal(a, "auction")}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* Seller Reveal Action */}
                    {a.status === "CLOSED_AWAITING_REVEAL" && (
                      <button
                        onClick={() => onOpenUnsealModal(a)}
                        className="px-4 py-2 rounded-full btn-orange-primary text-xs font-bold flex items-center space-x-1.5 shadow-sm"
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
                        className="px-4 py-2 rounded-full btn-orange-pill text-xs font-bold flex items-center space-x-1.5"
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
        <div className="card-static p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#1A1816] flex items-center space-x-2">
              <Key className="w-5 h-5 text-[#D96522]" />
              <span>Buyer Vault — Unlocked Digital Items & Settlements</span>
            </h3>
            <p className="text-xs text-[#66635F] mt-1">
              Directly unlocked digital keys, licenses, and verified fulfillment records confirmed by the ZecShield Gateway.
            </p>
          </div>

          {settledListings.length === 0 && settledAuctions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-[#66635F] text-xs space-y-2">
              <Package className="w-8 h-8 text-[#949089] mx-auto" />
              <p className="font-bold text-[#1A1816]">No confirmed purchases yet.</p>
              <p>Buy a marketplace listing or win a sealed auction to view your unlocked items and receipts here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Paid Marketplace Listings */}
              {settledListings.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={l.imageUrl} alt={l.title} className="w-12 h-12 rounded-xl object-cover border border-black/[0.06]" />
                      <div>
                        <div className="font-bold text-sm text-[#1A1816]">{l.title}</div>
                        <div className="text-xs text-[#D96522] font-mono font-bold">Paid {l.priceZec} ZEC</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Settled
                      </span>
                      {onOpenReceiptModal && (
                        <button
                          onClick={() => onOpenReceiptModal(l, "listing")}
                          className="px-3 py-1 rounded-full bg-white hover:bg-stone-50 border border-black/[0.08] text-xs font-bold text-[#1A1816] flex items-center space-x-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D96522]" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {l.secretPayload && (
                    <div className="p-3.5 rounded-xl bg-white border border-[#D96522]/20 flex items-center justify-between">
                      <div className="font-mono text-xs text-[#C85A17] font-bold truncate max-w-[450px]">
                        {l.secretPayload}
                      </div>
                      <button
                        onClick={() => copyToClipboard(l.secretPayload, l.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FCEFE7] text-[#66635F] hover:text-[#A7430B] transition-colors"
                        title="Copy Secret Key"
                      >
                        {copiedKey === l.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Paid Won Auctions */}
              {settledAuctions.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl bg-[#FCEFE7]/40 border border-[#D96522]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={a.imageUrl} alt={a.title} className="w-12 h-12 rounded-xl object-cover border border-[#D96522]/20" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-[#1A1816]">{a.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Auction Won
                          </span>
                        </div>
                        <div className="text-xs text-[#D96522] font-mono font-bold">
                          Settled {a.winningAmountZec} ZEC
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Paid
                      </span>
                      {onOpenReceiptModal && (
                        <button
                          onClick={() => onOpenReceiptModal(a, "auction")}
                          className="px-3 py-1 rounded-full bg-white hover:bg-stone-50 border border-black/[0.08] text-xs font-bold text-[#1A1816] flex items-center space-x-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D96522]" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {a.secretPayload && (
                    <div className="p-3.5 rounded-xl bg-white border border-[#D96522]/20 flex items-center justify-between">
                      <div className="font-mono text-xs text-[#C85A17] font-bold truncate max-w-[450px]">
                        {a.secretPayload}
                      </div>
                      <button
                        onClick={() => copyToClipboard(a.secretPayload, a.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FCEFE7] text-[#66635F] hover:text-[#A7430B] transition-colors"
                        title="Copy Secret Payload"
                      >
                        {copiedKey === a.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG TRAIL */}
      {subTab === "audits" && (
        <div className="card-static p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#1A1816] flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#D96522]" />
                <span>Shielded Webhook Settlement Log (zechack Indexer)</span>
              </h3>
              <p className="text-xs text-[#66635F] mt-1 font-mono">
                Idempotent on-chain detection logs ensuring double-spend and replay immunity.
              </p>
            </div>
            <a
              href="https://github.com/TheWebDevEhi/zechack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#D96522] hover:underline font-bold flex items-center space-x-1 self-start sm:self-auto"
            >
              <span>zechack Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => {
              const isTestnet = log.memo?.includes("test") || profile.network === "testnet";
              const explorerUrl = getBlockExplorerUrl(log.txid, isTestnet ? "testnet" : "mainnet");
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.05] text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[#66635F]">
                    <span className="text-[#C85A17] font-bold">{log.eventId}</span>
                    <span className="text-[10px] text-[#949089]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[#1A1816]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#949089]">txid:</span>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D96522] font-bold hover:underline flex items-center space-x-1"
                        title="View on Zcash Block Explorer"
                      >
                        <span>{formatAddress(log.txid, 12, 10)}</span>
                        <ExternalLink className="w-3 h-3 text-[#D96522]" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(log.txid, `log_${log.id}`)}
                        className="p-0.5 text-[#949089] hover:text-[#1A1816]"
                        title="Copy TxID"
                      >
                        {copiedKey === `log_${log.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <span className="text-emerald-700 font-bold">
                      {log.amountZec} ZEC ({log.pool || "Ironwood"})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A7430B] font-bold truncate">
                    Memo: {log.memo}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
