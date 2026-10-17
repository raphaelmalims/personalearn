import { NextResponse } from "next/server";
import {
  CHAT_MODEL_OPTIONS,
  PICKER_EFFORTS,
  resolveRequestChatSettings,
} from "@/lib/ai/chat-settings";
import { mapApiError } from "@/lib/ai-hub/api-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    return NextResponse.json({
      settings: resolveRequestChatSettings(null),
      models: CHAT_MODEL_OPTIONS,
      efforts: PICKER_EFFORTS,
    });
  } catch (error) {
    const { message, status } = mapApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
