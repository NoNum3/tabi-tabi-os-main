import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("id");
  if (!playlistId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("playlist_songs")
    .select("url")
    .eq("playlist_id", playlistId)
    .order("seq_id", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return NextResponse.json({ url: null });
  return NextResponse.json({ url: data.url });
} 