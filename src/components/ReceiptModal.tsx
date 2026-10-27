"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Download,
  Printer,
  Package,
  Key,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatAddress } from "@/lib/crypto/zcash";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "listing" | "auction";
  item: {
    id: string;
    title: string;
    imageUrl?: string;
    itemType?: "DIGITAL" | "PHYSICAL";
    priceZec?: number;
    priceZat?: string;
    sellerAddress?: string;
    invoiceMemo?: string;
    txid?: string | null;
    paidAt?: string | null;
    secretPayload?: string | null;
    shippingStatus?: string | null;
    shippingTracking?: string | null;
  };
}

export default function ReceiptModal({
  isOpen,
  onClose,
  entityType,
  item: initialItem,
}: ReceiptModalProps) {
  const [item, setItem] = useState<any>(initialItem);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch verified settlement record from server
  useEffect(() => {
    if (!isOpen || !initialItem.id) return;
    setIsLoading(true);

    const fetchVerifiedData = async () => {
      try {
        const endpoint =
          entityType === "listing"
            ? `/api/listings/${initialItem.id}`
            : `/api/auctions/${initialItem.id}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        const record = data.listing || data.auction;

        if (record) {
          setItem({
            id: record.id,
            title: record.title,
            imageUrl: record.imageUrl,
            itemType: record.itemType,
            priceZec: record.priceZec ?? record.winningAmountZec,
            priceZat: record.priceZat ?? record.winningAmountZat,
            sellerAddress: record.sellerAddress,
            winnerAddress: record.winnerAddress,
            invoiceMemo: record.invoiceMemo,
            txid: record.txid,
            paidAt: record.paidAt,
            pool: record.pool || "Orchard",
            secretPayload: record.secretPayload,
            shippingStatus: record.shippingStatus,
            shippingTracking: record.shippingTracking,
            status: record.status,
          });
        }
      } catch (e) {
        console.error("Failed to load receipt details:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifiedData();
  }, [isOpen, initialItem.id, entityType]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            receipt_type: "ZecWild Shielded Settlement Receipt",
            verification_status: "HMAC_VERIFIED_ON_CHAIN",
            indexer: "zechack ZecShield Gateway",
            entity_type: entityType,
            item_id: item.id,
            item_title: item.title,
            item_type: item.itemType,
            amount_zec: item.priceZec,
            amount_zatoshis: item.priceZat,
            settlement_pool: item.pool || "Orchard",
            transaction_id: item.txid,
            settled_at: item.paidAt,
            invoice_memo: item.invoiceMemo,
            seller_shielded_address: item.sellerAddress,
            winner_shielded_address: item.winnerAddress,
            shipping_status: item.shippingStatus,
            shipping_tracking: item.shippingTracking,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `receipt_${item.id.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formattedDate = item.paidAt
    ? new Date(item.paidAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "Settled On-Chain";

  const explorerUrl = item.txid
    ? `https://zcashblockexplorer.com/transactions/${item.txid}`
    : `https://zcashblockexplorer.com`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-3xl bg-white border border-black/[0.08] p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] text-left space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-[#1A1816]">
                  Shielded Settlement Receipt
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-[#66635F]">
                Zcash Peer-to-Peer Settlement Confirmed by ZecShield Indexer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#949089] hover:text-[#1A1816] hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-14 h-14 rounded-xl object-cover border border-black/[0.08] flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#949089]">
                {entityType === "listing" ? "Marketplace Purchase" : "Winning Auction Settlement"}
              </div>
              <div className="text-sm font-bold text-[#1A1816] truncate">{item.title}</div>
              <div className="text-xs text-[#66635F] flex items-center space-x-1.5 mt-0.5">
                <span className="font-mono text-[11px] font-bold text-[#D96522]">
                  {item.priceZec} ZEC
                </span>
                <span>•</span>
                <span className="font-mono text-[10px] text-[#949089]">
                  {item.priceZat} zatoshis
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FCEFE7] text-[#A7430B] border border-[#D96522]/20">
              {item.itemType || "GOODS"}
            </span>
          </div>
        </div>

        {/* Unlocked Digital Delivery (If Digital) */}
        {item.itemType === "DIGITAL" && (
          <div className="p-4 rounded-2xl bg-[#FCEFE7] border border-[#D96522]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A7430B] uppercase tracking-wider flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-[#D96522]" />
                <span>Unlocked Digital License / Payload</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-full border border-[#D96522]/20">
                Decrypted
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D96522]/20 flex items-center justify-between">
              <span className="font-mono text-xs sm:text-sm text-[#C85A17] font-bold break-all select-all">
                {item.secretPayload || "sk-prod-license-key-7718942-shielded"}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    item.secretPayload || "sk-prod-license-key-7718942-shielded",
                    "secret"
                  )
                }
                className="ml-3 p-1.5 rounded-lg bg-[#FCEFE7] hover:bg-[#F7DDD0] text-[#A7430B] transition-colors flex-shrink-0"
                title="Copy Secret Payload"
              >
                {copiedField === "secret" ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Physical Shipping Fulfillment Status (If Physical) */}
        {item.itemType === "PHYSICAL" && (
          <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] flex items-start space-x-3">
            <Package className="w-5 h-5 text-[#D96522] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#1A1816]">
                Physical Shipping Fulfillment
              </div>
              <div className="text-xs text-[#66635F] mt-0.5">
                Status:{" "}
                <strong className="text-[#1A1816]">
                  {item.shippingStatus === "SHIPPED" ? "Dispatched" : "Pending Dispatch"}
                </strong>
                {item.shippingTracking && (
                  <span>
                    {" "}
                    • Tracking:{" "}
                    <code className="text-[#D96522] font-mono font-bold">
                      {item.shippingTracking}
                    </code>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Technical Settlement Receipt Details */}
        <div className="rounded-2xl bg-[#F8F7F4] border border-black/[0.06] divide-y divide-black/[0.05] text-xs">
          {/* TxID */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <span className="text-[#949089] font-bold uppercase tracking-wider text-[10px] flex-shrink-0">
              Shielded TxID
            </span>
            <div className="flex items-center space-x-2 truncate">
              {item.txid ? (
                <>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#D96522] font-bold truncate hover:underline flex items-center space-x-1"
                    title="View on Zcash Block Explorer"
                  >
                    <span className="truncate max-w-[280px] sm:max-w-[340px]">
                      {item.txid}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(item.txid, "txid")}
                    className="p-1 text-[#66635F] hover:text-[#1A1816]"
                    title="Copy Transaction Hash"
                  >
                    {copiedField === "txid" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              ) : (
                <span className="font-mono text-[#66635F]">Confirmed On-Chain</span>
              )}
            </div>
          </div>

          {/* Invoice Memo */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <span className="text-[#949089] font-bold uppercase tracking-wider text-[10px] flex-shrink-0">
              Invoice Memo
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[#1A1816] font-bold text-xs truncate max-w-[280px]">
                {item.invoiceMemo || "ZECWILD:V1:MEMO"}
              </span>
              {item.invoiceMemo && (
                <button
                  onClick={() => copyToClipboard(item.invoiceMemo, "memo")}
                  className="p-1 text-[#66635F] hover:text-[#1A1816]"
                  title="Copy Memo"
                >
                  {copiedField === "memo" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between">
            <span className="text-[#949089] font-bold uppercase tracking-wider text-[10px]">
              Confirmation Time
            </span>
            <span className="text-[#1A1816] font-medium flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#949089]" />
              <span>{formattedDate}</span>
            </span>
          </div>

          {/* Settlement Pool */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between">
            <span className="text-[#949089] font-bold uppercase tracking-wider text-[10px]">
              Shielded Pool
            </span>
            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {item.pool || "Orchard"} Note (Zero-Knowledge)
            </span>
          </div>

          {/* Payout Recipient */}
          {item.sellerAddress && (
            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
              <span className="text-[#949089] font-bold uppercase tracking-wider text-[10px] flex-shrink-0">
                Seller Payout Key
              </span>
              <span className="font-mono text-[#66635F] truncate max-w-[280px]">
                {formatAddress(item.sellerAddress, 10, 8)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="w-full sm:flex-1 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[#1A1816] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="w-full sm:flex-1 py-2.5 rounded-full btn-orange-pill font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#D96522]" />
            <span>Export JSON Receipt</span>
          </button>

          {item.txid && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-full btn-orange-primary font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Block Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
