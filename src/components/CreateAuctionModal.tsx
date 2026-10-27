"use client";

import React, { useState } from "react";
import { X, Lock, Upload, AlertCircle, Shield, Key, Package, Clock } from "lucide-react";
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
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [sellerAddress, setSellerAddress] = useState(profile.address || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
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
      setError("Image must be smaller than 2MB.");
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

    const reserveNum = parseFloat(reservePriceZec || "0");
    if (isNaN(reserveNum) || reserveNum < 0) {
      setError("Reserve price must be a valid non-negative number.");
      return;
    }

    const minutesNum = parseInt(durationMinutes, 10);
    if (isNaN(minutesNum) || minutesNum <= 0) {
      setError("Please select a valid auction duration.");
      return;
    }

    if (!sellerAddress || !isShieldedAddress(sellerAddress)) {
      setError("A valid shielded Zcash address (Orchard u1... or Sapling zs1...) is required.");
      return;
    }

    if (itemType === "DIGITAL" && !secretPayload.trim()) {
      setError("Digital goods require a secret payload to deliver to the winner upon payment.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate Auction Keypair Client-Side via WebCrypto
      const keypair = await generateAuctionKeypair();

      // 2. Submit to backend
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
          itemType,
          secretPayload: itemType === "DIGITAL" ? secretPayload : null,
          reservePriceZec: reserveNum,
          durationMinutes: minutesNum,
          sellerAddress: sellerAddress.trim(),
          sealingPublicKey: keypair.publicKeyBase64,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create auction");
      }

      // 3. Store private key safely in seller's browser vault
      storeAuctionPrivateKey(data.auction.id, keypair.privateKeyBase64);

      onCreated();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl glass-panel border border-slate-700/80 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Sealed-Bid Auction</h3>
              <p className="text-xs text-slate-400 font-mono">End-to-End Cryptographic Sealing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Auction Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType("DIGITAL")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "DIGITAL"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Digital Asset</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType("PHYSICAL")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "PHYSICAL"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Physical Good</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Auction Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rare Shielded Proof of Provenance Artifact"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide auction specifications..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Reserve & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reserve Price (ZEC)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={reservePriceZec}
                onChange={(e) => setReservePriceZec(e.target.value)}
                placeholder="0.5"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400"
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Image (Max 2MB)
            </label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-300 flex items-center justify-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Choose Image</span>
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover border border-slate-700" />
              )}
            </div>
          </div>

          {/* Digital Secret Payload */}
          {itemType === "DIGITAL" && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>Secret Payload / Download Link (Unlocked for Winner)</span>
              </label>
              <input
                type="text"
                value={secretPayload}
                onChange={(e) => setSecretPayload(e.target.value)}
                placeholder="e.g. https://storage.network/master_key.zip"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          )}

          {/* Seller Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Payout Shielded Address (Orchard u1... / Sapling zs1...)
            </label>
            <input
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="u1... or zs1..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start space-x-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              An ephemeral RSA-2048 keypair will be generated in your browser. The private key will be saved strictly in your local device vault to unseal bids at deadline.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Generating Keys & Launching..." : "Launch Sealed Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}
