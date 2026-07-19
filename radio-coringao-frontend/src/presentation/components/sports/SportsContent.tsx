"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { NewsCard } from "@/presentation/components/ui/NewsCard";
import { formatDate } from "@/shared/utils/date";

interface MatchResultData {
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  score: string;
  round?: string | null;
}

function RecentResultsCarousel({ results }: { results: MatchResultData[] }) {
  return null;
}

function TransferenciasPorTemporada({ transfers }: { transfers: any[] }) {
  const initialSeason = transfers.length > 0
    ? Object.keys(transfers.reduce<Record<string, boolean>>((acc, t) => { acc[t.season || new Date(t.date).getFullYear().toString()] = true; return acc; }, {})).sort().reverse()[0]
    : null;
  const [expandedSeason, setExpandedSeason] = useState<string | null>(initialSeason);

  const bySeason = transfers.reduce<Record<string, any[]>>((acc, t) => {
    const season = t.season || new Date(t.date).getFullYear().toString();
    if (!acc[season]) acc[season] = [];
    acc[season].push(t);
    return acc;
  }, {});

  const seasons = Object.keys(bySeason).sort().reverse();

  if (seasons.length === 0) return null;

  const CORINTHIANS_LOGO = 'https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png';
  const TYPE_LABEL: Record<string, string> = { ARRIVAL: 'Contratação', DEPARTURE: 'Venda', LOAN_IN: 'Empréstimo Entrada', LOAN_OUT: 'Empréstimo Saída', RETURN: 'Retorno' };

  return (
    <div className="space-y-3">
      {seasons.map((season) => {
        const isOpen = expandedSeason === season;
        const items = bySeason[season];
        const arrivals = items.filter((t: any) => ['ARRIVAL', 'LOAN_IN', 'RETURN'].includes(t.type));
        const departures = items.filter((t: any) => ['DEPARTURE', 'LOAN_OUT'].includes(t.type));

        return (
          <div key={season} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <button
              onClick={() => setExpandedSeason(isOpen ? null : season)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className={`text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                <div>
                  <h3 className="font-headline text-sm font-bold text-on-surface">Temporada {season}</h3>
                  <p className="text-[10px] text-on-surface-variant">{items.length} movimentações</p>
                </div>
              </div>
              <div className="flex gap-2">
                {arrivals.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{arrivals.length} chegadas</span>}
                {departures.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{departures.length} saídas</span>}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-4">
                    {arrivals.length > 0 && (
                      <TransferSection title="Chegadas" color="blue" transfers={arrivals} typeLabel={(t: any) => TYPE_LABEL[t.type] || t.type} logo={CORINTHIANS_LOGO} />
                    )}
                    {departures.length > 0 && (
                      <TransferSection title="Saídas" color="red" transfers={departures} typeLabel={(t: any) => TYPE_LABEL[t.type] || t.type} logo={CORINTHIANS_LOGO} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function TransferSection({ title, color, transfers, typeLabel, logo }: { title: string; color: string; transfers: any[]; typeLabel: (t: any) => string; logo: string }) {
  const [page, setPage] = useState(0);
  const perPage = 6;
  const totalPages = Math.ceil(transfers.length / perPage);
  const paged = transfers.slice(page * perPage, (page + 1) * perPage);

  if (transfers.length === 0) return null;

  const bgColor = color === 'blue' ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100';
  const badgeBg = color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
  const headerColor = color === 'blue' ? 'text-blue-600' : 'text-red-600';
  const dotColor = color === 'blue' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <h3 className={`mb-3 font-headline text-xs font-bold ${headerColor} flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {title} ({transfers.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {paged.map((t) => {
          const isArrival = t.type === 'ARRIVAL' || t.type === 'LOAN_IN' || t.type === 'RETURN';
          const leftLogo = isArrival ? (t.clubLogo || logo) : logo;
          const rightLogo = isArrival ? logo : (t.clubLogo || null);
          const leftName = isArrival ? (t.clubName || 'Clube de Origem') : 'Corinthians';
          const rightName = isArrival ? 'Corinthians' : (t.clubName || 'Clube de Destino');

          return (
            <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor}`}>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                {t.playerPhoto ? (
                  <img src={t.playerPhoto} alt={t.playerName} className="w-10 h-10 object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-on-surface-variant">{t.playerName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline text-xs font-bold text-on-surface truncate">{t.playerName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <img src={leftLogo} alt={leftName} className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-[8px] text-on-surface-variant">{leftName}</span>
                  <span className={`text-[8px] font-bold px-1 ${isArrival ? 'text-blue-600' : 'text-red-500'}`}>{isArrival ? '→' : '←'}</span>
                  <img src={rightLogo} alt={rightName} className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-[8px] text-on-surface-variant">{rightName}</span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>{typeLabel(t)}</span>
                {t.value && <span className="text-[9px] text-on-surface-variant">{t.value}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">{page + 1} de {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NextMatchData {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  date: string;
  time: string;
  venue: string;
  competition: string;
  hasTickets: boolean;
  round?: string | null;
}

interface TableEntryData {
  pos: number;
  time: string;
  logoUrl?: string | null;
  pts?: number;
  pj?: number;
  vit?: number;
  e?: number;
  der?: number;
  gm?: number;
  gc?: number;
  sg?: number;
  j?: number;
  v?: number;
  d?: number;
  ppro?: number;
  pcon?: number;
  sld?: number;
}

interface SportTableData {
  name: string;
  standings: TableEntryData[];
}

interface SpecialMatchData {
  id: string;
  date: string;
  status: string;
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

interface SpecialCompetitionData {
  id: string;
  name: string;
  matches: SpecialMatchData[];
}

interface NewsArticleData {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  authorAvatar: string;
  imageUrl: string;
  imageAlt: string;
  publishedAt: string;
  slug: string;
  isBreaking: boolean;
  isLive: boolean;
  viewCount: number;
}

interface TransferData {
  id: string;
  type: string;
  date: string;
  playerName: string;
  playerPhoto: string | null;
  clubName: string;
  clubLogo: string | null;
  value: string | null;
  isFreeLoan: boolean;
  paysSalary: boolean;
  categoryName?: string;
}

interface SportsContentProps {
  name: string;
  slug: string;
  categorySlug: string;
  modality?: "FOOTBALL" | "FUTSAL" | "BASKETBALL";
  heroTitle: string;
  heroDescription: string;
  nextMatch: NextMatchData | null;
  recentResults: MatchResultData[];
  standings: TableEntryData[];
  tables?: SportTableData[];
  specialCompetitions?: SpecialCompetitionData[];
  latestNews: NewsArticleData[];
  weekHighlights: NewsArticleData[];
  transfers?: TransferData[];
  squad?: { id: string; name: string; shirtNumber?: number; photoUrl?: string; position?: string }[];
}

type Tab = "noticias" | "tabela" | "transferencias" | "elenco";

function TeamLogo({ name, size = "md", logo }: { name: string; size?: "sm" | "md" | "lg"; logo?: string | null }) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  const imgSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  };
  if (logo) {
    return (
      <div className={`${sizes[size]} shrink-0 flex items-center justify-center overflow-hidden`}>
        <img src={logo} alt={name} className={`${imgSizes[size]} object-contain`} />
      </div>
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className={`${sizes[size]} shrink-0 rounded-full bg-primary flex items-center justify-center`}>
      <span className="font-bold text-on-primary text-[10px]">{initials}</span>
    </div>
  );
}

function NewsSection({ title, articles }: { title: string; articles: NewsArticleData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const useCarousel = articles.length > 4;

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-secondary" />
          <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
        </div>
        {useCarousel && (
          <div className="flex gap-1.5">
            <button onClick={() => scroll("left")} className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant bg-surface transition-colors hover:bg-surface-container">
              <ChevronLeft size={16} className="text-on-surface" />
            </button>
            <button onClick={() => scroll("right")} className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant bg-surface transition-colors hover:bg-surface-container">
              <ChevronRight size={16} className="text-on-surface" />
            </button>
          </div>
        )}
      </div>
      {useCarousel ? (
        <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
          {articles.map((article) => (
            <div key={article.id} className="min-w-[280px] snap-start">
              <NewsCard article={article} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SportsContent({
  name,
  slug,
  categorySlug,
  modality = "FOOTBALL",
  heroTitle,
  heroDescription,
  nextMatch,
  recentResults,
  standings,
  tables,
  specialCompetitions = [],
  latestNews,
  weekHighlights,
  transfers = [],
  squad = [],
}: SportsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isBasketball = modality === "BASKETBALL";

  const validTabs: Tab[] = ["noticias", "tabela", "transferencias", "elenco"];
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTabState] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "noticias"
  );

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Client-side filter: only show transfers matching this page's category slug
  const filteredTransfers = transfers.filter((t) => !t.categoryName || t.categoryName === categorySlug);

  const tabs: { id: Tab; label: string }[] = [
    { id: "noticias", label: "Notícias" },
    ...(tables && tables.some((t) => t.standings && t.standings.length > 0) ? [{ id: "tabela" as Tab, label: "Tabelas" }] : []),
    ...(filteredTransfers.length > 0 ? [{ id: "transferencias" as Tab, label: "Transferências" }] : []),
    ...(squad.length > 0 ? [{ id: "elenco" as Tab, label: "Elenco" }] : []),
  ];

  // Ensure activeTab is always valid
  const currentTab = tabs.find((t) => t.id === activeTab) ? activeTab : "noticias";

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-8 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative z-10">
          <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
            {heroTitle}
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-white/70">
            {heroDescription}
          </p>
        </div>
      </motion.div>

      {/* Next Match + Recent Results */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Next Match */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6"
        >
          {nextMatch ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface">Próximo Jogo</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-label-sm text-label-sm text-gray-600">
                  {nextMatch.competition}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 py-6">
                <div className="flex flex-1 flex-col items-center">
                  <TeamLogo name={nextMatch.homeTeam} size="lg" logo={nextMatch.homeTeamLogo} />
                  <span className="mt-2 text-center font-headline-md text-headline-md text-primary">{nextMatch.homeTeam}</span>
                </div>
                <span className="text-3xl font-bold text-outline">X</span>
                <div className="flex flex-1 flex-col items-center">
                  <TeamLogo name={nextMatch.awayTeam} size="lg" logo={nextMatch.awayTeamLogo} />
                  <span className="mt-2 text-center font-headline-md text-headline-md text-primary">{nextMatch.awayTeam}</span>
                </div>
              </div>
              <div className="border-t border-surface-variant pt-4 text-center">
                <p className="font-body-md text-on-surface-variant">{nextMatch.date}, {nextMatch.time}</p>
                <p className="font-body-md text-on-surface-variant">{nextMatch.venue}</p>
                {nextMatch.round && <p className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">{nextMatch.round}</p>}
              </div>
              {nextMatch.hasTickets && (
                <Link href="https://www.fieltorcedor.com.br/" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full rounded-md bg-primary py-3 text-center font-label-sm text-label-sm uppercase font-bold text-on-primary transition-all duration-200 hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                  Ingressos Disponíveis
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Próximo Jogo</span>
              <p className="mt-2 text-center font-body-md text-on-surface-variant">Nenhuma partida agendada</p>
            </div>
          )}
        </motion.div>

        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6"
        >
          <span className="mb-4 block font-label-sm text-label-sm uppercase font-bold text-on-surface">Últimos Resultados</span>
          {recentResults.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentResults.slice(0, 4).map((result, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <span className={`text-right font-body-md text-body-md ${result.home === "Corinthians" ? "font-bold text-gray-900" : "text-gray-600"}`}>
                      {result.home}
                    </span>
                    <TeamLogo name={result.home} size="sm" logo={result.homeLogo} />
                  </div>
                  <div className="flex flex-col items-center mx-3">
                    <span className="font-headline-md text-headline-md font-bold text-gray-900">
                      {result.score}
                    </span>
                    {result.round && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">{result.round}</span>}
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <TeamLogo name={result.away} size="sm" logo={result.awayLogo} />
                    <span className={`font-body-md text-body-md ${result.away === "Corinthians" ? "font-bold text-gray-900" : "text-gray-600"}`}>
                      {result.away}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center font-body-md text-on-surface-variant">Nenhum resultado recente</p>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-outline-variant">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-3 font-label-sm text-label-sm font-bold transition-colors ${
              currentTab === tab.id ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentTab === "noticias" && (
          <>
            <NewsSection title="Últimas Notícias" articles={latestNews} />
            <NewsSection title="Destaques da Semana" articles={weekHighlights} />
          </>
        )}

        {currentTab === "tabela" && (
          <div className="space-y-8">
            {specialCompetitions.map((comp) => (
              <div key={comp.id}>
                <h3 className="mb-4 font-headline-md text-headline-md text-primary">{comp.name}</h3>
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant/50">
                  {comp.matches.map((m) => {
                    const finished = m.status === "FINISHED";
                    const d = new Date(m.date);
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-4 hover:bg-surface-container-low/50 transition-colors">
                        <div className="flex flex-col items-center gap-1.5 w-24 shrink-0">
                          <TeamLogo name={m.homeName} size="lg" logo={m.homeLogo} />
                          <span className="text-[11px] font-bold text-on-surface text-center leading-tight line-clamp-2">{m.homeName}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          {finished ? (
                            <span className="text-2xl font-headline font-extrabold text-on-surface tabular-nums">{m.homeScore} x {m.awayScore}</span>
                          ) : (
                            <span className="text-sm font-bold text-on-surface-variant">VS</span>
                          )}
                          <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                            {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {!finished && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">Agendado</span>}
                        </div>
                        <div className="flex flex-col items-center gap-1.5 w-24 shrink-0">
                          <TeamLogo name={m.awayName} size="lg" logo={m.awayLogo} />
                          <span className="text-[11px] font-bold text-on-surface text-center leading-tight line-clamp-2">{m.awayName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Main standings - only show if no additional tables */}
            {!tables && standings.length > 0 && (
              <div>
                <h3 className="mb-4 font-headline-md text-headline-md text-primary">
                  {name}
                </h3>
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-[#222]">
                      <th className="w-10 px-3 py-3 font-label-sm text-[11px] font-bold uppercase text-on-primary">#</th>
                      <th className="px-3 py-3 font-label-sm text-[11px] font-bold uppercase text-on-primary">Clube</th>
                      {isBasketball ? (
                        <>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">J</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">V</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">D</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PPRO</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PCON</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">SLD</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">Pts</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PJ</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">VIT</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">E</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">DER</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">GM</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">GC</th>
                          <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">SG</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, index) => {
                      const posColor = isBasketball
                        ? "#1565C0"
                        : row.pos <= 4 ? "#1565C0" :
                          row.pos === 5 ? "#E65100" :
                          row.pos <= 11 ? "#6A1B9A" :
                          row.pos >= 18 ? "#b71c1c" :
                          "transparent";
                      const sg = row.sg || ((row.gm || 0) - (row.gc || 0));
                      return (
                        <tr
                          key={`${row.time}-${row.pos}-${index}`}
                          className={`relative border-b border-outline-variant/50 transition-colors hover:bg-surface-container-low ${
                            row.time === "Corinthians"
                              ? "bg-gradient-to-r from-primary/5 to-transparent font-bold"
                              : index % 2 === 0
                              ? "bg-surface"
                              : "bg-surface-container-lowest"
                          }`}
                        >
                          <td className="relative px-3 py-3 text-center text-[13px] text-on-surface-variant">
                            <div
                              className="absolute left-0 top-0 h-full w-1"
                              style={{ backgroundColor: posColor }}
                            />
                            {row.pos}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <TeamLogo name={row.time} size="sm" logo={row.logoUrl} />
                              <span className={`text-[13px] ${row.time === "Corinthians" ? "font-bold text-primary" : "text-on-surface"}`}>
                                {row.time}
                              </span>
                            </div>
                          </td>
                          {isBasketball ? (
                            <>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.j}</td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-[12px] font-bold text-blue-700">
                                  {row.v}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[12px] font-bold text-red-700">
                                  {row.d}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.ppro}</td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.pcon}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[12px] font-bold ${
                                  (row.sld || 0) > 0 ? "bg-blue-100 text-blue-700" : (row.sld || 0) < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                }`}>
                                  {(row.sld || 0) > 0 ? `+${row.sld}` : row.sld}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-on-primary">
                                  {row.pts}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.pj}</td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-[12px] font-bold text-blue-700">
                                  {row.vit}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-100 px-2 text-[12px] font-bold text-yellow-700">
                                  {row.e}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[12px] font-bold text-red-700">
                                  {row.der}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.gm}</td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.gc}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[12px] font-bold ${
                                  (row.sg || 0) > 0 ? "bg-blue-100 text-blue-700" : (row.sg || 0) < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                }`}>
                                  {(row.sg || 0) > 0 ? `+${row.sg}` : row.sg}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {!tables && standings.length === 0 && null}

            {/* Additional tables */}
            {tables && tables.filter((t) => t.standings && t.standings.length > 0).map((table, tableIndex) => (
              <div key={tableIndex}>
                <h3 className="mb-4 font-headline-md text-headline-md text-primary">
                  {table.name}
                </h3>
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary to-[#222]">
                        <th className="w-10 px-3 py-3 font-label-sm text-[11px] font-bold uppercase text-on-primary">#</th>
                        <th className="px-3 py-3 font-label-sm text-[11px] font-bold uppercase text-on-primary">Clube</th>
                        {isBasketball ? (
                          <>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">J</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">V</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">D</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PPRO</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PCON</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">SLD</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">Pts</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">PJ</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">VIT</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">E</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">DER</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">GM</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">GC</th>
                            <th className="px-3 py-3 text-center font-label-sm text-[11px] font-bold uppercase text-on-primary">SG</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {table.standings.map((row, index) => {
                        const posColor = isBasketball
                          ? "#1565C0"
                          : row.pos <= 4 ? "#1565C0" :
                            row.pos === 5 ? "#E65100" :
                            row.pos <= 11 ? "#6A1B9A" :
                            row.pos >= 18 ? "#b71c1c" :
                            "transparent";
                        const sg = row.sg || ((row.gm || 0) - (row.gc || 0));
                        return (
                          <tr
                            key={`${table.name}-${row.time}-${row.pos}-${index}`}
                            className={`relative border-b border-outline-variant/50 transition-colors hover:bg-surface-container-low ${
                              row.time === "Corinthians"
                                ? "bg-gradient-to-r from-primary/5 to-transparent font-bold"
                                : index % 2 === 0
                                ? "bg-surface"
                                : "bg-surface-container-lowest"
                            }`}
                          >
                            <td className="relative px-3 py-3 text-center text-[13px] text-on-surface-variant">
                              <div
                                className="absolute left-0 top-0 h-full w-1"
                                style={{ backgroundColor: posColor }}
                              />
                              {row.pos}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <TeamLogo name={row.time} size="sm" logo={row.logoUrl} />
                                <span className={`text-[13px] ${row.time === "Corinthians" ? "font-bold text-primary" : "text-on-surface"}`}>
                                  {row.time}
                                </span>
                              </div>
                            </td>
                            {isBasketball ? (
                              <>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.j}</td>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-[12px] font-bold text-blue-700">
                                    {row.v}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[12px] font-bold text-red-700">
                                    {row.d}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.ppro}</td>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.pcon}</td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[12px] font-bold ${
                                    (row.sld || 0) > 0 ? "bg-blue-100 text-blue-700" : (row.sld || 0) < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                  }`}>
                                    {(row.sld || 0) > 0 ? `+${row.sld}` : row.sld}
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-on-primary">
                                    {row.pts}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.pj}</td>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-[12px] font-bold text-blue-700">
                                    {row.vit}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-100 px-2 text-[12px] font-bold text-yellow-700">
                                    {row.e}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[12px] font-bold text-red-700">
                                    {row.der}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.gm}</td>
                                <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{row.gc}</td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[12px] font-bold ${
                                    (row.sg || 0) > 0 ? "bg-blue-100 text-blue-700" : (row.sg || 0) < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                  }`}>
                                    {(row.sg || 0) > 0 ? `+${row.sg}` : row.sg}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab === "transferencias" && (
          <TransferenciasPorTemporada transfers={filteredTransfers} />
        )}

        {currentTab === "elenco" && squad.length > 0 && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="mb-4 font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Elenco {name} ({squad.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {squad.map((player) => (
                <div key={player.id} className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-3 text-center">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="h-14 w-14 object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-on-surface-variant">{player.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    {player.shirtNumber && (
                      <span className="mb-0.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        #{player.shirtNumber}
                      </span>
                    )}
                    <p className="font-headline text-xs font-bold text-on-surface truncate">{player.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
