import Link from "next/link";
import { container } from "@/application/services/container";

export const dynamic = "force-dynamic";
import { EditorialGrid } from "@/presentation/components/news/EditorialGrid";
import { MatchCarousel } from "@/presentation/components/news/MatchCarousel";
import { LatestNews } from "@/presentation/components/news/LatestNews";
import { ClassificationCarousel } from "@/presentation/components/classification/ClassificationCarousel";
import { HighlightsSection } from "@/presentation/components/news/HighlightsSection";

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailySeed(): number {
  const dateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return hash;
}

function buildTopRead(weekHighlights: any[], latestNews: any[], limit = 5) {
  const base = weekHighlights.slice(0, limit);
  if (base.length >= limit) return base;
  const usedIds = new Set(base.map((a) => a.id));
  const remaining = latestNews.filter((a) => !usedIds.has(a.id));
  const rng = mulberry32(getDailySeed());
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  return [...base, ...remaining.slice(0, limit - base.length)];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

function mapArticle(article: any) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content || "",
    category: article.category?.name || "",
    categorySlug: article.category?.slug || "",
    author: article.author?.name || article.authorNameSnapshot || "",
    authorAvatar: article.author?.avatar || article.authorAvatarSnapshot || "",
    imageUrl: article.coverImage || "",
    imageAlt: article.coverImageAlt || article.title,
    publishedAt: article.publishedAt || "",
    isBreaking: article.isBreaking || false,
    isLive: false,
    viewCount: article.viewCount || 0,
  };
}

export default async function Home() {
  let editorialNews: any[] = [];
  let latestNews: any[] = [];
  let scheduledMatches: any[] = [];

  try {
    const data = await container.getHomePageData.execute();
    editorialNews = data.editorialNews;
    latestNews = data.latestNews;
    scheduledMatches = data.scheduledMatches;
  } catch (e) {
    console.error("Failed to load home data:", e);
  }

  // Fetch week and month highlights from API
  const [weekRes, monthRes] = await Promise.all([
    fetch(`${API_URL}/noticias/highlights/week`, { next: { revalidate: 60 } }).catch(() => null),
    fetch(`${API_URL}/noticias/highlights/month`, { next: { revalidate: 60 } }).catch(() => null),
  ]);

  let weekArticles: any[] = [];
  let monthArticles: any[] = [];

  if (weekRes?.ok) {
    const data = await weekRes.json();
    weekArticles = Array.isArray(data) ? data : data?.data || [];
  }
  if (monthRes?.ok) {
    const data = await monthRes.json();
    monthArticles = Array.isArray(data) ? data : data?.data || [];
  }

  const weekHighlights = weekArticles.map(mapArticle);
  const monthHighlights = monthArticles.map(mapArticle);

  // Mapa posição → artigo (usa order como chave, sem compactação)
  const byPosition = new Map<number, any>(editorialNews.filter(Boolean).map((a: any) => [a.order, a]));

  // Position 1: Hero Principal
  const heroArticle = byPosition.get(1) || null;

  // Positions 2-3: Laterais
  const sideArticles = [2, 3].map(p => byPosition.get(p)).filter(Boolean);

  // Partidas agendadas do banco de dados
  const matches = scheduledMatches.map((m: any, i) => ({
    ...m,
    title: m.competition || `Partida ${i + 1}`,
    competition: m.competition || "",
    category: m.categoryName || m.category || "",
  }));

  const topRead = buildTopRead(weekHighlights, latestNews);

  // Positions 4-12: cards adicionais (cada um no slot exato do seu order)
  const moreNews = Array.from({ length: 9 }, (_, i) => byPosition.get(i + 4)).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-5">
          {heroArticle && <EditorialGrid heroArticle={heroArticle} sideArticles={sideArticles} />}

          {/* Cards adicionais antes de Últimas Notícias */}
          <div className="grid grid-cols-2 gap-[5px] sm:grid-cols-3">
            {moreNews.map((article, index) => (
              <Link
                key={article.id}
                href={`/noticias/${article.slug}`}
                className="group relative block min-h-[200px] overflow-hidden rounded-sm sm:min-h-[240px]"
              >
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-3">
                  <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
                    {article.category}
                  </span>
                  <h3 className="line-clamp-2 font-headline-md text-[15px] font-bold text-white">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <MatchCarousel matches={matches} />

          {/* Mais Lidas */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <h3 className="mb-3 font-headline-md text-headline-md text-primary">
              Mais Lidas
            </h3>
            <div className="flex flex-col gap-2.5">
              {topRead.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/noticias/${story.slug}`}
                  className="group flex items-start gap-3 border-b border-outline-variant pb-2.5 last:border-b-0 last:pb-0"
                >
                  <span className="shrink-0 text-[16px] font-bold text-on-surface-variant">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="line-clamp-2 text-[13px] font-bold text-primary transition-colors group-hover:text-secondary">
                      {story.title}
                    </h4>
                    <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                      {story.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <ClassificationCarousel />
        </aside>
      </div>

      <LatestNews articles={latestNews.slice(0, 6)} />

      <HighlightsSection
        monthHighlights={monthHighlights}
        weekHighlights={weekHighlights}
      />
    </div>
  );
}
// force redeploy Tue Jul 14 04:06:13 -03 2026
