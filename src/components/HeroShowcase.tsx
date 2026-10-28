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
  Clock,
  CheckCircle2,
  ChevronRight,
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
      setAssistantStatus("Opening Payment Simulator...");
    } else if (lower.includes("bid") || lower.includes("auction") || lower.includes("seal")) {
      setActiveTab("auctions");
      setAssistantStatus("Navigating to Sealed-Bid Auctions...");
    } else if (lower.includes("buy") || lower.includes("market") || lower.includes("list")) {
      setActiveTab("marketplace");
      setAssistantStatus("Navigating to Open Marketplace...");
    } else if (lower.includes("audit") || lower.includes("receipt") || lower.includes("vault")) {
      setActiveTab("activity", "audits");
      setAssistantStatus("Navigating to Activity & Vault...");
    } else {
      setAssistantStatus(`Navigating inventory for "${assistantPrompt}"...`);
      setActiveTab("marketplace");
    }
    setAssistantPrompt("");
    setTimeout(() => setAssistantStatus(null), 3500);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* 
        Hero Stage Canvas with Live Item / Auction Imagery Backdrop
        Inspired directly by Image 1 & Image 3: The featured asset forms the visual home backdrop,
        with floating interactive quick-action cards and clean controls overlaid.
      */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[460px] sm:min-h-[500px] lg:min-h-[520px] shadow-sm flex flex-col justify-between p-5 sm:p-8 lg:p-10">
        {/* Background Visual Showcase Canvas */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=2000&q=85"
            alt="Shielded Auctions & Marketplace"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.7] contrast-[1.05]"
          />
          {/* Subtle multi-stop gradient overlay for crisp text readability across breakpoints */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
          {/* Ambient Royal Blue Glow Accent */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1b5efa]/25 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Header Pill Bar Over Background */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Featured Sealed Drop • Live on ZecWild</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md ${
                activeTab === "marketplace"
                  ? "bg-[#1b5efa] text-white shadow-sm"
                  : "bg-black/40 text-slate-200 hover:bg-black/60 border border-white/10"
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab("auctions")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md ${
                activeTab === "auctions"
                  ? "bg-[#1b5efa] text-white shadow-sm"
                  : "bg-black/40 text-slate-200 hover:bg-black/60 border border-white/10"
              }`}
            >
              Sealed Auctions
            </button>
          </div>
        </div>

        {/* Middle Stage: Left Item Headline + Right Floating Action Widget */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end my-auto py-6">
          {/* Left Title & Key Details */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 text-white/80 text-xs font-medium">
              <span>Cypherpunk Hardware Vault</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1b5efa]" />
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Genesis Hardware Node <span className="text-[#1b5efa]">#001</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Cryptographically sealed blind auction with zero on-chain bid leakage. Bid privately or buy digital assets and physical hardware with direct wallet-to-wallet settlements.
            </p>

            {/* Quick Action Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs flex items-center space-x-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Reserve:</span>
                <span className="font-black text-sm text-[#1b5efa]">0.75 ZEC</span>
              </div>

              <button
                onClick={() => setActiveTab("auctions")}
                className="px-5 py-2.5 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold flex items-center space-x-2 shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Place Sealed Bid</span>
              </button>

              <button
                onClick={() => setActiveTab("marketplace")}
                className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold flex items-center space-x-1.5 backdrop-blur-md transition-colors"
              >
                <span>Browse Listings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Floating Assistant / Quick Action Card (Directly inspired by Image 1's floating widget) */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-4 sm:p-5 shadow-2xl space-y-3.5 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#1b5efa] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Shielded Navigator</h3>
                    <p className="text-[10px] text-slate-500">Quick Actions & Search</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Ready
                </span>
              </div>

              {/* 4 Action Buttons Grid (Inspired by Book a rent / Analysis in Image 1) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAssistantAction("marketplace")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] border border-slate-200/80 hover:border-[#1b5efa]/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Package className="w-3.5 h-3.5 text-[#1b5efa]" />
                    <span className="text-[9px] text-slate-400 font-mono">Market</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#1b5efa]">
                    View Listings
                  </div>
                  <div className="text-[10px] text-slate-500">Fixed-price buy</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("auctions")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] border border-slate-200/80 hover:border-[#1b5efa]/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Lock className="w-3.5 h-3.5 text-[#1b5efa]" />
                    <span className="text-[9px] text-slate-400 font-mono">Blind Bids</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#1b5efa]">
                    Sealed Auctions
                  </div>
                  <div className="text-[10px] text-slate-500">Encrypted bids</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("copy")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] border border-slate-200/80 hover:border-[#1b5efa]/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Copy className="w-3.5 h-3.5 text-[#1b5efa]" />
                    <span className="text-[9px] text-slate-400 font-mono">Wallet</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#1b5efa]">
                    Copy Address
                  </div>
                  <div className="text-[10px] text-slate-500">Active shielded key</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("simulate")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] border border-slate-200/80 hover:border-[#1b5efa]/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#1b5efa]" />
                    <span className="text-[9px] text-slate-400 font-mono">Test</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#1b5efa]">
                    Simulate Payment
                  </div>
                  <div className="text-[10px] text-slate-500">Test note settlement</div>
                </button>
              </div>

              {/* Status Notice if triggered */}
              {assistantStatus && (
                <div className="p-2 rounded-xl bg-[#eff4ff] text-[#1b5efa] text-xs font-medium border border-[#1b5efa]/20 animate-in fade-in flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1b5efa] flex-shrink-0" />
                  <span>{assistantStatus}</span>
                </div>
              )}

              {/* Chat / Command Input Bar (Directly inspired by Image 1 bottom bar) */}
              <form onSubmit={handleAssistantSend} className="relative pt-0.5">
                <input
                  type="text"
                  value={assistantPrompt}
                  onChange={(e) => setAssistantPrompt(e.target.value)}
                  placeholder="Ask assistant or type 'simulate', 'auctions'..."
                  className="w-full pl-3.5 pr-20 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b5efa] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1.5 px-3 py-1 rounded-lg bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <span>Go</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Bottom Metric Overview Cards Strip
        (Directly inspired by the 3 bottom cards in Image 1: My Location / My Dates / Payment Method)
        Clean, user-centric metrics with no internal indexer jargon!
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Shielded Volume */}
        <div
          onClick={() => setActiveTab("activity", "audits")}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#1b5efa]/40 hover:shadow-sm transition-all group"
          title="Click to view settlement vault"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1b5efa] transition-colors">
              Shielded Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#1b5efa]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {settledVolumeZec.toFixed(2)} <span className="text-sm text-[#1b5efa] font-semibold">ZEC</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">100%</span>
              <span>Shielded Settlements</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Marketplace Listings */}
        <div
          onClick={() => setActiveTab("marketplace")}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#1b5efa]/40 hover:shadow-sm transition-all group"
          title="Click to view marketplace listings"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1b5efa] transition-colors">
              Marketplace Listings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#1b5efa]">
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
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#1b5efa]/40 hover:shadow-sm transition-all group"
          title="Click to view live sealed auctions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1b5efa] transition-colors">
              Sealed Auctions
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#1b5efa]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {auctionsCount} <span className="text-sm text-slate-500 font-normal">live</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Encrypted blind bids
            </div>
          </div>
        </div>

        {/* Metric 4: Shielded Security (Replaces technical indexer details!) */}
        <div
          onClick={onOpenSimulator}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#1b5efa]/40 hover:shadow-sm transition-all group"
          title="Click to open payment simulator"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1b5efa] transition-colors">
              Shielded Security
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#1b5efa]">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero Knowledge</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">
              Direct P2P Settlement
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
