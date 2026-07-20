import type { Metadata } from "next";
import { Header } from "@/presentation/components/layout/Header";
import { Footer } from "@/presentation/components/layout/Footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiocoringao.com.br";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

const DEFAULT_SITE_NAME = "Rádio Coringão";
const DEFAULT_FAVICON = "/icon.png";

async function getSettings(): Promise<{ siteName?: string; faviconUrl?: string }> {
  try {
    const res = await fetch(`${API_URL}/configuracoes`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    return res.json();
  } catch { return {}; }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.siteName || DEFAULT_SITE_NAME;
  const favicon = settings.faviconUrl || DEFAULT_FAVICON;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} - O portal da Fiel`,
      template: `%s | ${siteName}`,
    },
    description:
      "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista. Notícias, jogos, classificações e muito mais.",
    keywords: ["Corinthians", "notícias", "futebol", "Timão", "esportes", "rádio coringão", "Sport Club Corinthians Paulista", "Brasileirão", "Libertadores"],
    openGraph: {
      title: `${siteName} - O portal da Fiel`,
      description:
        "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista.",
      images: [
        {
          url: "/logo-preto-og.png",
          width: 1200,
          height: 630,
          alt: `${siteName} - Portal de notícias do Corinthians`,
        },
      ],
      siteName,
      locale: "pt_BR",
      type: "website",
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - O portal da Fiel`,
      description:
        "Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista.",
      images: ["/logo-preto-og.png"],
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
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
    authors: [{ name: siteName }],
    publisher: siteName,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
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
