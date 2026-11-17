"use client";

import Script from "next/script";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { MediaControls } from "@/components/explainers/media-controls";
import { narrationCues, pickNarrationVoice } from "@/lib/explainers/narration";
import { templateVariables, type ExplainerScript } from "@/lib/explainers/script";

type PlayerElement = HTMLElement & { play: () => void; pause?: () => void };

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
  const [playing, setPlaying] = useState(false);
  const mutedRef = useRef(muted);
  const timers = useRef<number[]>([]);
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

  function stopSpeech() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    window.speechSynthesis?.cancel();
  }

  function begin() {
    const root = rootRef.current;
    const player = root?.querySelector("hyperframes-player") as PlayerElement | null;
    try {
      player?.play();
    } catch {
      // The player rejects play until its timeline is ready.
    }
    stopSpeech();
    setPlaying(true);
    const voice = pickNarrationVoice(voiceList(), language);
    if (!voice || mutedRef.current) return;
    const cues = narrationCues(script.steps.length);
    script.steps.forEach((step, index) => {
      const cue = cues[index];
      if (cue == null || !step.caption) return;
      const id = window.setTimeout(() => {
        if (mutedRef.current || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(step.caption);
        utterance.lang = voice.lang;
        const live = window.speechSynthesis
          .getVoices()
          .find((item) => item.lang === voice.lang && item.name === voice.name);
        if (live) utterance.voice = live;
        window.speechSynthesis.speak(utterance);
      }, cue);
      timers.current.push(id);
    });
  }

  function pause() {
    setPlaying(false);
    stopSpeech();
    const player = rootRef.current?.querySelector("hyperframes-player") as PlayerElement | null;
    try {
      player?.pause?.();
    } catch {
      // Some player builds only expose play.
    }
  }

  useEffect(() => {
    if (!armRef.current || !playerReady) return;
    armRef.current = false;
    const timer = window.setTimeout(() => {
      begin();
    }, 800);
    return () => window.clearTimeout(timer);
    // Playback is armed once per src. Later mute toggles must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady, src]);

  useEffect(() => {
    if (muted) window.speechSynthesis?.cancel();
  }, [muted]);

  return (
    <figure ref={rootRef} className="overflow-hidden rounded-2xl border border-border bg-surface-1">
      <figcaption className="px-4 pt-4 text-[15px] font-medium tracking-tight text-foreground">
        {script.title}
      </figcaption>
      <div className="relative">
        <Script src={PLAYER_SRC} strategy="afterInteractive" onLoad={() => setPlayerReady(true)} />
        {playerReady ? (
          createElement("hyperframes-player", {
            key: src,
            src,
            controls: false,
            style: { display: "block", width: "100%", aspectRatio: "16 / 9" },
          })
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            Loading the player…
          </div>
        )}
        <MediaControls
          className="absolute right-3 bottom-3"
          playing={playing}
          muted={muted}
          disabled={!playerReady}
          onPlay={begin}
          onPause={pause}
          onToggleVolume={() => {
            setMuted((value) => {
              if (!value) window.speechSynthesis?.cancel();
              return !value;
            });
          }}
        />
      </div>
    </figure>
  );
}
