import Link from "next/link";
import { container } from "@/application/services/container";

export const dynamic = "force-dynamic";
import { EditorialGrid } from "@/presentation/components/news/EditorialGrid";
import { MatchCarousel } from "@/presentation/components/news/MatchCarousel";
import { LatestNews } from "@/presentation/components/news/LatestNews";
import { ClassificationCarousel } from "@/presentation/components/classification/ClassificationCarousel";
import { HighlightsSection } from "@/presentation/components/news/HighlightsSection";

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
    author: article.author?.name || "",
    authorAvatar: article.author?.avatar || "",
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

  // Position [0]: Card Hero (lado esquerdo, ~55% largura)
  const heroArticle = editorialNews[0];

  // Position [1]: Card lateral superior (lado direito)
  // Position [2]: Card lateral inferior (lado direito)
  const sideArticles = editorialNews.slice(1, 3);

  // Partidas agendadas do banco de dados
  const CATEGORY_LABELS: Record<string, string> = {
    principal: "Futebol", feminino: "Feminino", basquete: "Basquete",
    futsal: "Futsal", "sub-20": "Sub-20", "sub-17": "Sub-17",
  };
  const matches = scheduledMatches.map((m: any, i) => ({
    ...m,
    title: m.competition?.name || `Partida ${i + 1}`,
    competition: m.competition?.name || "",
    category: CATEGORY_LABELS[m.category] || m.category || "",
    homeTeam: m.isHome ? "Corinthians" : m.opponent?.name || "TBD",
    awayTeam: m.isHome ? m.opponent?.name || "TBD" : "Corinthians",
    homeTeamLogo: m.isHome ? "https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png" : m.opponent?.logoUrl || null,
    awayTeamLogo: m.isHome ? m.opponent?.logoUrl || null : "https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png",
  }));

  const topRead = weekHighlights.length > 0 ? weekHighlights.slice(0, 5) : latestNews.slice(0, 5);

  // Position [3] a [11]: cards adicionais vindos do editorial (order 4-12)
  // Fallback para latestNews se não houver artigos editoriais suficientes
  const editorialMore = editorialNews.slice(3, 12);
  const moreNews = (editorialMore.length >= 4 ? editorialMore : latestNews.slice(0, 9)).filter(Boolean);

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
