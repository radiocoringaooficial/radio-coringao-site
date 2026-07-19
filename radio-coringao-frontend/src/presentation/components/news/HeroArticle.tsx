"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { NewsArticle } from "@/domain/entities";
import { CategoryTag } from "@/presentation/components/ui/CategoryTag";
import { ImageWithFallback } from "@/presentation/components/ui/ImageWithFallback";
import { formatRelativeDate } from "@/shared/utils/date";

interface HeroArticleProps {
  article: NewsArticle;
}

export function HeroArticle({ article }: HeroArticleProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group cursor-pointer"
    >
      <Link href={`/noticias/${article.slug}`}>
        <div className="relative mb-stack-sm aspect-video w-full overflow-hidden rounded-sm bg-surface-variant">
          <ImageWithFallback
            src={article.imageUrl}
            alt={article.imageAlt}
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryTag label={article.category} />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {formatRelativeDate(article.publishedAt)}
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary transition-colors duration-200 group-hover:text-secondary md:font-headline-lg md:text-headline-lg">
          {article.title}
        </h1>
        <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-3">
          {article.authorAvatar && (
            <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-variant">
              <ImageWithFallback
                src={article.authorAvatar}
                alt={article.author}
                className="block h-full w-full object-cover"
              />
            </div>
          )}
          <span className="font-label-sm text-label-sm text-primary">
            Por {article.author}
          </span>
        </div>
      </Link>
    </motion.article>
  );
}