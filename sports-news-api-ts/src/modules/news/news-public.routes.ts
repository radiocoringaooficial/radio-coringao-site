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

  // GET /news/highlights/week — destaques da semana (mais lidos por IP único)
  app.get('/noticias/highlights/week', async (_request, reply) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const includeArgs = {
      author: { select: { id: true, name: true, avatar: true, role: true, position: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    } as const;

    // Busca artigos com mais leitores únicos (via article_views)
    const topByViews = await prisma.$queryRaw<{ id: string; uniqueReaders: bigint }[]>`
      SELECT av."articleId" as id, COUNT(DISTINCT av."ipHash")::int as "uniqueReaders"
      FROM article_views av
      INNER JOIN articles a ON a.id = av."articleId"
      WHERE a.status = 'PUBLISHED'
        AND a."publishedAt" >= ${weekAgo}
        AND av."viewBucket" >= ${weekAgo}
      GROUP BY av."articleId"
      ORDER BY "uniqueReaders" DESC
      LIMIT 10
    `;

    let articles: any[] = [];

    if (topByViews.length >= 3) {
      // Tem views suficientes — usa a ordenação por leitores únicos
      const ids = topByViews.map((r) => r.id);
      const found = await prisma.article.findMany({
        where: { id: { in: ids } },
        include: includeArgs,
      });
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      articles = found.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    } else {
      // Poucas ou nenhuma view — seleciona aleatoriamente
      articles = await prisma.$queryRaw<any[]>`
        SELECT a.*
        FROM articles a
        WHERE a.status = 'PUBLISHED'
          AND a."publishedAt" >= ${weekAgo}
        ORDER BY RANDOM()
        LIMIT 10
      `;
      // Busca os includes separadamente para artigos aleatórios
      if (articles.length > 0) {
        const randomIds = articles.map((a: any) => a.id);
        const enriched = await prisma.article.findMany({
          where: { id: { in: randomIds } },
          include: includeArgs,
        });
        const enrichMap = new Map(enriched.map((e) => [e.id, e]));
        articles = articles.map((a: any) => enrichMap.get(a.id) || a);
      }
    }

    return reply.send(articles);
  });

  // GET /news/highlights/month — destaques do mês (mais lidos por IP único)
  app.get('/noticias/highlights/month', async (_request, reply) => {
    const monthAgo = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const includeArgs = {
      author: { select: { id: true, name: true, avatar: true, role: true, position: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    } as const;

    const topByViews = await prisma.$queryRaw<{ id: string; uniqueReaders: bigint }[]>`
      SELECT av."articleId" as id, COUNT(DISTINCT av."ipHash")::int as "uniqueReaders"
      FROM article_views av
      INNER JOIN articles a ON a.id = av."articleId"
      WHERE a.status = 'PUBLISHED'
        AND a."publishedAt" >= ${monthAgo}
        AND av."viewBucket" >= ${monthAgo}
      GROUP BY av."articleId"
      ORDER BY "uniqueReaders" DESC
      LIMIT 10
    `;

    let articles: any[] = [];

    if (topByViews.length >= 3) {
      const ids = topByViews.map((r) => r.id);
      const found = await prisma.article.findMany({
        where: { id: { in: ids } },
        include: includeArgs,
      });
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      articles = found.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    } else {
      articles = await prisma.$queryRaw<any[]>`
        SELECT a.*
        FROM articles a
        WHERE a.status = 'PUBLISHED'
          AND a."publishedAt" >= ${monthAgo}
        ORDER BY RANDOM()
        LIMIT 10
      `;
      if (articles.length > 0) {
        const randomIds = articles.map((a: any) => a.id);
        const enriched = await prisma.article.findMany({
          where: { id: { in: randomIds } },
          include: includeArgs,
        });
        const enrichMap = new Map(enriched.map((e) => [e.id, e]));
        articles = articles.map((a: any) => enrichMap.get(a.id) || a);
      }
    }

    return reply.send(articles);
  });

  // GET /news/search?q=... — busca por texto
  app.get('/noticias/search', articlePublicController.search);

  // GET /news — listagem com filtros (?category, ?page, ?limit)
  app.get('/noticias', articlePublicController.list);

  // GET /news/:slug — artigo individual (deve ficar por último)
  app.get('/noticias/:slug', articlePublicController.getBySlug);
}
