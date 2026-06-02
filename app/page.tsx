"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthButton from "../components/AuthButton";
import CalculatorGrid from "../components/CalculatorGrid";
import SearchBar, {
  TradeItem,
  TradeRecord,
  PetItem,
  GlobalTrade,
} from "../components/SearchBar";
import WFLCapsule from "../components/WFLCapsule";
import { petDatabase } from "../lib/master_database";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabase";

interface SavedInventoryItem {
  id: number | string;
  variant: string;
  potion: string;
  qty?: number;
  [key: string]: unknown;
}

export default function Home() {
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [myOffer, setMyOffer] = useState<TradeItem[]>([]);
  const [theirOffer, setTheirOffer] = useState<TradeItem[]>([]);

  const [myBackpack, setMyBackpack] = useState<TradeItem[]>([]);
  const [myWishlist, setMyWishlist] = useState<TradeItem[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [globalTrades, setGlobalTrades] = useState<GlobalTrade[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const tradeScreenshotRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleRemoveHistory = (id: string) => {
    setTradeHistory((prev) => prev.filter((record) => record.id !== id));
  };

  const syncWithLiveDatabase = useCallback(
    (inventory: SavedInventoryItem[]): TradeItem[] => {
      return inventory
        .map((item) => {
          const livePet = (petDatabase as PetItem[]).find(
            (p) => Number(p.id) === Number(item.id),
          );

          if (!livePet) return null;

          return {
            ...item,
            id: Number(item.id),
            name: livePet.name,
            image: livePet.image,
            variant: item.variant,
            potion: item.potion,
            qty: item.qty ?? 1,
            value:
              livePet.values[item.variant as "Reg" | "N" | "M"][
                item.potion as "NoPot" | "R" | "F" | "FR"
              ],
          } as TradeItem;
        })
        .filter((item): item is TradeItem => item !== null);
    },
    [],
  );

  const encodeOffer = (offer: TradeItem[]) => {
    return offer
      .map((i) => `${i.id}-${i.variant}-${i.potion}-${i.qty}`)
      .join("_");
  };

  const decodeOffer = (encoded: string): TradeItem[] => {
    if (!encoded) return [];
    const items = encoded.split("_");
    const decoded: TradeItem[] = [];

    items.forEach((str) => {
      const [idStr, variant, potion, qtyStr] = str.split("-");
      const id = parseInt(idStr);
      const qty = parseInt(qtyStr);
      const pet = (petDatabase as PetItem[]).find((p) => p.id === id);

      if (pet) {
        decoded.push({
          id: pet.id,
          name: pet.name,
          image: pet.image,
          variant: variant as "Reg" | "N" | "M",
          potion: potion as "NoPot" | "R" | "F" | "FR",
          qty: isNaN(qty) ? 1 : qty,
          value:
            pet.values[variant as "Reg" | "N" | "M"][
              potion as "NoPot" | "R" | "F" | "FR"
            ],
        });
      }
    });
    return decoded;
  };

  const fetchGlobalTrades = async () => {
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("global_trades")
      .select("*")
      .gt("created_at", fortyEightHoursAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching global trades:", error);
    } else if (data) {
      setGlobalTrades(data as GlobalTrade[]);
    }
  };

  useEffect(() => {
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const mUrl = params.get("m");
    const tUrl = params.get("t");

    if (mUrl || tUrl) {
      if (mUrl) setMyOffer(decodeOffer(mUrl));
      if (tUrl) setTheirOffer(decodeOffer(tUrl));
      window.history.replaceState({}, "", window.location.pathname);
    }

    const initializeUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setCurrentUserId(session.user.id);

          const { data, error } = await supabase
            .from("user_profiles")
            .select("backpack, wishlist, trade_history")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!error && data) {
            if (data.backpack && data.backpack.length > 0) {
              setMyBackpack(
                syncWithLiveDatabase(data.backpack as SavedInventoryItem[]),
              );
            } else {
              const savedPack = localStorage.getItem("adoptMeBackpack");
              if (savedPack)
                setMyBackpack(syncWithLiveDatabase(JSON.parse(savedPack)));
            }

            if (data.wishlist && data.wishlist.length > 0) {
              setMyWishlist(
                syncWithLiveDatabase(data.wishlist as SavedInventoryItem[]),
              );
            } else {
              const savedWish = localStorage.getItem("adoptMeWishlist");
              if (savedWish)
                setMyWishlist(syncWithLiveDatabase(JSON.parse(savedWish)));
            }

            if (data.trade_history && data.trade_history.length > 0) {
              setTradeHistory(data.trade_history);
            } else {
              const savedHist = localStorage.getItem("adoptMeHistory");
              if (savedHist) setTradeHistory(JSON.parse(savedHist));
            }
          }
        } else {
          const savedPack = localStorage.getItem("adoptMeBackpack");
          const savedWish = localStorage.getItem("adoptMeWishlist");
          const savedHist = localStorage.getItem("adoptMeHistory");
          if (savedPack)
            setMyBackpack(syncWithLiveDatabase(JSON.parse(savedPack)));
          if (savedWish)
            setMyWishlist(syncWithLiveDatabase(JSON.parse(savedWish)));
          if (savedHist) setTradeHistory(JSON.parse(savedHist));
        }
      } catch (err) {
        console.error("Error initializing user data:", err);
      }

      setIsCloudLoaded(true);
    };

    initializeUserData();
    fetchGlobalTrades();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setCurrentUserId(null);
        setMyOffer([]);
        setTheirOffer([]);
        setMyBackpack([]);
        setMyWishlist([]);
        setTradeHistory([]);
        localStorage.removeItem("adoptMeBackpack");
        localStorage.removeItem("adoptMeWishlist");
        localStorage.removeItem("adoptMeHistory");
        setIsCloudLoaded(false);
      } else if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    });

    const globalTradesChannel = supabase
      .channel("public-global-trades")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_trades" },
        () => {
          fetchGlobalTrades();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(globalTradesChannel);
    };
  }, [syncWithLiveDatabase]);

  useEffect(() => {
    if (!isMounted || !isCloudLoaded) return;

    localStorage.setItem("adoptMeBackpack", JSON.stringify(myBackpack));

    const syncBackpackWithCloud = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({ backpack: myBackpack })
          .eq("id", user.id);
      }
    };
    syncBackpackWithCloud();
  }, [myBackpack, isMounted, isCloudLoaded]);

  useEffect(() => {
    if (!isMounted || !isCloudLoaded) return;

    localStorage.setItem("adoptMeWishlist", JSON.stringify(myWishlist));

    const syncWishlistWithCloud = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("user_profiles")
          .update({ wishlist: myWishlist })
          .eq("id", user.id);
        if (error)
          console.error("❌ Supabase Wishlist Sync Failed:", error.message);
      }
    };
    syncWishlistWithCloud();
  }, [myWishlist, isMounted, isCloudLoaded]);

  useEffect(() => {
    if (!isMounted || !isCloudLoaded) return;

    localStorage.setItem("adoptMeHistory", JSON.stringify(tradeHistory));

    const syncHistoryWithCloud = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("user_profiles")
          .update({ trade_history: tradeHistory })
          .eq("id", user.id);
        if (error)
          console.error("❌ Supabase History Sync Failed:", error.message);
      }
    };
    syncHistoryWithCloud();
  }, [tradeHistory, isMounted, isCloudLoaded]);

  const handleScreenshot = async () => {
    if (!tradeScreenshotRef.current) return;
    try {
      const dataUrl = await toPng(tradeScreenshotRef.current, {
        backgroundColor: "#f6f3eb",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `adopt-me-trade-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Screenshot failed", err);
      alert("Failed to capture screenshot. Make sure images are fully loaded.");
    }
  };

  const handleShareLink = () => {
    const m = encodeOffer(myOffer);
    const t = encodeOffer(theirOffer);
    const url = `${window.location.origin}${window.location.pathname}?m=${m}&t=${t}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(
          "Trade link copied to clipboard! Anyone who clicks this link will see this exact trade.",
        );
      })
      .catch(() => {
        alert("Failed to copy. Here is your link:\n\n" + url);
      });
  };

  const handlePostToGlobal = async () => {
    if (!currentUserId) {
      return alert(
        "You must create an account or sign in to post onto the Global Board!",
      );
    }

    if (myOffer.length === 0 && theirOffer.length === 0)
      return alert("Trade is empty!");

    const name = window.prompt(
      "Enter your display name for the public board (Max 20 chars):",
    );
    if (!name) return;

    if (name.length > 20) {
      return alert(
        "Name is too long! Maximum is 20 characters (Roblox limit).",
      );
    }

    const mySum = myOffer.reduce((sum, item) => sum + item.value * item.qty, 0);
    const theirSum = theirOffer.reduce(
      (sum, item) => sum + item.value * item.qty,
      0,
    );

    const { error } = await supabase.from("global_trades").insert([
      {
        user_id: currentUserId,
        poster_name: name,
        my_offer: myOffer,
        their_offer: theirOffer,
        my_total: mySum,
        their_total: theirSum,
      },
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      alert("Failed to post trade.");
    } else {
      alert("Trade posted to the Global Board!");
      fetchGlobalTrades();
    }
  };

  const handleDeleteGlobalTrade = async (tradeId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove your trade from the public board?",
      )
    )
      return;

    const formattedId = /^\d+$/.test(tradeId) ? Number(tradeId) : tradeId;

    const { error } = await supabase
      .from("global_trades")
      .delete()
      .eq("id", formattedId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Failed to delete public post:", error);
      alert("Could not remove post.");
    } else {
      alert("Post removed successfully!");
      fetchGlobalTrades();
    }
  };

  const handleLoadTrade = (mine: TradeItem[], theirs: TradeItem[]) => {
    setMyOffer(mine);
    setTheirOffer(theirs);
  };

  const handleExport = () => {
    const fullSave = { pack: myBackpack, wish: myWishlist, hist: tradeHistory };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(fullSave));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "adopt_me_tracker_backup.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.pack) setMyBackpack(syncWithLiveDatabase(imported.pack));
        if (imported.wish) setMyWishlist(syncWithLiveDatabase(imported.wish));
        if (imported.hist) setTradeHistory(imported.hist);
        alert(
          "Data successfully restored and synced with current database values!",
        );
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRemoveMine = (index: number) => {
    setMyOffer((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveTheirs = (index: number) => {
    setTheirOffer((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveInventory = (
    packId: number,
    target: "pack" | "wish",
    amount?: number,
  ) => {
    const targetSet = target === "pack" ? setMyBackpack : setMyWishlist;
    targetSet((prev) => {
      const targetItem = prev.find((i) => i.packId === packId);
      if (!targetItem) return prev;

      const amtToRemove = amount ?? targetItem.qty;

      if (targetItem.qty > amtToRemove) {
        return prev.map((item) =>
          item.packId === packId
            ? { ...item, qty: item.qty - amtToRemove }
            : item,
        );
      }
      return prev.filter((i) => i.packId !== packId);
    });
  };

  const handleAddOffer = (item: TradeItem, side: "mine" | "theirs") => {
    const targetSet = side === "mine" ? setMyOffer : setTheirOffer;
    targetSet((prevOffer) => {
      const itemsToAdd: TradeItem[] = Array.from({ length: item.qty }).map(
        () => ({
          ...item,
          qty: 1,
        }),
      );

      if (prevOffer.length + itemsToAdd.length > 18) {
        alert("Offer grid is full! Cannot add all requested items.");
        const dynamicSlotsAvailable = 18 - prevOffer.length;
        if (dynamicSlotsAvailable <= 0) return prevOffer;
        return [...prevOffer, ...itemsToAdd.slice(0, dynamicSlotsAvailable)];
      }
      return [...prevOffer, ...itemsToAdd];
    });
  };

  const handleAddInventory = (item: TradeItem, target: "pack" | "wish") => {
    if (item.qty > 100) {
      alert(
        "System Limit: You can only add up to 100 of an item to your backpack at once.",
      );
      return;
    }

    const targetSet = target === "pack" ? setMyBackpack : setMyWishlist;
    targetSet((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.id === item.id &&
          i.variant === item.variant &&
          i.potion === item.potion,
      );
      if (existingIndex >= 0) {
        const newArr = [...prev];
        newArr[existingIndex] = {
          ...newArr[existingIndex],
          qty: newArr[existingIndex].qty + item.qty,
        };
        return newArr;
      }
      return [...prev, { ...item, packId: Date.now() + Math.random() }];
    });
  };

  const handleAcceptTrade = () => {
    if (myOffer.length === 0 && theirOffer.length === 0)
      return alert("Trade is empty!");

    if (
      !confirm(
        "Do you want to log this trade to your History tab?\n\n(Note: This will NOT alter your backpack inventory items yet).",
      )
    )
      return;

    const mySum = myOffer.reduce((sum, item) => sum + item.value * item.qty, 0);
    const theirSum = theirOffer.reduce(
      (sum, item) => sum + item.value * item.qty,
      0,
    );
    const diff = mySum - theirSum;
    let status: "WIN" | "FAIR" | "LOSE" = "WIN";
    if ((mySum === 0 && theirSum === 0) || Math.abs(diff) <= theirSum * 0.05)
      status = "FAIR";
    else if (diff > 0) status = "LOSE";

    const formatName = (i: TradeItem) =>
      `${i.qty}x ${i.variant !== "Reg" ? i.variant + " " : ""}${i.potion !== "NoPot" ? i.potion + " " : ""}${i.name}`;

    const newRecord: TradeRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      given: myOffer.map(formatName),
      received: theirOffer.map(formatName),
      myTotal: mySum,
      theirTotal: theirSum,
      status,
      isCompleted: false,
      rawGiven: [...myOffer],
      rawReceived: [...theirOffer],
    };

    setTradeHistory((prev) => [newRecord, ...prev]);

    setMyOffer([]);
    setTheirOffer([]);

    setTimeout(() => {
      alert(
        "TRADE LOGGED! Check your History tab to apply changes to your backpack.",
      );
    }, 0);
  };

  const handleCompleteHistoryTrade = (tradeId: string) => {
    const record = tradeHistory.find((r) => r.id === tradeId);
    if (!record || record.isCompleted) return;

    const totalNeededGiven: { [key: string]: number } = {};
    (record.rawGiven || []).forEach((item) => {
      const key = `${item.id}-${item.variant}-${item.potion}`;
      totalNeededGiven[key] = (totalNeededGiven[key] || 0) + item.qty;
    });

    let hasItemExploit = false;
    let explicitErrorText = "";

    for (const offerItem of record.rawGiven || []) {
      const key = `${offerItem.id}-${offerItem.variant}-${offerItem.potion}`;
      const totalRequired = totalNeededGiven[key];

      const totalOwned = myBackpack
        .filter(
          (bp) =>
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion,
        )
        .reduce((sum, item) => sum + item.qty, 0);

      if (totalOwned < totalRequired) {
        hasItemExploit = true;
        explicitErrorText = `${totalRequired}x ${offerItem.variant !== "Reg" ? offerItem.variant + " " : ""}${offerItem.potion !== "NoPot" ? offerItem.potion + " " : ""}${offerItem.name}`;
        break;
      }
    }

    if (hasItemExploit) {
      return alert(
        `INVENTORY VERIFICATION FAILED:\n\nYou no longer own the items required to finalize this transfer!\n\nMissing: ${explicitErrorText}`,
      );
    }

    if (
      !confirm(
        "CONFIRM BACKPACK TRANSFER:\n\nThis will permanently subtract the given items from your backpack and insert received items. Proceed?",
      )
    )
      return;

    setMyBackpack((prev) => {
      let updatedPack = prev.map((item) => ({ ...item }));

      // Safely deduct across split stacks
      (record.rawGiven || []).forEach((offerItem) => {
        let remaining = offerItem.qty;
        for (let i = 0; i < updatedPack.length; i++) {
          const bp = updatedPack[i];
          if (
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion
          ) {
            if (bp.qty >= remaining) {
              bp.qty -= remaining;
              remaining = 0;
              break;
            } else {
              remaining -= bp.qty;
              bp.qty = 0;
            }
          }
        }
      });

      updatedPack = updatedPack.filter((bp) => bp.qty > 0);

      (record.rawReceived || []).forEach((offerItem) => {
        const bpIndex = updatedPack.findIndex(
          (bp) =>
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion,
        );

        if (bpIndex >= 0) {
          updatedPack[bpIndex].qty += offerItem.qty;
        } else {
          updatedPack.push({
            ...offerItem,
            id: Number(offerItem.id),
            qty: offerItem.qty ?? 1,
            packId: Date.now() + Math.random(),
          });
        }
      });

      return syncWithLiveDatabase(updatedPack as SavedInventoryItem[]);
    });

    setMyWishlist((prevWish) => {
      const updatedWish = prevWish.map((item) => ({ ...item }));
      (record.rawReceived || []).forEach((receivedItem) => {
        const wishIndex = updatedWish.findIndex(
          (w) =>
            Number(w.id) === Number(receivedItem.id) &&
            w.variant === receivedItem.variant &&
            w.potion === receivedItem.potion,
        );
        if (wishIndex >= 0) {
          updatedWish[wishIndex].qty -= receivedItem.qty;
        }
      });
      return updatedWish.filter((w) => w.qty > 0);
    });

    setTradeHistory((prev) =>
      prev.map((r) => (r.id === tradeId ? { ...r, isCompleted: true } : r)),
    );

    setTimeout(() => {
      alert(
        "Backpack successfully updated and matched items removed from Wishlist!",
      );
    }, 0);
  };

  const handleCompleteGlobalTrade = async (trade: GlobalTrade) => {
    if (!currentUserId || trade.user_id !== currentUserId) return;

    const totalNeededGiven: { [key: string]: number } = {};
    (trade.my_offer || []).forEach((item) => {
      const key = `${item.id}-${item.variant}-${item.potion}`;
      totalNeededGiven[key] = (totalNeededGiven[key] || 0) + item.qty;
    });

    let hasItemExploit = false;
    let explicitErrorText = "";

    for (const offerItem of trade.my_offer || []) {
      const key = `${offerItem.id}-${offerItem.variant}-${offerItem.potion}`;
      const totalRequired = totalNeededGiven[key];

      const totalOwned = myBackpack
        .filter(
          (bp) =>
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion,
        )
        .reduce((sum, item) => sum + item.qty, 0);

      if (totalOwned < totalRequired) {
        hasItemExploit = true;
        explicitErrorText = `${totalRequired}x ${offerItem.variant !== "Reg" ? offerItem.variant + " " : ""}${offerItem.potion !== "NoPot" ? offerItem.potion + " " : ""}${offerItem.name}`;
        break;
      }
    }

    if (hasItemExploit) {
      return alert(
        `INVENTORY VERIFICATION FAILED:\n\nYou no longer own the items offered on this board post to fulfill it!\n\nMissing: ${explicitErrorText}`,
      );
    }

    if (
      !confirm(
        "CONFIRM GLOBAL TRADE COMPLETION:\n\nThis will permanently subtract the items you offered from your backpack, add your wanted items, log a history record, and unlist this post from the board. Proceed?",
      )
    )
      return;

    setMyBackpack((prev) => {
      let updatedPack = prev.map((item) => ({ ...item }));

      // Safely deduct across split stacks
      (trade.my_offer || []).forEach((offerItem) => {
        let remaining = offerItem.qty;
        for (let i = 0; i < updatedPack.length; i++) {
          const bp = updatedPack[i];
          if (
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion
          ) {
            if (bp.qty >= remaining) {
              bp.qty -= remaining;
              remaining = 0;
              break;
            } else {
              remaining -= bp.qty;
              bp.qty = 0;
            }
          }
        }
      });

      updatedPack = updatedPack.filter((bp) => bp.qty > 0);

      (trade.their_offer || []).forEach((offerItem) => {
        const bpIndex = updatedPack.findIndex(
          (bp) =>
            Number(bp.id) === Number(offerItem.id) &&
            bp.variant === offerItem.variant &&
            bp.potion === offerItem.potion,
        );

        if (bpIndex >= 0) {
          updatedPack[bpIndex].qty += offerItem.qty;
        } else {
          updatedPack.push({
            ...offerItem,
            id: Number(offerItem.id),
            qty: offerItem.qty ?? 1,
            packId: Date.now() + Math.random(),
          });
        }
      });

      return syncWithLiveDatabase(updatedPack as SavedInventoryItem[]);
    });

    setMyWishlist((prevWish) => {
      const updatedWish = prevWish.map((item) => ({ ...item }));
      (trade.their_offer || []).forEach((receivedItem) => {
        const wishIndex = updatedWish.findIndex(
          (w) =>
            Number(w.id) === Number(receivedItem.id) &&
            w.variant === receivedItem.variant &&
            w.potion === receivedItem.potion,
        );
        if (wishIndex >= 0) {
          updatedWish[wishIndex].qty -= receivedItem.qty;
        }
      });
      return updatedWish.filter((w) => w.qty > 0);
    });

    const formatName = (i: TradeItem) =>
      `${i.qty}x ${i.variant !== "Reg" ? i.variant + " " : ""}${i.potion !== "NoPot" ? i.potion + " " : ""}${i.name}`;

    const diff = trade.my_total - trade.their_total;
    let status: "WIN" | "FAIR" | "LOSE" = "WIN";
    if (
      (trade.my_total === 0 && trade.their_total === 0) ||
      Math.abs(diff) <= trade.their_total * 0.05
    )
      status = "FAIR";
    else if (diff > 0) status = "LOSE";

    const globalHistoryRecord: TradeRecord = {
      id: Date.now().toString() + "-global",
      date: new Date().toLocaleString() + " (Global Feed)",
      given: trade.my_offer.map(formatName),
      received: trade.their_offer.map(formatName),
      myTotal: trade.my_total,
      theirTotal: trade.their_total,
      status,
      isCompleted: true,
      rawGiven: [...trade.my_offer],
      rawReceived: [...trade.their_offer],
    };

    setTradeHistory((prev) => [globalHistoryRecord, ...prev]);

    const formattedId = /^\d+$/.test(trade.id) ? Number(trade.id) : trade.id;

    const { error } = await supabase
      .from("global_trades")
      .delete()
      .eq("id", formattedId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Error removing completed global trade row:", error);
      alert(
        `Backpack balanced, but could not remove post from board.\n\nReason: ${error.message || "Unknown error"}`,
      );
    } else {
      alert(
        "Trade successfully processed! Backpack updated, Wishlist balanced, and board post archived.",
      );
      fetchGlobalTrades();
    }
  };

  const myTotal = myOffer.reduce((sum, item) => sum + item.value * item.qty, 0);
  const theirTotal = theirOffer.reduce(
    (sum, item) => sum + item.value * item.qty,
    0,
  );

  const SuggestionCard = ({
    item,
    side,
  }: {
    item: TradeItem;
    side: "mine" | "theirs";
  }) => (
    <div
      onClick={() => handleAddOffer({ ...item, qty: 1 }, side)}
      className="flex items-center gap-3 p-2.5 border border-[#eee] rounded-[15px] hover:bg-[#f9f9f9] cursor-pointer transition-colors bg-white shadow-sm w-full"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt={item.name}
        className="w-[45px] h-[45px] object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/100x100/333/FFF?text=Pet";
        }}
      />
      <div className="flex-1 text-left overflow-hidden">
        <div className="text-[13px] font-black text-[#333] leading-tight truncate">
          {item.variant && item.variant !== "Reg" ? item.variant + " " : ""}
          {item.potion && item.potion !== "NoPot" ? item.potion + " " : ""}
          {item.name}
        </div>
        <div className="text-[12px] font-bold text-[#888]">
          Val: {item.value.toFixed(2)}
        </div>
      </div>
      <div className="w-[28px] h-[28px] shrink-0 bg-[#85d67a] text-white font-black rounded-full flex items-center justify-center text-[16px] shadow-sm">
        +
      </div>
    </div>
  );

  const renderSuggestions = () => {
    if (!isMounted) return null;

    if (myTotal === 0 && theirTotal === 0) {
      return (
        <div className="text-[#a39d91] font-bold text-center mt-5">
          Add items to see Smart Suggestions!
        </div>
      );
    }

    const diff = theirTotal - myTotal;
    if (Math.abs(diff) < 0.1) {
      return (
        <div className="text-[#85d67a] font-black text-[20px] text-center mt-5">
          Trade is perfectly balanced!
        </div>
      );
    }

    if (diff > 0) {
      const availableBackpack = myBackpack
        .map((bpItem) => {
          const countInOffer = myOffer.filter(
            (o) =>
              o.id === bpItem.id &&
              o.variant === bpItem.variant &&
              o.potion === bpItem.potion,
          ).length;
          return {
            ...bpItem,
            availableQty: bpItem.qty - countInOffer,
          };
        })
        .filter((item) => item.availableQty > 0);

      const sortedPack = availableBackpack
        .sort((a, b) => Math.abs(a.value - diff) - Math.abs(b.value - diff))
        .slice(0, 5);

      return (
        <div className="flex flex-col gap-3 w-full mt-2">
          <div className="text-[14px] font-bold text-[#333] mb-1">
            You are under by{" "}
            <span className="text-[#ff7c7c]">{diff.toFixed(2)}</span>. Add from
            Backpack:
          </div>
          {sortedPack.length === 0 ? (
            <div className="text-[#a39d91] text-[13px] italic">
              No suitable items left in your backpack!
            </div>
          ) : (
            sortedPack.map((item, idx) => (
              <SuggestionCard key={idx} item={item} side="mine" />
            ))
          )}
        </div>
      );
    } else {
      const absDiff = Math.abs(diff);
      const typedDb = petDatabase as PetItem[];

      const mappedDb: TradeItem[] = typedDb.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        variant: "Reg" as const,
        potion: "NoPot" as const,
        qty: 1,
        value: p.values.Reg.NoPot,
      }));

      const sortedDb = mappedDb
        .sort(
          (a, b) => Math.abs(a.value - absDiff) - Math.abs(b.value - absDiff),
        )
        .slice(0, 5);

      return (
        <div className="flex flex-col gap-3 w-full mt-2">
          <div className="text-[14px] font-bold text-[#333] mb-1">
            You are over by{" "}
            <span className="text-[#85d67a]">{absDiff.toFixed(2)}</span>. Ask
            them to add:
          </div>
          {sortedDb.map((item, idx) => (
            <SuggestionCard key={idx} item={item} side="theirs" />
          ))}
        </div>
      );
    }
  };

  const maxItemsCount = Math.max(myOffer.length, theirOffer.length);

  return (
    <main className="p-[20px] md:p-[30px] 2xl:px-[20px] flex flex-col items-center bg-[#f6f3eb] min-h-screen font-sans text-[#333]">
      <div className="w-full max-w-[1200px] flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-black text-[#333] hidden sm:block">
          Adopt Me Trading Assistant
        </h1>
        <div className="ml-auto">
          <AuthButton />
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-5 w-full max-w-[1200px] mb-5">
        <div className="flex-1 flex flex-col items-center">
          <div
            ref={tradeScreenshotRef}
            className="w-full flex flex-col items-center bg-[#f6f3eb] pt-2 pb-5 px-2 rounded-[40px]"
          >
            <WFLCapsule myTotal={myTotal} theirTotal={theirTotal} />
            <div className="bg-[#ebe6da] rounded-[40px] pt-[40px] pb-[30px] px-[20px] sm:px-[40px] w-full flex flex-col items-center shadow-inner">
              <div className="flex flex-col md:flex-row gap-[20px] md:gap-[40px] w-full justify-center mb-1">
                <CalculatorGrid
                  items={myOffer}
                  gridType="mine"
                  onRemoveItem={handleRemoveMine}
                  maxItemsCount={maxItemsCount}
                />
                <CalculatorGrid
                  items={theirOffer}
                  gridType="theirs"
                  onRemoveItem={handleRemoveTheirs}
                  maxItemsCount={maxItemsCount}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2.5 px-4 flex-wrap">
            <button
              onClick={() => {
                setMyOffer([]);
                setTheirOffer([]);
              }}
              className="px-8 py-[15px] rounded-[30px] text-[18px] font-black text-white bg-[#ff7c7c] hover:brightness-95 transition-all shadow-sm w-full sm:w-auto"
            >
              Decline
            </button>
            <button
              onClick={handleScreenshot}
              className="px-8 py-[15px] rounded-[30px] text-[18px] font-black text-white bg-[#333] hover:brightness-110 transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
            >
              📸 Screenshot
            </button>
            <button
              onClick={handleShareLink}
              className="px-8 py-[15px] rounded-[30px] text-[18px] font-black text-white bg-[#5dbbff] hover:brightness-110 transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
            >
              🔗 Share Link
            </button>
            <button
              onClick={handlePostToGlobal}
              className="px-8 py-[15px] rounded-[30px] text-[18px] font-black text-white bg-[#b15dff] hover:brightness-110 transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
            >
              🌐 Post Trade
            </button>
            <button
              onClick={handleAcceptTrade}
              className="px-8 py-[15px] rounded-[30px] text-[18px] font-black text-white bg-[#85d67a] hover:brightness-95 transition-all shadow-sm w-full sm:w-auto"
            >
              Accept Trade
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-[25px] w-full xl:w-[350px] shadow-sm flex flex-col items-start border border-[#eee] xl:mt-[100px]">
          <h2 className="text-[20px] font-black text-[#333] w-full text-center border-b-2 border-[#f6f3eb] pb-3 mb-2">
            Smart Suggestions
          </h2>
          <div className="w-full flex-1 overflow-y-auto pr-2">
            {renderSuggestions()}
          </div>
        </div>
      </div>

      <SearchBar
        onAddOffer={handleAddOffer}
        onAddInventory={handleAddInventory}
        onRemoveInventory={handleRemoveInventory}
        myBackpack={myBackpack}
        myWishlist={myWishlist}
        tradeHistory={tradeHistory}
        onRemoveHistory={handleRemoveHistory}
        onCompleteHistory={handleCompleteHistoryTrade}
        onExport={handleExport}
        onImport={handleImport}
        globalTrades={globalTrades}
        onRefreshGlobal={fetchGlobalTrades}
        onLoadTrade={handleLoadTrade}
        currentUserId={currentUserId}
        onDeleteGlobal={handleDeleteGlobalTrade}
        onCompleteGlobal={handleCompleteGlobalTrade}
      />
    </main>
  );
}
