import { NextResponse } from "next/server";
import { isSceneObjectPath } from "@/lib/explainers/scene-image";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!isSceneObjectPath(path)) {
    return NextResponse.json({ error: "Unknown picture." }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: signed, error } = await supabase.storage.from("explainers").createSignedUrl(path, 300);
  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "Picture is not stored." }, { status: 404 });
  }
  const upstream = await fetch(signed.signedUrl);
  const bytes = Buffer.from(await upstream.arrayBuffer());
  if (!upstream.ok || bytes.byteLength === 0) {
    return NextResponse.json({ error: "Picture is not stored." }, { status: 404 });
  }
  return new NextResponse(bytes, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/png",
      "cache-control": "private, max-age=300",
    },
  });
}
