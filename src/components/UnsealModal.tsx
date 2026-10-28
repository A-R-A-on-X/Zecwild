"use client";

import React, { useState, useEffect } from "react";
import { X, Unlock, Trophy, AlertCircle, Sparkles, Check, ArrowRight } from "lucide-react";
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
    bids?: Array<{
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
  const [bidsList, setBidsList] = useState<any[]>(auction?.bids || []);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [decryptedBids, setDecryptedBids] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen && auction?.id) {
      const storedKey = getAuctionPrivateKey(auction.id);
      if (storedKey) setPrivateKeyBase64(storedKey);
      setIsFinished(false);
      setDecryptedBids([]);
      setError(null);
      setBidsList(auction.bids || []);

      // Fetch fresh bids list from backend
      setIsLoadingBids(true);
      fetch(`/api/auctions/${auction.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.auction?.bids) {
            setBidsList(data.auction.bids);
          }
        })
        .catch((e) => console.error("Failed to fetch bids for unsealing:", e))
        .finally(() => setIsLoadingBids(false));
    }
  }, [isOpen, auction?.id, auction?.bids]);

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

    const currentBids = bidsList.length > 0 ? bidsList : (auction?.bids || []);
    if (currentBids.length === 0) {
      setError("No bids are registered on this auction to unseal.");
      return;
    }

    setIsUnsealing(true);
    setError(null);

    try {
      const unsealedList: any[] = [];

      for (const b of currentBids) {
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
      window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
    } catch (err: any) {
      console.error("Unsealing error:", err);
      setError(err.message || "Failed to unseal bids.");
    } finally {
      setIsUnsealing(false);
    }
  };

  const count = bidsList?.length ?? (auction?.bids?.length ?? 0);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg sm:max-w-xl rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#094ae0] flex items-center justify-center shadow-xs">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Unseal Bids & Declare Winner</h3>
              <p className="text-xs text-slate-500">Client-side RSA-OAEP Decryption & Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFinished ? (
          /* Finished Ranked View */
          <div className="py-5 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] border border-[#094ae0]/30 text-[#094ae0] flex items-center justify-center mx-auto shadow-sm">
                <Trophy className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Auction Decrypted & Winner Declared!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The winning sealed bid has been selected. A direct wallet-to-wallet settlement invoice has been registered.
              </p>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {decryptedBids.map((b, idx) => (
                <div
                  key={b.bidId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    idx === 0
                      ? "bg-[#EEF4FF] border-[#094ae0]/30 text-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-[#094ae0] text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {formatAddress(b.bidderAddress, 10, 8)}
                      </div>
                      {idx === 0 && (
                        <div className="text-[10px] text-[#094ae0] font-black uppercase tracking-wider flex items-center space-x-1 mt-0.5">
                          <Sparkles className="w-3 h-3" />
                          <span>Winning Bidder</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-slate-900">{b.amountZec} ZEC</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold shadow-md transition-all"
            >
              Close & View Settlements
            </button>
          </div>
        ) : (
          /* Input / Decrypt Action View */
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auction Title:</div>
              <div className="text-sm font-bold text-slate-900 truncate mt-0.5">{auction.title}</div>
              <div className="text-xs text-[#094ae0] mt-1.5 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#094ae0]" />
                <span>
                  {isLoadingBids
                    ? "Loading bids..."
                    : `${count} Sealed Bid${count === 1 ? "" : "s"} Awaiting Decryption`}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Auction Unsealing Private Key
              </label>
              <textarea
                rows={3}
                value={privateKeyBase64}
                onChange={(e) => setPrivateKeyBase64(e.target.value)}
                placeholder="Paste the Base64 PKCS#8 private key (or auto-loaded from local browser vault)"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#094ae0] resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Decryption runs exclusively inside your browser's WebCrypto runtime. Your private key is never transmitted across the network.
              </p>
            </div>

            <button
              onClick={handleUnseal}
              disabled={isUnsealing || count === 0}
              className="w-full py-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isUnsealing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
