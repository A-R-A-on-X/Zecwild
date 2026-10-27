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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-7 shadow-2xl overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#FCEFE7] text-[#D96522] border border-[#D96522]/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1A1816]">Submit Cryptographically Sealed Bid</h3>
              <p className="text-xs text-[#66635F] font-mono">Zero-Knowledge • Client-Side Sealing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#949089] hover:text-[#1A1816] hover:bg-stone-100 transition-colors"
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

            <h4 className="text-xl font-black text-[#1A1816]">Bid Successfully Sealed!</h4>
            <p className="text-xs text-[#66635F] max-w-sm mx-auto leading-relaxed">
              Your bid was encrypted locally in your browser with the auction's public key. The server stores only the opaque ciphertext and commitment hash.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-left">
              <div className="text-[10px] uppercase tracking-wider text-[#949089] font-bold">
                SHA-256 Cryptographic Commitment Hash
              </div>
              <div className="font-mono text-xs text-[#C85A17] font-bold mt-1 break-all select-all">
                {successCommitment}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full btn-orange-primary font-bold text-sm transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#949089]">Auction</div>
              <div className="text-sm font-bold text-[#1A1816] truncate">{auction.title}</div>
              <div className="text-xs text-[#D96522] mt-0.5 font-mono font-bold">
                Reserve Price: {auction.reservePriceZec} ZEC
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bid Amount */}
            <div>
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] font-mono text-sm focus:outline-none focus:border-[#D96522]"
                  required
                />
                <div className="absolute right-4 top-2.5 text-xs font-mono text-[#D96522] font-black">
                  ZEC
                </div>
              </div>
            </div>

            {/* Bidder Shielded Address */}
            <div>
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Your Shielded Zcash Address (Orchard / Sapling)
              </label>
              <input
                type="text"
                value={bidderAddress}
                onChange={(e) => setBidderAddress(e.target.value)}
                placeholder="u1... or zs1..."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] font-mono text-xs focus:outline-none focus:border-[#D96522]"
                required
              />
              <p className="text-[11px] text-[#949089] mt-1">
                Used to verify identity upon winning and coordinate private settlement.
              </p>
            </div>

            {/* Sealing Security Guarantee Banner in Burnt Orange */}
            <div className="p-3.5 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/20 text-xs text-[#A7430B] flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-[#D96522] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#C85A17]">Cryptographic Seal Guarantee: </strong>
                Your bid is encrypted locally via WebCrypto (RSA-OAEP + AES-GCM). Only the seller's browser can unseal it when the deadline expires.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSealing}
              className="w-full py-3 rounded-full btn-orange-primary font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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
