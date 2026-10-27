"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Shield,
  Key,
  Package,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";

interface MarketplaceViewProps {
  listings: any[];
  onOpenPaymentModal: (listing: any) => void;
  openCreateModal: () => void;
}

export default function MarketplaceView({
  listings,
  onOpenPaymentModal,
  openCreateModal,
}: MarketplaceViewProps) {
  const [filter, setFilter] = useState<"ALL" | "DIGITAL" | "PHYSICAL">("ALL");

  const filteredListings = listings.filter((item) => {
    if (filter === "ALL") return true;
    return item.itemType === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filter Strip & Actions (Inspired by Image 3's filter pills & Image 1's segmented tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-[#EAE9E4] p-1.5 rounded-full border border-black/[0.04] self-start">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === "ALL"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            All Items ({listings.length})
          </button>
          <button
            onClick={() => setFilter("DIGITAL")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === "DIGITAL"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            Digital Goods
          </button>
          <button
            onClick={() => setFilter("PHYSICAL")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === "PHYSICAL"
                ? "bg-white text-[#1A1816] shadow-sm"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            Physical Goods
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#949089] font-medium hidden sm:inline">
            Showing {filteredListings.length} listing{filteredListings.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-full btn-orange-primary text-xs font-bold flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Post Listing</span>
          </button>
        </div>
      </div>

      {/* Grid of Listings (Inspired by Image 1 & Image 3 car and item cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="card-floating overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-stone-100 p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Badge Category (Inspired by Image 1's rounded badge) */}
                <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.08] text-[11px] font-bold text-[#1A1816] shadow-sm">
                  {item.itemType === "DIGITAL" ? (
                    <>
                      <Key className="w-3.5 h-3.5 text-[#D96522]" />
                      <span>Digital Secret</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-3.5 h-3.5 text-[#C85A17]" />
                      <span>Physical Asset</span>
                    </>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                      item.status === "SOLD"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white/90 text-[#66635F] border-black/[0.08]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-bold text-[#1A1816] group-hover:text-[#D96522] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#66635F] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Seller Shielded Address */}
                <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] uppercase font-bold text-[#949089]">Seller:</span>
                  <span className="text-[#66635F]">{formatAddress(item.sellerAddress, 8, 6)}</span>
                </div>
              </div>
            </div>

            {/* Card Footer (Price in Burnt Orange + Direct Action Button) */}
            <div className="p-5 pt-0">
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#949089] font-bold">
                    Price
                  </div>
                  <div className="text-xl font-black font-mono text-[#1A1816] flex items-baseline space-x-1">
                    <span className="text-[#D96522]">{item.priceZec}</span>
                    <span className="text-xs text-[#A7430B] font-bold">ZEC</span>
                  </div>
                </div>

                {item.status === "SOLD" ? (
                  <button
                    onClick={() => onOpenPaymentModal(item)}
                    className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#1A1816] font-bold text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenPaymentModal(item)}
                    className="px-5 py-2.5 rounded-full btn-orange-primary text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <span>Buy Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
