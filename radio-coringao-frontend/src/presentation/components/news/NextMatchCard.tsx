"use client";

import Link from "next/link";
import { NextMatch } from "@/domain/entities";

interface NextMatchCardProps extends NextMatch {
  title?: string;
  category?: string;
  dots?: number;
  activeDot?: number;
  cardIndex?: number;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <div className="h-14 w-14 flex items-center justify-center overflow-hidden">
        <img src={logo} alt={name} className="h-14 w-14 object-contain" />
      </div>
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="h-14 w-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
      <span className="text-[13px] font-bold text-white">{initials}</span>
    </div>
  );
}

export function NextMatchCard(props: NextMatchCardProps) {
  const { homeTeam, awayTeam, date, time, venue, hasTickets, competition, category, title, dots, activeDot, cardIndex = 0, homeTeamLogo, awayTeamLogo, round } =
    props;

  const competitionColors = [
    { border: "border-white/20", bg: "bg-white/10", text: "text-white/90" },
    { border: "border-white/30", bg: "bg-white/15", text: "text-white" },
    { border: "border-white/15", bg: "bg-white/5", text: "text-white/70" },
  ];
  const color = competitionColors[cardIndex % competitionColors.length];

  return (
    <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-md text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
      {/* Top accent */}
      <div className="relative z-10 h-0.5 w-full bg-white/20" />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            <span className={`shrink-0 whitespace-nowrap rounded-full border ${color.border} ${color.bg} px-3 py-1 font-label-sm text-label-sm font-bold uppercase tracking-wider ${color.text}`}>
              {competition}
            </span>
            {category && (
              <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
                {category}
              </span>
            )}
            <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
          </div>
        </div>

        {/* Teams */}
        <div className="my-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <TeamLogo name={homeTeam} logo={homeTeamLogo} />
              <span className="text-[12px] font-bold text-white/80">{homeTeam}</span>
            </div>
            <span className="text-xl font-bold text-white/40">X</span>
            <div className="flex flex-col items-center gap-2">
              <TeamLogo name={awayTeam} logo={awayTeamLogo} />
              <span className="text-[12px] font-bold text-white/80">{awayTeam}</span>
            </div>
          </div>
        </div>

        {/* Info + CTA */}
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 font-body-md text-body-md text-white/60">
            <span className="material-symbols-outlined text-[16px]">
              calendar_today
            </span>
            <span>{date}, {time}</span>
            <span className="text-white/20">|</span>
            <span>{venue}</span>
          </div>
          {round && (
            <div className="mb-3 flex justify-center">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white/80 uppercase tracking-wider">{round}</span>
            </div>
          )}
          <Link
            href="#"
            className="block w-full rounded-md border border-white/20 bg-white/10 py-3 text-center font-label-sm text-label-sm uppercase font-bold text-white transition-all duration-200 hover:bg-white hover:text-primary"
          >
            Ingressos
          </Link>
        </div>
      </div>

      {/* Dots */}
      {dots && dots > 1 && (
        <div className="relative z-10 flex justify-center gap-2 pb-4">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeDot ? "w-5 bg-white" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
