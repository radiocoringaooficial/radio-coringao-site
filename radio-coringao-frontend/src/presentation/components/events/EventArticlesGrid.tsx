"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface EventArticlesGridProps {
  articles: any[];
}

export function EventArticlesGrid({ articles }: EventArticlesGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);
  const paginated = articles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paginated.map((article: any) => (
          <Link
            key={article.id}
            href={`/noticias/${article.slug}`}
            className="group overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary"
          >
            {article.coverImage && (
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-3">
              <h3 className="mb-1 line-clamp-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="line-clamp-2 text-[12px] text-on-surface-variant">
                  {article.excerpt}
                </p>
              )}
              {article.publishedAt && (
                <span className="mt-2 block text-[10px] text-on-surface-variant">
                  {new Date(article.publishedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-[11px] text-on-surface-variant">
            Página {currentPage} de {totalPages} ({articles.length} artigos)
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-surface-container-low disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                  p === currentPage ? "bg-primary text-white" : "hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-surface-container-low disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
