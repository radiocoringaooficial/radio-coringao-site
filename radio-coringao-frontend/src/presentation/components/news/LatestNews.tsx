"use client";

import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";
import { EditorialGrid } from "@/presentation/components/news/EditorialGrid";

interface LatestNewsProps {
  articles: NewsArticle[];
}

export function LatestNews({ articles }: LatestNewsProps) {
  const heroArticle = articles[0];
  const remainingArticles = articles.slice(1);

  if (!heroArticle) return null;

  return (
    <section className="mt-4">
      <div className="mb-stack-lg flex items-center gap-2">
        <div className="h-6 w-1 bg-secondary" />
        <h2 className="font-headline-md text-headline-md text-primary">
          Últimas Notícias
        </h2>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <EditorialGrid heroArticle={heroArticle} sideArticles={remainingArticles.slice(0, 2)} />
      </motion.div>
      {remainingArticles.length > 2 && (
        <div className="mt-[5px] grid grid-cols-1 gap-[5px] sm:grid-cols-2 lg:grid-cols-3">
          {remainingArticles.slice(2, 8).map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <a
                href={`/noticias/${article.slug}`}
                className="group relative block min-h-[200px] overflow-hidden rounded-sm"
              >
                <img
                  src={article.imageUrl || undefined}
                  alt={article.imageAlt || article.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-3">
                  <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
                    {article.category}
                  </span>
                  <h3 className="font-headline-md text-[14px] font-bold text-white">
                    {article.title}
                  </h3>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
