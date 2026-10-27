"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  ShoppingBag,
  PlusCircle,
  Zap,
  User,
  CheckCircle2,
  ChevronDown,
  Layers,
  Activity,
} from "lucide-react";
import {
  getActiveProfile,
  setActiveProfile,
  DEMO_PERSONAS,
  ShieldedProfile,
} from "@/lib/crypto/identity";
import { formatAddress } from "@/lib/crypto/zcash";

interface NavbarProps {
  activeTab: "marketplace" | "auctions" | "activity";
  setActiveTab: (tab: "marketplace" | "auctions" | "activity") => void;
  openCreateModal: (type: "listing" | "auction") => void;
  openSimulatorModal: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  openCreateModal,
  openSimulatorModal,
}: NavbarProps) {
  const [profile, setProfile] = useState<ShieldedProfile>(DEMO_PERSONAS[0]);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

  const createRef = React.useRef<HTMLDivElement>(null);
  const personaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile(getActiveProfile());
    const handler = (e: any) => {
      if (e.detail) setProfile(e.detail);
    };
    window.addEventListener("zecwild_profile_changed", handler);
    return () => window.removeEventListener("zecwild_profile_changed", handler);
  }, []);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateDropdownOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreateDropdownOpen(false);
        setPersonaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectPersona = (p: ShieldedProfile) => {
    setActiveProfile(p);
    setProfile(p);
    setPersonaDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("marketplace")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 p-[2px]">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white">ZecWild</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Shielded
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Zero-Custody • Sealed Auctions
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "marketplace"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => setActiveTab("auctions")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "auctions"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sealed-Bid Auctions</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "activity"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity & Audits</span>
          </button>
        </nav>

        {/* Action Controls & Identity Switcher */}
        <div className="flex items-center space-x-3">
          {/* Webhook Testbed Simulator Button */}
          <button
            onClick={openSimulatorModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
            title="Open ZecShield Gateway Webhook Simulator"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
            <span className="hidden sm:inline">Webhook Testbed</span>
          </button>

          {/* Create Menu */}
          <div ref={createRef} className="relative">
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-semibold shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {createDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl glass-panel p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setCreateDropdownOpen(false)}
              >
                <button
                  onClick={() => openCreateModal("listing")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center space-x-2.5 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">New Listing</div>
                    <div className="text-[11px] text-slate-400">Fixed-price marketplace</div>
                  </div>
                </button>

                <button
                  onClick={() => openCreateModal("auction")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-amber-500/10 hover:text-amber-300 flex items-center space-x-2.5 transition-colors mt-1"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold">New Sealed Auction</div>
                    <div className="text-[11px] text-slate-400">Client-sealed bids</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Persona / Shielded Identity Switcher */}
          <div ref={personaRef} className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-200">{profile.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {personaDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl glass-panel p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2 border-b border-slate-800">
                  Switch Active Persona
                </div>
                <div className="space-y-1 mt-2">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPersona(p)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between ${
                        profile.id === p.id
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {p.addressType}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                          {formatAddress(p.address, 10, 8)}
                        </div>
                      </div>
                      {profile.id === p.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
