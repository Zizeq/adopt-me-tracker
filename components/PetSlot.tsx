// components/PetSlot.tsx
import React from "react";
import { TradeItem } from "./SearchBar";

interface PetSlotProps {
  item?: TradeItem;
  index: number;
  gridType: "mine" | "theirs";
  onRemove?: (index: number) => void;
}

export default function PetSlot({
  item,
  index,
  gridType,
  onRemove,
}: PetSlotProps) {
  const slotGradient =
    gridType === "mine"
      ? "bg-[linear-gradient(180deg,#ffe8d6,#ffdbbf)]"
      : "bg-[linear-gradient(180deg,#ffe5e5,#ffcccc)]";

  if (!item) {
    return (
      <div
        className={`w-full h-full rounded-[8px] flex flex-col items-center justify-center relative cursor-pointer ${slotGradient}`}
      >
        <span className="text-[40px] text-white/60 font-bold leading-none mb-2">
          +
        </span>
      </div>
    );
  }

  const safeImageUrl = `https://wsrv.nl/?url=${encodeURIComponent(item.image)}`;

  return (
    <div
      className={`w-full h-full group relative rounded-[8px] flex flex-col items-center justify-center cursor-pointer ${slotGradient}`}
    >
      {item.qty > 1 && (
        <div className="absolute -top-2 -left-2 bg-white text-[#333] border-2 border-[#333] rounded-[12px] px-1.5 py-0.5 text-[12px] font-black z-10">
          x{item.qty}
        </div>
      )}

      <button
        onClick={() => onRemove && onRemove(index)}
        className="absolute -top-2 -right-2 bg-[#333] text-white border-none rounded-full w-[24px] h-[24px] text-[12px] font-bold cursor-pointer hidden group-hover:block z-10"
      >
        X
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safeImageUrl}
        alt={item.name}
        crossOrigin="anonymous"
        className="w-[65%] h-[65%] object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/100x100/333/FFF?text=Pet";
        }}
      />

      <div className="text-[12px] font-black mt-1 text-[#333] bg-white/50 px-1.5 py-0.5 rounded-[10px]">
        {item.value.toFixed(2)}
      </div>
    </div>
  );
}
