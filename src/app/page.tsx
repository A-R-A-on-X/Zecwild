"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroShowcase from "@/components/HeroShowcase";
import MarketplaceView from "@/components/MarketplaceView";
import SealedAuctionsView from "@/components/SealedAuctionsView";
import ActivityView from "@/components/ActivityView";
import PaymentModal from "@/components/PaymentModal";
import PlaceBidModal from "@/components/PlaceBidModal";
import UnsealModal from "@/components/UnsealModal";
import CreateListingModal from "@/components/CreateListingModal";
import CreateAuctionModal from "@/components/CreateAuctionModal";
import WebhookSimulatorModal from "@/components/WebhookSimulatorModal";
import { Shield, Lock, Terminal, Sparkles } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#F3F2EE] text-[#1A1816]">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={(type) => setCreateModalType(type)}
        openSimulatorModal={() => setIsSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Hero & Metrics Showcase (Images 1 & 2 inspired) */}
        <HeroShowcase
          onOpenCreate={(type) => setCreateModalType(type)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          listingsCount={listings.length}
          auctionsCount={auctions.length}
        />

        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#D96522] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#66635F]">Synchronizing Shielded State...</p>
          </div>
        ) : (
          <div className="pt-2">
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
          </div>
        )}
      </main>

      {/* Security Architecture & Warm Stone Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-8 px-4 text-center text-xs text-[#66635F] space-y-3 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-[#66635F]">
          <span className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Platform Custody</span>
          </span>
          <span className="text-[#949089] hidden sm:inline">•</span>
          <span className="flex items-center space-x-1.5 text-[#A7430B] font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#D96522]" />
            <span>Client-Side RSA-OAEP Sealing</span>
          </span>
          <span className="text-[#949089] hidden sm:inline">•</span>
          <span className="flex items-center space-x-1.5 text-[#1A1816] font-semibold">
            <Terminal className="w-3.5 h-3.5 text-[#C85A17]" />
            <span>ZecShield Gateway Indexer (`zechack`)</span>
          </span>
        </div>
        <p className="text-[11px] text-[#949089]">
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
