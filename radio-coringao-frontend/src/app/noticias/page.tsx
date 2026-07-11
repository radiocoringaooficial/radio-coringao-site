import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsMainContent } from "@/presentation/components/news/NewsMainContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

export const metadata: Metadata = {
  title: "Notícias - Rádio Coringão",
  description: "Todas as notícias do Corinthians em um só lugar.",
};

async function fetchNewsData(sort: string = "recent") {
  const [editorialRes, latestRes] = await Promise.all([
    fetch(`${API_URL}/noticias/editorial`, { cache: "no-store" }).catch(() => null),
    fetch(`${API_URL}/noticias?page=1&limit=20&sort=${sort}`, { cache: "no-store" }).catch(() => null),
  ]);

  let editorialArticles: any[] = [];
  let initialArticles: any[] = [];
  let initialTotal = 0;
  let initialTotalPages = 1;

  if (editorialRes?.ok) {
    const data = await editorialRes.json();
    editorialArticles = Array.isArray(data) ? data : data?.data || [];
  }

  if (latestRes?.ok) {
    const data = await latestRes.json();
    initialArticles = Array.isArray(data) ? data : data?.data || [];
    initialTotal = data?.total || 0;
    initialTotalPages = data?.totalPages || Math.ceil(initialTotal / 20) || 1;
  }

  const mapArticle = (article: any) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content || "",
    category: article.category?.name || "",
    categorySlug: article.category?.slug || "",
    author: article.author?.name || "",
    authorAvatar: article.author?.avatar || "",
    authorPosition: article.author?.position || "",
    imageUrl: article.coverImage || "",
    imageAlt: article.coverImageAlt || article.title,
    publishedAt: article.publishedAt || "",
    isBreaking: article.isBreaking || false,
    isLive: false,
    viewCount: article.viewCount || 0,
  });

  return {
    editorialArticles: editorialArticles.map(mapArticle),
    initialArticles: initialArticles.map(mapArticle),
    initialTotal,
    initialTotalPages,
  };
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ sort?: string; tab?: string }> }) {
  const { sort = "recent", tab } = await searchParams;
  const { editorialArticles, initialArticles, initialTotal, initialTotalPages } = await fetchNewsData(sort);

  return (
    <Suspense>
      <NewsMainContent
        editorialArticles={editorialArticles}
        initialArticles={initialArticles}
        initialTotal={initialTotal}
        initialTotalPages={initialTotalPages}
        currentSort={sort}
        initialTab={tab as any}
      />
    </Suspense>
  );
}
