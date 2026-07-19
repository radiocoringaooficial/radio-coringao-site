import type { Metadata } from "next";
import { TransferenciasContent } from "./TransferenciasContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiocoringao.com.br";

export const metadata: Metadata = {
  title: "Transferências | Rádio Coringão",
  description:
    "Confira todas as chegadas, saídas e empréstimos do Corinthians. Acompanhe as movimentações do elenco por temporada e modalidade.",
  openGraph: {
    title: "Transferências | Rádio Coringão",
    description:
      "Confira todas as chegadas, saídas e empréstimos do Corinthians. Acompanhe as movimentações do elenco por temporada e modalidade.",
    url: `${SITE_URL}/transferencias`,
    siteName: "Rádio Coringão",
    images: [
      {
        url: `${SITE_URL}/logo-preto-og.png`,
        width: 1200,
        height: 630,
        alt: "Transferências Corinthians",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transferências | Rádio Coringão",
    description:
      "Confira todas as chegadas, saídas e empréstimos do Corinthians.",
    images: [`${SITE_URL}/logo-preto-og.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/transferencias`,
  },
};

export default function TransferenciasPage() {
  return <TransferenciasContent />;
}
