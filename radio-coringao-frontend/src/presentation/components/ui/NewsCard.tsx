"use client";

import Link from "next/link";
import { formatRelativeDate } from "@/shared/utils/date";

interface NewsCardProps {
  article: {
    title: string;
    excerpt: string;
    category: string;
    author: string;
    imageUrl: string;
    imageAlt: string;
    publishedAt: string;
    slug: string;
  };
  variant?: "default" | "horizontal";
}

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  if (variant === "horizontal") {
    return (
      <Link
        href={`/noticias/${article.slug}`}
        className="group flex gap-3 overflow-hidden rounded-lg bg-surface-container-lowest transition-colors hover:bg-surface-container-low sm:gap-4"
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden sm:h-28 sm:w-28">
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            loading="lazy"
            className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center py-2 pr-2 sm:py-3 sm:pr-3">
          <span className="mb-1 inline-block w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
            {article.category}
          </span>
          <h3 className="mb-1 line-clamp-2 text-[13px] font-bold leading-tight text-primary sm:text-[14px]">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] text-on-surface-variant sm:text-[11px]">{article.author}</span>
            <span className="text-[10px] text-on-surface-variant sm:text-[11px]">{formatRelativeDate(article.publishedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest transition-colors hover:bg-surface-container-low"
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.imageAlt}
          loading="lazy"
          className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="mb-2 inline-block w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
          {article.category}
        </span>
        <h3 className="mb-2 line-clamp-2 text-[14px] font-bold leading-tight text-primary sm:text-[15px]">
          {article.title}
        </h3>
        <p className="mb-3 line-clamp-2 flex-1 text-[12px] leading-relaxed text-on-surface-variant sm:text-[13px]">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between border-t border-surface-variant pt-2 sm:pt-3">
          <span className="text-[10px] text-on-surface-variant sm:text-[11px]">{article.author}</span>
          <span className="text-[10px] text-on-surface-variant sm:text-[11px]">{formatRelativeDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
