import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChampionshipContent } from "@/presentation/components/standings/ChampionshipContent";
import type { ChampionshipData } from "@/infrastructure/data/championships";

const CLUBE_API = process.env.NEXT_PUBLIC_CLUBE_API_URL || "https://radiocoringao-clube.vercel.app/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ApiCompetition {
  id: string;
  name: string;
  season: string;
  status?: string | null;
  isParticipating?: boolean;
  eliminationMessage?: string | null;
  slug?: string | null;
}

interface ApiStandingEntry {
  position: number;
  teamName: string;
  logoUrl?: string | null;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

async function getCompetitions(): Promise<ApiCompetition[]> {
  try {
    const res = await fetch(`${CLUBE_API}/competicoes`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

async function getStandings(slug: string): Promise<ApiStandingEntry[]> {
  try {
    const res = await fetch(`${CLUBE_API}/classificacoes/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

function buildDescription(comp: ApiCompetition): string {
  const category = comp.season ? `${comp.season}` : "";
  return `Classificação do ${comp.name}${category ? " " + category : ""}.`;
}

function transformData(comp: ApiCompetition, standings: ApiStandingEntry[]): ChampionshipData {
  return {
    name: comp.name,
    slug: slugify(comp.name),
    description: buildDescription(comp),
    status: comp.status || "Em andamento",
    elimination: comp.eliminationMessage || undefined,
    standings: standings.map((s) => ({
      pos: s.position,
      time: s.teamName,
      j: s.played,
      v: s.won,
      d: s.lost,
      ppro: s.goalsFor,
      pcon: s.goalsAgainst,
      sld: s.goalDifference,
      logoUrl: s.logoUrl,
    })),
  };
}

interface Props {
  params: Promise<{ championship: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { championship } = await params;
  const competitions = await getCompetitions();
  const comp = competitions.find((c) => slugify(c.name) === championship);
  if (!comp) return { title: "Campeonato não encontrado" };
  return {
    title: `${comp.name} - Rádio Coringão`,
    description: buildDescription(comp),
  };
}

export async function generateStaticParams() {
  const competitions = await getCompetitions();
  return competitions.map((c) => ({ championship: slugify(c.name) }));
}

export default async function ChampionshipPage({ params }: Props) {
  const { championship } = await params;
  const competitions = await getCompetitions();
  const comp = competitions.find((c) => slugify(c.name) === championship);
  if (!comp) notFound();

  const standings = await getStandings(championship);
  const data = transformData(comp, standings);

  return <ChampionshipContent data={data} />;
}
