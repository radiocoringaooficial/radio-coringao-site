import type { Metadata } from "next";
import { RadioPlayer } from "@/presentation/components/radio/RadioPlayer";

export const metadata: Metadata = {
  title: "Rádio | Rádio Coringão",
  description: "Ouça a Rádio Coringão ao vivo. Transmissão contínua 24 horas.",
};

export default function RadioPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">Rádio Coringão</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Ouça ao vivo • Transmissão contínua 24h</p>
      </div>
      <RadioPlayer />
    </div>
  );
}
