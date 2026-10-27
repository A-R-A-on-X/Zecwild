"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";
import { getActiveProfile } from "@/lib/crypto/identity";

interface HeroShowcaseProps {
  onOpenCreate: (type: "listing" | "auction") => void;
  onOpenSimulator: () => void;
  activeTab: "marketplace" | "auctions" | "activity";
  setActiveTab: (tab: "marketplace" | "auctions" | "activity") => void;
  listingsCount: number;
  auctionsCount: number;
}

export default function HeroShowcase({
  onOpenCreate,
  onOpenSimulator,
  activeTab,
  setActiveTab,
  listingsCount,
  auctionsCount,
}: HeroShowcaseProps) {
  const profile = getActiveProfile();
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantStatus, setAssistantStatus] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleAssistantAction = (action: string) => {
    if (action === "simulate") {
      onOpenSimulator();
    } else if (action === "copy") {
      handleCopy();
      setAssistantStatus("Shielded address copied to clipboard!");
      setTimeout(() => setAssistantStatus(null), 3000);
    } else if (action === "marketplace") {
      setActiveTab("marketplace");
    } else if (action === "auctions") {
      setActiveTab("auctions");
    } else if (action === "activity") {
      setActiveTab("activity");
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
      setActiveTab("activity");
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
      {/* 1. Metric Overview Cards (Inspired by Image 2 - Modern Dashboard KPI strip) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Shielded Volume -> Click to view audit log */}
        <div
          onClick={() => setActiveTab("activity")}
          className="card-static p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#D96522]/40 transition-all group"
          title="Click to view on-chain audit trail"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949089] group-hover:text-[#D96522] transition-colors">
              Shielded Volume
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FCEFE7] flex items-center justify-center text-[#D96522]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1A1816] font-mono">
              12.85 <span className="text-sm text-[#C85A17] font-semibold">ZEC</span>
            </div>
            <div className="text-[11px] text-[#66635F] mt-0.5 flex items-center space-x-1">
              <span className="text-emerald-700 font-bold">100%</span>
              <span>Shielded P2P Settlements</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Listings -> Click to view marketplace */}
        <div
          onClick={() => setActiveTab("marketplace")}
          className="card-static p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#D96522]/40 transition-all group"
          title="Click to explore marketplace listings"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949089] group-hover:text-[#D96522] transition-colors">
              Active Listings
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FCEFE7] flex items-center justify-center text-[#D96522]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1A1816] font-mono">
              {listingsCount} <span className="text-sm text-[#66635F] font-normal">items</span>
            </div>
            <div className="text-[11px] text-[#66635F] mt-0.5">
              Fixed-price direct sales
            </div>
          </div>
        </div>

        {/* Metric 3: Sealed Auctions -> Click to view auctions */}
        <div
          onClick={() => setActiveTab("auctions")}
          className="card-static p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#D96522]/40 transition-all group"
          title="Click to explore live sealed auctions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949089] group-hover:text-[#D96522] transition-colors">
              Sealed Auctions
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FCEFE7] flex items-center justify-center text-[#D96522]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1A1816] font-mono">
              {auctionsCount} <span className="text-sm text-[#66635F] font-normal">live</span>
            </div>
            <div className="text-[11px] text-[#66635F] mt-0.5">
              Client-side RSA-OAEP sealed
            </div>
          </div>
        </div>

        {/* Metric 4: Indexer Gateway -> Click to open simulator testbed */}
        <div
          onClick={onOpenSimulator}
          className="card-static p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
          title="Click to launch zechack simulator testbed"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949089] group-hover:text-emerald-700 transition-colors">
              Indexer Gateway
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-bold text-emerald-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>zechack Connected</span>
              <ExternalLink className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="text-[11px] text-[#66635F] mt-0.5 truncate font-mono">
              Click to launch testbed
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Hero Showcase with Floating Assistant (Directly inspired by Image 1 & 3 layout) */}
      <div className="relative rounded-3xl bg-white border border-black/[0.06] p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
        {/* Subtle burnt orange ambient glow in background */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D96522]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FCEFE7] border border-[#D96522]/20 text-[#A7430B] text-xs font-bold">
              <Shield className="w-4 h-4 text-[#D96522]" />
              <span>Shielded Zcash • Zero Platform Custody</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A1816] tracking-tight leading-[1.15]">
              Peer-to-Peer Commerce with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D96522] via-[#C85A17] to-[#A7430B]">
                Cryptographic Sealing
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#66635F] leading-relaxed max-w-xl">
              Bid in sealed auctions without information leakage, or buy items instantly with direct wallet-to-wallet shielded ZEC transactions. All payments verified on-chain by the <strong>ZecShield Gateway</strong> indexer.
            </p>

            {/* Quick Feature Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                onClick={() => onOpenCreate("listing")}
                className="px-5 py-2.5 rounded-full btn-orange-primary text-xs font-bold flex items-center space-x-2"
              >
                <span>Create Marketplace Listing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenCreate("auction")}
                className="px-5 py-2.5 rounded-full btn-orange-pill text-xs font-bold flex items-center space-x-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Launch Sealed Auction</span>
              </button>

              <a
                href="https://github.com/TheWebDevEhi/zechack"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[#1A1816] text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <span>Indexer GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#66635F]" />
              </a>
            </div>
          </div>

          {/* Right Floating Assistant Card (Directly inspired by Image 1's floating widget) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-[#F8F7F4] border border-black/[0.08] p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D96522] to-[#A7430B] flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1816]">Shielded Assistant</h3>
                    <p className="text-[11px] text-[#66635F]">ZecWild Navigator & Simulator</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              </div>

              {/* Action Grid (Inspired by Book a rent / Analysis / Insurance in Image 1) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAssistantAction("simulate")}
                  className="p-3 rounded-2xl bg-white border border-black/[0.06] hover:border-[#D96522]/30 hover:bg-[#FCEFE7] transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Zap className="w-4 h-4 text-[#D96522]" />
                    <span className="text-[9px] text-[#949089] font-mono">Testbed</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A1816] group-hover:text-[#A7430B]">
                    Simulate Payment
                  </div>
                  <div className="text-[10px] text-[#66635F]">Test indexer note</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("copy")}
                  className="p-3 rounded-2xl bg-white border border-black/[0.06] hover:border-[#D96522]/30 hover:bg-[#FCEFE7] transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Copy className="w-4 h-4 text-[#D96522]" />
                    <span className="text-[9px] text-[#949089] font-mono">Identity</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A1816] group-hover:text-[#A7430B]">
                    Copy Address
                  </div>
                  <div className="text-[10px] text-[#66635F]">Active shielded key</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("marketplace")}
                  className="p-3 rounded-2xl bg-white border border-black/[0.06] hover:border-[#D96522]/30 hover:bg-[#FCEFE7] transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Package className="w-4 h-4 text-[#D96522]" />
                    <span className="text-[9px] text-[#949089] font-mono">Market</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A1816] group-hover:text-[#A7430B]">
                    View Listings
                  </div>
                  <div className="text-[10px] text-[#66635F]">Fixed-price sales</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssistantAction("auctions")}
                  className="p-3 rounded-2xl bg-white border border-black/[0.06] hover:border-[#D96522]/30 hover:bg-[#FCEFE7] transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Lock className="w-4 h-4 text-[#D96522]" />
                    <span className="text-[9px] text-[#949089] font-mono">Sealed</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A1816] group-hover:text-[#A7430B]">
                    Explore Bids
                  </div>
                  <div className="text-[10px] text-[#66635F]">Blind auctions</div>
                </button>
              </div>

              {/* Status Notice if triggered */}
              {assistantStatus && (
                <div className="p-2.5 rounded-xl bg-[#FCEFE7] text-[#A7430B] text-xs font-medium border border-[#D96522]/20 animate-in fade-in">
                  {assistantStatus}
                </div>
              )}

              {/* Chat / Command Input Bar (Directly inspired by Image 1 bottom bar) */}
              <form onSubmit={handleAssistantSend} className="relative pt-1">
                <input
                  type="text"
                  value={assistantPrompt}
                  onChange={(e) => setAssistantPrompt(e.target.value)}
                  placeholder="Ask assistant or type 'simulate', 'auctions'..."
                  className="w-full pl-4 pr-24 py-2.5 rounded-2xl bg-white border border-black/[0.08] text-xs text-[#1A1816] placeholder-[#949089] focus:outline-none focus:border-[#D96522]"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-2 px-3.5 py-1.5 rounded-xl btn-orange-primary text-xs font-bold flex items-center space-x-1"
                >
                  <span>Go</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
