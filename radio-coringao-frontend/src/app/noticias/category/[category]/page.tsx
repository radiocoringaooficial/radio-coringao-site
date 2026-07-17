import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsCategoryContent } from "@/presentation/components/news/NewsCategoryContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface Props {
  params: Promise<{ category: string }>;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

async function fetchCategoryInfo(slug: string): Promise<CategoryInfo | null> {
  try {
    const res = await fetch(`${API_URL}/categorias`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const categories = Array.isArray(data) ? data : data?.data || [];
    // Search top-level categories
    const found = categories.find((c: CategoryInfo) => c.slug === slug);
    if (found) return found;
    // Search children (subcategories)
    for (const parent of categories) {
      if (parent.children) {
        const childFound = parent.children.find((c: any) => c.slug === slug);
        if (childFound) return childFound;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCategoryArticles(slug: string): Promise<{ articles: any[]; total: number; totalPages: number }> {
  try {
    const res = await fetch(`${API_URL}/noticias?category=${slug}&page=1&limit=20`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { articles: [], total: 0, totalPages: 0 };
    const data = await res.json();
    const articles = Array.isArray(data) ? data : data?.data || [];
    return {
      articles,
      total: data?.total || 0,
      totalPages: data?.totalPages || Math.ceil((data?.total || 0) / 20) || 1,
    };
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = await fetchCategoryInfo(category);
  if (!categoryInfo) return { title: "Categoria não encontrada" };
  return {
    title: `${categoryInfo.name} - Rádio Coringão`,
    description: categoryInfo.description || `Notícias de ${categoryInfo.name}`,
  };
}

export default async function NewsCategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryInfo = await fetchCategoryInfo(category);
  if (!categoryInfo) notFound();

  const { articles, total, totalPages } = await fetchCategoryArticles(category);

  const mapArticle = (article: any) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content || "",
    category: article.category?.name || categoryInfo!.name,
    categorySlug: article.category?.slug || categoryInfo!.slug,
    author: article.author?.name || article.authorNameSnapshot || "",
    authorAvatar: article.author?.avatar || "",
    imageUrl: article.coverImage || "",
    imageAlt: article.coverImageAlt || article.title,
    publishedAt: article.publishedAt || "",
    isBreaking: article.isBreaking || false,
    isLive: false,
    viewCount: article.viewCount || 0,
  });

  return (
    <NewsCategoryContent
      category={{
        name: categoryInfo.name,
        slug: categoryInfo.slug,
        description: categoryInfo.description || "",
      }}
      initialArticles={articles.map(mapArticle)}
      initialTotal={total}
      initialTotalPages={totalPages}
    />
  );
}
