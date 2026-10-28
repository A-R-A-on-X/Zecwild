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
  const [bidderAddress, setBidderAddress] = useState<string>(profile?.address || "");
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCommitment, setSuccessCommitment] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const active = getActiveProfile();
    setBidderAddress(active?.address || "");

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
      setError("A valid shielded address (Mainnet u1... / zs1... or Testnet utest1... / ztestsapling1...) is required.");
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
      window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#eff4ff] text-[#1b5efa] border border-[#1b5efa]/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Submit Cryptographically Sealed Bid</h3>
              <p className="text-xs text-slate-500 font-mono">Zero-Knowledge • Client-Side Sealing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCommitment ? (
          /* Bid Sealed Success View */
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-black text-slate-900">Bid Successfully Sealed!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your bid was encrypted locally in your browser with the auction's public key. The server stores only the opaque ciphertext and commitment hash.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                SHA-256 Cryptographic Commitment Hash
              </div>
              <div className="font-mono text-xs text-[#1b5efa] font-bold mt-1 break-all select-all">
                {successCommitment}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white font-bold text-sm transition-all shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auction</div>
              <div className="text-sm font-bold text-slate-900 truncate">{auction.title}</div>
              <div className="text-xs text-[#1b5efa] mt-0.5 font-mono font-bold">
                Reserve Price: {auction.reservePriceZec} ZEC
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bid Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-[#1b5efa]"
                  required
                />
                <div className="absolute right-4 top-2.5 text-xs font-mono text-[#1b5efa] font-black">
                  ZEC
                </div>
              </div>
            </div>

            {/* Bidder Shielded Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Your Shielded Zcash Address
                </label>
                <span className="text-[10px] text-[#1b5efa] font-bold">
                  🌲 Ironwood / Sapling
                </span>
              </div>
              <input
                type="text"
                value={bidderAddress}
                onChange={(e) => setBidderAddress(e.target.value)}
                placeholder="u1... / zs1... (Mainnet) or utest1... / ztestsapling1... (Testnet)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#1b5efa]"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to verify identity upon winning and coordinate private settlement.
              </p>
            </div>

            {/* Sealing Security Guarantee Banner */}
            <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#1b5efa]/20 text-xs text-[#1b5efa] flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-[#1b5efa] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1b5efa]">Cryptographic Seal Guarantee: </strong>
                <span className="text-slate-700">Your bid is encrypted locally via WebCrypto (RSA-OAEP + AES-GCM). Only the seller's browser can unseal it when the deadline expires.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSealing}
              className="w-full py-3 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md"
            >
              {isSealing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
