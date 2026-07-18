"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { LiveBadge } from "@/presentation/components/ui/LiveBadge";

const STREAM_URL = "https://s18.maxcast.com.br:8010/live";

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${
            playing ? "bg-primary animate-eq" : "bg-on-surface-variant/30 h-[6px]"
          }`}
          style={playing ? { animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
      <style>{`
        @keyframes eq {
          0%, 100% { height: 6px; }
          50% { height: 20px; }
        }
        .animate-eq {
          animation: eq 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (error) {
      audio.src = STREAM_URL;
      audio.load();
      setError(null);
    }
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Não foi possível conectar à transmissão."));
    }
  }, [playing, error]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0 && muted) {
        audioRef.current.muted = false;
        setMuted(false);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    const onPlay = () => { setPlaying(true); setLoading(false); setError(null); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onError = () => setError("Não foi possível conectar à transmissão.");

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#111] shadow-2xl">
        {/* Capa + Info */}
        <div className="relative flex items-center gap-5 p-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl shadow-lg">
            <img src="/radio-logo.jpg" alt="Rádio Coringão" className="h-full w-full object-cover" />
            {playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Equalizer playing={playing} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <LiveBadge />
            <h2 className="mt-2 text-lg font-bold text-white truncate">Rádio Coringão</h2>
            <p className="text-xs text-white/50">Ao vivo • Transmissão contínua</p>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4 border-t border-white/10 px-6 py-4">
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary/90 active:scale-95"
            aria-label={playing ? "Pausar" : "Tocar"}
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : playing ? (
              <Pause size={20} fill="white" />
            ) : (
              <Play size={20} fill="white" className="ml-0.5" />
            )}
          </button>

          <div className="flex flex-1 items-center gap-3">
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors" aria-label={muted ? "Ativar som" : "Silenciar"}>
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-primary"
            />
          </div>

          {playing && <Equalizer playing={playing} />}
        </div>
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
