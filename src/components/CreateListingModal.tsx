"use client";

import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Upload, AlertCircle, Shield, Key, Package, Sparkles } from "lucide-react";
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

  // Sync profile and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const active = getActiveProfile();
    setSellerAddress(active.address || "");

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

    const priceNum = parseFloat(priceZec);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid positive price in ZEC.");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-white border border-black/[0.08] p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCEFE7] text-[#D96522] flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1A1816]">Create Marketplace Listing</h3>
              <p className="text-xs text-[#66635F]">Fixed-Price Direct Shielded Sale</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#949089] hover:text-[#1A1816] hover:bg-black/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
              Item Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType("DIGITAL")}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "DIGITAL"
                    ? "bg-[#FCEFE7] border-[#D96522]/30 text-[#A7430B] shadow-xs"
                    : "bg-[#F8F7F4] border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Digital Asset / Key</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType("PHYSICAL")}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  itemType === "PHYSICAL"
                    ? "bg-[#FCEFE7] border-[#D96522]/30 text-[#A7430B] shadow-xs"
                    : "bg-[#F8F7F4] border-black/[0.06] text-[#66635F] hover:text-[#1A1816]"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Physical Good</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shielded Hardware Node or API Access Key"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] text-xs font-medium focus:outline-none focus:border-[#D96522]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specifications and what the buyer receives..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] text-xs focus:outline-none focus:border-[#D96522] resize-none"
            />
          </div>

          {/* Price & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Price (ZEC)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={priceZec}
                onChange={(e) => setPriceZec(e.target.value)}
                placeholder="0.25"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] font-mono text-xs font-bold focus:outline-none focus:border-[#D96522]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Image (Max 2MB)
              </label>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer flex-1 py-2 px-3 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] hover:border-[#D96522]/30 text-xs text-[#66635F] flex items-center justify-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#D96522]" />
                  <span>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="preview" className="w-9 h-9 rounded-xl object-cover border border-black/[0.08]" />
                )}
              </div>
            </div>
          </div>

          {/* Digital Secret Payload */}
          {itemType === "DIGITAL" && (
            <div>
              <label className="block text-xs font-bold text-[#C85A17] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>Secret Payload / Download Link (Unlocked After Payment)</span>
              </label>
              <input
                type="text"
                value={secretPayload}
                onChange={(e) => setSecretPayload(e.target.value)}
                placeholder="e.g. sk-prod-key-xyz or https://secure.vault/download"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-[#D96522]/30 text-[#1A1816] font-mono text-xs focus:outline-none focus:border-[#D96522]"
                required
              />
            </div>
          )}

          {/* Seller Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                Payout Shielded Address
              </label>
              <span className="text-[10px] text-[#A7430B] font-bold">
                🌲 Ironwood & Sapling Compatible
              </span>
            </div>
            <input
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="u1... / zs1... (Mainnet) or utest1... / ztestsapling1... (Testnet)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.08] text-[#1A1816] font-mono text-xs focus:outline-none focus:border-[#D96522]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full btn-orange-primary text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Publishing Listing..." : "Publish Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
