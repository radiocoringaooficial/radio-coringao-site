"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";

interface EditorialGridProps {
  heroArticle: NewsArticle;
  sideArticles: NewsArticle[];
}

export function EditorialGrid({ heroArticle, sideArticles }: EditorialGridProps) {
  if (!heroArticle) return null;
  const rightArticles = sideArticles.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 gap-[5px] lg:grid-cols-[55%_45%]"
      style={{ gridTemplateRows: rightArticles.length === 2 ? "auto auto" : "auto" }}
    >
      {/* Hero card - left */}
      <Link
        href={`/noticias/${heroArticle.slug}`}
        className="group relative block aspect-[4/3] min-h-[320px] overflow-hidden rounded-sm lg:row-span-2 lg:aspect-auto lg:min-h-[500px]"
      >
        {heroArticle.imageUrl ? (
          <img
            src={heroArticle.imageUrl}
            alt={heroArticle.imageAlt}
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
        ) : (
          <div className="h-full w-full bg-surface-container" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6">
          <span className="mb-2 inline-block bg-white/20 px-2 py-1 font-label-sm text-label-sm text-white backdrop-blur-sm">
            {heroArticle.category}
          </span>
          <h2 className="font-headline-md text-[17px] leading-snug font-bold text-white md:text-[20px]">
            {heroArticle.title}
          </h2>
          {heroArticle.excerpt && (
            <p className="mt-2 text-[13px] leading-snug text-white/80">
              {heroArticle.excerpt}
            </p>
          )}
        </div>
      </Link>

      {/* Right side cards */}
      {rightArticles.map((article) => (
        <Link
          key={article.id}
          href={`/noticias/${article.slug}`}
          className="group relative block min-h-[200px] overflow-hidden rounded-sm"
        >
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-surface-container" />
          )}
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
