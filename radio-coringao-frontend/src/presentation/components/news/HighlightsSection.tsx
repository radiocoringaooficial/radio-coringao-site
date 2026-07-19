"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";

interface HighlightsProps {
  monthHighlights: NewsArticle[];
  weekHighlights: NewsArticle[];
}

function HighlightCard({ article, large = false }: { article: NewsArticle; large?: boolean | string }) {
  const sizeClasses = large === "xl"
    ? "h-[350px] sm:h-[400px]"
    : large === "lg"
    ? "h-[280px] sm:h-[320px]"
    : large === "md" || large === true
    ? "h-[260px]"
    : "h-[180px] min-w-[240px]";

  const textClasses = large === "xl"
    ? "text-[18px] sm:text-[20px]"
    : large === "lg"
    ? "text-[16px] sm:text-[18px]"
    : large === "md" || large === true
    ? "text-[16px]"
    : "line-clamp-2 text-[14px]";

  const paddingClasses = large === "xl"
    ? "p-5 sm:p-6"
    : large === "lg"
    ? "p-4 sm:p-5"
    : large
    ? "p-4"
    : "p-3";

  return (
    <a
      href={`/noticias/${article.slug}`}
      className={`group relative block overflow-hidden rounded-sm ${sizeClasses}`}
    >
      <img
        src={article.imageUrl || undefined}
        alt={article.imageAlt || article.title}
        className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className={`absolute bottom-0 left-0 w-full ${paddingClasses}`}>
        <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
          {article.category}
        </span>
        <h3 className={`font-headline-md font-bold text-white ${textClasses}`}>
          {article.title}
        </h3>
      </div>
    </a>
  );
}

const MAX_ARTICLES = 10;

function HighlightCarousel({ title, articles, autoPlayInterval = 0, viewMoreLink }: { title: string; articles: NewsArticle[]; autoPlayInterval?: number; viewMoreLink: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayArticles = articles.slice(0, MAX_ARTICLES);
  const useCarousel = displayArticles.length > 4;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const max = el.scrollWidth - el.offsetWidth;
    if (el.scrollLeft >= max) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: el.offsetWidth * 0.7, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!useCarousel || autoPlayInterval <= 0) return;
    intervalRef.current = setInterval(autoScroll, autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlayInterval, useCarousel, autoScroll]);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-secondary" />
          <h2 className="font-headline-md text-headline-md text-primary">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {useCarousel && (
            <div className="flex gap-1.5">
              <button
                onClick={() => scroll("left")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant bg-surface transition-colors hover:bg-surface-container"
              >
                <ChevronLeft size={16} className="text-on-surface" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant bg-surface transition-colors hover:bg-surface-container"
              >
                <ChevronRight size={16} className="text-on-surface" />
              </button>
            </div>
          )}
          <Link
            href={viewMoreLink}
            className="font-label-sm text-label-sm font-bold text-secondary transition-colors hover:text-primary"
          >
            Ver mais →
          </Link>
        </div>
      </div>
      {useCarousel ? (
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-[5px] overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {displayArticles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="snap-start"
            >
              <HighlightCard article={article} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-[5px] ${
          displayArticles.length === 1 ? "" :
          displayArticles.length === 2 ? "sm:grid-cols-2" :
          displayArticles.length === 3 ? "sm:grid-cols-3" :
          "sm:grid-cols-2 lg:grid-cols-4"
        }`}>
          {displayArticles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <HighlightCard article={article} large={
                displayArticles.length <= 2 ? "xl" : displayArticles.length === 3 ? "lg" : "md"
              } />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HighlightsSection({ monthHighlights, weekHighlights }: HighlightsProps) {
  return (
    <section className="mt-10 flex flex-col gap-8">
      <HighlightCarousel
        title="Destaques da Semana"
        articles={weekHighlights}
        autoPlayInterval={10000}
        viewMoreLink="/noticias"
      />
      <HighlightCarousel
        title="Destaques do Mês"
        articles={monthHighlights}
        autoPlayInterval={20000}
        viewMoreLink="/noticias"
      />
    </section>
  );
}
