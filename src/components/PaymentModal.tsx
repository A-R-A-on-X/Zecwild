"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Lock,
  Unlock,
  Package,
  QrCode as QrCodeIcon,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  generateZip321Uri,
  generateQrDataUrl,
  formatAddress,
  detectNetwork,
  getBlockExplorerUrl,
} from "@/lib/crypto/zcash";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "listing" | "auction";
  item: {
    id: string;
    title: string;
    imageUrl: string;
    itemType: "DIGITAL" | "PHYSICAL";
    priceZec: number;
    priceZat: string;
    sellerAddress: string;
    invoiceMemo: string;
    status: string;
    secretPayload?: string | null;
    txid?: string | null;
  };
  onPaymentSuccess?: () => void;
  onOpenReceiptModal?: (item: any, type: "listing" | "auction") => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  entityType,
  item,
  onPaymentSuccess,
  onOpenReceiptModal,
}: PaymentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(
    item.status === "SOLD" || item.status === "SETTLED_PAID"
  );
  const [unlockedSecret, setUnlockedSecret] = useState<string | null>(
    item.secretPayload || null
  );
  const [confirmedTxid, setConfirmedTxid] = useState<string | null>(
    item.txid || null
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const zip321Uri = generateZip321Uri({
    address: item.sellerAddress,
    amountZec: item.priceZec,
    memo: item.invoiceMemo,
  });

  // Fetch verified status whenever opened
  useEffect(() => {
    if (!isOpen) return;

    generateQrDataUrl(zip321Uri).then(setQrDataUrl);

    // Fetch fresh item data from API
    const fetchFresh = async () => {
      try {
        const endpoint =
          entityType === "listing"
            ? `/api/listings/${item.id}`
            : `/api/auctions/${item.id}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        const fresh = data.listing || data.auction;

        if (fresh) {
          const settled =
            fresh.status === "SOLD" || fresh.status === "SETTLED_PAID";
          setIsSettled(settled);
          if (fresh.secretPayload) setUnlockedSecret(fresh.secretPayload);
          if (fresh.txid) setConfirmedTxid(fresh.txid);
        }
      } catch (err) {
        console.error("Failed to fetch fresh item status in PaymentModal:", err);
      }
    };

    fetchFresh();
  }, [isOpen, zip321Uri, item.id, entityType]);

  // Poller to detect when webhook settles payment
  useEffect(() => {
    if (!isOpen || isSettled) return;

    const interval = setInterval(async () => {
      try {
        const endpoint =
          entityType === "listing"
            ? `/api/listings/${item.id}`
            : `/api/auctions/${item.id}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        const updated = data.listing || data.auction;

        if (
          updated &&
          (updated.status === "SOLD" || updated.status === "SETTLED_PAID")
        ) {
          setIsSettled(true);
          setUnlockedSecret(updated.secretPayload || null);
          setConfirmedTxid(updated.txid || null);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          if (onPaymentSuccess) onPaymentSuccess();
          window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
        }
      } catch (err) {
        console.error("Poller error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, isSettled, entityType, item.id, onPaymentSuccess]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const network = detectNetwork(item.sellerAddress);
  const isTestnet = network === "testnet";

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const res = await fetch("/api/webhooks/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo: item.invoiceMemo,
          amountZat: item.priceZat,
          amountZec: item.priceZec,
          pool: "Ironwood",
          network: network,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSettled(true);
        setConfirmedTxid(data.simulatedPayload.data.txid);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onPaymentSuccess) onPaymentSuccess();
        window.dispatchEvent(new CustomEvent("zecwild_refresh_data"));
      } else {
        setSimError(data.error || "Simulation failed to match invoice.");
      }
    } catch (e: any) {
      console.error("Simulation error:", e);
      setSimError(e.message || "Failed to trigger shielded payment simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const explorerUrl = confirmedTxid
    ? getBlockExplorerUrl(confirmedTxid, network)
    : (isTestnet ? "https://testnet.zcashblockexplorer.com" : "https://zcashblockexplorer.com");

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#EEF4FF] text-[#094ae0] border border-[#094ae0]/20 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Shielded Settlement Invoice
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider">
                  🌲 Ironwood
                </span>
                {isTestnet && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold uppercase tracking-wider border border-amber-300">
                    🧪 Testnet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                ZIP-321 Direct Wallet-to-Wallet ZEC Settlement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSettled ? (
          /* Payment Settled Success View */
          <div className="py-6 space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-slate-900">Payment Confirmed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Settled on-chain via Zcash Ironwood Shielded Note ({item.priceZec} ZEC • {isTestnet ? "Testnet" : "Mainnet"})
              </p>
            </div>

            {/* Confirmed Txid with explorer link */}
            {confirmedTxid && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Shielded Transaction ID
                </div>
                <div className="flex items-center justify-between mt-1">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#094ae0] font-bold truncate max-w-[340px] hover:underline flex items-center space-x-1"
                    title="View on Zcash Block Explorer"
                  >
                    <span className="truncate">{confirmedTxid}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(confirmedTxid, "txid")}
                    className="p-1 text-slate-400 hover:text-slate-700 ml-2 flex-shrink-0"
                  >
                    {copiedField === "txid" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* If Digital Goods: Reveal Secret Payload */}
            {item.itemType === "DIGITAL" && (
              <div className="p-4 rounded-xl bg-[#EEF4FF] border border-[#094ae0]/30 text-left">
                <div className="flex items-center space-x-2 text-[#094ae0] text-xs font-bold uppercase tracking-wider">
                  <Unlock className="w-4 h-4 text-[#094ae0]" />
                  <span>Unlocked Digital Secret / Download</span>
                </div>
                <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#094ae0]/20 flex items-center justify-between shadow-xs">
                  <span className="font-mono text-xs sm:text-sm text-[#094ae0] font-bold break-all select-all">
                    {unlockedSecret || "Secret payload decrypted and available in your vault."}
                  </span>
                  {unlockedSecret && (
                    <button
                      onClick={() => copyToClipboard(unlockedSecret, "secret")}
                      className="ml-3 p-1.5 rounded-lg bg-[#EEF4FF] hover:bg-[#dbe7ff] text-[#094ae0] transition-colors flex-shrink-0"
                      title="Copy Secret Key"
                    >
                      {copiedField === "secret" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If Physical Goods */}
            {item.itemType === "PHYSICAL" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left flex items-start space-x-3">
                <Package className="w-5 h-5 text-[#094ae0] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Physical Fulfillment Initiated
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    The seller has been notified of your confirmed shielded payment and will dispatch your package.
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {onOpenReceiptModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReceiptModal(item, entityType);
                  }}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-[#EEF4FF] hover:bg-[#dbe7ff] text-[#094ae0] border border-[#094ae0]/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <FileText className="w-4 h-4 text-[#094ae0]" />
                  <span>View Full Shielded Receipt</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold shadow-md transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Active Payment Invoice View */
          <div className="py-4 space-y-4">
            {/* Top Item Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div className="truncate max-w-[240px] sm:max-w-[300px]">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.itemType === "DIGITAL" ? "Digital Good" : "Physical Item"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono text-[#094ae0]">
                  {item.priceZec} ZEC
                </div>
                <div className="text-[10px] text-slate-400">Wallet-to-Wallet</div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="ZIP-321 QR" className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 rounded-lg">
                    <QrCodeIcon className="w-8 h-8 text-slate-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-2 max-w-sm">
                <div className="text-xs font-bold text-slate-900">
                  Scan with any Shielded Zcash Wallet
                </div>
                <div className="flex items-center justify-center space-x-1.5 text-[11px] font-mono text-[#094ae0]">
                  <span className="px-2.5 py-1 rounded-full bg-[#EEF4FF] border border-[#094ae0]/20 font-bold">
                    Zashi
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#EEF4FF] border border-[#094ae0]/20 font-bold">
                    YWallet
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#EEF4FF] border border-[#094ae0]/20 font-bold">
                    Zingo!
                  </span>
                </div>

                {/* ZIP-321 Action Row */}
                <div className="pt-2 flex items-center justify-center space-x-2">
                  <a
                    href={zip321Uri}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#EEF4FF] hover:bg-[#dbe7ff] text-[#094ae0] border border-[#094ae0]/30 text-xs font-bold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#094ae0]" />
                    <span>Open in Zcash Wallet</span>
                  </a>

                  <button
                    onClick={() => copyToClipboard(zip321Uri, "zip321")}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                    title="Copy Full ZIP-321 Payment URI"
                  >
                    {copiedField === "zip321" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Copy URI</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Fields Breakdown */}
            <div className="space-y-2 pt-1">
              {/* Amount */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Exact Amount
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    <span className="text-[#094ae0]">{item.priceZec}</span> ZEC{" "}
                    <span className="text-[11px] text-slate-500 font-normal">
                      ({item.priceZat} zatoshis)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.priceZec.toString(), "amount")}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {copiedField === "amount" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Memo */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Required Memo Tag
                  </div>
                  <div className="text-xs font-mono font-bold text-[#094ae0] truncate max-w-[280px] sm:max-w-[400px]">
                    {item.invoiceMemo}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.invoiceMemo, "memo")}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {copiedField === "memo" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Payout Shielded Address */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Recipient Address
                  </div>
                  <div className="text-xs font-mono text-slate-600 truncate max-w-[280px] sm:max-w-[400px]">
                    {item.sellerAddress}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.sellerAddress, "address")}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {copiedField === "address" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {simError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <span className="font-semibold">{simError}</span>
              </div>
            )}

            {/* Listening Notice & Simulator Trigger */}
            <div className="p-3.5 rounded-xl bg-[#EEF4FF] border border-[#094ae0]/30 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-[#094ae0]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#094ae0] animate-ping" />
                <span className="font-semibold">
                  Listening for compact block note via zechack indexer...
                </span>
              </div>
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-[#094ae0] hover:bg-[#073bc2] text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Simulating..." : "Simulate Note"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
