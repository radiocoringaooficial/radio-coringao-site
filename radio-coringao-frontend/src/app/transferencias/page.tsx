"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, User, Calendar, Banknote, Loader2 } from "lucide-react";

const CLUBE_API = process.env.NEXT_PUBLIC_CLUBE_API_URL || "https://radiocoringao-clube.vercel.app/api";
const CORINTHIANS_LOGO = "https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png";

const SECTION_LIMIT = 6;

const TYPE_LABEL: Record<string, string> = {
  ARRIVAL: "Chegada",
  DEPARTURE: "Saída",
  LOAN_IN: "Empréstimo (Entrada)",
  LOAN_OUT: "Empréstimo (Saída)",
  RETURN: "Retorno",
};

const TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  ARRIVAL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  DEPARTURE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  LOAN_IN: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  LOAN_OUT: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  RETURN: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

const GENDER_LABEL: Record<string, string> = { MALE: "Masculino", FEMALE: "Feminino", MIXED: "Misto" };
const MODALITY_LABEL: Record<string, string> = { FOOTBALL: "Futebol", BASKETBALL: "Basquete", FUTSAL: "Futsal" };

interface Movement {
  id: string;
  type: string;
  playerName: string;
  playerPhotoUrl?: string;
  date: string;
  season: string;
  valueCents?: number;
  currency?: string;
  isFreeLoan?: boolean;
  returnDate?: string;
  opponent?: { id: string; name: string; logoUrl?: string } | null;
  club?: { id: string; name: string; logoUrl?: string } | null;
  category?: { id: string; name: string; slug: string; gender?: string; modality?: string } | null;
}

function formatValue(m: Movement): string {
  if (m.isFreeLoan) return "Gratuito";
  if (m.valueCents != null && m.valueCents > 0) {
    const val = m.valueCents / 100;
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
    return `R$ ${val.toFixed(0)}`;
  }
  return "";
}

const CATEGORY_DISPLAY_LABEL: Record<string, string> = {
  principal: "Futebol Masculino",
  feminino: "Futebol Feminino",
};

function getCategoryLabel(cat?: Movement["category"]): string {
  if (!cat) return "Sem Categoria";
  return CATEGORY_DISPLAY_LABEL[cat.slug] || cat.name;
}

function getCategoryOrder(cat?: Movement["category"]): number {
  const order: Record<string, number> = { principal: 1, feminino: 2, "sub-20": 3, "sub-17": 4, basquete: 5, futsal: 6 };
  return order[cat?.slug || ""] || 99;
}

function MovementCard({ m }: { m: Movement }) {
  const st = TYPE_LABEL[m.type] || m.type;
  const colors = TYPE_COLOR[m.type] || TYPE_COLOR.ARRIVAL;
  const isArrival = ["ARRIVAL", "LOAN_IN", "RETURN"].includes(m.type);
  const isLoan = m.type === "LOAN_OUT" || m.type === "LOAN_IN";
  const otherClub = m.opponent;
  const otherLogo = otherClub?.logoUrl || null;
  const otherName = otherClub?.name || "A definir";
  const d = new Date(m.date);

  return (
    <div className={`rounded-xl border ${colors.border} bg-white overflow-hidden hover:shadow-md transition-shadow`}>
      <div className="flex items-stretch">
        {/* Photo */}
        <div className="w-20 h-20 shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
          {m.playerPhotoUrl ? (
            <img src={m.playerPhotoUrl} alt={m.playerName} className="w-full h-full object-cover" />
          ) : (
            <User size={24} className="text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm text-gray-900 truncate">{m.playerName}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {st}
            </span>
          </div>

          {/* Transfer flow: Corinthians ↔ Other Club */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1">
              <img src={CORINTHIANS_LOGO} alt="Corinthians" className="w-5 h-5 object-contain" />
              <span className="text-[10px] font-semibold text-gray-600">COR</span>
            </div>
            <div className={`flex items-center ${isArrival ? 'text-blue-500' : 'text-red-500'}`}>
              {isArrival ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            </div>
            <div className="flex items-center gap-1">
              {otherLogo ? (
                <img src={otherLogo} alt={otherName} className="w-5 h-5 object-contain" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-gray-500">{otherName.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
              <span className="text-[10px] font-semibold text-gray-700 truncate max-w-[90px]">{otherName}</span>
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Calendar size={9} />
              {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" })}
            </span>
            {formatValue(m) && (
              <span className="text-[10px] font-semibold text-gray-600 flex items-center gap-0.5">
                <Banknote size={9} />
                {formatValue(m)}
              </span>
            )}
          </div>

          {/* Loan return date */}
          {isLoan && m.returnDate && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-600 font-semibold bg-purple-50 rounded px-2 py-0.5 w-fit">
              <Calendar size={9} />
              Retorno: {new Date(m.returnDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-[11px] text-gray-400">
        {page} de {total}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => onChange(Math.min(total, page + 1))}
          disabled={page === total}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TransferenciasPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [arrivalPages, setArrivalPages] = useState<Record<string, number>>({});
  const [departurePages, setDeparturePages] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${CLUBE_API}/movimentacoes/recent?limit=500`)
      .then((r) => r.json())
      .then((d) => setMovements(Array.isArray(d) ? d : d?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const bySeason: Record<string, Record<string, Movement[]>> = {};
    movements.forEach((m) => {
      const season = m.season || "2026";
      const catSlug = m.category?.slug || "sem-categoria";
      if (!bySeason[season]) bySeason[season] = {};
      if (!bySeason[season][catSlug]) bySeason[season][catSlug] = [];
      bySeason[season][catSlug].push(m);
    });

    const seasons = Object.keys(bySeason)
      .sort()
      .reverse()
      .map((season) => {
        const cats = Object.keys(bySeason[season])
          .map((slug) => ({
            slug,
            label: getCategoryLabel(bySeason[season][slug][0]?.category),
            order: getCategoryOrder(bySeason[season][slug][0]?.category),
            arrivals: bySeason[season][slug].filter((m) => ["ARRIVAL", "LOAN_IN", "RETURN"].includes(m.type)),
            departures: bySeason[season][slug].filter((m) => ["DEPARTURE", "LOAN_OUT"].includes(m.type)),
          }))
          .sort((a, b) => a.order - b.order);
        return { season, cats, total: movements.filter((m) => (m.season || "2026") === season).length };
      });

    return seasons;
  }, [movements]);

  const initialized = useRef(false);

  useEffect(() => {
    if (data.length > 0 && !initialized.current) {
      initialized.current = true;
      const currentSeason = data[0].season;
      setExpandedSeason(currentSeason);
      const principalCat = data[0].cats.find((c) => c.slug === "principal");
      if (principalCat) {
        setExpandedCategory(`${currentSeason}-${principalCat.slug}`);
      }
    }
  }, [data]);

  const toggleCategory = (key: string) => {
    setExpandedCategory((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-64" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Transferências</h1>
          <p className="text-gray-500 text-sm">
            Chegadas, saídas e empréstimos do Corinthians por temporada e modalidade.
          </p>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma transferência registrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(({ season, cats, total }) => {
              const isSeasonOpen = expandedSeason === season;
              const seasonArrivals = cats.reduce((sum, c) => sum + c.arrivals.length, 0);
              const seasonDepartures = cats.reduce((sum, c) => sum + c.departures.length, 0);

              return (
                <div key={season} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Season Header */}
                  <button
                    onClick={() => setExpandedSeason(isSeasonOpen ? null : season)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${isSeasonOpen ? "rotate-90" : ""}`}
                      />
                      <div>
                        <h2 className="font-bold text-gray-900">Temporada {season}</h2>
                        <p className="text-xs text-gray-400">
                          {total} movimentações · {cats.length} categoria{cats.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {seasonArrivals > 0 && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                          {seasonArrivals} chegada{seasonArrivals !== 1 ? "s" : ""}
                        </span>
                      )}
                      {seasonDepartures > 0 && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                          {seasonDepartures} saída{seasonDepartures !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Season Content */}
                  <AnimatePresence>
                    {isSeasonOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4">
                          {cats.map(({ slug, label, arrivals, departures }) => {
                            const catKey = `${season}-${slug}`;
                            const isCatOpen = expandedCategory === catKey;
                            const hasArrivals = arrivals.length > 0;
                            const hasDepartures = departures.length > 0;

                            return (
                              <div key={slug} className="border border-gray-100 rounded-xl overflow-hidden">
                                {/* Category Header */}
                                <button
                                  onClick={() => toggleCategory(catKey)}
                                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight
                                      size={14}
                                      className={`text-gray-400 transition-transform duration-200 ${isCatOpen ? "rotate-90" : ""}`}
                                    />
                                    <span className="font-semibold text-sm text-gray-800">{label}</span>
                                    <span className="text-[10px] text-gray-400">
                                      ({arrivals.length + departures.length} total)
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    {hasArrivals && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                        {arrivals.length}
                                      </span>
                                    )}
                                    {hasDepartures && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                                        {departures.length}
                                      </span>
                                    )}
                                  </div>
                                </button>

                                {/* Category Content */}
                                <AnimatePresence>
                                  {isCatOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-4 space-y-5">
                                        {/* Arrivals */}
                                        {hasArrivals && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-3">
                                              <ArrowRight size={14} className="text-blue-500" />
                                              <h4 className="font-bold text-sm text-blue-700">
                                                Chegadas ({arrivals.length})
                                              </h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {arrivals
                                                .slice(
                                                  ((arrivalPages[catKey] || 1) - 1) * SECTION_LIMIT,
                                                  (arrivalPages[catKey] || 1) * SECTION_LIMIT
                                                )
                                                .map((m) => (
                                                  <MovementCard key={m.id} m={m} />
                                                ))}
                                            </div>
                                            <Pagination
                                              page={arrivalPages[catKey] || 1}
                                              total={Math.ceil(arrivals.length / SECTION_LIMIT)}
                                              onChange={(p) => setArrivalPages({ ...arrivalPages, [catKey]: p })}
                                            />
                                          </div>
                                        )}

                                        {/* Departures */}
                                        {hasDepartures && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-3">
                                              <ArrowLeft size={14} className="text-red-500" />
                                              <h4 className="font-bold text-sm text-red-700">
                                                Saídas ({departures.length})
                                              </h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {departures
                                                .slice(
                                                  ((departurePages[catKey] || 1) - 1) * SECTION_LIMIT,
                                                  (departurePages[catKey] || 1) * SECTION_LIMIT
                                                )
                                                .map((m) => (
                                                  <MovementCard key={m.id} m={m} />
                                                ))}
                                            </div>
                                            <Pagination
                                              page={departurePages[catKey] || 1}
                                              total={Math.ceil(departures.length / SECTION_LIMIT)}
                                              onChange={(p) => setDeparturePages({ ...departurePages, [catKey]: p })}
                                            />
                                          </div>
                                        )}

                                        {!hasArrivals && !hasDepartures && (
                                          <p className="text-xs text-gray-400 text-center py-4">
                                            Nenhuma movimentação nesta categoria.
                                          </p>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
