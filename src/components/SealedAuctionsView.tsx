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
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-amber-500/30">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Blind Bidding • End-to-End Client Sealing</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Cryptographically Sealed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
              Zcash Auctions
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Bid with zero information leakage. Bids are encrypted in your browser using the auction’s public key. Competing bidders and server administrators cannot peek at bid values until the auction closes.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Launch Sealed Auction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Auctions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => {
          const isClosed = timeRemaining[auction.id] === "CLOSED" || auction.status !== "OPEN";
          const isWinnerDeclared = auction.status === "WINNER_DECLARED";
          const isSettled = auction.status === "SETTLED_PAID";
          const isAwaitingReveal = auction.status === "CLOSED_AWAITING_REVEAL";

          return (
            <div
              key={auction.id}
              className="group rounded-2xl glass-card overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image & Timers Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={auction.imageUrl}
                    alt={auction.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Countdown Timer Badge */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{timeRemaining[auction.id] || "Loading..."}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                        isSettled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : isWinnerDeclared
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : isAwaitingReveal
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-black/70 text-slate-300 border-white/10"
                      }`}
                    >
                      {auction.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {auction.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {auction.description}
                  </p>

                  {/* Sealed Bids Count Banner */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Sealed Bids Received:</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-black/40">
                      {auction.bidsCount || 0}
                    </span>
                  </div>

                  {/* Reserve & Seller */}
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Reserve: {auction.reservePriceZec} ZEC</span>
                    <span>Seller: {formatAddress(auction.sellerAddress, 6, 4)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-800/80">
                  {/* Status 1: OPEN -> Place Bid */}
                  {!isClosed && (
                    <button
                      onClick={() => onOpenBidModal(auction)}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Place Cryptographically Sealed Bid</span>
                    </button>
                  )}

                  {/* Status 2: Awaiting Reveal -> Unseal Bids */}
                  {isAwaitingReveal && (
                    <button
                      onClick={() => onOpenUnsealModal(auction)}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unseal Bids & Declare Winner</span>
                    </button>
                  )}

                  {/* Status 3: Winner Declared -> Settle Payment or Select Runner-Up */}
                  {isWinnerDeclared && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                        <div className="flex items-center justify-between text-cyan-300 font-bold">
                          <span>🏆 Winner Declared</span>
                          <span className="font-mono">{auction.winningAmountZec} ZEC</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate mt-0.5">
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
                          className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1"
                        >
                          <span>Settle Payment</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSelectRunnerUp(auction.id)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1"
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
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-bold flex items-center space-x-1">
                        <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Settled & Paid</span>
                      </span>
                      <span className="font-mono text-emerald-200 font-bold">
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
