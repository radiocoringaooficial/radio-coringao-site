"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";
import { Pagination } from "@/presentation/components/ui/Pagination";
import { NewsCard } from "@/presentation/components/ui/NewsCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
}

interface NewsCategoryContentProps {
  category: CategoryInfo;
  initialArticles: NewsArticle[];
  initialTotal: number;
  initialTotalPages: number;
}

const EDITORIAL_COUNT = 3;
const GRID_ITEMS_PER_PAGE = 8;
const PAGINATION_THRESHOLD = 10;
const API_LIMIT = 20;

interface ApiArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  isBreaking: boolean;
  publishedAt: string;
  viewCount: number;
  author: { name: string; avatar?: string } | null;
  authorNameSnapshot?: string;
  authorAvatarSnapshot?: string;
  category: { name: string; slug: string };
}

function mapApiArticle(article: ApiArticle): NewsArticle {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: (article as any).content || "",
    category: article.category?.name || "",
    categorySlug: article.category?.slug || "",
    author: article.author?.name || article.authorNameSnapshot || "",
    authorAvatar: article.author?.avatar || article.authorAvatarSnapshot || "",
    imageUrl: article.coverImage || "",
    imageAlt: article.coverImageAlt || article.title,
    publishedAt: article.publishedAt,
    isBreaking: article.isBreaking,
    isLive: false,
    viewCount: article.viewCount || 0,
  };
}

function EditorialGrid({ articles }: { articles: NewsArticle[] }) {
  const hero = articles[0];
  const side = articles.slice(1, 3);

  if (!hero) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 grid grid-cols-1 gap-[5px] lg:grid-cols-[55%_45%]"
    >
      <Link
        href={`/noticias/${hero.slug}`}
        className="group relative block min-h-[320px] overflow-hidden rounded-sm lg:row-span-2 lg:min-h-[500px]"
      >
        <img
          src={hero.imageUrl}
          alt={hero.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6">
          <span className="mb-2 inline-block bg-white/20 px-2 py-1 font-label-sm text-label-sm text-white backdrop-blur-sm">
            {hero.category}
          </span>
          <h2 className="font-headline-md text-[17px] leading-snug font-bold text-white md:text-[20px]">
            {hero.title}
          </h2>
          {hero.excerpt && (
            <p className="mt-2 text-[13px] leading-snug text-white/80">
              {hero.excerpt}
            </p>
          )}
        </div>
      </Link>

      {side.map((article) => (
        <Link
          key={article.id}
          href={`/noticias/${article.slug}`}
          className="group relative block min-h-[200px] overflow-hidden rounded-sm"
        >
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-3 md:p-4">
            <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
              {article.category}
            </span>
            <h3 className="font-headline-md text-[14px] font-bold text-white">
              {article.title}
            </h3>
          </div>
        </Link>
      ))}
    </motion.div>
  );
}

export function NewsCategoryContent({
  category,
  initialArticles,
  initialTotal,
  initialTotalPages,
}: NewsCategoryContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/news`);
      url.searchParams.append("category", category.slug);
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit", String(API_LIMIT));

      const res = await fetch(url.toString(), { next: { revalidate: 60 } });
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : data?.data || []).map(mapApiArticle);
        setArticles(mapped);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || Math.ceil((data?.total || 0) / API_LIMIT) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [category.slug]);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    loadPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const editorialArticles = articles.slice(0, EDITORIAL_COUNT);
  const gridArticles = articles.slice(EDITORIAL_COUNT);
  const usePagination = gridArticles.length > PAGINATION_THRESHOLD || totalPages > 1;

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-8 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative z-10">
          <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
            {category.name}
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-white/70">
            {category.description}
          </p>
        </div>
      </motion.div>

      {loading && (
        <div className="mb-4 flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && <EditorialGrid articles={editorialArticles} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {gridArticles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <NewsCard article={article} />
          </motion.div>
        ))}
      </div>

      {usePagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
