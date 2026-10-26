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
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-emerald-500/30">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Shielded Zcash Settlement • Zero Platform Custody</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Direct Peer-to-Peer Marketplace with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Shielded ZEC
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Buy digital and physical goods directly from sellers. Settlement is strictly wallet-to-wallet via ZIP-321 QR codes, confirmed seamlessly by the ZecShield indexer.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Create Listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Items ({listings.length})
          </button>
          <button
            onClick={() => setFilter("DIGITAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "DIGITAL"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Digital Goods
          </button>
          <button
            onClick={() => setFilter("PHYSICAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "PHYSICAL"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Physical Goods
          </button>
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl glass-card overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Category */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
                  {item.itemType === "DIGITAL" ? (
                    <>
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Digital Secret</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Physical Asset</span>
                    </>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                      item.status === "SOLD"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-black/70 text-slate-300 border-white/10"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Seller Shielded Address */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-[10px] uppercase text-slate-500">Seller:</span>
                  <span className="text-slate-300">{formatAddress(item.sellerAddress, 8, 6)}</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-5 pt-0">
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Price
                  </div>
                  <div className="text-lg font-bold font-mono text-white flex items-baseline space-x-1">
                    <span>{item.priceZec}</span>
                    <span className="text-xs text-emerald-400 font-normal">ZEC</span>
                  </div>
                </div>

                {item.status === "SOLD" ? (
                  <button
                    onClick={() => onOpenPaymentModal(item)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenPaymentModal(item)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1"
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
