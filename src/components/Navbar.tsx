"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  ShoppingBag,
  ShoppingCart,
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
  ArrowRight,
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
  const [mobileShowAddCustom, setMobileShowAddCustom] = useState(false);
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
    setMobileShowAddCustom(false);
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
      setCustomError("Enter a valid Orchard (u1..., utest1...) or Sapling (zs1..., ztestsapling1...) address.");
      return;
    }
    const newProf = addCustomProfile(customName || "My Shielded Wallet", customAddress);
    setProfile(newProf);
    reloadProfiles();
    setCustomName("");
    setCustomAddress("");
    setShowAddCustom(false);
    setMobileShowAddCustom(false);
    setPersonaDropdownOpen(false);
  };

  const handleGenerateRandom = () => {
    const fresh = generateRandomShieldedProfile("Shielded Test User", activeNetwork);
    setProfile(fresh);
    reloadProfiles();
    setShowAddCustom(false);
    setMobileShowAddCustom(false);
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1b5efa] to-[#1550df] flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-slate-900">ZecWild</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wide uppercase hidden sm:inline-flex">
              Shielded
            </span>
          </div>
        </div>

        {/* Center Pill Segmented Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "marketplace"
                ? "bg-white text-[#1b5efa] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag
              className={`w-3.5 h-3.5 ${
                activeTab === "marketplace" ? "text-[#1b5efa]" : "text-slate-400"
              }`}
            />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => setActiveTab("auctions")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "auctions"
                ? "bg-white text-[#1b5efa] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock
              className={`w-3.5 h-3.5 ${
                activeTab === "auctions" ? "text-[#1b5efa]" : "text-slate-400"
              }`}
            />
            <span>Sealed Auctions</span>
          </button>

          <button
            onClick={() => setActiveTab("activity", "audits")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "activity"
                ? "bg-white text-[#1b5efa] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity
              className={`w-3.5 h-3.5 ${
                activeTab === "activity" ? "text-[#1b5efa]" : "text-slate-400"
              }`}
            />
            <span>Activity & Vault</span>
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Network Switcher Toggle Pill - Desktop */}
          <div className="hidden md:flex items-center space-x-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => handleNetworkChange("mainnet")}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeNetwork === "mainnet"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Zcash Mainnet"
            >
              Mainnet
            </button>
            <button
              onClick={() => handleNetworkChange("testnet")}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeNetwork === "testnet"
                  ? "bg-[#eff4ff] text-[#1b5efa] border border-[#1b5efa]/30 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Zcash Testnet (utest1 / ztestsapling1)"
            >
              🧪 Testnet
            </button>
          </div>

          {/* Quick Payment Simulator Icon Button - Desktop */}
          <button
            onClick={openSimulatorModal}
            className="hidden md:flex p-2.5 rounded-xl bg-white hover:bg-[#eff4ff] text-[#1b5efa] border border-slate-200 hover:border-[#1b5efa]/40 shadow-xs transition-colors"
            title="Launch Shielded Payment Simulator"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Create Button Dropdown - Desktop */}
          <div ref={createRef} className="relative hidden md:block">
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {createDropdownOpen && (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
                <button
                  onClick={() => {
                    openCreateModal("listing");
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-slate-800 hover:bg-[#eff4ff] hover:text-[#1b5efa] flex items-center space-x-3 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#eff4ff] text-[#1b5efa]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">New Listing</div>
                    <div className="text-[11px] text-slate-500">Fixed-price marketplace</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    openCreateModal("auction");
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-slate-800 hover:bg-[#eff4ff] hover:text-[#1b5efa] flex items-center space-x-3 transition-colors mt-1"
                >
                  <div className="p-2 rounded-lg bg-[#eff4ff] text-[#1b5efa]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">New Sealed Auction</div>
                    <div className="text-[11px] text-slate-500">Client-sealed bids</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    openSimulatorModal();
                    setCreateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-slate-800 hover:bg-[#eff4ff] hover:text-[#1b5efa] flex items-center space-x-3 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#eff4ff] text-[#1b5efa]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Payment Simulator</div>
                    <div className="text-[11px] text-slate-500">Test shielded payments</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Persona / Shielded Account Switcher - Desktop */}
          <div ref={personaRef} className="relative hidden md:block">
            {profile ? (
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-white border border-slate-200 hover:border-[#1b5efa]/40 shadow-xs transition-all"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    profile.network === "testnet" ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span className="font-bold text-slate-900 max-w-[100px] truncate">
                  {profile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowAddCustom(true);
                  setPersonaDropdownOpen(!personaDropdownOpen);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#eff4ff] hover:bg-[#dbe7ff] border border-[#1b5efa]/30 text-[#1b5efa] shadow-xs transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-[#1b5efa]" />
                <span>Connect Shielded ID</span>
              </button>
            )}

            {personaDropdownOpen && (
              <div className="absolute right-0 mt-3 w-88 rounded-2xl bg-white p-5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 space-y-4 text-left">
                {/* Active Account Details */}
                {profile ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#1b5efa] flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active Identity</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
                          {profile.addressType}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold uppercase">
                          {profile.network || "mainnet"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">{profile.name}</div>
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
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="font-mono text-[11px] truncate max-w-[210px]">
                        {profile.address}
                      </span>
                      <button
                        onClick={() => handleCopyActive(profile.address)}
                        className="p-1 rounded-md hover:bg-white text-slate-700 transition-colors"
                        title="Copy Full Shielded Address"
                      >
                        {copiedActive ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#1b5efa]/20 space-y-1.5">
                    <div className="flex items-center space-x-2 text-[#1b5efa] font-bold text-xs">
                      <Shield className="w-4 h-4 text-[#1b5efa]" />
                      <span>No Shielded Identity Connected</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Connect a custom shielded address (Orchard/Sapling) or generate an instant test identity to list, buy, or participate in sealed auctions.
                    </p>
                  </div>
                )}

                {/* Demo Personas List */}
                {demoList.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ⚡ Quick Personas
                      </span>
                    </div>
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                      {demoList.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPersona(p)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                            profile?.id === p.id
                              ? "bg-[#eff4ff] border border-[#1b5efa]/30 text-[#1b5efa]"
                              : "hover:bg-slate-50 text-slate-800 border border-slate-100"
                          }`}
                        >
                          <div className="truncate max-w-[190px]">
                            <div className="font-bold flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                                {p.addressType}
                              </span>
                              <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-600 uppercase font-mono font-bold">
                                {p.network}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 truncate">
                              {formatAddress(p.address, 8, 6)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {profile?.id === p.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#1b5efa]" />
                            )}
                            <button
                              onClick={(e) => handleDeleteProfile(e, p.id)}
                              className="p-1 hover:text-rose-600 text-slate-400 transition-colors"
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
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Connected Custom Wallets
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {customList.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPersona(p)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-between ${
                            profile?.id === p.id
                              ? "bg-[#eff4ff] border border-[#1b5efa]/30 text-[#1b5efa]"
                              : "hover:bg-slate-50 text-slate-800 border border-slate-100"
                          }`}
                        >
                          <div className="truncate max-w-[190px]">
                            <div className="font-bold text-slate-900 flex items-center space-x-1">
                              <span>{p.name}</span>
                              <span className="text-[9px] uppercase font-mono text-slate-400">({p.network})</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 truncate">
                              {formatAddress(p.address, 8, 6)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {profile?.id === p.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#1b5efa]" />
                            )}
                            <button
                              onClick={(e) => handleDeleteProfile(e, p.id)}
                              className="p-1 hover:text-rose-600 text-slate-400 transition-colors"
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
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#1b5efa]" />
                      <span>Restore Default Personas</span>
                    </button>
                  </div>
                )}

                {/* Add Custom / Burner Identity Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {showAddCustom ? (
                    <form onSubmit={handleConnectCustom} className="space-y-2.5">
                      <div className="text-xs font-bold text-slate-900">Connect Shielded Address</div>
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
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b5efa]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Mainnet (u1... / zs1...) or Testnet (utest1...)"
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b5efa]"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold transition-colors"
                        >
                          Connect
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCustom(false);
                            setCustomError(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
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
                        className="py-2.5 px-3 rounded-xl border border-dashed border-[#1b5efa]/40 hover:border-[#1b5efa] hover:bg-[#eff4ff] text-[#1b5efa] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Address</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateRandom}
                        className="py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#1b5efa] hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                        title={`Generate a random ${activeNetwork} identity`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#1b5efa]" />
                        <span>New {activeNetwork === "testnet" ? "Testnet" : "Mainnet"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Network Indicator Button */}
          <button
            onClick={() => handleNetworkChange(activeNetwork === "mainnet" ? "testnet" : "mainnet")}
            className="md:hidden px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center space-x-1.5 bg-slate-50 border-slate-200"
            title={`Active: ${activeNetwork}. Tap to toggle network.`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeNetwork === "testnet" ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span className="font-mono text-slate-900 uppercase text-[10px]">
              {activeNetwork === "testnet" ? "Testnet" : "Mainnet"}
            </span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#1b5efa]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Responsive Hamburger Menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* 1. Shielded Identity Section in Mobile Drawer */}
          {profile ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1b5efa] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{profile.name}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
                  {profile.addressType}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                <span className="font-mono text-xs truncate max-w-[190px]">{formatAddress(profile.address, 8, 6)}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyActive(profile.address)}
                    className="p-1 text-slate-500 hover:text-slate-900"
                    title="Copy Shielded Address"
                  >
                    {copiedActive ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setActiveProfile(null);
                      setProfile(null);
                      reloadProfiles();
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#1b5efa]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1b5efa]">
                  <Shield className="w-4 h-4 text-[#1b5efa]" />
                  <span>Shielded Identity</span>
                </div>
                <span className="text-[10px] text-slate-500">Not Connected</span>
              </div>

              {/* Mobile Connect Address Form or Trigger Buttons */}
              {mobileShowAddCustom ? (
                <form onSubmit={handleConnectCustom} className="space-y-2 pt-1 animate-in fade-in duration-150">
                  {customError && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {customError}
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Account Name (e.g. My Zashi)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b5efa]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="u1... / zs1... or utest1..."
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b5efa]"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold transition-colors"
                    >
                      Connect
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileShowAddCustom(false);
                        setCustomError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setMobileShowAddCustom(true)}
                      className="py-2.5 px-3 rounded-xl bg-[#1b5efa] hover:bg-[#1550df] text-white text-xs font-bold text-center shadow-xs"
                    >
                      Connect Address
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateRandom}
                      className="py-2.5 px-3 rounded-xl bg-white border border-[#1b5efa]/30 text-[#1b5efa] text-xs font-bold text-center hover:bg-[#eff4ff]"
                    >
                      Generate New
                    </button>
                  </div>

                  {/* Quick Select Persona Pills on Mobile */}
                  {demoList.length > 0 && (
                    <div className="pt-1 border-t border-[#1b5efa]/15 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Quick Select:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {demoList.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPersona(p)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#1b5efa] text-[11px] font-medium text-slate-800 flex items-center space-x-1"
                          >
                            <span>{p.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({p.network})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Main Navigation Links */}
          <div className="space-y-1 pt-1">
            <button
              onClick={() => {
                setActiveTab("marketplace");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "marketplace" ? "bg-[#eff4ff] text-[#1b5efa]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#1b5efa]" />
              <span>Marketplace</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("auctions");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "auctions" ? "bg-[#eff4ff] text-[#1b5efa]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-4 h-4 text-[#1b5efa]" />
              <span>Sealed Auctions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("activity", "audits");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "activity" ? "bg-[#eff4ff] text-[#1b5efa]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Activity className="w-4 h-4 text-[#1b5efa]" />
              <span>Activity & Vault</span>
            </button>
          </div>

          {/* 3. Creation Actions & Simulator */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  openCreateModal("listing");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] text-left border border-slate-200 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#1b5efa]" />
                  <span>New Listing</span>
                </div>
                <div className="text-[10px] text-slate-500">Fixed-price sales</div>
              </button>

              <button
                onClick={() => {
                  openCreateModal("auction");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#eff4ff] text-left border border-slate-200 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1b5efa]" />
                  <span>New Auction</span>
                </div>
                <div className="text-[10px] text-slate-500">Sealed bids</div>
              </button>
            </div>

            <button
              onClick={() => {
                openSimulatorModal();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dbe7ff] text-[#1b5efa] border border-[#1b5efa]/20 flex items-center justify-center space-x-2 text-xs font-bold transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#1b5efa]" />
              <span>Launch Payment Simulator</span>
            </button>
          </div>

          {/* 4. Network Switcher */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-900">Active Network:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleNetworkChange("mainnet")}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  activeNetwork === "mainnet" ? "bg-[#1b5efa] text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                Mainnet
              </button>
              <button
                onClick={() => handleNetworkChange("testnet")}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  activeNetwork === "testnet" ? "bg-[#1b5efa] text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                🧪 Testnet
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
