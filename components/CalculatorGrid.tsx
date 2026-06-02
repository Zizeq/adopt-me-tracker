// components/CalculatorGrid.tsx
import React from "react";
import PetSlot from "./PetSlot";
import { TradeItem } from "./SearchBar";

interface CalculatorGridProps {
  items: TradeItem[];
  gridType: "mine" | "theirs";
  onRemoveItem: (index: number) => void;
  maxItemsCount: number;
}

export default function CalculatorGrid({
  items,
  gridType,
  onRemoveItem,
  maxItemsCount,
}: CalculatorGridProps) {
  const rows = Math.max(3, Math.ceil(maxItemsCount / 3));
  const totalSlots = rows * 3;

  const aspectClass =
    rows === 3
      ? "aspect-[3/3]"
      : rows === 4
        ? "aspect-[3/4]"
        : rows === 5
          ? "aspect-[3/5]"
          : rows === 6
            ? "aspect-[3/6]"
            : "aspect-[3/7]";

  const containerStyle =
    gridType === "mine"
      ? "bg-[#ff9e5e] border-[#ff9e5e]"
      : "bg-[#ff7c7c] border-[#ff7c7c]";

  return (
    <div
      className={`w-full max-w-[320px] rounded-[15px] p-1 border-[3px] grid grid-cols-3 gap-1 relative transition-all duration-300 ${aspectClass} ${containerStyle}`}
      style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: totalSlots }).map((_, idx) => (
        <PetSlot
          key={idx}
          index={idx}
          item={items[idx]}
          gridType={gridType}
          onRemove={onRemoveItem}
        />
      ))}
    </div>
  );
}
