"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MarketplaceView from "@/components/MarketplaceView";
import SealedAuctionsView from "@/components/SealedAuctionsView";
import ActivityView from "@/components/ActivityView";
import PaymentModal from "@/components/PaymentModal";
import PlaceBidModal from "@/components/PlaceBidModal";
import UnsealModal from "@/components/UnsealModal";
import CreateListingModal from "@/components/CreateListingModal";
import CreateAuctionModal from "@/components/CreateAuctionModal";
import WebhookSimulatorModal from "@/components/WebhookSimulatorModal";
import { Shield, Lock, Zap, CheckCircle2, Terminal } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "auctions" | "activity">("marketplace");
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [createModalType, setCreateModalType] = useState<"listing" | "auction" | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<{ item: any; type: "listing" | "auction" } | null>(null);
  const [bidAuction, setBidAuction] = useState<any | null>(null);
  const [unsealAuction, setUnsealAuction] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [listRes, auctRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/auctions"),
      ]);
      const listData = await listRes.json();
      const auctData = await auctRes.json();

      if (listData.listings) setListings(listData.listings);
      if (auctData.auctions) setAuctions(auctData.auctions);
    } catch (e) {
      console.error("Failed to load ZecWild data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] cyber-grid">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={(type) => setCreateModalType(type)}
        openSimulatorModal={() => setIsSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto glow-emerald" />
            <p className="text-xs font-mono text-slate-400">Loading Shielded State...</p>
          </div>
        ) : (
          <>
            {activeTab === "marketplace" && (
              <MarketplaceView
                listings={listings}
                onOpenPaymentModal={(item) => setPaymentItem({ item, type: "listing" })}
                openCreateModal={() => setCreateModalType("listing")}
              />
            )}

            {activeTab === "auctions" && (
              <SealedAuctionsView
                auctions={auctions}
                onOpenBidModal={(auction) => setBidAuction(auction)}
                onOpenUnsealModal={(auction) => setUnsealAuction(auction)}
                onOpenPaymentModal={(item) => setPaymentItem({ item, type: "auction" })}
                openCreateModal={() => setCreateModalType("auction")}
                refreshData={fetchData}
              />
            )}

            {activeTab === "activity" && (
              <ActivityView
                onOpenPaymentModal={(item, type) => setPaymentItem({ item, type })}
                onOpenUnsealModal={(auction) => setUnsealAuction(auction)}
              />
            )}
          </>
        )}
      </main>

      {/* Security Architecture & Cyber Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090e]/90 py-8 px-4 text-center text-xs text-slate-400 space-y-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Platform Custody</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1.5 text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Client-Side RSA-OAEP Sealing</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1.5 text-cyan-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>ZecShield Gateway Indexer (`zechack`)</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          ZecWild MVP — Shielded Zcash Sealed-Bid Auctions & Open Marketplace
        </p>
      </footer>

      {/* Modals Container */}
      <CreateListingModal
        isOpen={createModalType === "listing"}
        onClose={() => setCreateModalType(null)}
        onCreated={fetchData}
      />

      <CreateAuctionModal
        isOpen={createModalType === "auction"}
        onClose={() => setCreateModalType(null)}
        onCreated={fetchData}
      />

      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onWebhookFired={fetchData}
      />

      {paymentItem && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentItem(null)}
          entityType={paymentItem.type}
          item={paymentItem.item}
          onPaymentSuccess={fetchData}
        />
      )}

      {bidAuction && (
        <PlaceBidModal
          isOpen={true}
          onClose={() => setBidAuction(null)}
          auction={bidAuction}
          onBidSubmitted={fetchData}
        />
      )}

      {unsealAuction && (
        <UnsealModal
          isOpen={true}
          onClose={() => setUnsealAuction(null)}
          auction={unsealAuction}
          onRevealed={fetchData}
        />
      )}
    </div>
  );
}
