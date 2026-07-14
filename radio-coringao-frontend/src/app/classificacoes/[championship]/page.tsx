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
  tableFormat?: string | null;
  groupNames?: string | null;
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
  groupName?: string | null;
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

function mapStanding(s: ApiStandingEntry) {
  return {
    pos: s.position,
    time: s.teamName,
    j: s.played,
    v: s.won,
    d: s.lost,
    ppro: s.goalsFor,
    pcon: s.goalsAgainst,
    sld: s.goalDifference,
    logoUrl: s.logoUrl,
  };
}

function transformData(comp: ApiCompetition, standings: ApiStandingEntry[]): ChampionshipData {
  const tableFormat = comp.tableFormat || "single";
  const base = {
    name: comp.name,
    slug: slugify(comp.name),
    description: buildDescription(comp),
    status: comp.status || "Em andamento",
    elimination: comp.eliminationMessage || undefined,
  };

  if (tableFormat === "friendly" || tableFormat === "none" || tableFormat === "phases") {
    return { ...base, groups: [], hasTable: false };
  }

  if (tableFormat === "grouped") {
    const grouped = new Map<string, ApiStandingEntry[]>();
    for (const entry of standings) {
      const group = entry.groupName || "Grupo";
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push(entry);
    }
    return {
      ...base,
      hasTable: true,
      groups: Array.from(grouped.entries()).map(([groupName, entries]) => ({
        groupName,
        entries: entries.map(mapStanding),
      })),
    };
  }

  return {
    ...base,
    hasTable: true,
    groups: [{ groupName: null, entries: standings.map(mapStanding) }],
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

export const dynamicParams = true;

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
