"use client";

import React, { useState, useEffect } from "react";
import { X, Unlock, Check, AlertCircle, Award, Trophy, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { unsealBid } from "@/lib/crypto/sealing";
import { getAuctionPrivateKey } from "@/lib/crypto/identity";
import { formatAddress } from "@/lib/crypto/zcash";

interface UnsealModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: {
    id: string;
    title: string;
    reservePriceZec: number;
    reservePriceZat: string;
    bids: Array<{
      id: string;
      sealedCiphertext: string;
      commitmentHash: string;
    }>;
  };
  onRevealed: () => void;
}

export default function UnsealModal({
  isOpen,
  onClose,
  auction,
  onRevealed,
}: UnsealModalProps) {
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string>("");
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [decryptedBids, setDecryptedBids] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = getAuctionPrivateKey(auction.id);
      if (storedKey) setPrivateKeyBase64(storedKey);
      setIsFinished(false);
      setDecryptedBids([]);
      setError(null);
    }
  }, [isOpen, auction.id]);

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

  const handleUnseal = async () => {
    if (!privateKeyBase64.trim()) {
      setError("Please provide the auction's unsealing private key.");
      return;
    }

    setIsUnsealing(true);
    setError(null);

    try {
      const unsealedList: any[] = [];

      for (const b of auction.bids) {
        try {
          const payload = await unsealBid(privateKeyBase64.trim(), b.sealedCiphertext);
          unsealedList.push({
            bidId: b.id,
            amountZat: payload.amountZat,
            amountZec: payload.amountZec,
            bidderAddress: payload.bidderAddress,
            salt: payload.salt,
          });
        } catch (e) {
          console.error(`Failed to unseal bid ${b.id}:`, e);
        }
      }

      if (unsealedList.length === 0) {
        throw new Error("Could not decrypt any bids. Ensure the private key matches this auction.");
      }

      // Submit revealed bids to the server to finalize the winner
      const res = await fetch(`/api/auctions/${auction.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealedBids: unsealedList }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to finalize auction reveal");
      }

      setDecryptedBids(unsealedList.sort((a, b) => b.amountZec - a.amountZec));
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      onRevealed();
    } catch (err: any) {
      console.error("Unsealing error:", err);
      setError(err.message || "Failed to unseal bids.");
    } finally {
      setIsUnsealing(false);
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
        className="relative w-full max-w-xl rounded-2xl glass-panel border border-slate-700/80 p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unseal Bids & Declare Winner</h3>
              <p className="text-xs text-slate-400 font-mono">Client-Side Decryption & Rank Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFinished ? (
          /* Finished Ranked View */
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto glow-emerald">
                <Trophy className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-emerald-300 mt-2">Auction Decrypted & Settled!</h4>
              <p className="text-xs text-slate-400">
                The winning bidder has been declared. A single-use settlement invoice has been issued.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {decryptedBids.map((b, idx) => (
                <div
                  key={b.bidId}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    idx === 0
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-medium">
                        {formatAddress(b.bidderAddress, 10, 8)}
                      </div>
                      {idx === 0 && (
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          🏆 Winning Bid
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">{b.amountZec} ZEC</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          /* Input / Decrypt Action View */
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Auction:</div>
              <div className="text-sm font-semibold text-slate-100 truncate">{auction.title}</div>
              <div className="text-xs text-emerald-400 mt-1 font-mono">
                {auction.bids.length} Sealed Bids Awaiting Decryption
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Auction Unsealing Private Key
              </label>
              <textarea
                rows={3}
                value={privateKeyBase64}
                onChange={(e) => setPrivateKeyBase64(e.target.value)}
                placeholder="Paste the Base64 PKCS#8 private key (or auto-loaded from seller browser vault)"
                className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your private key is used only locally in your browser to unseal bids and never leaves this device.
              </p>
            </div>

            <button
              onClick={handleUnseal}
              disabled={isUnsealing || auction.bids.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isUnsealing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Decrypting Sealed Bids Locally...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt & Reveal Winner</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
