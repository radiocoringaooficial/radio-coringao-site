import type { Metadata } from "next";
import { container } from "@/application/services/container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colunas - Rádio Coringão",
  description: "Colunas e opiniões sobre o Corinthians",
};

export default async function ColunasPage() {
  const columnists = await container.getColumnists.execute();

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-stack-lg flex items-center gap-2">
        <div className="h-6 w-1 bg-secondary" />
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
          Colunas
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {columnists.map((col) => (
          <div
            key={col.name}
            className="border border-outline-variant bg-surface-container-lowest p-6 transition-colors hover:border-secondary"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center bg-primary">
              <span className="font-headline-md text-headline-md text-on-primary">
                {col.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary">
              {col.name}
            </h3>
            <span className="mt-1 block font-label-sm text-label-sm text-secondary">
              {col.role}
            </span>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              {col.description}
            </p>
            <button className="mt-4 w-full border-2 border-primary bg-transparent py-2 font-label-sm text-label-sm text-primary transition-colors hover:bg-primary hover:text-on-primary">
              Ler colunas
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}