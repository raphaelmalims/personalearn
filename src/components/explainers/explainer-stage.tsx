"use client";

import Script from "next/script";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { narrationCues, pickNarrationVoice } from "@/lib/explainers/narration";
import { languageName, templateVariables, type ExplainerScript } from "@/lib/explainers/script";

type PlayerElement = HTMLElement & { play: () => void };

const PLAYER_SRC =
  "https://cdn.jsdelivr.net/npm/hyperframes@0.9.32/dist/hyperframes-player.global.js";

function voiceList(): Array<{ lang: string; name: string }> {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({
    lang: voice.lang,
    name: voice.name,
  }));
}

export function ExplainerStage({
  script,
  language,
  playKey,
  autoPlay = false,
}: {
  script: ExplainerScript;
  language: string;
  playKey: string;
  autoPlay?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captionsOnly, setCaptionsOnly] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const armRef = useRef(autoPlay);
  if (autoPlay) armRef.current = true;

  const src = useMemo(() => {
    const vars = templateVariables(script);
    return `/explainers/template?vars=${encodeURIComponent(JSON.stringify(vars))}&play=${playKey}`;
  }, [script, playKey]);

  useEffect(() => {
    if (typeof customElements !== "undefined" && customElements.get("hyperframes-player")) {
      setPlayerReady(true);
    }
  }, []);

  function begin() {
    const root = rootRef.current;
    const player = root?.querySelector("hyperframes-player") as PlayerElement | null;
    try {
      player?.play();
    } catch {
      // The player rejects play until its timeline is ready.
    }
    window.speechSynthesis?.cancel();
    const voice = pickNarrationVoice(voiceList(), language);
    if (!voice) {
      setCaptionsOnly(true);
      return;
    }
    setCaptionsOnly(false);
    const cues = narrationCues(script.steps.length);
    script.steps.forEach((step, index) => {
      const cue = cues[index];
      if (cue == null || !step.caption) return;
      window.setTimeout(() => {
        if (mutedRef.current || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(step.caption);
        utterance.lang = voice.lang;
        const live = window.speechSynthesis
          .getVoices()
          .find((item) => item.lang === voice.lang && item.name === voice.name);
        if (live) utterance.voice = live;
        window.speechSynthesis.speak(utterance);
      }, cue);
    });
  }

  useEffect(() => {
    if (!armRef.current || !playerReady) return;
    armRef.current = false;
    const timer = window.setTimeout(() => {
      setPlaying(true);
      begin();
    }, 800);
    return () => window.clearTimeout(timer);
    // Playback is armed once per src. Later mute toggles must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady, src]);

  useEffect(() => {
    if (muted) window.speechSynthesis?.cancel();
  }, [muted]);

  const voiceNote = captionsOnly
    ? `Captions only. This browser has no ${languageName(language)} voice.`
    : muted
      ? "Narration is muted. Captions stay on."
      : "Captions are read aloud with this browser.";

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <Script src={PLAYER_SRC} strategy="afterInteractive" onLoad={() => setPlayerReady(true)} />
      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        {playerReady
          ? createElement("hyperframes-player", {
              key: src,
              src,
              controls: true,
              style: { display: "block", width: "100%", aspectRatio: "16 / 9" },
            })
          : (
            <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
              Loading the player…
            </div>
          )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!playerReady}
          onClick={() => {
            setPlaying(true);
            begin();
          }}
        >
          {playing ? "Replay" : "Play"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={muted}
          disabled={captionsOnly}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? "Unmute" : "Mute"}
        </Button>
        <p className="text-xs text-muted-foreground">{voiceNote}</p>
      </div>
    </div>
  );
}
