"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Upload, AlertCircle, Shield, Key, Package, Sparkles } from "lucide-react";
import { getActiveProfile, storeAuctionPrivateKey } from "@/lib/crypto/identity";
import { generateAuctionKeypair } from "@/lib/crypto/sealing";
import { isShieldedAddress } from "@/lib/crypto/zcash";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAuctionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAuctionModalProps) {
  const profile = getActiveProfile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [itemType, setItemType] = useState<"DIGITAL" | "PHYSICAL">("DIGITAL");
  const [secretPayload, setSecretPayload] = useState("");
  const [reservePriceZec, setReservePriceZec] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("5");
  const [sellerAddress, setSellerAddress] = useState(profile?.address || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync profile and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const active = getActiveProfile();
    setSellerAddress(active?.address || "");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image file must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reserveNum = reservePriceZec ? parseFloat(reservePriceZec) : 0;
    if (reservePriceZec && (isNaN(reserveNum) || reserveNum < 0)) {
      setError("Please enter a valid reserve price.");
      return;
    }

    if (!sellerAddress || !isShieldedAddress(sellerAddress)) {
      setError("A valid shielded Zcash address (Mainnet u1... / zs1... or Testnet utest1... / ztestsapling1...) is required.");
      return;
    }

    if (itemType === "DIGITAL" && !secretPayload.trim()) {
      setError("Digital goods require a secret payload or download link to release upon shielded settlement.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate client-side RSA keypair
      const keypair = await generateAuctionKeypair();

      // 2. Compute end time
      const endTime = new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000).toISOString();

      // 3. Post auction with public key to backend
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
          itemType,
          secretPayload: itemType === "DIGITAL" ? secretPayload : null,
          reservePriceZec: reserveNum,
          endTime,
          sealingPublicKey: keypair.publicKey,
          sellerAddress: sellerAddress.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create auction");
      }

      // 4. Save private key locally in IndexedDB / localStorage vault
      storeAuctionPrivateKey(data.auction.id, keypair.privateKey);

      onCreated();
      window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
      onClose();
    } catch (err: any) {
      console.error("Auction creation error:", err);
      setError(err.message || "Failed to create auction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#094ae0] flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Create Sealed-Bid Auction</h3>
              <p className="text-xs text-slate-500">End-to-End Cryptographic Sealing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Type */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Auction Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType("DIGITAL")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${itemType === "DIGITAL"
                    ? "bg-[#EEF4FF] border-[#094ae0]/40 text-[#094ae0] shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Digital Asset</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType("PHYSICAL")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${itemType === "PHYSICAL"
                    ? "bg-[#EEF4FF] border-[#094ae0]/40 text-[#094ae0] shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Physical Good</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Auction Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shielded Proof of Provenance Artifact"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#094ae0]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide auction specifications..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#094ae0] resize-none"
            />
          </div>

          {/* Reserve & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Reserve Price (ZEC)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={reservePriceZec}
                onChange={(e) => setReservePriceZec(e.target.value)}
                placeholder="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#094ae0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#094ae0]"
              >
                <option value="5">5 Minutes (Fast Demo)</option>
                <option value="15">15 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="1440">24 Hours</option>
              </select>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Image (Max 2MB)
            </label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex-1 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#094ae0]/40 text-xs text-slate-600 flex items-center justify-center space-x-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#094ae0]" />
                <span>Choose Image</span>
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
              )}
            </div>
          </div>

          {/* Digital Secret Payload */}
          {itemType === "DIGITAL" && (
            <div>
              <label className="block text-xs font-bold text-[#094ae0] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>Secret Payload / Download Link (Unlocked for Winner)</span>
              </label>
              <input
                type="text"
                value={secretPayload}
                onChange={(e) => setSecretPayload(e.target.value)}
                placeholder="e.g. https://storage.network/master_key.zip"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#094ae0]/30 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#094ae0]"
                required
              />
            </div>
          )}

          {/* Seller Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Payout Shielded Address
              </label>
              <span className="text-[10px] text-[#094ae0] font-bold">
                🌲 Ironwood & Sapling Compatible
              </span>
            </div>
            <input
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="u1... / zs1... (Mainnet) or utest1... / ztestsapling1... (Testnet)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#094ae0]"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-[#EEF4FF] border border-[#094ae0]/20 text-xs text-[#094ae0] flex items-start space-x-2">
            <Shield className="w-4 h-4 text-[#094ae0] flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed text-slate-700">
              An ephemeral RSA-2048 keypair will be generated in your browser. The private key will be saved strictly in your local device vault to unseal bids at deadline.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Generating Keys & Launching..." : "Launch Sealed Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}
