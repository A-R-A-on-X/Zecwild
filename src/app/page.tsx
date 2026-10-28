"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroShowcase from "@/components/HeroShowcase";
import MarketplaceView from "@/components/MarketplaceView";
import SealedAuctionsView from "@/components/SealedAuctionsView";
import ActivityView from "@/components/ActivityView";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";
import PlaceBidModal from "@/components/PlaceBidModal";
import UnsealModal from "@/components/UnsealModal";
import CreateListingModal from "@/components/CreateListingModal";
import CreateAuctionModal from "@/components/CreateAuctionModal";
import WebhookSimulatorModal from "@/components/WebhookSimulatorModal";
import { Shield, Lock, Terminal, Sparkles, ExternalLink } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "auctions" | "activity">("marketplace");
  const [activitySubTab, setActivitySubTab] = useState<"seller" | "buyer" | "audits">("seller");
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [createModalType, setCreateModalType] = useState<"listing" | "auction" | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<{ item: any; type: "listing" | "auction" } | null>(null);
  const [receiptItem, setReceiptItem] = useState<{ item: any; type: "listing" | "auction" } | null>(null);
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

    // Auto-sync polling every 3 seconds so state updates automatically without manual reload
    const interval = setInterval(fetchData, 3000);

    const handleRefresh = () => fetchData();
    window.addEventListener("zecwild_refresh_data", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("zecwild_refresh_data", handleRefresh);
    };
  }, []);

  const settledVolumeZec =
    listings
      .filter((l) => l.status === "SOLD")
      .reduce((acc, l) => acc + (l.priceZec || 0), 0) +
    auctions
      .filter((a) => a.status === "SETTLED_PAID")
      .reduce((acc, a) => acc + (a.winningAmountZec || 0), 0);

  // Compute the most recently added item across marketplace listings and sealed auctions
  const allInventory = [
    ...listings.map((l) => ({ ...l, __type: "listing" as const })),
    ...auctions.map((a) => ({ ...a, __type: "auction" as const })),
  ];

  allInventory.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const latestItem = allInventory.length > 0 ? allInventory[0] : null;

  const handleTabChange = (
    tab: "marketplace" | "auctions" | "activity",
    subTab?: "seller" | "buyer" | "audits"
  ) => {
    setActiveTab(tab);
    if (subTab) {
      setActivitySubTab(subTab);
    }
    setTimeout(() => {
      const el = document.getElementById("content-view");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0F172A]">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
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
          setActiveTab={handleTabChange}
          listingsCount={listings.length}
          auctionsCount={auctions.length}
          settledVolumeZec={settledVolumeZec}
          latestItem={latestItem}
          onOpenBid={(auction) => setBidAuction(auction)}
          onOpenPayment={(item, type) => setPaymentItem({ item, type })}
        />

        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#1b5efa] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">Synchronizing Shielded State...</p>
          </div>
        ) : (
          <div id="content-view" className="scroll-mt-20 sm:scroll-mt-24 pt-2">
            {activeTab === "marketplace" && (
              <MarketplaceView
                listings={listings}
                onOpenPaymentModal={(item) => setPaymentItem({ item, type: "listing" })}
                onOpenReceiptModal={(item) => setReceiptItem({ item, type: "listing" })}
                openCreateModal={() => setCreateModalType("listing")}
              />
            )}

            {activeTab === "auctions" && (
              <SealedAuctionsView
                auctions={auctions}
                onOpenBidModal={(auction) => setBidAuction(auction)}
                onOpenUnsealModal={(auction) => setUnsealAuction(auction)}
                onOpenPaymentModal={(item) => setPaymentItem({ item, type: "auction" })}
                onOpenReceiptModal={(auction) => setReceiptItem({ item: auction, type: "auction" })}
                openCreateModal={() => setCreateModalType("auction")}
                refreshData={fetchData}
              />
            )}

            {activeTab === "activity" && (
              <ActivityView
                subTab={activitySubTab}
                onSubTabChange={(st) => setActivitySubTab(st)}
                onOpenPaymentModal={(item, type) => setPaymentItem({ item, type })}
                onOpenUnsealModal={(auction) => setUnsealAuction(auction)}
                onOpenReceiptModal={(item, type) => setReceiptItem({ item, type })}
              />
            )}
          </div>
        )}
      </main>

      {/* OpenSea-Style Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <p className="text-[12px] text-slate-500 font-medium">
          ZecWild — Shielded Sealed-Bid Auctions & Open Marketplace • Powered by Zcash Shielded Pools
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
          onOpenReceiptModal={(item, type) => setReceiptItem({ item, type })}
        />
      )}

      {receiptItem && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setReceiptItem(null)}
          entityType={receiptItem.type}
          item={receiptItem.item}
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
