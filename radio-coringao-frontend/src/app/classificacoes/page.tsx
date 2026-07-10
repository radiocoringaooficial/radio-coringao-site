import type { Metadata } from "next";
import { StandingsTable } from "@/presentation/components/standings/StandingsTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radio-coringao-news-api.vercel.app/api";
const CLUBE_URL = process.env.NEXT_PUBLIC_CLUBE_API_URL || "https://radio-coringao-clube-api.vercel.app/api";

export const metadata: Metadata = {
  title: "Classificações - Rádio Coringão",
  description: "Tabela de classificação de todos os campeonatos do Corinthians.",
};

interface StandingEntry {
  position: number;
  teamName: string;
  logoUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface TableData {
  competition: { id: string; name: string; season: string };
  standings: StandingEntry[];
}

const MODALITY_MAP: Record<string, "FOOTBALL" | "FUTSAL" | "BASKETBALL"> = {
  basquete: "BASKETBALL",
  futsal: "FUTSAL",
};

function mapEntry(entry: StandingEntry, modality: "FOOTBALL" | "FUTSAL" | "BASKETBALL") {
  if (modality === "BASKETBALL") {
    return {
      pos: entry.position,
      time: entry.teamName,
      logoUrl: entry.logoUrl,
      j: entry.played,
      v: entry.won,
      d: entry.lost,
      ppro: entry.goalsFor,
      pcon: entry.goalsAgainst,
      sld: entry.goalDifference,
    };
  }
  return {
    pos: entry.position,
    time: entry.teamName,
    logoUrl: entry.logoUrl,
    pts: (entry.won || 0) * 3 + (entry.drawn || 0),
    pj: entry.played,
    vit: entry.won,
    e: entry.drawn,
    der: entry.lost,
    gm: entry.goalsFor,
    gc: entry.goalsAgainst,
    sg: entry.goalDifference,
  };
}

export default async function ClassificacoesPage() {
  const categories = [
    { slug: "principal", label: "Futebol" },
    { slug: "basquete", label: "Basquete" },
    { slug: "futsal", label: "Futsal" },
    { slug: "feminino", label: "Feminino" },
    { slug: "sub-20", label: "Sub-20" },
  ];

  const results = await Promise.all(
    categories.map(async (cat) => {
      try {
        const res = await fetch(`${CLUBE_URL}/classificacoes/category/${cat.slug}`, { cache: "no-store" });
        if (!res.ok) return { ...cat, tables: [] as TableData[] };
        const data = await res.json();
        return { ...cat, tables: (data.tables || []) as TableData[] };
      } catch {
        return { ...cat, tables: [] as TableData[] };
      }
    })
  );

  const categoriesWithData = results.filter((r) => r.tables.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative z-10">
          <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
            Classificações
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-white/70">
            Acompanhe a classificação de todos os campeonatos do Corinthians.
          </p>
        </div>
      </div>

      {categoriesWithData.length === 0 && (
        <p className="text-center text-on-surface-variant py-12">
          Nenhuma classificação disponível no momento.
        </p>
      )}

      {categoriesWithData.map((cat) => {
        const modality = MODALITY_MAP[cat.slug] || "FOOTBALL";
        return (
          <div key={cat.slug} className="mb-10">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">{cat.label}</h2>
            {cat.tables.map((table) => (
              <div key={table.competition.id} className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-on-surface-variant">
                  {table.competition.name} — {table.competition.season}
                </h3>
                <StandingsTable standings={table.standings.map((e) => mapEntry(e, modality))} modality={modality} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
