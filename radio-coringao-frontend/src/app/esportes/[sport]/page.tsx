import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SportsContent } from "@/presentation/components/sports/SportsContent";
import { clubeClient } from "@/infrastructure/api/http-client";
import { httpClient } from "@/infrastructure/api/http-client";

const SPORT_SLABS = ["futebol", "basquete", "futsal", "futebol-feminino", "futebol-masculino", "sub-20", "sub-17"];

// Map sport slugs to match category slugs for API queries
const SPORT_TO_MATCH_CATEGORY: Record<string, string> = {
  "futebol": "principal",
  "basquete": "basquete",
  "futsal": "futsal",
  "futebol-feminino": "feminino",
  "futebol-masculino": "principal",
  "sub-20": "sub-20",
  "sub-17": "sub-17",
};

// Map sport slugs to news category slugs (sports-news-api categories)
const SPORT_TO_NEWS_CATEGORY: Record<string, string> = {
  "futebol": "futebol",
  "basquete": "basquete",
  "futsal": "futsal",
  "futebol-feminino": "futebol-feminino",
  "futebol-masculino": "futebol-masculino",
  "sub-20": "sub-20",
  "sub-17": "futebol",
};

const SPORT_MODALITY: Record<string, "FOOTBALL" | "FUTSAL" | "BASKETBALL"> = {
  basquete: "BASKETBALL",
  futsal: "FUTSAL",
};

const CORINTHIANS_LOGO = 'https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png';

interface Category {
  id: string;
  name: string;
  slug: string;
  gender: string;
  modality: string;
  order: number;
  parentId: string | null;
}

interface Match {
  id: string;
  date: string;
  venue: string | null;
  isHome: boolean;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  round: string | null;
  opponent: { id: string; name: string; logoUrl: string | null };
  competition: {
    id: string;
    name: string;
    season: string;
    category: { name: string; slug: string; gender: string };
  };
}

interface StandingEntry {
  position: number;
  teamName: string;
  logoUrl: string | null;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  isOwnTeam: boolean;
  form: string | null;
  zone: string;
}

interface StandingsResponse {
  category: string;
  tables: {
    competition: { id: string; name: string; season: string };
    standings: StandingEntry[];
  }[];
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  summary?: string;
  publishedAt: string;
  author: { name: string };
  category: { name: string; slug: string };
  featuredImage?: string;
  coverImage?: string;
}

interface Props {
  params: Promise<{ sport: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport } = await params;
  if (!SPORT_SLABS.includes(sport)) {
    return { title: "Esporte não encontrado" };
  }

  try {
    const categorySlug = SPORT_TO_MATCH_CATEGORY[sport] || sport;
    const category = await clubeClient.get<Category>(`/categorias/${categorySlug}`);
    return {
      title: `${category.name} - Rádio Coringão`,
      description: `Acompanhe tudo sobre ${category.name} no Rádio Coringão.`,
    };
  } catch {
    return { title: "Esporte não encontrado" };
  }
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  return SPORT_SLABS.map((sport) => ({ sport }));
}

export default async function SportPage({ params }: Props) {
  const { sport } = await params;

  if (!SPORT_SLABS.includes(sport)) {
    notFound();
  }

  const matchCategory = SPORT_TO_MATCH_CATEGORY[sport] || sport;

  let category: Category;
  try {
    const catRes = await fetch(`${process.env.NEXT_PUBLIC_CLUBE_API_URL || "https://radiocoringao-clube.vercel.app/api"}/categorias/${matchCategory}`);
    if (!catRes.ok) notFound();
    category = await catRes.json();
  } catch {
    notFound();
  }

  const [nextMatch, recentResults, standingsResponse, newsResponse, movementsResponse, squadResponse] = await Promise.all([
    clubeClient.get<Match[]>(`/partidas/next`, { params: { category: matchCategory, limit: "1" } }).catch(() => []),
    clubeClient.get<Match[]>(`/partidas/recent`, { params: { category: matchCategory, limit: "5" } }).catch(() => []),
    clubeClient.get<any[]>(`/classificacoes/category/${matchCategory}`)
      .then(entries => {
        if (!Array.isArray(entries)) return entries;
        const byComp = new Map<string, any[]>();
        for (const e of entries) {
          const arr = byComp.get(e.competitionId) || [];
          arr.push(e);
          byComp.set(e.competitionId, arr);
        }
        return {
          category: category.name,
          tables: Array.from(byComp.entries()).map(([id, standings]) => ({
            competition: { id, name: standings[0]?.groupName || category.name, season: "" },
            standings,
          })),
        };
      })
      .catch(() => ({ category: category.name, tables: [] })),
    httpClient.get<NewsArticle[]>(`/noticias`, { params: { category: SPORT_TO_NEWS_CATEGORY[sport] || sport, limit: "6" } }).catch(() => []),
    clubeClient.get<any>(`/movimentacoes/recent`, { params: { limit: "20", category: matchCategory } }).catch(() => []),
    clubeClient.get<any>(`/elenco`, { params: { category: matchCategory } }).catch(() => []),
  ]);

  const heroTitle = `${category.name} - Corinthians`;
  const heroDescription = `Acompanhe tudo sobre o Corinthians na modalidade ${category.name}.`;

  const nextMatchData = nextMatch[0]
    ? {
        homeTeam: nextMatch[0].isHome ? "Corinthians" : nextMatch[0].opponent.name,
        awayTeam: nextMatch[0].isHome ? nextMatch[0].opponent.name : "Corinthians",
        homeTeamLogo: nextMatch[0].isHome ? CORINTHIANS_LOGO : nextMatch[0].opponent.logoUrl,
        awayTeamLogo: nextMatch[0].isHome ? nextMatch[0].opponent.logoUrl : CORINTHIANS_LOGO,
        date: new Date(nextMatch[0].date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }),
        time: new Date(nextMatch[0].date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }),
        venue: nextMatch[0].venue || "A definir",
        competition: nextMatch[0].competition.name,
        hasTickets: true,
        round: nextMatch[0].round || null,
      }
    : null;

  const recentResultsData = recentResults.map((match) => ({
    home: match.isHome ? "Corinthians" : match.opponent.name,
    away: match.isHome ? match.opponent.name : "Corinthians",
    homeLogo: match.isHome ? CORINTHIANS_LOGO : match.opponent.logoUrl,
    awayLogo: match.isHome ? match.opponent.logoUrl : CORINTHIANS_LOGO,
    score: match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore} x ${match.awayScore}`
      : "A definir",
    round: match.round || null,
  }));

  const modality = SPORT_MODALITY[sport] || "FOOTBALL";
  const isBasketball = modality === "BASKETBALL";

  const allStandings = standingsResponse.tables.flatMap((table) =>
    table.standings.map((entry) => {
      if (isBasketball) {
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
        pts: entry.points,
        pj: entry.played,
        vit: entry.won,
        e: entry.drawn,
        der: entry.lost,
        gm: entry.goalsFor,
        gc: entry.goalsAgainst,
        sg: entry.goalDifference,
      };
    })
  );

  const tables = standingsResponse.tables.length > 1
    ? standingsResponse.tables.map((table) => ({
        name: table.competition.name,
        standings: table.standings.map((entry) => {
          if (isBasketball) {
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
            pts: entry.points,
            pj: entry.played,
            vit: entry.won,
            e: entry.drawn,
            der: entry.lost,
            gm: entry.goalsFor,
            gc: entry.goalsAgainst,
            sg: entry.goalDifference,
          };
        }),
      }))
    : undefined;

  const newsData = ((Array.isArray(newsResponse) ? newsResponse : (newsResponse as any)?.data || []) as any[]).map((article) => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt || article.summary || "",
    category: article.category?.name || category.name,
    categorySlug: article.category?.slug || sport,
    author: article.author?.name || article.authorNameSnapshot || "Redação",
    authorAvatar: "",
    imageUrl: article.featuredImage || article.coverImage || "",
    imageAlt: article.title,
    publishedAt: article.publishedAt,
    slug: article.slug,
    isBreaking: false,
    isLive: false,
    viewCount: 0,
  }));

  const half = Math.ceil(newsData.length / 2);
  const latestNews = newsData.slice(0, half);
  const weekHighlights = newsData.slice(half);

  const movementsData = (Array.isArray(movementsResponse) ? movementsResponse : movementsResponse?.data || []).map((m: any) => ({
    id: m.id,
    type: m.type,
    date: m.date,
    playerName: m.playerName || m.squadMember?.name || 'Jogador',
    playerPhoto: m.playerPhotoUrl || m.squadMember?.photoUrl || null,
    clubName: m.opponent?.name || '',
    clubLogo: m.opponent?.logoUrl || null,
    value: m.valueCents ? `R$ ${(Number(m.valueCents) / 100).toLocaleString('pt-BR')}` : null,
    isFreeLoan: m.isFreeLoan,
    paysSalary: m.paysSalary,
    categoryName: m.category?.slug || m.squadMember?.category?.slug || '',
  }));

  // Map sport slug to category slug for client-side filtering
  const SPORT_CATEGORY_MAP: Record<string, string> = {
    futebol: "principal", "futebol-feminino": "feminino", basquete: "basquete",
    futsal: "futsal", "sub-20": "sub-20", "sub-17": "sub-17",
  };
  const categorySlug = SPORT_CATEGORY_MAP[sport] || sport;

  const squadData = (Array.isArray(squadResponse) ? squadResponse : squadResponse?.data || [])
    .filter((s: any) => s.isActive !== false)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      shirtNumber: s.shirtNumber,
      photoUrl: s.photoUrl || null,
      position: s.position || '',
    }));

  return (
    <SportsContent
      name={category.name}
      slug={category.slug}
      categorySlug={categorySlug}
      modality={modality}
      heroTitle={heroTitle}
      heroDescription={heroDescription}
      nextMatch={nextMatchData}
      recentResults={recentResultsData}
      standings={allStandings}
      tables={tables}
      latestNews={latestNews}
      weekHighlights={weekHighlights}
      transfers={movementsData}
      squad={squadData}
    />
  );
}
