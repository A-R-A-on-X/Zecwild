"use client";

import React, { useState } from "react";
import { X, ShoppingBag, Upload, AlertCircle, Shield, Key, Package } from "lucide-react";
import { getActiveProfile } from "@/lib/crypto/identity";
import { isShieldedAddress } from "@/lib/crypto/zcash";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateListingModal({
  isOpen,
  onClose,
  onCreated,
}: CreateListingModalProps) {
  const profile = getActiveProfile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [itemType, setItemType] = useState<"DIGITAL" | "PHYSICAL">("DIGITAL");
  const [secretPayload, setSecretPayload] = useState("");
  const [priceZec, setPriceZec] = useState("");
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

    // Strict 2MB size cap
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

    const priceNum = parseFloat(priceZec);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid positive price in ZEC.");
      return;
    }

    if (!sellerAddress || !isShieldedAddress(sellerAddress)) {
      setError("A valid shielded Zcash address (Orchard u1... or Sapling zs1...) is required.");
      return;
    }

    if (itemType === "DIGITAL" && !secretPayload.trim()) {
      setError("Digital goods require a secret payload / download link to unlock for the buyer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          itemType,
          secretPayload: itemType === "DIGITAL" ? secretPayload : null,
          priceZec: priceNum,
          sellerAddress: sellerAddress.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create listing");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Listing creation error:", err);
      setError(err.message || "Failed to create listing.");
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
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Marketplace Listing</h3>
              <p className="text-xs text-slate-400 font-mono">Fixed-Price Shielded Sale</p>
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

          {/* Item Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Item Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType("DIGITAL")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "DIGITAL"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Digital Asset / Key</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType("PHYSICAL")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "PHYSICAL"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shielded Hardware Node or API Key"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-400"
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
              placeholder="Describe what the buyer will receive..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>

          {/* Price & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price (ZEC)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={priceZec}
                onChange={(e) => setPriceZec(e.target.value)}
                placeholder="0.25"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Image (Max 2MB)
              </label>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-300 flex items-center justify-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose File</span>
                  <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover border border-slate-700" />
                )}
              </div>
            </div>
          </div>

          {/* Digital Secret Payload */}
          {itemType === "DIGITAL" && (
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>Secret Payload / Download Link (Revealed Upon Payment)</span>
              </label>
              <input
                type="text"
                value={secretPayload}
                onChange={(e) => setSecretPayload(e.target.value)}
                placeholder="e.g. sk-prod-key-xyz or https://secure.storage/download"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Creating Listing..." : "Publish Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
