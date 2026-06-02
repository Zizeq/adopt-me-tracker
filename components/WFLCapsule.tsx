// components/WFLCapsule.tsx
import React from "react";

interface WFLCapsuleProps {
  myTotal: number;
  theirTotal: number;
}

export default function WFLCapsule({ myTotal, theirTotal }: WFLCapsuleProps) {
  const diff = myTotal - theirTotal;

  const isFair =
    (myTotal === 0 && theirTotal === 0) || Math.abs(diff) <= theirTotal * 0.05;
  const isWin = !isFair && diff <= 0;
  const isLose = !isFair && diff > 0;

  return (
    <div className="w-full max-w-[900px] bg-[#ebe6da] rounded-[60px] py-4 px-10 flex items-center justify-between mb-5 shadow-inner">
      {/* My Score */}
      <div className="text-[55px] font-black w-[120px] text-center text-[#333] leading-none">
        {myTotal.toFixed(2)}
      </div>

      {/* Center Console */}
      <div className="flex flex-col items-center flex-1">
        <div className="bg-black/5 px-5 py-1.5 rounded-full flex gap-5 text-[24px] font-black text-[#cdc6ba] uppercase mb-1">
          <span className={isWin ? "text-[#85d67a] drop-shadow-sm" : ""}>
            Win
          </span>
          <span className={isFair ? "text-white drop-shadow-sm" : ""}>
            Fair
          </span>
          <span className={isLose ? "text-[#ff7c7c] drop-shadow-sm" : ""}>
            Lose
          </span>
        </div>
        <div className="flex justify-between w-[250px] text-[15px] font-extrabold text-[#a39d91]">
          <span>YOUR OFFER</span>
          <span>|</span>
          <span>THEIR OFFER</span>
        </div>
      </div>

      {/* Their Score */}
      <div className="text-[55px] font-black w-[120px] text-center text-[#333] leading-none">
        {theirTotal.toFixed(2)}
      </div>
    </div>
  );
}
