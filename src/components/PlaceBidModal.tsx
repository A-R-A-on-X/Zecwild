"use client";

import React, { useState } from "react";
import { X, Lock, Shield, Check, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { sealBid, BidPayload } from "@/lib/crypto/sealing";
import { zecToZat, isShieldedAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: {
    id: string;
    title: string;
    reservePriceZec: number;
    reservePriceZat: string;
    sealingPublicKey: string;
    endTime: string;
  };
  onBidSubmitted: () => void;
}

export default function PlaceBidModal({
  isOpen,
  onClose,
  auction,
  onBidSubmitted,
}: PlaceBidModalProps) {
  const profile = getActiveProfile();
  const [bidAmountZec, setBidAmountZec] = useState<string>("");
  const [bidderAddress, setBidderAddress] = useState<string>(profile.address || "");
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCommitment, setSuccessCommitment] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const active = getActiveProfile();
    setBidderAddress(active.address || "");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(bidAmountZec);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid positive bid amount in ZEC.");
      return;
    }

    if (amountNum < auction.reservePriceZec) {
      setError(`Bid must be at least the reserve price of ${auction.reservePriceZec} ZEC.`);
      return;
    }

    if (!bidderAddress || !isShieldedAddress(bidderAddress)) {
      setError("A valid shielded address (Orchard u1... or Sapling zs1...) is required.");
      return;
    }

    setIsSealing(true);
    try {
      const amountZat = zecToZat(amountNum);
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const payload: BidPayload = {
        amountZat,
        amountZec: amountNum,
        bidderAddress: bidderAddress.trim(),
        salt,
        timestamp: Date.now(),
      };

      // Client-Side Hybrid Encryption (Option B)
      const sealed = await sealBid(auction.sealingPublicKey, payload);

      // Submit to server
      const res = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sealedCiphertext: sealed.sealedCiphertext,
          commitmentHash: sealed.commitmentHash,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit sealed bid");
      }

      setSuccessCommitment(sealed.commitmentHash);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      onBidSubmitted();
    } catch (err: any) {
      console.error("Sealed bid error:", err);
      setError(err.message || "Failed to seal and submit bid.");
    } finally {
      setIsSealing(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl glass-panel border border-slate-700/80 p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Submit Cryptographically Sealed Bid</h3>
              <p className="text-xs text-slate-400 font-mono">Zero-Knowledge • Client-Side Sealing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCommitment ? (
          /* Bid Sealed Success View */
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto glow-emerald">
              <Check className="w-7 h-7" />
            </div>

            <h4 className="text-lg font-bold text-emerald-300">Bid Successfully Sealed!</h4>
            <p className="text-xs text-slate-300">
              Your bid was encrypted in your browser with the auction's public key. Neither the server nor other bidders can view your amount until the auction closes.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                SHA-256 Cryptographic Commitment Hash
              </div>
              <div className="font-mono text-xs text-amber-300 mt-1 break-all select-all">
                {successCommitment}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Auction:</div>
              <div className="text-sm font-semibold text-slate-100 truncate">{auction.title}</div>
              <div className="text-xs text-amber-400 mt-1 font-mono">
                Reserve Price: {auction.reservePriceZec} ZEC
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bid Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Sealed Bid Amount (ZEC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  min={auction.reservePriceZec}
                  value={bidAmountZec}
                  onChange={(e) => setBidAmountZec(e.target.value)}
                  placeholder={`Min ${auction.reservePriceZec} ZEC`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
                <div className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 font-bold">
                  ZEC
                </div>
              </div>
            </div>

            {/* Bidder Shielded Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Shielded Zcash Address (Orchard / Sapling)
              </label>
              <input
                type="text"
                value={bidderAddress}
                onChange={(e) => setBidderAddress(e.target.value)}
                placeholder="u1... or zs1..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to verify identity upon winning and deliver secrets.
              </p>
            </div>

            {/* Sealing Security Guarantee Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Cryptographic Seal Guarantee: </span>
                Your bid is hybrid-encrypted locally via WebCrypto (RSA-OAEP + AES-GCM). Only the seller's browser can unseal it when the deadline expires.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSealing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSealing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Committing Bid...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Submit Sealed Bid</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
