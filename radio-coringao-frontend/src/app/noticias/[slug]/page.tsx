import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/application/services/container";
import { ArticleContent } from "@/presentation/components/news/ArticleContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiocoringao.com.br";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await container.getArticlePageData.execute(slug);
  if (!data) return { title: "Notícia não encontrada" };

  const article = data.article;
  const articleUrl = `${SITE_URL}/noticias/${slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    keywords: [article.category, "Corinthians", "notícias", "futebol"],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      siteName: "Rádio Coringão",
      images: [
        {
          url: article.imageUrl || `${SITE_URL}/logo-seo.png`,
          width: 1200,
          height: 630,
          alt: article.imageAlt || article.title,
        },
      ],
      locale: "pt_BR",
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author || article.authorNameSnapshot || 'Autor removido'],
      tags: [article.category],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl || `${SITE_URL}/logo-seo.png`],
    },
    alternates: {
      canonical: articleUrl,
    },
  };
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params;
  const data = await container.getArticlePageData.execute(slug);
  if (!data) notFound();

  const article = data.article;
  const articleUrl = `${SITE_URL}/noticias/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl || `${SITE_URL}/logo-seo.png`,
    url: articleUrl,
    datePublished: article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Rádio Coringão",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-seo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: article.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleContent article={article} topStories={data.topStories} nextMatch={data.nextMatch} slug={slug} />
    </>
  );
}
