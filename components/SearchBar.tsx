// components/SearchBar.tsx
import React, { useState, useEffect } from "react";
import { petDatabase } from "../lib/master_database";

export interface GlobalTrade {
  id: string;
  user_id?: string;
  poster_name: string;
  my_offer: TradeItem[];
  their_offer: TradeItem[];
  my_total: number;
  their_total: number;
  created_at: string;
}

export interface PotionValues {
  NoPot: number;
  R: number;
  F: number;
  FR: number;
}

export interface PetItem {
  id: number;
  name: string;
  rarity: string;
  is_pet: boolean;
  image: string;
  values: {
    Reg: PotionValues;
    N: PotionValues;
    M: PotionValues;
  };
}

export interface TradeItem {
  id: number;
  name: string;
  image: string;
  variant: "Reg" | "N" | "M";
  potion: "NoPot" | "R" | "F" | "FR";
  qty: number;
  value: number;
  packId?: number;
}

export interface TradeRecord {
  id: string;
  date: string;
  given: string[];
  received: string[];
  myTotal: number;
  theirTotal: number;
  status: "WIN" | "FAIR" | "LOSE";
  isCompleted?: boolean;
  rawGiven?: TradeItem[];
  rawReceived?: TradeItem[];
}

interface SearchBarProps {
  onAddOffer: (item: TradeItem, side: "mine" | "theirs") => void;
  onAddInventory: (item: TradeItem, target: "pack" | "wish") => void;
  onRemoveInventory: (
    packId: number,
    target: "pack" | "wish",
    amount?: number,
  ) => void;
  myBackpack: TradeItem[];
  myWishlist: TradeItem[];
  tradeHistory: TradeRecord[];
  onRemoveHistory: (id: string) => void;
  onCompleteHistory: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  globalTrades: GlobalTrade[];
  onRefreshGlobal: () => void;
  onLoadTrade: (mine: TradeItem[], theirs: TradeItem[]) => void;
  currentUserId: string | null;
  onDeleteGlobal: (tradeId: string) => void;
  onCompleteGlobal: (trade: GlobalTrade) => void;
}

function DbResultCard({
  pet,
  onAddOffer,
  onAddInventory,
}: {
  pet: PetItem;
  onAddOffer: (item: TradeItem, side: "mine" | "theirs") => void;
  onAddInventory: (item: TradeItem, target: "pack" | "wish") => void;
}) {
  const [variant, setVariant] = useState<"Reg" | "N" | "M">("Reg");
  const [isF, setIsF] = useState(false);
  const [isR, setIsR] = useState(false);
  const [amt, setAmt] = useState<number>(1);

  // Animation states
  const [addedPack, setAddedPack] = useState(false);
  const [addedWish, setAddedWish] = useState(false);

  let potionKey: "NoPot" | "R" | "F" | "FR" = "NoPot";
  if (isF && isR) potionKey = "FR";
  else if (isF) potionKey = "F";
  else if (isR) potionKey = "R";

  const currentValue = pet.values[variant][potionKey];
  const itemToPass: TradeItem = {
    id: pet.id,
    name: pet.name,
    image: pet.image,
    variant,
    potion: potionKey,
    qty: amt,
    value: currentValue,
  };

  const handleAddPack = () => {
    onAddInventory(itemToPass, "pack");
    setAddedPack(true);
    setTimeout(() => setAddedPack(false), 1000);
  };

  const handleAddWish = () => {
    onAddInventory(itemToPass, "wish");
    setAddedWish(true);
    setTimeout(() => setAddedWish(false), 1000);
  };

  return (
    <div className="bg-white rounded-[20px] p-4 text-center shadow-sm relative border border-stone-100 flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pet.image}
        alt={pet.name}
        className="w-[70px] h-[70px] object-contain mb-2"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/100x100/333/FFF?text=Pet";
        }}
      />
      <div
        className="text-[14px] font-black text-[#333] truncate w-full"
        title={pet.name}
      >
        {pet.name}
      </div>
      <div className="text-[18px] font-black text-[#333]">
        {currentValue.toFixed(2)}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        <button
          onClick={() => setVariant("Reg")}
          className={`px-2.5 py-1 rounded-lg border-2 text-[12px] font-black transition-colors ${variant === "Reg" ? "bg-[#ffdf70] border-[#ffdf70] text-black" : "bg-white border-[#eee] text-[#888]"}`}
        >
          Reg
        </button>
        {pet.values.N.NoPot > 0 && (
          <button
            onClick={() => setVariant("N")}
            className={`px-2.5 py-1 rounded-lg border-2 text-[12px] font-black transition-colors ${variant === "N" ? "bg-[#00e5ff] border-[#00e5ff] text-black" : "bg-white border-[#eee] text-[#888]"}`}
          >
            N
          </button>
        )}
        {pet.values.M.NoPot > 0 && (
          <button
            onClick={() => setVariant("M")}
            className={`px-2.5 py-1 rounded-lg border-2 text-[12px] font-black transition-colors ${variant === "M" ? "bg-[#b15dff] border-[#b15dff] text-white" : "bg-white border-[#eee] text-[#888]"}`}
          >
            M
          </button>
        )}
      </div>
      {pet.is_pet && (
        <div className="flex justify-center gap-1.5 mt-2 mb-2">
          <button
            onClick={() => setIsF(!isF)}
            className={`px-2.5 py-1 rounded-lg border-2 text-[12px] font-black transition-colors ${isF ? "bg-[#5dbbff] border-[#5dbbff] text-white" : "bg-white border-[#eee] text-[#888]"}`}
          >
            Fly
          </button>
          <button
            onClick={() => setIsR(!isR)}
            className={`px-2.5 py-1 rounded-lg border-2 text-[12px] font-black transition-colors ${isR ? "bg-[#ff7aa2] border-[#ff7aa2] text-white" : "bg-white border-[#eee] text-[#888]"}`}
          >
            Ride
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 my-2 bg-stone-50 px-3 py-1 rounded-xl border border-stone-200">
        <span className="text-[12px] font-bold text-stone-500">Qty:</span>
        <input
          type="number"
          min="1"
          max="100"
          value={amt}
          onChange={(e) =>
            setAmt(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
          }
          className="w-12 text-center bg-transparent text-[14px] font-black text-[#333] outline-none"
        />
      </div>

      <div className="flex gap-1.5 w-full mt-auto pt-2">
        <button
          onClick={() => onAddOffer(itemToPass, "mine")}
          className="flex-1 py-2 rounded-[10px] text-[13px] font-black bg-[#e2f0e6] text-[#2d8647] hover:brightness-95 transition-all"
        >
          Your Offer
        </button>
        <button
          onClick={() => onAddOffer(itemToPass, "theirs")}
          className="flex-1 py-2 rounded-[10px] text-[13px] font-black bg-[#fce4e4] text-[#c9302c] hover:brightness-95 transition-all"
        >
          Their Offer
        </button>
      </div>
      <div className="flex gap-1.5 w-full mt-1.5">
        <button
          onClick={handleAddPack}
          className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-black transition-all ${addedPack ? "bg-[#85d67a] text-white" : "bg-[#f0f0f0] text-[#555] hover:brightness-95"}`}
        >
          {addedPack ? "Added! ✓" : "+ Backpack"}
        </button>
        <button
          onClick={handleAddWish}
          className={`px-3 py-1.5 rounded-[10px] text-[13px] font-black transition-all ${addedWish ? "bg-[#ffdf70] text-black" : "bg-[#fff3cd] text-[#856404] hover:brightness-95"}`}
          title="Add to Wishlist"
        >
          {addedWish ? "✓" : "⭐"}
        </button>
      </div>
    </div>
  );
}

function InventoryCard({
  item,
  target,
  onAddOffer,
  onRemove,
}: {
  item: TradeItem;
  target: "pack" | "wish";
  onAddOffer: (item: TradeItem, side: "mine" | "theirs") => void;
  onRemove: (packId: number, target: "pack" | "wish", amount?: number) => void;
}) {
  const [amtToMove, setAmtToMove] = useState<number>(1);

  if (!item || !item.variant || !item.potion) return null;

  const prefix = `${item.variant !== "Reg" ? item.variant + " " : ""}${item.potion !== "NoPot" ? item.potion + " " : ""}`;

  return (
    <div className="bg-white rounded-[20px] p-4 text-center shadow-sm relative border border-stone-100 flex flex-col items-center">
      {item.qty > 1 && (
        <div className="absolute top-2 left-2 bg-white text-[#333] border-2 border-[#333] rounded-[12px] px-1.5 py-0.5 text-[12px] font-black z-10">
          x{item.qty}
        </div>
      )}
      <button
        onClick={() => onRemove(item.packId!, target)}
        className="absolute top-2 right-2 bg-[#ffe5e5] text-[#c9302c] w-[25px] h-[25px] rounded-full font-bold text-[12px] flex items-center justify-center hover:brightness-95"
        title="Remove entire stack from inventory"
      >
        X
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt={item.name}
        className="w-[70px] h-[70px] object-contain mb-2"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/100x100/333/FFF?text=Pet";
        }}
      />
      <div
        className="text-[14px] font-black text-[#333] mt-2 truncate w-full"
        title={prefix + item.name}
      >
        {prefix}
        {item.name}
      </div>
      <div className="text-[18px] font-black text-[#333]">
        {item.value.toFixed(2)}
      </div>

      <div className="flex items-center justify-between gap-1 mt-2 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200 w-full box-border">
        <span className="text-[11px] font-bold text-stone-400">Qty:</span>
        <input
          type="number"
          min="1"
          max={item.qty}
          value={amtToMove}
          onChange={(e) =>
            setAmtToMove(
              Math.max(1, Math.min(item.qty, parseInt(e.target.value) || 1)),
            )
          }
          className="w-8 text-center bg-transparent text-[13px] font-black text-[#333] outline-none"
        />
        <button
          onClick={() => {
            onRemove(item.packId!, target, amtToMove);
            setAmtToMove(1);
          }}
          className="bg-[#ffe5e5] text-[#c9302c] px-2 py-1 rounded-[6px] font-black text-[11px] hover:brightness-95 transition-all shrink-0"
          title="Deduct this exact amount from your inventory stack"
        >
          - Reduce
        </button>
      </div>

      {target === "pack" && (
        <div className="flex gap-1.5 w-full mt-auto pt-3">
          <button
            onClick={() => onAddOffer({ ...item, qty: amtToMove }, "mine")}
            className="flex-1 py-1.5 rounded-[10px] text-[13px] font-black bg-[#e2f0e6] text-[#2d8647] hover:brightness-95 transition-all"
          >
            Your Offer
          </button>
          <button
            onClick={() => onAddOffer({ ...item, qty: amtToMove }, "theirs")}
            className="flex-1 py-1.5 rounded-[10px] text-[13px] font-black bg-[#fce4e4] text-[#c9302c] hover:brightness-95 transition-all"
          >
            Their Offer
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  record,
  onRemove,
  onComplete,
}: {
  record: TradeRecord;
  onRemove: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const borderColor =
    record.status === "WIN"
      ? "border-l-[#85d67a]"
      : record.status === "LOSE"
        ? "border-l-[#ff7c7c]"
        : "border-l-[#ddd]";

  return (
    <div
      className={`bg-white rounded-[15px] p-[15px] flex flex-col gap-2 shadow-sm border-l-8 ${borderColor} col-span-full relative`}
    >
      <div className="flex justify-between font-bold text-[14px] text-[#888] pr-8">
        <span>{record.date}</span>
        <span className="text-[#333] font-black">{record.status}</span>
      </div>

      <button
        onClick={() => onRemove(record.id)}
        className="absolute top-3 right-3 text-[#ff7c7c] hover:text-[#c9302c] font-black text-[14px] px-1"
        title="Delete Record"
      >
        ✕
      </button>
      <div className="flex gap-5 text-[14px] font-semibold">
        <div className="flex-1 bg-[#f9f9f9] p-2.5 rounded-[8px]">
          <strong>Given ({record.myTotal.toFixed(2)}):</strong>
          <br />
          <span className="text-[#555]">
            {record.given.length > 0 ? record.given.join(", ") : "Nothing"}
          </span>
        </div>
        <div className="flex-1 bg-[#f9f9f9] p-2.5 rounded-[8px]">
          <strong>Got ({record.theirTotal.toFixed(2)}):</strong>
          <br />
          <span className="text-[#555]">
            {record.received.length > 0
              ? record.received.join(", ")
              : "Nothing"}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-1 pt-2 border-t border-stone-100 flex-wrap gap-2">
        <div className="text-[12px] font-bold text-stone-400 flex items-center gap-1">
          <span>Status:</span>
          {record.isCompleted ? (
            <span className="text-[#2d8647] font-extrabold">
              ✅ Transferred to Inventory
            </span>
          ) : (
            <span className="text-[#c9302c] font-extrabold">
              ⏳ Pending Transfer
            </span>
          )}
        </div>

        {!record.isCompleted && (
          <button
            onClick={() => onComplete(record.id)}
            className="px-3 py-1 bg-[#85d67a] hover:bg-[#74c569] text-white font-black text-[12px] rounded-lg transition-all shadow-sm"
          >
            Apply to Backpack
          </button>
        )}
      </div>
    </div>
  );
}

function GlobalTradeCard({
  trade,
  onLoadTrade,
  currentUserId,
  onDeleteGlobal,
  onCompleteGlobal,
}: {
  trade: GlobalTrade;
  onLoadTrade: (mine: TradeItem[], theirs: TradeItem[]) => void;
  currentUserId: string | null;
  onDeleteGlobal: (tradeId: string) => void;
  onCompleteGlobal: (trade: GlobalTrade) => void;
}) {
  const formatName = (i: TradeItem) =>
    `${i.qty}x ${i.variant !== "Reg" ? i.variant + " " : ""}${i.potion !== "NoPot" ? i.potion + " " : ""}${i.name}`;

  const isPostOwner = currentUserId && trade.user_id === currentUserId;

  return (
    <div className="bg-white rounded-[15px] p-[15px] flex flex-col gap-2 shadow-sm border-l-8 border-l-[#5dbbff] col-span-full relative">
      <div className="flex justify-between font-bold text-[14px] text-[#888] pr-8">
        <span>
          Posted by:{" "}
          <span className="text-[#333] font-black">{trade.poster_name}</span>
          {isPostOwner && (
            <span className="text-[11px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md ml-1.5">
              You
            </span>
          )}
        </span>
        <span>{new Date(trade.created_at).toLocaleString()}</span>
      </div>

      {isPostOwner && (
        <button
          onClick={() => onDeleteGlobal(trade.id)}
          className="absolute top-3 right-3 text-[#ff7c7c] hover:text-[#c9302c] font-black text-[14px] px-1"
          title="Remove post from Public Board"
        >
          ✕
        </button>
      )}

      <div className="flex gap-5 text-[14px] font-semibold">
        <div className="flex-1 bg-[#f9f9f9] p-2.5 rounded-[8px]">
          <strong>
            They are offering ({Number(trade.my_total).toFixed(2)}):
          </strong>
          <br />
          <span className="text-[#555]">
            {trade.my_offer.map(formatName).join(", ") || "Nothing"}
          </span>
        </div>
        <div className="flex-1 bg-[#f9f9f9] p-2.5 rounded-[8px]">
          <strong>They want ({Number(trade.their_total).toFixed(2)}):</strong>
          <br />
          <span className="text-[#555]">
            {trade.their_offer.map(formatName).join(", ") || "Nothing"}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
        <button
          onClick={() => onLoadTrade(trade.their_offer, trade.my_offer)}
          className="flex-1 py-2 bg-[#e2f0e6] text-[#2d8647] font-black rounded-[10px] hover:brightness-95 transition-all shadow-sm"
        >
          Evaluate Trade in Calculator
        </button>

        {isPostOwner && (
          <button
            onClick={() => onCompleteGlobal(trade)}
            className="flex-1 py-2 bg-[#85d67a] text-white font-black rounded-[10px] hover:brightness-95 transition-all shadow-sm"
          >
            Complete Trade & Update Backpack
          </button>
        )}
      </div>
    </div>
  );
}

export default function SearchBar({
  onAddOffer,
  onAddInventory,
  onRemoveInventory,
  myBackpack,
  myWishlist,
  tradeHistory,
  onRemoveHistory,
  onCompleteHistory,
  onExport,
  onImport,
  globalTrades,
  onRefreshGlobal,
  onLoadTrade,
  currentUserId,
  onDeleteGlobal,
  onCompleteGlobal,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pets">("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"high" | "low">("high");

  // Value Range & Pagination states
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [activeTab, setActiveTab] = useState<
    "db" | "pack" | "wish" | "hist" | "global"
  >("db");
  const [results, setResults] = useState<PetItem[]>([]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const typedDatabase = petDatabase as PetItem[];

      let filtered = typedDatabase.filter((pet) =>
        pet.name.toLowerCase().includes(query.toLowerCase()),
      );

      if (filter === "pets") {
        filtered = filtered.filter((pet) => pet.is_pet);
      }

      if (rarityFilter !== "all") {
        filtered = filtered.filter(
          (pet) =>
            pet.rarity.toLowerCase().replace(/[^a-z]/g, "") ===
            rarityFilter.toLowerCase().replace(/[^a-z]/g, ""),
        );
      }

      if (minVal !== "") {
        const min = parseFloat(minVal);
        if (!isNaN(min)) {
          filtered = filtered.filter(
            (pet) => (pet.values?.Reg?.NoPot || 0) >= min,
          );
        }
      }

      if (maxVal !== "") {
        const max = parseFloat(maxVal);
        if (!isNaN(max)) {
          filtered = filtered.filter(
            (pet) => (pet.values?.Reg?.NoPot || 0) <= max,
          );
        }
      }

      filtered.sort((a, b) => {
        const valA = a.values?.Reg?.NoPot || 0;
        const valB = b.values?.Reg?.NoPot || 0;
        return sortMode === "high" ? valB - valA : valA - valB;
      });

      const total = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
      setTotalPages(total);

      const safePage = Math.min(currentPage, total);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
      }

      setResults(
        filtered.slice(
          (safePage - 1) * ITEMS_PER_PAGE,
          safePage * ITEMS_PER_PAGE,
        ),
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, filter, rarityFilter, sortMode, minVal, maxVal, currentPage]);

  const getTabClass = (tabId: string) => {
    const base =
      "px-[15px] py-[10px] rounded-[20px] border-none cursor-pointer font-extrabold text-[15px] transition-all duration-200 ";
    return activeTab === tabId
      ? base + "bg-[#333] text-white shadow-sm"
      : base + "bg-transparent text-[#a39d91]";
  };

  const processInventory = (inv: TradeItem[]) => {
    if (!inv || !Array.isArray(inv)) return [];

    const res = inv.filter((item) =>
      item?.name?.toLowerCase().includes(query.toLowerCase()),
    );

    res.sort((a, b) =>
      sortMode === "high"
        ? (b?.value || 0) - (a?.value || 0)
        : (a?.value || 0) - (b?.value || 0),
    );
    return res;
  };

  const packTotal = myBackpack.reduce(
    (sum, item) => sum + item.value * item.qty,
    0,
  );
  const wishTotal = myWishlist.reduce(
    (sum, item) => sum + item.value * item.qty,
    0,
  );
  const progressPercent =
    wishTotal === 0 ? 0 : Math.min((packTotal / wishTotal) * 100, 100);

  const sortedBackpack = processInventory(myBackpack);
  const sortedWishlist = processInventory(myWishlist);

  const filteredHistory = tradeHistory.filter((record) => {
    if (!query) return true;
    const searchStr = query.toLowerCase();
    return (
      record.status.toLowerCase().includes(searchStr) ||
      record.date.toLowerCase().includes(searchStr) ||
      record.given.some((g) => g.toLowerCase().includes(searchStr)) ||
      record.received.some((r) => r.toLowerCase().includes(searchStr))
    );
  });

  const filteredGlobalTrades = globalTrades.filter((trade) => {
    if (!query) return true;
    const searchStr = query.toLowerCase();
    const formatName = (i: TradeItem) =>
      `${i.qty}x ${i.variant !== "Reg" ? i.variant + " " : ""}${i.potion !== "NoPot" ? i.potion + " " : ""}${i.name}`;

    const offerStr = trade.my_offer.map(formatName).join(" ").toLowerCase();
    const demandStr = trade.their_offer.map(formatName).join(" ").toLowerCase();

    return (
      trade.poster_name.toLowerCase().includes(searchStr) ||
      offerStr.includes(searchStr) ||
      demandStr.includes(searchStr)
    );
  });

  const handleTabChange = (
    tabId: "db" | "pack" | "wish" | "hist" | "global",
  ) => {
    setActiveTab(tabId);
    setQuery("");
    setCurrentPage(1);
    if (tabId === "global") {
      onRefreshGlobal();
    }
  };

  return (
    <div className="w-full max-w-[1200px] bg-[#ebe6da] p-[30px] rounded-[40px] flex flex-col mt-4 box-border mb-[100px]">
      <div className="flex gap-[10px] mb-[25px] flex-wrap bg-white p-[10px] rounded-[30px] items-center">
        <button
          onClick={() => handleTabChange("db")}
          className={getTabClass("db")}
        >
          Database
        </button>
        <button
          onClick={() => handleTabChange("pack")}
          className={getTabClass("pack")}
        >
          My Backpack
        </button>
        <button
          onClick={() => handleTabChange("wish")}
          className={getTabClass("wish")}
        >
          Wishlist
        </button>
        <button
          onClick={() => handleTabChange("hist")}
          className={getTabClass("hist")}
        >
          History
        </button>
        <button
          onClick={() => handleTabChange("global")}
          className={getTabClass("global")}
        >
          🌐 Global Feed
        </button>

        <div className="w-[2px] h-[25px] bg-[#eee] mx-[5px] hidden md:block"></div>

        <input
          type="text"
          placeholder={
            activeTab === "hist" || activeTab === "global"
              ? "Search feed text..."
              : "Search pets..."
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(1);
          }} // Updated
          className="flex-1 px-[10px] py-[12px] rounded-[30px] border-none text-[15px] bg-transparent outline-none min-w-[150px] font-bold"
        />

        {activeTab !== "hist" && activeTab !== "global" && (
          <>
            <input
              type="number"
              placeholder="Min Val"
              value={minVal}
              onChange={(e) => {
                setMinVal(e.target.value);
                setCurrentPage(1);
              }} // Updated
              className="w-[90px] px-[15px] py-[10px] rounded-[20px] border-2 border-[#eee] bg-white font-bold outline-none text-[14px]"
            />
            <input
              type="number"
              placeholder="Max Val"
              value={maxVal}
              onChange={(e) => {
                setMaxVal(e.target.value);
                setCurrentPage(1);
              }} // Updated
              className="w-[90px] px-[15px] py-[10px] rounded-[20px] border-2 border-[#eee] bg-white font-bold outline-none text-[14px]"
            />

            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as "all" | "pets");
                setCurrentPage(1);
              }} // Updated
              className="px-[15px] py-[10px] rounded-[20px] border-2 border-[#eee] bg-white font-bold outline-none cursor-pointer text-[14px]"
            >
              <option value="all">All Items</option>
              <option value="pets">Pets Only</option>
            </select>

            <select
              value={rarityFilter}
              onChange={(e) => {
                setRarityFilter(e.target.value);
                setCurrentPage(1);
              }} // Updated
              className="px-[15px] py-[10px] rounded-[20px] border-2 border-[#eee] bg-white font-bold outline-none cursor-pointer text-[14px]"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="ultra-rare">Ultra-Rare</option>
              <option value="legendary">Legendary</option>
            </select>

            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as "high" | "low");
                setCurrentPage(1);
              }} // Updated
              className="px-[15px] py-[10px] rounded-[20px] border-2 border-[#eee] bg-white font-bold outline-none cursor-pointer text-[14px]"
            >
              <option value="high">High-Low</option>
              <option value="low">Low-High</option>
            </select>
          </>
        )}
      </div>

      {activeTab === "wish" && (
        <div className="w-full bg-[#eee] rounded-[20px] h-[25px] mb-[20px] overflow-hidden relative">
          <div
            className="h-full bg-[#85d67a] transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
          <div className="absolute w-full text-center top-[3px] text-[14px] font-bold text-[#333]">
            {wishTotal === 0
              ? "Add items to your wishlist!"
              : `Goal: ${packTotal.toFixed(2)} / ${wishTotal.toFixed(2)} (${Math.round(progressPercent)}%)`}
          </div>
        </div>
      )}

      {activeTab === "db" && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
            {results.map((pet) => (
              <DbResultCard
                key={pet.id}
                pet={pet}
                onAddOffer={onAddOffer}
                onAddInventory={onAddInventory}
              />
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-black/10 w-full">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-[#333] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              Prev
            </button>
            <span className="font-bold text-[#333] text-[15px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-[#333] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              Next
            </button>
          </div>
        </>
      )}

      {activeTab === "pack" && (
        <>
          <div className="flex gap-2.5 mb-4 justify-center flex-wrap">
            <button
              onClick={onExport}
              className="px-4 py-2 bg-[#333] text-white rounded-[15px] font-bold text-[13px] hover:brightness-110 transition-all shadow-sm"
            >
              Export Data Backup
            </button>
            <button
              onClick={() => document.getElementById("importFile")?.click()}
              className="px-4 py-2 bg-[#333] text-white rounded-[15px] font-bold text-[13px] hover:brightness-110 transition-all shadow-sm"
            >
              Import Data Backup
            </button>
            <input
              type="file"
              id="importFile"
              style={{ display: "none" }}
              accept=".json"
              onChange={onImport}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {sortedBackpack.length === 0 ? (
              <div className="col-span-full text-center font-bold text-[#a39d91] p-10">
                Backpack is empty!
              </div>
            ) : (
              sortedBackpack.map((item, index) => (
                <InventoryCard
                  key={
                    item.packId ||
                    `${item.id}-${item.variant}-${item.potion}-${index}`
                  }
                  item={item}
                  target="pack"
                  onAddOffer={onAddOffer}
                  onRemove={onRemoveInventory}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "wish" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {sortedWishlist.length === 0 ? (
            <div className="col-span-full text-center font-bold text-[#a39d91] p-10">
              Wishlist is empty!
            </div>
          ) : (
            sortedWishlist.map((item, index) => (
              <InventoryCard
                key={
                  item.packId ||
                  `${item.id}-${item.variant}-${item.potion}-${index}`
                }
                item={item}
                target="wish"
                onAddOffer={onAddOffer}
                onRemove={onRemoveInventory}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "hist" && (
        <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-2">
          {filteredHistory.length === 0 ? (
            <div className="text-center font-bold text-[#a39d91] p-10">
              No matching records discovered in history.
            </div>
          ) : (
            filteredHistory.map((record, index) => (
              <HistoryCard
                key={record.id || index}
                record={record}
                onRemove={onRemoveHistory}
                onComplete={onCompleteHistory}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "global" && (
        <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-2">
          <button
            onClick={onRefreshGlobal}
            className="mb-2 px-4 py-2 bg-[#5dbbff] text-white font-bold rounded-[15px] self-start shadow-sm hover:brightness-110 transition-all"
          >
            🔄 Refresh Feed
          </button>
          {filteredGlobalTrades.length === 0 ? (
            <div className="text-center font-bold text-[#a39d91] p-10">
              No matching public posts found.
            </div>
          ) : (
            filteredGlobalTrades.map((trade) => (
              <GlobalTradeCard
                key={trade.id}
                trade={trade}
                onLoadTrade={onLoadTrade}
                currentUserId={currentUserId}
                onDeleteGlobal={onDeleteGlobal}
                onCompleteGlobal={onCompleteGlobal}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
