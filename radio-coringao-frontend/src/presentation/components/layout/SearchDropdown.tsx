"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NewsArticle } from "@/domain/entities";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface SearchDropdownProps {
  query: string;
  visible: boolean;
  onClose: () => void;
}

export function SearchDropdown({ query, visible, onClose }: SearchDropdownProps) {
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!visible || query.length < 1) {
      setResults([]);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`${API_URL}/noticias/search?q=${encodeURIComponent(query)}&limit=5`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => {
          const data = Array.isArray(json) ? json : json?.data || [];
          setResults(
            data.map((a: any) => ({
              id: a.id,
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt || "",
              category: a.category?.name || "",
              categorySlug: a.category?.slug || "",
              author: a.author?.name || a.authorNameSnapshot || "",
              authorAvatar: a.author?.avatar || "",
              imageUrl: a.coverImage || "",
              imageAlt: a.coverImageAlt || a.title,
              publishedAt: a.publishedAt || "",
              isBreaking: a.isBreaking || false,
              isLive: false,
              viewCount: a.viewCount || 0,
            }))
          );
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query, visible]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!visible || query.length < 1 || results.length === 0) return null;

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="absolute -left-20 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-outline-variant bg-surface shadow-lg sm:w-72"
    >
      <div className="max-h-[280px] overflow-y-auto">
        {results.map((article, index) => (
          <Link
            key={`${article.id}-${index}`}
            href={`/noticias/${article.slug}`}
            onClick={onClose}
            className="flex items-center gap-2.5 border-b border-outline-variant/30 p-2.5 transition-colors hover:bg-surface-container-low last:border-b-0"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm">
              <img
                src={article.imageUrl}
                alt={article.imageAlt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-[12px] font-bold text-primary">
                {article.title}
              </h4>
              <span className="text-[10px] text-on-surface-variant">
                {article.category}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
