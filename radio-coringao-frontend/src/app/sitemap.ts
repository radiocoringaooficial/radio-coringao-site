import type { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiocoringao.com.br";

async function fetchSlugs(endpoint: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map((item: any) => item.slug || item.id).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/noticias`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/jogos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/classificacoes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/eventos`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/colunas`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/transferencias`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/quem-somos`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/patrocinadores`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/anuncie-conosco`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/trabalhe-conosco`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/politica-de-privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/termos-de-uso`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Dynamic routes from API
  const [articleSlugs, categorySlugs, eventSlugs, championshipSlugs, sportSlugs] = await Promise.all([
    fetchSlugs("/noticias?limit=500&status=PUBLISHED"),
    fetchSlugs("/categorias"),
    fetchSlugs("/eventos"),
    fetchSlugs("/classificacoes"),
    Promise.resolve(["futebol", "futsal", "basquete", "feminino", "sub-20", "sub-17"]),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...articleSlugs.map((slug) => ({
      url: `${SITE_URL}/noticias/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...categorySlugs.map((slug) => ({
      url: `${SITE_URL}/noticias/category/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...eventSlugs.map((slug) => ({
      url: `${SITE_URL}/eventos/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...championshipSlugs.map((slug) => ({
      url: `${SITE_URL}/classificacoes/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...sportSlugs.map((slug) => ({
      url: `${SITE_URL}/esportes/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
