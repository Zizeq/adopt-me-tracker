"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (provider: "discord" | "google") => {
    await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // UI IF LOGGED IN
  if (user) {
    return (
      <div className="flex items-center gap-4 p-2 border rounded-lg bg-gray-50">
        {user.user_metadata.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="text-left">
          <p className="text-sm font-bold text-gray-800">
            {user.user_metadata.full_name || "Trader"}
          </p>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:underline"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // UI IF LOGGED OUT
  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleLogin("discord")}
        className="px-4 py-2 bg-[#5865F2] text-white font-medium text-sm rounded-md hover:bg-[#4752C4] transition"
      >
        Login with Discord
      </button>
      <button
        onClick={() => handleLogin("google")}
        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium text-sm rounded-md hover:bg-gray-50 transition"
      >
        Login with Google
      </button>
    </div>
  );
}
