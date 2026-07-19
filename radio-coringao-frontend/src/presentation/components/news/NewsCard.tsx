import Link from "next/link";
import { NewsArticle } from "@/domain/entities";
import { CategoryTag } from "@/presentation/components/ui/CategoryTag";
import { formatRelativeDate } from "@/shared/utils/date";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "horizontal" | "vertical";
}

export function NewsCard({ article, variant = "horizontal" }: NewsCardProps) {
  if (variant === "vertical") {
    return (
      <Link href={`/noticias/${article.slug}`} className="group block">
        <div className="mb-stack-sm aspect-video w-full overflow-hidden rounded-sm bg-surface-variant">
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="mb-2 flex items-center gap-2">
          <CategoryTag label={article.category} />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {formatRelativeDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary transition-colors duration-200 group-hover:text-secondary">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 font-body-md text-body-md text-on-surface-variant">
            {article.excerpt}
          </p>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="group flex items-start gap-4 border-t border-surface-variant py-stack-lg first:border-t-0"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-surface-variant">
        <img
          src={article.imageUrl}
          alt={article.imageAlt}
          className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex-grow">
        <div className="mb-1 flex items-center gap-2">
          <CategoryTag label={article.category} />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {formatRelativeDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-body-md text-body-md font-bold text-primary transition-colors duration-200 group-hover:text-secondary">
          {article.title}
        </h3>
        {article.author && (
          <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
            Por {article.author}
          </span>
        )}
      </div>
    </Link>
  );
}