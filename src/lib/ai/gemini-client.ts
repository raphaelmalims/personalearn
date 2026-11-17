import { GoogleGenAI } from "@google/genai";
import { GoogleGenAI as PostHogGoogleGenAI } from "@posthog/ai/gemini";
import { getServerPostHog } from "@/lib/posthog-server";
import { requireGoogleGenerativeAiApiKey } from "@/lib/ai/vision-model";

export function createGeminiClient() {
  return new GoogleGenAI({ apiKey: requireGoogleGenerativeAiApiKey() });
}

export function createObservedGeminiClient() {
  const apiKey = requireGoogleGenerativeAiApiKey();
  const posthog = getServerPostHog();
  return posthog
    ? new PostHogGoogleGenAI({ apiKey, posthog })
    : new GoogleGenAI({ apiKey });
}
