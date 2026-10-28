"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  ShoppingBag,
  PlusCircle,
  Zap,
  CheckCircle2,
  ChevronDown,
  Activity,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Menu,
  X,
  RotateCcw,
  ExternalLink,
  Info,
  Globe,
  Layers,
} from "lucide-react";
import {
  getActiveProfile,
  setActiveProfile,
  DEFAULT_DEMO_PERSONAS,
  ShieldedProfile,
  getAllProfiles,
  addCustomProfile,
  generateRandomShieldedProfile,
  deleteProfile,
  restoreDemoPersonas,
  getDeletedPersonaIds,
  getActiveNetwork,
  setActiveNetwork,
} from "@/lib/crypto/identity";
import { formatAddress, isShieldedAddress, ZecNetwork } from "@/lib/crypto/zcash";

interface NavbarProps {
  activeTab: "marketplace" | "auctions" | "activity";
  setActiveTab: (tab: "marketplace" | "auctions" | "activity", subTab?: "seller" | "buyer" | "audits") => void;
  openCreateModal: (type: "listing" | "auction") => void;
  openSimulatorModal: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  openCreateModal,
  openSimulatorModal,
}: NavbarProps) {
  const [profile, setProfile] = useState<ShieldedProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<ShieldedProfile[]>([]);
  const [activeNetwork, setActiveNetworkState] = useState<ZecNetwork>("mainnet");
  const [hasDeletedDemos, setHasDeletedDemos] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [copiedActive, setCopiedActive] = useState(false);

  const createRef = React.useRef<HTMLDivElement>(null);
  const personaRef = React.useRef<HTMLDivElement>(null);

  const reloadProfiles = () => {
    setProfile(getActiveProfile());
    setAllProfiles(getAllProfiles());
    setHasDeletedDemos(getDeletedPersonaIds().length > 0);
    setActiveNetworkState(getActiveNetwork());
  };

  useEffect(() => {
    reloadProfiles();
    const handler = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
        setAllProfiles(getAllProfiles());
        setHasDeletedDemos(getDeletedPersonaIds().length > 0);
      }
    };
    const netHandler = (e: any) => {
      if (e.detail) {
        setActiveNetworkState(e.detail);
      }
    };

    window.addEventListener("zecwild_profile_changed", handler);
    window.addEventListener("zecwild_network_changed", netHandler);
    return () => {
      window.removeEventListener("zecwild_profile_changed", handler);
      window.removeEventListener("zecwild_network_changed", netHandler);
    };
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
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNetworkChange = (newNet: ZecNetwork) => {
    setActiveNetwork(newNet);
    setActiveNetworkState(newNet);

    // Switch to appropriate persona matching the network if current doesn't match
    const profiles = getAllProfiles();
    const matching = profiles.find((p) => p.network === newNet);
    if (matching && profile?.network !== newNet) {
      selectPersona(matching);
    }
  };

  const selectPersona = (p: ShieldedProfile) => {
    setActiveProfile(p);
    setProfile(p);
    if (p.network && p.network !== activeNetwork) {
      setActiveNetwork(p.network);
      setActiveNetworkState(p.network);
    }
    setPersonaDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleCopyActive = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedActive(true);
    setTimeout(() => setCopiedActive(false), 2000);
  };

  const handleConnectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    if (!customAddress || !isShieldedAddress(customAddress)) {
      setCustomError("Enter a valid Orchard/Ironwood (u1..., utest1...) or Sapling (zs1..., ztestsapling1...) address.");
      return;
    }
    const newProf = addCustomProfile(customName || "My Shielded Wallet", customAddress);
    setProfile(newProf);
    reloadProfiles();
    setCustomName("");
    setCustomAddress("");
    setShowAddCustom(false);
    setPersonaDropdownOpen(false);
  };

  const handleGenerateRandom = () => {
    const fresh = generateRandomShieldedProfile("Shielded Test User", activeNetwork);
    setProfile(fresh);
    reloadProfiles();
    setShowAddCustom(false);
    setPersonaDropdownOpen(false);
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProfile(id);
    reloadProfiles();
  };

  const handleRestoreDemos = (e: React.MouseEvent) => {
    e.stopPropagation();
    restoreDemoPersonas();
    reloadProfiles();
  };

  const demoList = allProfiles.filter((p) => p.isDemo);
  const customList = allProfiles.filter((p) => !p.isDemo);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-[#FFFFFF]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Brand Logo -> Click resets view to marketplace */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer select-none group flex-shrink-0"
          onClick={() => {
            setActiveTab("marketplace");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title="Return to ZecWild Marketplace"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D96522] to-[#A7430B] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black tracking-tight text-[#1A1816]">ZecWild</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wide uppercase hidden sm:inline-flex">
              🌲 Ironwood
            </span>
          </div>
        </div>

        {/* Center Pill Segmented Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#EAE9E4] p-1 rounded-full border border-black/[0.04]">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "marketplace"
                ? "bg-white text-[#1A1816] shadow-xs"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            <ShoppingBag
              className={`w-3.5 h-3.5 ${
                activeTab === "marketplace" ? "text-[#D96522]" : "text-[#66635F]"
              }`}
            />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => setActiveTab("auctions")}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "auctions"
                ? "bg-white text-[#1A1816] shadow-xs"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            <Lock
              className={`w-3.5 h-3.5 ${
                activeTab === "auctions" ? "text-[#D96522]" : "text-[#66635F]"
              }`}
            />
            <span>Sealed Auctions</span>
          </button>

          <button
            onClick={() => setActiveTab("activity", "audits")}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "activity"
                ? "bg-white text-[#1A1816] shadow-xs"
                : "text-[#66635F] hover:text-[#1A1816]"
            }`}
          >
            <Activity
              className={`w-3.5 h-3.5 ${
                activeTab === "activity" ? "text-[#D96522]" : "text-[#66635F]"
              }`}
            />
            <span>Activity & Audit</span>
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Network Switcher Toggle Pill */}
          <div className="flex items-center space-x-0.5 bg-[#EAE9E4] p-0.5 rounded-full border border-black/[0.04]">
            <button
              onClick={() => handleNetworkChange("mainnet")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                activeNetwork === "mainnet"
                  ? "bg-white text-[#1A1816] shadow-xs"
                  : "text-[#66635F] hover:text-[#1A1816]"
              }`}
              title="Zcash Mainnet"
            >
              Mainnet
            </button>
            <button
              onClick={() => handleNetworkChange("testnet")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                activeNetwork === "testnet"
                  ? "bg-[#FCEFE7] text-[#A7430B] border border-[#D96522]/30 shadow-xs"
                  : "text-[#66635F] hover:text-[#1A1816]"
              }`}
              title="Zcash Testnet (utest1 / ztestsapling1)"
            >
              🧪 Testnet
            </button>
          </div>

          {/* Quick Webhook Simulator Icon Button */}
          <button
            onClick={openSimulatorModal}
            className="hidden sm:flex p-2 rounded-full bg-white hover:bg-[#FCEFE7] text-[#D96522] border border-black/[0.08] hover:border-[#D96522]/30 shadow-xs transition-colors"
            title="Launch Webhook Simulator Testbed"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          {/* Create Button Dropdown */}
          <div ref={createRef} className="relative">
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full btn-orange-primary text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {createDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-black/[0.08]">
                <button
                  onClick={() => {
                    openCreateModal("listing");
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-[#1A1816] hover:bg-[#FCEFE7] hover:text-[#A7430B] flex items-center space-x-3 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-100 text-[#D96522]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">New Listing</div>
                    <div className="text-[11px] text-[#66635F]">Fixed-price marketplace</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    openCreateModal("auction");
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-[#1A1816] hover:bg-[#FCEFE7] hover:text-[#A7430B] flex items-center space-x-3 transition-colors mt-1"
                >
                  <div className="p-2 rounded-lg bg-orange-100 text-[#D96522]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">New Sealed Auction</div>
                    <div className="text-[11px] text-[#66635F]">Client-sealed bids</div>
                  </div>
                </button>

                <div className="my-1 border-t border-black/[0.05]" />

                <button
                  onClick={() => {
                    openSimulatorModal();
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-[#1A1816] hover:bg-[#FCEFE7] hover:text-[#A7430B] flex items-center space-x-3 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-100 text-[#D96522]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Webhook Simulator</div>
                    <div className="text-[11px] text-[#66635F]">Test shielded payments</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Persona / Shielded Account Switcher */}
          <div ref={personaRef} className="relative">
            {profile ? (
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-mono bg-white border border-black/[0.08] hover:border-[#D96522]/40 shadow-sm transition-all"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    profile.network === "testnet" ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span className="font-bold text-[#1A1816] max-w-[90px] sm:max-w-[120px] truncate">
                  {profile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#949089]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowAddCustom(true);
                  setPersonaDropdownOpen(!personaDropdownOpen);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold bg-[#FCEFE7] hover:bg-[#F8E2D5] border border-[#D96522]/30 hover:border-[#D96522] text-[#A7430B] shadow-xs transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-[#D96522]" />
                <span className="hidden sm:inline">Connect Shielded Identity</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            {personaDropdownOpen && (
              <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-3xl bg-white p-5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-black/[0.08] space-y-4 text-left">
                {/* Active Account Details */}
                {profile ? (
                  <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#C85A17] flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active Identity</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                          🌲 {profile.addressType}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono font-bold uppercase">
                          {profile.network || "mainnet"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[#1A1816]">{profile.name}</div>
                      <button
                        onClick={() => {
                          setActiveProfile(null);
                          setProfile(null);
                          reloadProfiles();
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                        title="Disconnect current identity"
                      >
                        Disconnect
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[#66635F] pt-1 border-t border-black/[0.04]">
                      <span className="font-mono text-[11px] truncate max-w-[220px]">
                        {profile.address}
                      </span>
                      <button
                        onClick={() => handleCopyActive(profile.address)}
                        className="p-1 rounded-md hover:bg-white text-[#1A1816] transition-colors"
                        title="Copy Full Shielded Address"
                      >
                        {copiedActive ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#66635F]" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/20 space-y-1.5">
                    <div className="flex items-center space-x-2 text-[#A7430B] font-bold text-xs">
                      <Shield className="w-4 h-4 text-[#D96522]" />
                      <span>No Shielded Identity Connected</span>
                    </div>
                    <p className="text-[11px] text-[#66635F] leading-relaxed">
                      Connect a custom shielded address (Orchard/Sapling) or generate an instant test identity to list, buy, or participate in sealed auctions.
                    </p>
                  </div>
                )}

                {/* Ironwood & Testnet Status Notice */}
                <div className="p-3 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/20 text-[11px] text-[#A7430B] flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-[#D96522] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Ironwood (NU6.3) Activated:</strong> Fully compatible with Ironwood Unified receivers and Sapling notes across Mainnet and Testnet.
                  </span>
                </div>

                {/* Demo Personas List with Delete & Restore */}
                {demoList.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#949089]">
                        ⚡ Demo Personas
                      </span>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {demoList.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPersona(p)}
                          className={`w-full text-left p-2.5 rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                            profile?.id === p.id
                              ? "bg-[#FCEFE7] border border-[#D96522]/30 text-[#A7430B]"
                              : "hover:bg-[#F8F7F4] text-[#1A1816] border border-black/[0.04]"
                          }`}
                        >
                          <div className="truncate max-w-[200px]">
                            <div className="font-bold flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-mono">
                                {p.addressType}
                              </span>
                              <span className="text-[9px] px-1 rounded bg-[#EAE9E4] text-[#66635F] uppercase font-mono font-bold">
                                {p.network}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-[#66635F] truncate">
                              {formatAddress(p.address, 8, 6)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {profile?.id === p.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#D96522]" />
                            )}
                            <button
                              onClick={(e) => handleDeleteProfile(e, p.id)}
                              className="p-1 hover:text-rose-600 text-[#949089] transition-colors"
                              title="Delete persona"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Profiles List */}
                {customList.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#949089] px-1">
                      Connected Custom Wallets
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {customList.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPersona(p)}
                          className={`p-2.5 rounded-2xl text-xs cursor-pointer transition-colors flex items-center justify-between ${
                            profile?.id === p.id
                              ? "bg-[#FCEFE7] border border-[#D96522]/30 text-[#A7430B]"
                              : "hover:bg-[#F8F7F4] text-[#1A1816] border border-black/[0.04]"
                          }`}
                        >
                          <div className="truncate max-w-[200px]">
                            <div className="font-bold text-[#1A1816] flex items-center space-x-1">
                              <span>{p.name}</span>
                              <span className="text-[9px] uppercase font-mono text-[#949089]">({p.network})</span>
                            </div>
                            <div className="font-mono text-[10px] text-[#66635F] truncate">
                              {formatAddress(p.address, 8, 6)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {profile?.id === p.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#D96522]" />
                            )}
                            <button
                              onClick={(e) => handleDeleteProfile(e, p.id)}
                              className="p-1 hover:text-rose-600 text-[#949089] transition-colors"
                              title="Delete persona"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restore Demos Button if any deleted */}
                {hasDeletedDemos && (
                  <div className="pt-1">
                    <button
                      onClick={handleRestoreDemos}
                      className="w-full py-2 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#1A1816] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D96522]" />
                      <span>Restore Default Demo Personas</span>
                    </button>
                  </div>
                )}

                {/* Add Custom / Burner Identity Controls */}
                <div className="pt-2 border-t border-black/[0.06] space-y-2">
                  {showAddCustom ? (
                    <form onSubmit={handleConnectCustom} className="space-y-2.5">
                      <div className="text-xs font-bold text-[#1A1816]">Connect Shielded Address (Mainnet or Testnet)</div>
                      {customError && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                          {customError}
                        </div>
                      )}
                      <div>
                        <input
                          type="text"
                          placeholder="Account Name (e.g. My Zashi)"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-black/[0.08] text-xs text-[#1A1816] placeholder-[#949089] focus:outline-none focus:border-[#D96522]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Mainnet (u1... / zs1...) or Testnet (utest1... / ztestsapling1...)"
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-black/[0.08] text-xs font-mono text-[#1A1816] placeholder-[#949089] focus:outline-none focus:border-[#D96522]"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl btn-orange-primary text-xs font-bold transition-colors"
                        >
                          Connect
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCustom(false);
                            setCustomError(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1A1816] text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(true)}
                        className="py-2.5 px-3 rounded-2xl border border-dashed border-[#D96522]/30 hover:border-[#D96522] hover:bg-[#FCEFE7] text-[#C85A17] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Address</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateRandom}
                        className="py-2.5 px-3 rounded-2xl border border-dashed border-stone-300 hover:border-[#D96522] hover:bg-stone-50 text-[#1A1816] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                        title={`Generate a random ${activeNetwork} Ironwood identity`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D96522]" />
                        <span>New {activeNetwork === "testnet" ? "Testnet" : "Mainnet"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl bg-[#EAE9E4] text-[#1A1816]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/[0.06] bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {/* Mobile Network Selector */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7F4] mb-2">
            <span className="text-xs font-bold text-[#1A1816]">Network:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleNetworkChange("mainnet")}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  activeNetwork === "mainnet" ? "bg-[#D96522] text-white" : "bg-stone-200 text-[#66635F]"
                }`}
              >
                Mainnet
              </button>
              <button
                onClick={() => handleNetworkChange("testnet")}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  activeNetwork === "testnet" ? "bg-[#D96522] text-white" : "bg-stone-200 text-[#66635F]"
                }`}
              >
                Testnet
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab("marketplace");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold ${
              activeTab === "marketplace" ? "bg-[#FCEFE7] text-[#A7430B]" : "text-[#66635F]"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#D96522]" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("auctions");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold ${
              activeTab === "auctions" ? "bg-[#FCEFE7] text-[#A7430B]" : "text-[#66635F]"
            }`}
          >
            <Lock className="w-4 h-4 text-[#D96522]" />
            <span>Sealed Auctions</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("activity", "audits");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold ${
              activeTab === "activity" ? "bg-[#FCEFE7] text-[#A7430B]" : "text-[#66635F]"
            }`}
          >
            <Activity className="w-4 h-4 text-[#D96522]" />
            <span>Activity & Audit Vault</span>
          </button>

          <button
            onClick={() => {
              openSimulatorModal();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold btn-orange-pill"
          >
            <Zap className="w-4 h-4 text-[#D96522]" />
            <span>Webhook Testbed</span>
          </button>
        </div>
      )}
    </header>
  );
}
