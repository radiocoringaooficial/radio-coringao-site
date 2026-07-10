import type { Metadata } from "next";
import { SponsorsContent } from "@/presentation/components/pages/SponsorsContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radio-coringao-news-api.vercel.app/api";

export const metadata: Metadata = {
  title: "Patrocinadores - Rádio Coringão",
  description: "Conheça os patrocinadores do Rádio Coringão.",
};

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  description?: string;
  isActive: boolean;
  order: number;
}

async function fetchSponsors(): Promise<Sponsor[]> {
  try {
    const res = await fetch(`${API_URL}/patrocinadores`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

export default async function PatrocinadoresPage() {
  const sponsors = await fetchSponsors();

  return <SponsorsContent sponsors={sponsors} />;
}
