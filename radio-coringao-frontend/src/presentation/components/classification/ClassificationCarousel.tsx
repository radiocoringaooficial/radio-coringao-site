"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TeamEntry {
  position: number;
  teamName: string;
  points: number;
  logoUrl?: string | null;
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <div className="h-6 w-6 shrink-0 flex items-center justify-center overflow-hidden">
        <img src={logo} alt={name} className="h-6 w-6 object-contain" />
      </div>
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="h-6 w-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
      <span className="text-[9px] font-bold text-white">{initials}</span>
    </div>
  );
}

function getBarColor(pos: number): string {
  if (pos <= 4) return "#1565C0";
  if (pos === 5) return "#E65100";
  if (pos <= 12) return "#6A1B9A";
  if (pos >= 18) return "#b71c1c";
  return "transparent";
}

export function ClassificationCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [standings, setStandings] = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_CLUBE_API_URL || 'https://radio-coringao-clube-api.vercel.app/api'}/classificacoes/6033dfa0-3034-4b73-ad9e-af16359894b4`)
      .then(res => res.json())
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || [];
        setStandings(all.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const page1 = standings.slice(0, 10);
  const page2 = standings.slice(10, 20);
  const pages = [page1, page2].filter(p => p.length > 0);
  const totalPages = pages.length || 1;

  function scrollTo(index: number) {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / totalPages;
    scrollRef.current.scrollTo({ left: cardWidth * index, behavior: "smooth" });
  }

  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      const next = (activePage + 1) % totalPages;
      setActivePage(next);
      scrollTo(next);
    }, 10000);
    return () => clearInterval(interval);
  }, [activePage, totalPages]);

  function scrollLeft() {
    const prev = (activePage - 1 + totalPages) % totalPages;
    setActivePage(prev);
    scrollTo(prev);
  }

  function scrollRight() {
    const next = (activePage + 1) % totalPages;
    setActivePage(next);
    scrollTo(next);
  }

  return (
    <div className="relative rounded-md border border-white/10 bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-4 text-white">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-white/60">
          Brasileirão Masculino 2026
        </span>
        {totalPages > 1 && (
          <div className="flex gap-1.5">
            <button onClick={scrollLeft} className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20">
              <ChevronLeft size={12} />
            </button>
            <button onClick={scrollRight} className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20">
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
        {loading ? (
          <div className="min-w-full snap-start">
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <div className="h-3 w-3 bg-white/10 rounded animate-pulse" />
                  <div className="h-5 w-5 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-3 flex-1 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-6 bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          pages.map((pageTeams, pageIndex) => (
            <div key={pageIndex} className="min-w-full snap-start">
              <div className="flex flex-col">
                {pageTeams.map((team) => (
                  <div key={team.position} className="relative flex items-center justify-between border-b border-white/5 py-1.5 last:border-b-0">
                    <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: getBarColor(team.position) }} />
                    <div className="flex items-center gap-2 pl-2">
                      <span className="w-4 text-center text-[11px] text-white/40">{team.position}</span>
                      <TeamLogo name={team.teamName} logo={team.logoUrl} />
                      <span className={`text-[13px] ${team.teamName === "Corinthians" ? "text-white font-bold" : "text-white/80"}`}>
                        {team.teamName}
                      </span>
                    </div>
                    <span className="text-[13px] font-bold text-white">{team.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dots */}
      {totalPages > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {pages.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activePage ? "w-5 bg-white" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
