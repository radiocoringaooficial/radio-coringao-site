"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { NewsArticle, NextMatch } from "@/domain/entities";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface ArticleContentProps {
  article: NewsArticle;
  topStories: NewsArticle[];
  nextMatch: NextMatch;
  slug: string;
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <div className="h-10 w-10 shrink-0 flex items-center justify-center overflow-hidden">
        <img src={logo} alt={name} className="h-10 w-10 object-contain" />
      </div>
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center">
      <span className="text-[11px] font-bold text-on-primary">{initials}</span>
    </div>
  );
}

function ArticleImage({ src, alt, credit }: { src: string; alt: string; credit: string }) {
  return (
    <figure className="my-6 sm:my-8">
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="mt-2 text-center text-[10px] italic text-on-surface-variant sm:text-[11px]">
        {credit}
      </p>
    </figure>
  );
}

export function ArticleContent({ article, topStories, nextMatch, slug }: ArticleContentProps) {
  const [weekHighlights, setWeekHighlights] = useState<NewsArticle[]>([]);

  // Registra visualização no servidor (IP real do visitante, não do SSR)
  useEffect(() => {
    fetch(`${API_URL.replace('/api', '')}/api/articles/view/${encodeURIComponent(slug)}`).catch(() => {});
  }, [slug]);

  useEffect(() => {
    fetch(`${API_URL}/noticias/highlights/week`)
      .then(r => r.ok ? r.json() : [])
      .then(json => {
        const data = Array.isArray(json) ? json : json?.data || [];
        setWeekHighlights(data.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt || "",
          category: a.category?.name || "",
          categorySlug: a.category?.slug || "",
          author: a.author?.name || a.authorNameSnapshot || "",
          authorAvatar: a.author?.avatar || "",
          authorPosition: a.authorCargo || a.author?.position || "",
          imageUrl: a.coverImage || "",
          imageAlt: a.coverImageAlt || a.title,
          publishedAt: a.publishedAt || "",
          isBreaking: a.isBreaking || false,
          isLive: false,
          viewCount: a.viewCount || 0,
        })));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-bold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Voltar para Notícias
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-full lg:max-w-[700px]"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-bold uppercase text-on-surface">
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
              <Clock size={12} />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }) : ''}
            </span>
          </div>

          <h1 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile font-bold leading-tight text-primary md:text-headline-lg">
            {article.title}
          </h1>

          <p className="mb-6 text-[18px] leading-relaxed text-on-surface-variant">
            {article.excerpt}
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-outline-variant py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container">
                {article.authorAvatar ? (
                  <img src={article.authorAvatar} alt={article.author} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary">
                    <span className="text-[12px] font-bold text-on-primary">
                      {article.author.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <span className="block text-[13px] font-bold text-primary">{article.author}</span>
                <span className="text-[11px] text-on-surface-variant">{article.authorPosition || 'Editor-Chefe'}</span>
              </div>
            </div>
          </div>

          <ArticleImage src={article.imageUrl} alt={article.imageAlt} credit="Foto: Rádio Coringão / Reprodução" />

          <div className="article-content mb-8" dangerouslySetInnerHTML={{ __html: article.content || "" }} />
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-5"
        >
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Próximo Jogo
              </span>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                {nextMatch.competition}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="flex flex-col items-center gap-1">
                <TeamLogo name={nextMatch.homeTeam} logo={nextMatch.homeTeamLogo} />
                <span className="text-[11px] font-bold text-primary">{nextMatch.homeTeam}</span>
              </div>
              <span className="text-lg font-bold text-outline">X</span>
              <div className="flex flex-col items-center gap-1">
                <TeamLogo name={nextMatch.awayTeam} logo={nextMatch.awayTeamLogo} />
                <span className="text-[11px] font-bold text-primary">{nextMatch.awayTeam}</span>
              </div>
            </div>
            <p className="text-center text-[11px] text-on-surface-variant">
              {nextMatch.date}, {nextMatch.time}
            </p>
            <p className="text-center text-[11px] text-on-surface-variant">
              {nextMatch.venue}
            </p>
            <Link href="https://www.fieltorcedor.com.br/" target="_blank" rel="noopener noreferrer" className="mt-3 block w-full rounded-md bg-primary py-2.5 text-center text-[11px] font-bold text-on-primary transition-colors hover:bg-secondary">
              Ingressos
            </Link>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <h3 className="mb-3 font-headline-md text-headline-md text-primary">Mais Lidas</h3>
            <div className="flex flex-col gap-3">
              {topStories.slice(0, 5).map((story, i) => (
                <Link key={story.id} href={`/noticias/${story.slug}`} className="group flex items-start gap-3 border-b border-outline-variant pb-3 last:border-b-0 last:pb-0">
                  <span className="shrink-0 text-[18px] font-bold text-outline">{i + 1}</span>
                  <div className="flex-1">
                    <h4 className="line-clamp-2 text-[13px] font-bold text-primary transition-colors group-hover:text-secondary">{story.title}</h4>
                    <span className="mt-1 block text-[11px] text-on-surface-variant">{story.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>

      {/* Destaques da Semana */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-secondary" />
            <h2 className="font-headline-md text-headline-md text-primary">
              Destaques da Semana
            </h2>
          </div>
          <Link
            href="/noticias?tab=semanais"
            className="font-label-sm text-label-sm font-bold text-secondary transition-colors hover:text-primary"
          >
            Ver mais →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-[5px] sm:grid-cols-2 lg:grid-cols-4">
          {weekHighlights.slice(0, 4).map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={`/noticias/${article.slug}`}
                className="group relative block min-h-[180px] overflow-hidden rounded-sm"
              >
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-3">
                  <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
                    {article.category}
                  </span>
                  <h3 className="line-clamp-2 font-headline-md text-[14px] font-bold text-white">
                    {article.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
