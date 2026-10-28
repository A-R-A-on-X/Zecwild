"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  Clock,
  Key,
  Package,
  Trophy,
  Unlock,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface SealedAuctionsViewProps {
  auctions: any[];
  onOpenBidModal: (auction: any) => void;
  onOpenUnsealModal: (auction: any) => void;
  onOpenPaymentModal: (item: any) => void;
  onOpenReceiptModal?: (auction: any) => void;
  openCreateModal: () => void;
  refreshData: () => void;
}

export default function SealedAuctionsView({
  auctions,
  onOpenBidModal,
  onOpenUnsealModal,
  onOpenPaymentModal,
  onOpenReceiptModal,
  openCreateModal,
  refreshData,
}: SealedAuctionsViewProps) {
  const profile = getActiveProfile();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      const updated: Record<string, string> = {};

      auctions.forEach((a) => {
        const end = new Date(a.endTime).getTime();
        const diff = end - now;

        if (diff <= 0) {
          if (timeRemaining[a.id] && timeRemaining[a.id] !== "CLOSED" && a.status === "OPEN") {
            refreshData();
            window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
          }
          updated[a.id] = "CLOSED";
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          updated[a.id] = `${hours.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
      });

      setTimeRemaining(updated);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [auctions]);

  const handleSelectRunnerUp = async (auctionId: string) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/runner-up`, { method: "POST" });
      const data = await res.json();
      alert(data.message || "Runner-up selected!");
      refreshData();
      window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Strip & Launch Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cryptographically Sealed Auctions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bids are client-side encrypted using the auction’s RSA-2048 public key. Zero information leakage until the timer expires.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Lock className="w-4 h-4" />
          <span>Launch Sealed Auction</span>
        </button>
      </div>

      {/* Grid of Auctions or Empty State */}
      {auctions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] text-[#094ae0] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900">No Sealed Auctions Live</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Launch a sealed-bid auction with client-side cryptographic sealing. Zero bid values or identities are revealed until the reveal period.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>Launch First Auction</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => {
            const timer = timeRemaining[auction.id] || "...";
            const isClosed = timer === "CLOSED" || auction.status !== "OPEN";
            const isAwaitingReveal = auction.status === "CLOSED_AWAITING_REVEAL";
            const isWinnerDeclared = auction.status === "WINNER_DECLARED";
            const isSettled = auction.status === "SETTLED_PAID";

            return (
              <div
                key={auction.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-[#094ae0]/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Media Container */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                    {/* Top Status & Type Badges */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-slate-900 shadow-sm flex items-center space-x-1">
                        {auction.itemType === "DIGITAL" ? (
                          <>
                            <Key className="w-3 h-3 text-[#094ae0]" />
                            <span>Digital</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 text-[#094ae0]" />
                            <span>Physical</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Countdown Timer Pill */}
                    <div className="absolute top-3 right-3">
                      <div
                        className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md shadow-sm ${
                          isClosed
                            ? "bg-black/60 text-slate-300"
                            : "bg-[#EEF4FF]/95 text-[#094ae0] border border-[#094ae0]/30"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{timer}</span>
                      </div>
                    </div>

                    {/* Bottom Sealed Bids Counter Pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-white flex items-center space-x-1.5">
                        <Lock className="w-3 h-3 text-[#094ae0]" />
                        <span>{auction.bids?.length || 0} Sealed Bids</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
                        Reserve: {auction.reservePriceZec} ZEC
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
                      <span>Shielded Sealed Drop</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#094ae0]" />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-[#094ae0] transition-colors">
                      {auction.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {auction.description || "Shielded peer-to-peer sealed auction with zero knowledge of bids."}
                    </p>

                    {/* Public Key Fingerprint */}
                    <div className="pt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <span className="flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-[#094ae0]" />
                          <span>Public Sealing Key</span>
                        </span>
                        <span className="text-[#094ae0] font-bold">RSA-2048</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 truncate">
                        {auction.sealingPublicKey?.slice(0, 42)}...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Status 1: OPEN -> Place Bid */}
                    {!isClosed && (
                      <button
                        onClick={() => onOpenBidModal(auction)}
                        className="w-full py-2.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Place Cryptographically Sealed Bid</span>
                      </button>
                    )}

                    {/* Status 2: Awaiting Reveal -> Unseal Bids */}
                    {isAwaitingReveal && (
                      <button
                        onClick={() => onOpenUnsealModal(auction)}
                        className="w-full py-2.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unseal Bids & Declare Winner</span>
                      </button>
                    )}

                    {/* Status 3: Winner Declared -> Settle Payment or Select Runner-Up */}
                    {isWinnerDeclared && (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-[#EEF4FF] border border-[#094ae0]/20 text-xs">
                          <div className="flex items-center justify-between text-[#094ae0] font-bold">
                            <span>🏆 Winner Declared</span>
                            <span className="font-mono text-sm font-black">{auction.winningAmountZec} ZEC</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-600 truncate mt-0.5">
                            {formatAddress(auction.winnerAddress || "", 12, 8)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() =>
                              onOpenPaymentModal({
                                id: auction.id,
                                title: auction.title,
                                imageUrl: auction.imageUrl,
                                itemType: auction.itemType,
                                priceZec: auction.winningAmountZec,
                                priceZat: auction.winningAmountZat,
                                sellerAddress: auction.sellerAddress,
                                invoiceMemo: auction.invoiceMemo,
                                status: auction.status,
                                secretPayload: auction.secretPayload,
                                txid: auction.txid,
                              })
                            }
                            className="py-2.5 px-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all"
                          >
                            <span>Settle Payment</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSelectRunnerUp(auction.id)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
                            title="If winner fails to settle within window, pick the next highest sealed bidder"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Pick Runner-Up</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status 4: Settled / Paid */}
                    {isSettled && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Settled & Finalized</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onOpenReceiptModal) {
                              onOpenReceiptModal(auction);
                            } else {
                              onOpenPaymentModal(auction);
                            }
                          }}
                          className="text-[11px] text-[#094ae0] font-bold hover:underline"
                        >
                          View Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
