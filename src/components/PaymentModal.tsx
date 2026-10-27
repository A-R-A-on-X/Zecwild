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
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  generateZip321Uri,
  generateQrDataUrl,
  formatAddress,
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
}

export default function PaymentModal({
  isOpen,
  onClose,
  entityType,
  item,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(item.status === "SOLD" || item.status === "SETTLED_PAID");
  const [unlockedSecret, setUnlockedSecret] = useState<string | null>(item.secretPayload || null);
  const [confirmedTxid, setConfirmedTxid] = useState<string | null>(item.txid || null);
  const [isSimulating, setIsSimulating] = useState(false);

  const zip321Uri = generateZip321Uri({
    address: item.sellerAddress,
    amountZec: item.priceZec,
    memo: item.invoiceMemo,
  });

  useEffect(() => {
    if (isOpen) {
      generateQrDataUrl(zip321Uri).then(setQrDataUrl);
      setIsSettled(item.status === "SOLD" || item.status === "SETTLED_PAID");
      setUnlockedSecret(item.secretPayload || null);
      setConfirmedTxid(item.txid || null);
    }
  }, [isOpen, zip321Uri, item]);

  // Poller to detect when webhook settles payment
  useEffect(() => {
    if (!isOpen || isSettled) return;

    const interval = setInterval(async () => {
      try {
        const endpoint = entityType === "listing" ? `/api/listings/${item.id}` : `/api/auctions/${item.id}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        const updated = data.listing || data.auction;

        if (updated && (updated.status === "SOLD" || updated.status === "SETTLED_PAID")) {
          setIsSettled(true);
          setUnlockedSecret(updated.secretPayload || null);
          setConfirmedTxid(updated.txid || null);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          if (onPaymentSuccess) onPaymentSuccess();
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

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/webhooks/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo: item.invoiceMemo,
          amountZat: item.priceZat,
          amountZec: item.priceZec,
          pool: "Orchard",
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
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-7 shadow-2xl overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#FCEFE7] text-[#D96522] border border-[#D96522]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1A1816]">Shielded Settlement Invoice</h3>
              <p className="text-xs text-[#66635F] font-mono">ZIP-321 Direct Wallet-to-Wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#949089] hover:text-[#1A1816] hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSettled ? (
          /* Payment Settled Success View */
          <div className="py-6 space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 animate-spin-slow" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-[#1A1816]">Payment Confirmed!</h4>
              <p className="text-xs text-[#66635F] mt-1">
                Settled on-chain via Zcash Shielded Note ({item.priceZec} ZEC)
              </p>
            </div>

            {/* Confirmed Txid */}
            {confirmedTxid && (
              <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-left">
                <div className="text-[10px] uppercase tracking-wider text-[#949089] font-bold">
                  Shielded Transaction ID
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs text-[#D96522] font-bold truncate max-w-[400px]">
                    {confirmedTxid}
                  </span>
                  <button
                    onClick={() => copyToClipboard(confirmedTxid, "txid")}
                    className="p-1 text-[#66635F] hover:text-[#1A1816]"
                  >
                    {copiedField === "txid" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* If Digital Goods: Reveal Secret Payload */}
            {item.itemType === "DIGITAL" && (
              <div className="p-4 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/30 text-left">
                <div className="flex items-center space-x-2 text-[#A7430B] text-xs font-bold uppercase tracking-wider">
                  <Unlock className="w-4 h-4 text-[#D96522]" />
                  <span>Unlocked Digital Secret / Download</span>
                </div>
                <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#D96522]/20 flex items-center justify-between shadow-xs">
                  <span className="font-mono text-sm text-[#C85A17] font-bold break-all select-all">
                    {unlockedSecret || "Secret payload decrypted and available in your dashboard."}
                  </span>
                  {unlockedSecret && (
                    <button
                      onClick={() => copyToClipboard(unlockedSecret, "secret")}
                      className="ml-3 p-1.5 rounded-lg bg-[#FCEFE7] hover:bg-[#F7DDD0] text-[#A7430B] transition-colors"
                    >
                      {copiedField === "secret" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If Physical Goods */}
            {item.itemType === "PHYSICAL" && (
              <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-left flex items-start space-x-3">
                <Package className="w-5 h-5 text-[#D96522] mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-[#1A1816]">Physical Fulfillment Initiated</div>
                  <div className="text-xs text-[#66635F] mt-0.5">
                    The seller has been notified of your confirmed shielded payment and will dispatch your package.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full btn-orange-primary font-bold text-sm transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* Payment QR Code & Instructions View */
          <div className="py-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* QR Code Container */}
              <div className="flex-shrink-0 p-3 bg-white rounded-2xl border border-black/[0.08] shadow-md flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="ZIP-321 Zcash QR Code" className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 bg-stone-100 animate-pulse rounded-xl flex items-center justify-center text-stone-500 font-mono text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="flex-1 space-y-2.5 text-left">
                <div className="text-xs text-[#66635F]">Scan with any shielded Zcash wallet:</div>
                <div className="flex items-center space-x-2 text-xs font-bold text-[#A7430B]">
                  <span className="px-2.5 py-1 rounded-full bg-[#FCEFE7] border border-[#D96522]/20">Zashi</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#FCEFE7] border border-[#D96522]/20">YWallet</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#FCEFE7] border border-[#D96522]/20">Zingo!</span>
                </div>
                <div className="pt-2 text-xs text-[#66635F]">
                  Or open directly on mobile via ZIP-321 deep link:
                </div>
                <a
                  href={zip321Uri}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full btn-orange-pill text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D96522]" />
                  <span>Open in Zcash Wallet</span>
                </a>
              </div>
            </div>

            {/* Payment Fields Breakdown */}
            <div className="space-y-2.5 pt-2">
              {/* Amount */}
              <div className="p-3 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#949089] font-bold">Exact Amount</div>
                  <div className="text-base font-black text-[#1A1816] font-mono">
                    <span className="text-[#D96522]">{item.priceZec}</span> ZEC{" "}
                    <span className="text-xs text-[#66635F] font-normal">({item.priceZat} zatoshis)</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(String(item.priceZec), "amount")}
                  className="p-2 rounded-xl bg-white hover:bg-stone-100 text-[#1A1816] shadow-xs border border-black/[0.05]"
                  title="Copy Amount"
                >
                  {copiedField === "amount" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Recipient Shielded Address */}
              <div className="p-3 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#949089] font-bold">Seller Shielded Address</div>
                  <div className="text-xs font-mono text-[#1A1816] truncate max-w-[340px]">
                    {formatAddress(item.sellerAddress, 16, 12)}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.sellerAddress, "addr")}
                  className="p-2 rounded-xl bg-white hover:bg-stone-100 text-[#1A1816] shadow-xs border border-black/[0.05]"
                  title="Copy Full Address"
                >
                  {copiedField === "addr" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Mandatory Memo */}
              <div className="p-3 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A7430B] font-bold flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-[#D96522]" />
                    <span>Mandatory Invoice Memo (Required)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#C85A17] mt-0.5">
                    {item.invoiceMemo}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.invoiceMemo, "memo")}
                  className="p-2 rounded-xl bg-white hover:bg-stone-100 text-[#C85A17] shadow-xs border border-[#D96522]/20"
                  title="Copy Exact Memo"
                >
                  {copiedField === "memo" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Real-time Status Banner */}
            <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-[#66635F]">
                <Clock className="w-4 h-4 text-[#D96522] animate-spin" />
                <span>Waiting for shielded note detection via indexer...</span>
              </div>

              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full btn-orange-pill text-xs font-bold disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-[#D96522]" />
                <span>{isSimulating ? "Simulating..." : "⚡ Quick Simulate"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
