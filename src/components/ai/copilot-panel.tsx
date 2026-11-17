"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  composerEnterAction,
  isImeComposing,
  pointerIsCoarse,
} from "@/lib/ai-hub/composer-enter";
import { cn } from "@/lib/utils";
import { useActiveClassStore } from "@/lib/store/active-class";

type CopilotResponse = {
  answer: string;
  sources: Array<{ resourceId: string; title: string }>;
};

export function CopilotPanel() {
  const activeClass = useActiveClassStore((state) => state.activeClass);
  const [question, setQuestion] = useState("");
  const [coarsePointer, setCoarsePointer] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CopilotResponse | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarsePointer(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = questionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [question]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeClass || !question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/query-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: activeClass.id,
          question: question.trim(),
        }),
      });

      const payload = (await res.json()) as CopilotResponse & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Query failed");
      }

      setResponse(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  if (!activeClass) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select an active class from the header to use the co-pilot.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Class co-pilot</CardTitle>
            <p className="text-sm text-muted-foreground">
              {activeClass.name} — answers grounded in uploaded .txt resources
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={questionRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                const action = composerEnterAction({
                  key: event.key,
                  shiftKey: event.shiftKey,
                  isComposing: isImeComposing(event),
                  coarsePointer: pointerIsCoarse(),
                });
                if (action !== "send") return;
                event.preventDefault();
                void handleSubmit(event);
              }}
              placeholder="Ask about your scheme of work…"
              disabled={loading}
              rows={1}
              maxLength={2000}
              enterKeyHint={coarsePointer ? "enter" : "send"}
              className={cn(
                "max-h-32 min-h-11 w-full resize-none overflow-y-auto rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Ask</span>
            </Button>
          </form>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {response ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm">{response.answer}</p>
              {response.sources.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Sources</p>
                  <ul className="mt-1 list-inside list-disc">
                    {response.sources.map((source) => (
                      <li key={source.resourceId}>{source.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload materials on the class page, then ask a question here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
