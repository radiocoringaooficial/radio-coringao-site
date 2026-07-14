"use client";

import { motion } from "framer-motion";
import { ChampionshipData } from "@/infrastructure/data/championships";

interface ChampionshipContentProps {
  data: ChampionshipData;
  modality?: "FOOTBALL" | "FUTSAL" | "BASKETBALL";
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <div className="h-7 w-7 shrink-0 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant">
        <img src={logo} alt={name} className="h-6 w-6 object-contain" />
      </div>
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center">
      <span className="text-[10px] font-bold text-on-primary">{initials}</span>
    </div>
  );
}

export function ChampionshipContent({ data, modality = "FOOTBALL" }: ChampionshipContentProps) {
  const isBasketball = modality === "BASKETBALL";
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
          <div className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 font-label-sm text-label-sm text-white/80">
            {data.status}
          </div>
          <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
            {data.name}
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-white/70">
            {data.description}
          </p>
        </div>
      </motion.div>

      {/* Elimination message */}
      {data.elimination && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-primary">Status</h3>
              <p className="font-body-md text-on-surface-variant">{data.elimination}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Last Match + Next Match */}
      {(data.lastMatch || data.nextMatch) && (
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {data.lastMatch && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
            >
              <span className="mb-3 block font-label-sm text-label-sm uppercase text-secondary">
                Última Partida
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo name={data.lastMatch.home} />
                  <span className="text-[13px] font-bold text-primary">{data.lastMatch.home}</span>
                </div>
                <span className="rounded bg-primary px-2 py-1 text-[13px] font-bold text-on-primary">
                  {data.lastMatch.score}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-primary">{data.lastMatch.away}</span>
                  <TeamLogo name={data.lastMatch.away} />
                </div>
              </div>
              <p className="mt-2 text-center text-[12px] text-on-surface-variant">
                {data.lastMatch.date} • {data.lastMatch.competition}
              </p>
            </motion.div>
          )}

                {data.nextMatch && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
            >
              <span className="mb-3 block font-label-sm text-label-sm uppercase text-secondary">
                Próxima Partida
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo name={data.nextMatch.home} />
                  <span className="text-[13px] font-bold text-primary">{data.nextMatch.home}</span>
                </div>
                <span className="text-[13px] text-on-surface-variant">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-primary">{data.nextMatch.away}</span>
                  <TeamLogo name={data.nextMatch.away} />
                </div>
              </div>
              <p className="mt-2 text-center text-[12px] text-on-surface-variant">
                {data.nextMatch.date}, {data.nextMatch.time} • {data.nextMatch.venue}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Standings Tables */}
      {data.hasTable && data.groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="mb-4 font-headline-md text-headline-md text-primary">Classificação</h2>
          {data.groups.map((group) => (
            <div key={group.groupName || "single"} className="mb-6">
              {group.groupName && data.groups.length > 1 && (
                <h3 className="mb-2 text-sm font-bold text-on-surface-variant">
                  {group.groupName}
                </h3>
              )}
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
                    {group.entries.map((row, index) => {
                      const posColor =
                        row.pos <= 4 ? "#1565C0" :
                        row.pos <= 6 ? "#E65100" :
                        "transparent";
                      const sld = row.sld;
                      return (
                        <tr
                          key={row.pos}
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
                              <TeamLogo name={row.time} logo={row.logoUrl} />
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
                                  row.sld > 0 ? "bg-blue-100 text-blue-700" : row.sld < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                }`}>
                                  {row.sld > 0 ? `+${row.sld}` : row.sld}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-3 text-center text-[13px] font-bold text-on-surface">{(row as any).pts ?? (row as any).ppro}</td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{(row as any).pj ?? row.j}</td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-[12px] font-bold text-blue-700">
                                  {(row as any).vit ?? row.v}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 px-2 text-[12px] font-bold text-gray-600">
                                  {(row as any).e ?? 0}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[12px] font-bold text-red-700">
                                  {(row as any).der ?? row.d}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{(row as any).gm ?? row.ppro}</td>
                              <td className="px-3 py-3 text-center text-[13px] text-on-surface-variant">{(row as any).gc ?? row.pcon}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[12px] font-bold ${
                                  row.sld > 0 ? "bg-blue-100 text-blue-700" : row.sld < 0 ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"
                                }`}>
                                  {row.sld > 0 ? `+${row.sld}` : row.sld}
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
        </motion.div>
      )}

      {!data.hasTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 text-center"
        >
          <p className="text-on-surface-variant">
            Esta competição não possui tabela de classificação.
          </p>
        </motion.div>
      )}
    </div>
  );
}
