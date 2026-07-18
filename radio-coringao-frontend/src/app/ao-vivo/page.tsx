import type { Metadata } from "next";
import { Radio } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ao Vivo | Rádio Coringão",
  description: "Acompanhe as transmissões ao vivo do Rádio Coringão.",
};

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/configuracoes`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AoVivoPage() {
  const settings = await getSettings();
  const liveStreamUrl = settings?.liveStreamUrl || "";
  const liveStreamActive = settings?.liveStreamActive || false;
  const videoId = getYoutubeId(liveStreamUrl);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <Radio size={18} className="text-primary" />
          <span className="text-sm font-bold text-primary uppercase tracking-wider">Ao Vivo</span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">Transmissão ao Vivo</h1>
      </div>

      {liveStreamActive && videoId ? (
        <div className="overflow-hidden rounded-xl border border-outline-variant">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Transmissão ao vivo"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-16">
          <Radio size={48} className="mb-4 text-on-surface-variant/30" />
          <p className="text-lg font-bold text-on-surface">Nenhuma transmissão ao vivo no momento</p>
          <p className="mt-1 text-sm text-on-surface-variant">Acompanhe nossas próximas transmissões!</p>
        </div>
      )}
    </div>
  );
}
