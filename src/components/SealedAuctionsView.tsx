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
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1816] tracking-tight">
            Cryptographically Sealed Auctions
          </h2>
          <p className="text-xs text-[#66635F] mt-0.5">
            Bids are encrypted in your browser using the auction’s public key. Zero information leakage.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-full btn-orange-primary text-xs font-bold flex items-center space-x-2 self-start sm:self-auto"
        >
          <Lock className="w-4 h-4" />
          <span>Launch Sealed Auction</span>
        </button>
      </div>

      {/* Grid of Auctions */}
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
              className="card-floating overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Media Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-100 p-2">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Top Status & Type Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#1A1816] shadow-sm flex items-center space-x-1">
                        {auction.itemType === "DIGITAL" ? (
                          <>
                            <Key className="w-3 h-3 text-[#D96522]" />
                            <span>Digital</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 text-[#D96522]" />
                            <span>Physical</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Countdown Timer Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <div
                        className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md shadow-sm ${
                          isClosed
                            ? "bg-black/60 text-stone-300"
                            : "bg-[#FCEFE7]/95 text-[#A7430B] border border-[#D96522]/30"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{timer}</span>
                      </div>
                    </div>

                    {/* Bottom Sealed Bids Counter Pill */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white flex items-center space-x-1.5">
                        <Lock className="w-3 h-3 text-[#D96522]" />
                        <span>{auction.bids?.length || 0} Sealed Bids Submitted</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                        Reserve: {auction.reservePriceZec} ZEC
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-2.5">
                  <h3 className="font-bold text-base text-[#1A1816] line-clamp-1 group-hover:text-[#D96522] transition-colors">
                    {auction.title}
                  </h3>
                  <p className="text-xs text-[#66635F] line-clamp-2 leading-relaxed">
                    {auction.description || "Shielded peer-to-peer sealed auction with zero knowledge of bids."}
                  </p>

                  {/* Public Key Fingerprint */}
                  <div className="pt-2 p-2.5 rounded-xl bg-[#F8F7F4] border border-black/[0.04] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#949089] uppercase tracking-wider font-bold">
                      <span className="flex items-center space-x-1">
                        <Shield className="w-3 h-3 text-[#D96522]" />
                        <span>Public Sealing Key</span>
                      </span>
                      <span className="text-emerald-700 font-bold">RSA-2048</span>
                    </div>
                    <div className="font-mono text-[10px] text-[#66635F] truncate">
                      {auction.sealingPublicKey?.slice(0, 42)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-black/[0.05] space-y-2">
                  {/* Status 1: OPEN -> Place Bid */}
                  {!isClosed && (
                    <button
                      onClick={() => onOpenBidModal(auction)}
                      className="w-full py-2.5 rounded-full btn-orange-primary text-xs font-bold transition-all flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Place Cryptographically Sealed Bid</span>
                    </button>
                  )}

                  {/* Status 2: Awaiting Reveal -> Unseal Bids */}
                  {isAwaitingReveal && (
                    <button
                      onClick={() => onOpenUnsealModal(auction)}
                      className="w-full py-2.5 rounded-full btn-orange-primary text-white font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unseal Bids & Declare Winner</span>
                    </button>
                  )}

                  {/* Status 3: Winner Declared -> Settle Payment or Select Runner-Up */}
                  {isWinnerDeclared && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/30 text-xs">
                        <div className="flex items-center justify-between text-[#A7430B] font-bold">
                          <span>🏆 Winner Declared</span>
                          <span className="font-mono text-sm font-black">{auction.winningAmountZec} ZEC</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#66635F] truncate mt-0.5">
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
                          className="py-2.5 px-3 rounded-full btn-orange-primary font-bold text-xs flex items-center justify-center space-x-1"
                        >
                          <span>Settle Payment</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSelectRunnerUp(auction.id)}
                          className="py-2.5 px-3 rounded-full bg-stone-100 hover:bg-stone-200 text-[#1A1816] font-bold text-xs flex items-center justify-center space-x-1"
                          title="If the winning bidder defaults or flakes, offer the item to the runner-up"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Runner-Up</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status 4: Settled & Paid -> With View Settlement Receipt Button */}
                  {isSettled && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-bold flex items-center space-x-1.5">
                          <Trophy className="w-4 h-4 text-emerald-600" />
                          <span>Settled & Paid</span>
                        </span>
                        <span className="font-mono text-emerald-900 font-black text-sm">
                          {auction.winningAmountZec} ZEC
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenReceiptModal) {
                            onOpenReceiptModal(auction);
                          } else {
                            onOpenPaymentModal(auction);
                          }
                        }}
                        className="w-full py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Settlement Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
