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
                onOpenPaymentModal={(item, type) => setPaymentItem({ item, type })}
                onOpenUnsealModal={(auction) => setUnsealAuction(auction)}
                onOpenReceiptModal={(item, type) => setReceiptItem({ item, type })}
              />
            )}
          </div>
        )}
      </main>

      {/* Security Architecture & Verifiable Links Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-8 px-4 text-center text-xs text-[#66635F] space-y-3 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-[#66635F]">
          <a
            href="https://zips.z.cash/zip-0321"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-emerald-800 font-semibold hover:underline"
            title="Read Zcash ZIP-321 Payment URI Specification"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Platform Custody (ZIP-321)</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
          <span className="text-[#949089] hidden sm:inline">•</span>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-[#A7430B] font-semibold hover:underline"
            title="Read WebCrypto SubtleCrypto standard"
          >
            <Lock className="w-3.5 h-3.5 text-[#D96522]" />
            <span>Client-Side RSA-OAEP Sealing</span>
            <ExternalLink className="w-3 h-3 text-[#D96522]" />
          </a>
          <span className="text-[#949089] hidden sm:inline">•</span>
          <a
            href="https://github.com/TheWebDevEhi/zechack"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-[#1A1816] font-semibold hover:underline"
            title="View the zechack ZecShield Gateway Indexer on GitHub"
          >
            <Terminal className="w-3.5 h-3.5 text-[#C85A17]" />
            <span>ZecShield Gateway Indexer (`zechack`)</span>
            <ExternalLink className="w-3 h-3 text-[#1A1816]" />
          </a>
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
