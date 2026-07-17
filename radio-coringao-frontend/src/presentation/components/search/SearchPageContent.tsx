"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { NewsArticle } from "@/domain/entities";
import { NewsCard } from "@/presentation/components/ui/NewsCard";
import { Pagination } from "@/presentation/components/ui/Pagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface SearchPageContentProps {
  query: string;
}

const ITEMS_PER_PAGE = 8;

const categories = ["Todos", "Mercado", "Futebol", "Base", "Política", "Destaques", "Torcida", "Jogos", "Feminino", "Basquete", "Futsal"];

type SortOption = "recente" | "data" | "az";

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "recente", label: "Mais recente" },
  { id: "data", label: "Por data" },
  { id: "az", label: "A-Z" },
];

function mapApiArticle(a: any): NewsArticle {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt || "",
    content: a.content || "",
    category: a.category?.name || "",
    categorySlug: a.category?.slug || "",
    author: a.author?.name || a.authorNameSnapshot || "",
    authorAvatar: a.author?.avatar || a.authorAvatarSnapshot || "",
    imageUrl: a.coverImage || "",
    imageAlt: a.coverImageAlt || a.title,
    publishedAt: a.publishedAt || "",
    isBreaking: a.isBreaking || false,
    isLive: false,
    viewCount: a.viewCount || 0,
  };
}

export function SearchPageContent({ query }: SearchPageContentProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("recente");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useCallback(async (q: string, page: number) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const sortMap: Record<SortOption, string> = { recente: "recent", data: "recent", az: "recent" };
      const url = `${API_URL}/noticias/search?q=${encodeURIComponent(q)}&page=1&limit=100&sort=${sortMap[sortBy] || "recent"}`;
      const res = await fetch(url);
      if (!res.ok) { setResults([]); setTotal(0); return; }
      const json = await res.json();
      const data = Array.isArray(json) ? json : json?.data || [];
      let sorted = data.map(mapApiArticle);

      // Client-side sorting for options the API doesn't support
      if (sortBy === "data") {
        sorted.sort((a: any, b: any) => new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime());
      } else if (sortBy === "az") {
        sorted.sort((a: any, b: any) => a.title.localeCompare(b.title, "pt-BR"));
      }

      setResults(sorted);
      setTotal(sorted.length);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(searchQuery, currentPage), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, fetchResults]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, activeCategory]);

  const filteredArticles = activeCategory === "Todos"
    ? results
    : results.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase());

  const filteredTotalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasResults = filteredArticles.length > 0;
  const hasQuery = searchQuery.length > 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    window.history.pushState({}, "", `/busca?q=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      {/* Search header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <form onSubmit={handleSearch} className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar notícias..."
              className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 font-label-sm text-label-sm font-bold text-on-primary transition-colors hover:bg-secondary"
          >
            Buscar
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant hover:text-primary"
        >
          <SlidersHorizontal size={14} />
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </motion.div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 overflow-hidden"
        >
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <h3 className="mb-3 text-[12px] font-bold uppercase text-on-surface-variant">
              Filtrar por categoria
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <h3 className="mb-2 mt-3 text-[12px] font-bold uppercase text-on-surface-variant">
              Ordenar por
            </h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setCurrentPage(1); }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    sortBy === opt.id
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && hasQuery && !hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-16"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
            <Search size={32} className="text-on-surface-variant" />
          </div>
          <h2 className="mb-2 font-headline-md text-headline-md text-primary">
            Nenhum resultado encontrado
          </h2>
          <p className="mb-6 text-center text-[14px] text-on-surface-variant">
            Não encontramos nenhuma notícia para &ldquo;{searchQuery}&rdquo;.
            <br />
            Tente usar outros termos ou verifique a ortografia.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-primary px-6 py-3 font-label-sm text-label-sm font-bold text-on-primary transition-colors hover:bg-secondary"
          >
            Voltar para o início
          </Link>
        </motion.div>
      )}

      {!loading && hasQuery && hasResults && (
        <>
          <p className="mb-6 text-[14px] text-on-surface-variant">
            <strong>{filteredArticles.length}</strong> resultado{filteredArticles.length !== 1 ? "s" : ""} encontrado{filteredArticles.length !== 1 ? "s" : ""} para &ldquo;{searchQuery}&rdquo;
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedArticles.map((article, i) => (
              <motion.div
                key={`${article.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <NewsCard article={article} />
              </motion.div>
            ))}
          </div>

          {filteredTotalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={filteredTotalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {!hasQuery && (
        <div className="flex flex-col items-center py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
            <Search size={32} className="text-on-surface-variant" />
          </div>
          <h2 className="mb-2 font-headline-md text-headline-md text-primary">
            O que você procura?
          </h2>
          <p className="text-center text-[14px] text-on-surface-variant">
            Digite algo no campo de pesquisa para encontrar notícias.
          </p>
        </div>
      )}
    </div>
  );
}
