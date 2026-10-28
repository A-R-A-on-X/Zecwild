"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Zap,
  TrendingUp,
  Key,
  Copy,
  Check,
  Package,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface HeroShowcaseProps {
  onOpenCreate: (type: "listing" | "auction") => void;
  onOpenSimulator: () => void;
  activeTab: "marketplace" | "auctions" | "activity";
  setActiveTab: (tab: "marketplace" | "auctions" | "activity", subTab?: "seller" | "buyer" | "audits") => void;
  listingsCount: number;
  auctionsCount: number;
  settledVolumeZec?: number;
}

export default function HeroShowcase({
  onOpenCreate,
  onOpenSimulator,
  activeTab,
  setActiveTab,
  listingsCount,
  auctionsCount,
  settledVolumeZec = 0,
}: HeroShowcaseProps) {
  const [profile, setProfile] = useState(getActiveProfile());
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantStatus, setAssistantStatus] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  useEffect(() => {
    setProfile(getActiveProfile());
    const handler = (e: any) => setProfile(e.detail);
    window.addEventListener("zecwild_profile_changed", handler);
    return () => window.removeEventListener("zecwild_profile_changed", handler);
  }, []);

  const handleCopy = () => {
    if (profile?.address) {
      navigator.clipboard.writeText(profile.address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleAssistantAction = (action: string) => {
    if (action === "simulate") {
      onOpenSimulator();
    } else if (action === "copy") {
      if (profile?.address) {
        handleCopy();
        setAssistantStatus("Shielded address copied to clipboard!");
      } else {
        setAssistantStatus("No shielded wallet connected. Connect in header above!");
      }
      setTimeout(() => setAssistantStatus(null), 3000);
    } else if (action === "marketplace") {
      setActiveTab("marketplace");
    } else if (action === "auctions") {
      setActiveTab("auctions");
    } else if (action === "activity") {
      setActiveTab("activity", "audits");
    }
  };

  const handleAssistantSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantPrompt.trim()) return;
    const lower = assistantPrompt.toLowerCase();
    if (lower.includes("simulat") || lower.includes("pay") || lower.includes("test")) {
      onOpenSimulator();
      setAssistantStatus("Opening ZecShield Webhook Simulator...");
    } else if (lower.includes("bid") || lower.includes("auction") || lower.includes("seal")) {
      setActiveTab("auctions");
      setAssistantStatus("Navigating to Sealed-Bid Auctions...");
    } else if (lower.includes("buy") || lower.includes("market") || lower.includes("list")) {
      setActiveTab("marketplace");
      setAssistantStatus("Navigating to Open Marketplace...");
    } else if (lower.includes("audit") || lower.includes("receipt") || lower.includes("vault")) {
      setActiveTab("activity", "audits");
      setAssistantStatus("Navigating to Activity & Audit Vault...");
    } else {
      setAssistantStatus(`Navigating inventory for "${assistantPrompt}"...`);
      setActiveTab("marketplace");
    }
    setAssistantPrompt("");
    setTimeout(() => setAssistantStatus(null), 3500);
  };

  return (
    <section className="space-y-6">
      {/* 1. OpenSea-Style Spotlight Hero Banner */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
        {/* Soft Electric Blue ambient glow in background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#094ae0]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#094ae0]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EEF4FF] border border-[#094ae0]/20 text-[#094ae0] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#094ae0] animate-pulse" />
              <span>Shielded Zcash Marketplace • Ironwood (NU6.3) Ready</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Explore, Collect & Bid on{" "}
              <span className="text-[#094ae0]">
                Shielded Digital Assets
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              The premier peer-to-peer marketplace powered by Zcash. Participate in cryptographically sealed blind auctions or buy physical and digital items with direct wallet-to-wallet transactions verified on-chain by the <strong>ZecShield Gateway</strong> indexer.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("marketplace")}
                className="px-6 py-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenCreate("auction")}
                className="px-5 py-3 rounded-xl bg-[#EEF4FF] hover:bg-[#dbe7ff] text-[#094ae0] border border-[#094ae0]/20 text-xs font-bold flex items-center space-x-2 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Launch Sealed Auction</span>
              </button>

              <button
                onClick={() => onOpenCreate("listing")}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-2 transition-colors"
              >
                <Package className="w-3.5 h-3.5 text-[#094ae0]" />
                <span>Create Listing</span>
              </button>
            </div>

            {/* Interactive Search / Assistant Command Bar */}
            <div className="pt-2 max-w-xl">
              <form onSubmit={handleAssistantSend} className="relative">
                <input
                  type="text"
                  value={assistantPrompt}
                  onChange={(e) => setAssistantPrompt(e.target.value)}
                  placeholder="Search shielded items, type 'simulate', 'auctions', 'audits'..."
                  className="w-full pl-4 pr-24 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#094ae0] focus:bg-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-4 py-2 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <span>Go</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>

              {assistantStatus && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#EEF4FF] text-[#094ae0] text-xs font-medium border border-[#094ae0]/20 animate-in fade-in flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#094ae0] flex-shrink-0" />
                  <span>{assistantStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right OpenSea-Style Featured Spotlight Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              {/* Media Spotlight Container */}
              <div className="relative aspect-4/3 sm:aspect-16/10 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80"
                  alt="Featured Shielded Auction"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#094ae0] text-white shadow-md flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured Drop</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white shadow-sm flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-[#094ae0]" />
                    <span>Sealed</span>
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white backdrop-blur-md shadow-sm flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Live Auction</span>
                  </span>
                </div>

                {/* Bottom Overlay Info on Media */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#094ae0]" />
                    <span>Closes 24h</span>
                  </div>
                  <div className="text-[11px] font-mono bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    RSA-2048 Encrypted
                  </div>
                </div>
              </div>

              {/* Spotlight Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mb-1">
                      <span>ZecWild Genesis Collection</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#094ae0]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#094ae0] transition-colors">
                      Cypherpunk Hardware Key #001
                    </h3>
                  </div>
                </div>

                {/* OpenSea Price & CTA Block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Reserve Price
                    </div>
                    <div className="text-lg font-black font-mono text-slate-900 flex items-baseline space-x-1">
                      <span className="text-[#094ae0]">0.75</span>
                      <span className="text-xs text-slate-500 font-bold">ZEC</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("auctions")}
                    className="px-4 py-2.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Place Sealed Bid</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OpenSea-Style Collection Metrics & Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Shielded Volume */}
        <div
          onClick={() => setActiveTab("activity", "audits")}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#094ae0]/50 hover:shadow-sm transition-all group"
          title="Click to view on-chain audit trail"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#094ae0] transition-colors">
              Shielded Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-[#094ae0]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {settledVolumeZec.toFixed(2)} <span className="text-sm text-[#094ae0] font-semibold">ZEC</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">100%</span>
              <span>Shielded P2P Settlements</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Listings */}
        <div
          onClick={() => setActiveTab("marketplace")}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#094ae0]/50 hover:shadow-sm transition-all group"
          title="Click to explore marketplace listings"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#094ae0] transition-colors">
              Marketplace Listings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-[#094ae0]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {listingsCount} <span className="text-sm text-slate-500 font-normal">items</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Fixed-price instant buy
            </div>
          </div>
        </div>

        {/* Metric 3: Sealed Auctions */}
        <div
          onClick={() => setActiveTab("auctions")}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#094ae0]/50 hover:shadow-sm transition-all group"
          title="Click to explore live sealed auctions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#094ae0] transition-colors">
              Sealed Auctions
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-[#094ae0]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {auctionsCount} <span className="text-sm text-slate-500 font-normal">live</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Client-side RSA-OAEP sealed
            </div>
          </div>
        </div>

        {/* Metric 4: Indexer Gateway */}
        <div
          onClick={onOpenSimulator}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 hover:shadow-sm transition-all group"
          title="Click to launch simulator testbed"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors">
              Indexer Gateway
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-bold text-emerald-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ironwood Ready</span>
              <ExternalLink className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">
              Mainnet & Testnet Simulator
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
