import type { Metadata } from "next";
import { container } from "@/application/services/container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jogos - Rádio Coringão",
  description: "Próximos jogos e resultados do Corinthians",
};

export default async function JogosPage() {
  const { nextMatch, recentResults } =
    await container.getJogosPageData.execute();

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-stack-lg flex items-center gap-2">
        <div className="h-6 w-1 bg-secondary" />
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
          Jogos
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        <div className="border border-outline-variant bg-surface-container-lowest p-6">
          <span className="mb-4 block font-label-sm text-label-sm uppercase text-secondary">
            Próximo Jogo
          </span>
          <div className="flex items-center justify-center gap-8 py-8">
            <div className="text-center">
              <div className="mb-3 h-16 w-16 rounded-sm bg-primary" />
              <span className="font-headline-md text-headline-md text-primary">
                {nextMatch.homeTeam}
              </span>
            </div>
            <span className="font-display-xl text-display-xl text-outline">
              VS
            </span>
            <div className="text-center">
              <div className="mb-3 h-16 w-16 rounded-sm bg-surface-variant" />
              <span className="font-headline-md text-headline-md text-primary">
                {nextMatch.awayTeam}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-surface-variant pt-4 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {nextMatch.competition}
            </p>
            <p className="font-body-lg text-body-lg text-primary">
              {nextMatch.date}, {nextMatch.time} - {nextMatch.venue}
            </p>
          </div>
        </div>

        <div className="border border-outline-variant bg-surface-container-lowest p-6">
          <span className="mb-4 block font-label-sm text-label-sm uppercase text-secondary">
            Últimos Resultados
          </span>
          <div className="flex flex-col gap-4">
            {recentResults.map((match, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-surface-variant pb-3 last:border-b-0 last:pb-0"
              >
                <span className="font-body-md text-body-md font-bold text-primary">
                  {match.home}
                </span>
                <span className="font-headline-md text-headline-md text-secondary">
                  {match.score}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {match.away}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}