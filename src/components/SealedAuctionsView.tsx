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
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface SealedAuctionsViewProps {
  auctions: any[];
  onOpenBidModal: (auction: any) => void;
  onOpenUnsealModal: (auction: any) => void;
  onOpenPaymentModal: (item: any) => void;
  openCreateModal: () => void;
  refreshData: () => void;
}

export default function SealedAuctionsView({
  auctions,
  onOpenBidModal,
  onOpenUnsealModal,
  onOpenPaymentModal,
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

      {/* Grid of Auctions (Inspired by Image 2 & 3 auction item cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => {
          const isClosed = timeRemaining[auction.id] === "CLOSED" || auction.status !== "OPEN";
          const isWinnerDeclared = auction.status === "WINNER_DECLARED";
          const isSettled = auction.status === "SETTLED_PAID";
          const isAwaitingReveal = auction.status === "CLOSED_AWAITING_REVEAL";

          return (
            <div
              key={auction.id}
              className="card-floating overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image & Timers Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-100 p-2">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Countdown Timer Badge (Inspired by Image 2 & 3 timers) */}
                  <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-black/[0.08] text-[11px] font-mono font-bold text-[#1A1816] shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#D96522]" />
                    <span>{timeRemaining[auction.id] || "Loading..."}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                        isSettled
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : isWinnerDeclared
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : isAwaitingReveal
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-white/90 text-[#66635F] border-black/[0.08]"
                      }`}
                    >
                      {auction.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-[#1A1816] group-hover:text-[#D96522] transition-colors line-clamp-1">
                    {auction.title}
                  </h3>
                  <p className="text-xs text-[#66635F] line-clamp-2 leading-relaxed">
                    {auction.description}
                  </p>

                  {/* Sealed Bids Count Banner in Burnt Orange */}
                  <div className="p-3 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/20 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-[#A7430B] font-bold">
                      <Lock className="w-4 h-4 text-[#D96522]" />
                      <span>Sealed Bids Received:</span>
                    </div>
                    <span className="font-mono text-sm font-black text-[#A7430B] px-2.5 py-0.5 rounded-full bg-white shadow-xs">
                      {auction.bidsCount || 0}
                    </span>
                  </div>

                  {/* Reserve & Seller */}
                  <div className="pt-1 flex items-center justify-between text-xs text-[#66635F] font-mono">
                    <span>Reserve: <strong className="text-[#1A1816]">{auction.reservePriceZec} ZEC</strong></span>
                    <span>Seller: {formatAddress(auction.sellerAddress, 6, 4)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-black/[0.05]">
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
                      className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
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

                  {/* Status 4: Settled & Paid */}
                  {isSettled && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-bold flex items-center space-x-1.5">
                        <Trophy className="w-4 h-4 text-emerald-600" />
                        <span>Settled & Paid</span>
                      </span>
                      <span className="font-mono text-emerald-900 font-black text-sm">
                        {auction.winningAmountZec} ZEC
                      </span>
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
