// app/api/proxy/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new NextResponse("Missing url parameter", { status: 400 });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/png,image/jpeg,image/webp,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch");

    const blob = await response.blob();
    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "image/png",
    );

    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
