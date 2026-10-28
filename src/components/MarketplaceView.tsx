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
  onOpenReceiptModal?: (listing: any) => void;
  openCreateModal: () => void;
}

export default function MarketplaceView({
  listings,
  onOpenPaymentModal,
  onOpenReceiptModal,
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

      {/* Grid of Listings or Empty State */}
      {filteredListings.length === 0 ? (
        <div className="card-static p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FCEFE7] text-[#D96522] flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-[#1A1816]">No Marketplace Listings Yet</h3>
            <p className="text-xs text-[#66635F] leading-relaxed">
              No items are currently listed for sale. Post a digital asset or physical item for peer-to-peer shielded settlement.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full btn-orange-primary text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Create First Listing</span>
          </button>
        </div>
      ) : (
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
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                    {/* Top Status & Category Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#1A1816] shadow-sm flex items-center space-x-1">
                        {item.itemType === "DIGITAL" ? (
                          <>
                            <Key className="w-3 h-3 text-[#D96522]" />
                            <span>Digital</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 text-[#D96522]" />
                            <span>Physical</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                          item.status === "SOLD"
                            ? "bg-emerald-500/90 text-white"
                            : "bg-black/60 text-white"
                        }`}
                      >
                        {item.status === "SOLD" ? "Sold / Settled" : "Available"}
                      </span>
                    </div>

                    {/* Memo Identifier Overlay */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <div className="text-[10px] font-mono text-white/90 truncate bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                        Memo: {item.invoiceMemo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-2.5">
                  <h3 className="font-bold text-base text-[#1A1816] line-clamp-1 group-hover:text-[#D96522] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#66635F] line-clamp-2 leading-relaxed">
                    {item.description || "Direct peer-to-peer shielded settlement on Zcash."}
                  </p>

                  {/* Seller & Network Info */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#949089] font-mono">
                    <span className="flex items-center space-x-1.5">
                      <span>Seller:</span>
                      {(item.sellerAddress?.startsWith("utest") || item.sellerAddress?.startsWith("ztestsapling")) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                          Testnet
                        </span>
                      )}
                    </span>
                    <span className="truncate max-w-[170px] text-[#66635F]">
                      {formatAddress(item.sellerAddress, 8, 6)}
                    </span>
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
                      onClick={() => {
                        if (onOpenReceiptModal) {
                          onOpenReceiptModal(item);
                        } else {
                          onOpenPaymentModal(item);
                        }
                      }}
                      className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
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
      )}
    </div>
  );
}
