// src/modules/news/news-public.routes.ts
//
// Rotas públicas /api/news/* que o frontend consome.
// Delega para os use-cases existentes do módulo articles.
import type { FastifyInstance } from 'fastify';
import { articlePublicController } from '../../shared/container';
import { prisma } from '../../shared/database/prisma';

export async function newsPublicRoutes(app: FastifyInstance): Promise<void> {
  // GET /news/editorial — artigos em destaque (hero + laterais)
  // Posições fixas: order 1=Hero, 2=Lateral sup, 3=Lateral inf, 4=Abaixo grid, 5=Extra, 6=Sidebar
  app.get('/noticias/editorial', async (_request, reply) => {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { updatedAt: 'desc' }],
      take: 50,
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true, position: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    // Monta array de 12 slots fixos
    const slots: (typeof articles[number] | null)[] = [null, null, null, null, null, null, null, null, null, null, null, null];
    const unpositioned: typeof articles = [];

    for (const a of articles) {
      const pos = (a as any).order;
      if (pos >= 1 && pos <= 12 && slots[pos - 1] === null) {
        slots[pos - 1] = a;
      } else {
        unpositioned.push(a);
      }
    }

    // Preenche slots vazios com artigos sem posição
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] === null && unpositioned.length > 0) {
        const filler = unpositioned.shift()!;
        slots[i] = { ...filler, order: i + 1 };
      }
    }

    const result = slots.filter(Boolean) as typeof articles;
    return reply.send(result);
  });

  // GET /news/latest — últimas notícias publicadas
  app.get('/noticias/latest', articlePublicController.list);

  // GET /news/highlights/week — destaques da semana (publicados nos últimos 7 dias, ordenados por views totais)
  app.get('/noticias/highlights/week', async (_request, reply) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const includeArgs = {
      author: { select: { id: true, name: true, avatar: true, role: true, position: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    } as const;

    let articles: any[] = await prisma.article.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gte: weekAgo } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: includeArgs,
    });

    if (articles.length === 0) {
      articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        include: includeArgs,
      });
    }

    const articleIds = articles.map((a: any) => a.id);
    const viewCounts = articleIds.length ? await prisma.articleView.groupBy({
      by: ['articleId'],
      where: { articleId: { in: articleIds } },
      _count: { id: true },
    }) : [];
    const viewCountMap = new Map(viewCounts.map((r: any) => [r.articleId, r._count.id]));

    const result = articles
      .map((a: any) => ({ ...a, viewCount: viewCountMap.get(a.id) || 0 }));

    const articlesWithViews = result.filter((a: any) => a.viewCount > 0).length;
    if (articlesWithViews >= 3) {
      result.sort((a: any, b: any) => b.viewCount - a.viewCount || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      // Menos de 3 artigos com views reais — mantém aleatório
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    return reply.send(result.slice(0, 10));
  });

  // GET /news/highlights/month — destaques do mês (publicados nos últimos 30 dias, ordenados por views totais)
  app.get('/noticias/highlights/month', async (_request, reply) => {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const includeArgs = {
      author: { select: { id: true, name: true, avatar: true, role: true, position: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    } as const;

    let articles: any[] = await prisma.article.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gte: monthAgo } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: includeArgs,
    });

    if (articles.length === 0) {
      articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        include: includeArgs,
      });
    }

    const articleIds = articles.map((a: any) => a.id);
    const viewCounts = articleIds.length ? await prisma.articleView.groupBy({
      by: ['articleId'],
      where: { articleId: { in: articleIds } },
      _count: { id: true },
    }) : [];
    const viewCountMap = new Map(viewCounts.map((r: any) => [r.articleId, r._count.id]));

    const result = articles
      .map((a: any) => ({ ...a, viewCount: viewCountMap.get(a.id) || 0 }));

    const articlesWithViews = result.filter((a: any) => a.viewCount > 0).length;
    if (articlesWithViews >= 3) {
      result.sort((a: any, b: any) => b.viewCount - a.viewCount || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      // Menos de 3 artigos com views reais — mantém aleatório
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    return reply.send(result.slice(0, 10));
  });

  // GET /news/search?q=... — busca por texto
  app.get('/noticias/search', articlePublicController.search);

  // GET /news — listagem com filtros (?category, ?page, ?limit)
  app.get('/noticias', articlePublicController.list);

  // GET /news/:slug — artigo individual (deve ficar por último)
  app.get('/noticias/:slug', articlePublicController.getBySlug);
}
