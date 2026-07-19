"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";
import { Pagination } from "@/presentation/components/ui/Pagination";
import { NewsCard } from "@/presentation/components/ui/NewsCard";
import { SortFilter } from "@/presentation/components/news/SortFilter";
import { NewsSortBar } from "@/presentation/components/news/NewsSortBar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface NewsMainContentProps {
  editorialArticles: NewsArticle[];
  initialArticles: NewsArticle[];
  initialTotal: number;
  initialTotalPages: number;
  currentSort?: string;
  initialTab?: "ultimas" | "semanais" | "mensais";
}

type Tab = "ultimas" | "semanais" | "mensais";

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
  author: { name: string; avatar?: string };
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
    author: (article as any).author?.name || (article as any).authorNameSnapshot || "",
    authorAvatar: (article as any).author?.avatar || (article as any).authorAvatarSnapshot || "",
    authorPosition: (article as any).author?.position || "",
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
          className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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

async function fetchArticlesFromApi(params: Record<string, string>): Promise<{ articles: NewsArticle[]; total: number; totalPages: number }> {
  const url = new URL(`${API_URL}/news`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { articles: [], total: 0, totalPages: 0 };
    const json = await res.json();
    const articles = (Array.isArray(json) ? json : json?.data || []).map(mapApiArticle);
    const total = json?.total || 0;
    const totalPages = json?.totalPages || Math.ceil(total / (Number(params.limit) || API_LIMIT));
    return { articles, total, totalPages };
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

async function fetchEditorialFromApi(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(`${API_URL}/noticias/editorial`);
    if (!res.ok) return [];
    const data = await res.json();
    const articles = Array.isArray(data) ? data : data?.data || [];
    return articles.map(mapApiArticle);
  } catch {
    return [];
  }
}

export function NewsMainContent({
  editorialArticles,
  initialArticles,
  initialTotal,
  initialTotalPages,
  currentSort = "recent",
  initialTab,
}: NewsMainContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const validTabs: Tab[] = ["ultimas", "semanais", "mensais"];
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTabState] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : (initialTab && validTabs.includes(initialTab) ? initialTab : "ultimas")
  );

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [currentPage, setCurrentPage] = useState(1);

  const [editorial, setEditorial] = useState<NewsArticle[]>(editorialArticles);
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "ultimas") {
      loadTab(activeTab, 1);
    }
  }, []);

  const loadTab = useCallback(async (tab: Tab, page: number = 1) => {
    setLoading(true);
    try {
      if (tab === "semanais") {
        const res = await fetch(`${API_URL}/noticias/highlights/week`).catch(() => null);
        if (res?.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : json?.data || [];
          setArticles(data.map(mapApiArticle));
          setTotal(data.length);
        }
        setTotalPages(1);
      } else if (tab === "mensais") {
        const res = await fetch(`${API_URL}/noticias/highlights/month`).catch(() => null);
        if (res?.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : json?.data || [];
          setArticles(data.map(mapApiArticle));
          setTotal(data.length);
        }
        setTotalPages(1);
      } else {
        const params: Record<string, string> = { page: String(page), limit: String(API_LIMIT), sort: currentSort };
        const result = await fetchArticlesFromApi(params);
        setArticles(result.articles);
        setTotal(result.total);
        setTotalPages(result.totalPages);

        const ed = await fetchEditorialFromApi();
        setEditorial(ed);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setCurrentPage(1);
    loadTab(tab, 1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    loadTab(activeTab, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const editorialForTab = activeTab === "ultimas" ? editorial : articles.slice(0, EDITORIAL_COUNT);
  const gridArticles = activeTab === "ultimas"
    ? articles.slice(EDITORIAL_COUNT)
    : articles;
  const usePagination = gridArticles.length > PAGINATION_THRESHOLD || totalPages > 1;

  const tabs: { id: Tab; label: string }[] = [
    { id: "ultimas", label: "Últimas Notícias" },
    { id: "semanais", label: "Destaques da Semana" },
    { id: "mensais", label: "Destaques do Mês" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="relative inline-block">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary md:text-[64px] md:leading-none">
            Notícias
          </h1>
          <div className="absolute -bottom-1 left-0 h-1 w-16 bg-secondary" />
        </div>
        <p className="mt-3 font-body-lg text-[17px] text-on-surface-variant">
          Fique por dentro de tudo que acontece no Sport Club Corinthians Paulista.
        </p>
      </motion.div>

      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-on-surface-variant font-medium">Ordenar por:</span>
        <SortFilter sort={currentSort} />
      </div>

      {loading && (
        <div className="mb-4 flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && <EditorialGrid articles={editorialForTab} />}

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-outline-variant">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`whitespace-nowrap px-4 py-3 font-label-sm text-label-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
