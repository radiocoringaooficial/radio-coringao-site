import type { Metadata } from "next";
import { Header } from "@/presentation/components/layout/Header";
import { Footer } from "@/presentation/components/layout/Footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiocoringao.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rádio Coringão - O portal da Fiel",
    template: "%s | Rádio Coringão",
  },
  description:
    "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista. Notícias, jogos, classificações e muito mais.",
  keywords: ["Corinthians", "notícias", "futebol", "Timão", "esportes", "rádio coringão", "Sport Club Corinthians Paulista", "Brasileirão", "Libertadores"],
  openGraph: {
    title: "Rádio Coringão - O portal da Fiel",
    description:
      "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista.",
    images: [
      {
        url: "/logo-seo.png",
        width: 1200,
        height: 630,
        alt: "Rádio Coringão - Portal de notícias do Corinthians",
      },
    ],
    siteName: "Rádio Coringão",
    locale: "pt_BR",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rádio Coringão - O portal da Fiel",
    description:
      "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista.",
    images: ["/logo-seo.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  authors: [{ name: "Rádio Coringão" }],
  publisher: "Rádio Coringão",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rádio Coringão",
    url: SITE_URL,
    description: "Jornalismo independente sobre o Sport Club Corinthians Paulista.",
    publisher: {
      "@type": "Organization",
      name: "Rádio Coringão",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-seo.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/busca?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body-md text-body-md flex min-h-screen flex-col bg-surface text-on-surface antialiased">
        <Header />
        <main className="w-full flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* auto-deploy test */
