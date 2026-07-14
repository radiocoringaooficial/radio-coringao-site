import type { VercelRequest, VercelResponse } from '@vercel/node';

let prisma: any = null;

async function getPrisma() {
  if (prisma) return prisma;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  return prisma;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '/';
  const method = req.method || 'GET';

  try {
    let db;
    try {
      db = await getPrisma();
    } catch (err: any) {
      console.error('Prisma connection error:', err?.message, err?.stack);
      return res.status(500).json({ error: 'Database connection failed', message: err?.message });
    }

    // Health
    if (url === '/api/health') {
      const count = await db.article.count();
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), articleCount: count });
    }

    // Notícias
    if (url === '/api/noticias' || url.startsWith('/api/noticias?')) {
      const urlObj = new URL(url, 'http://localhost');
      const categoryParam = urlObj.searchParams.get('category');
      const limitParam = parseInt(urlObj.searchParams.get('limit') || '20');
      const where: any = { status: 'PUBLISHED' };
      if (categoryParam) where.category = { slug: categoryParam };
      const articles = await db.article.findMany({
        where,
        take: limitParam,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
      });
      return res.status(200).json(articles);
    }

    // Editoriais
    if (url === '/api/noticias/editorial' || url.startsWith('/api/noticias/editorial?')) {
      const articles = await db.article.findMany({
        where: { status: 'PUBLISHED', isFeatured: true, order: { gt: 0 } },
        orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
        take: 50,
        include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
      });

      // Monta array de 12 slots fixos — cada artigo vai pro slot[order-1]
      const slots: (typeof articles[number] | null)[] = Array(12).fill(null);
      const unpositioned: typeof articles = [];

      for (const a of articles) {
        const pos = (a as any).order ?? 0;
        if (pos >= 1 && pos <= 12 && slots[pos - 1] === null) {
          slots[pos - 1] = a;
        } else {
          unpositioned.push(a);
        }
      }

      // Preenche slots vazios com artigos sem posição
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null && unpositioned.length > 0) {
          slots[i] = unpositioned.shift()!;
        }
      }

      return res.status(200).json(slots);
    }

    // Destaques da semana (must be BEFORE slug match)
    if (url === '/api/noticias/highlights/week' || url.startsWith('/api/noticias/highlights/week?')) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekViewCounts = await db.articleView.groupBy({
        by: ['articleId'],
        where: { viewedAt: { gte: weekAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });
      const weekIds = weekViewCounts.map((r: any) => r.articleId);
      const weekArticles = weekIds.length
        ? await db.article.findMany({
            where: { id: { in: weekIds }, status: 'PUBLISHED' },
            include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
          })
        : [];
      const weekCountMap = new Map(weekViewCounts.map((r: any) => [r.articleId, r._count.id]));
      const weekResult = weekArticles
        .map((a: any) => ({ ...a, viewCount: weekCountMap.get(a.id) || 0 }))
        .sort((a: any, b: any) => b.viewCount - a.viewCount);
      return res.status(200).json(weekResult);
    }

    // Destaques do mês
    if (url === '/api/noticias/highlights/month' || url.startsWith('/api/noticias/highlights/month?')) {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const monthViewCounts = await db.articleView.groupBy({
        by: ['articleId'],
        where: { viewedAt: { gte: monthAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });
      const monthIds = monthViewCounts.map((r: any) => r.articleId);
      const monthArticles = monthIds.length
        ? await db.article.findMany({
            where: { id: { in: monthIds }, status: 'PUBLISHED' },
            include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
          })
        : [];
      const monthCountMap = new Map(monthViewCounts.map((r: any) => [r.articleId, r._count.id]));
      const monthResult = monthArticles
        .map((a: any) => ({ ...a, viewCount: monthCountMap.get(a.id) || 0 }))
        .sort((a: any, b: any) => b.viewCount - a.viewCount);
      return res.status(200).json(monthResult);
    }

    // Últimas notícias
    if (url === '/api/noticias/latest' || url.startsWith('/api/noticias/latest?')) {
      const articles = await db.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
      });
      return res.status(200).json(articles);
    }

    // Notícias por slug (AFTER specific routes like /latest, /highlights, /search)
    const slugMatch = url.match(/^\/api\/noticias\/([^?/]+)/);
    if (slugMatch && !['search', 'latest', 'editorial', 'highlights'].includes(slugMatch[1])) {
      const article = await db.article.findFirst({
        where: { slug: slugMatch[1], status: 'PUBLISHED' },
        include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
      });
      if (!article) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(article);
    }

    // Busca
    if (url.startsWith('/api/noticias/search')) {
      const urlObj = new URL(url, 'http://localhost');
      const q = urlObj.searchParams.get('q') || '';
      const articles = await db.article.findMany({
        where: { status: 'PUBLISHED', OR: [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }] },
        take: 20,
        include: { category: true, author: { select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, position: true } } },
      });
      return res.status(200).json(articles);
    }

    // Menu (nested: parents with children array)
    if (url === '/api/menu' || url.startsWith('/api/menu?')) {
      const allItems = await db.menuItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      const parents = allItems.filter((i: any) => !i.parentId);
      const childrenMap = new Map<string, any[]>();
      for (const item of allItems) {
        if (item.parentId) {
          const list = childrenMap.get(item.parentId) || [];
          list.push({ label: item.label, url: item.url });
          childrenMap.set(item.parentId, list);
        }
      }
      const result = parents.map((p: any) => ({ ...p, children: childrenMap.get(p.id) || [] }));
      return res.status(200).json(result);
    }

    // Categorias
    if (url === '/api/categorias' || url.startsWith('/api/categorias?')) {
      const categories = await db.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      return res.status(200).json(categories);
    }

    // Banners
    if (url === '/api/banners' || url.startsWith('/api/banners?')) {
      const banners = await db.banner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      return res.status(200).json(banners);
    }

    // Menu
    if (url === '/api/navbar' || url.startsWith('/api/navbar?')) {
      const allItems = await db.menuItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      const parents = allItems.filter((i: any) => !i.parentId);
      const childrenMap = new Map<string, any[]>();
      for (const item of allItems) {
        if (item.parentId) {
          const list = childrenMap.get(item.parentId) || [];
          list.push({ label: item.label, url: item.url });
          childrenMap.set(item.parentId, list);
        }
      }
      const result = parents.map((p: any) => ({ ...p, children: childrenMap.get(p.id) || [] }));
      return res.status(200).json(result);
    }

    // Eventos
    if (url === '/api/eventos' || url.startsWith('/api/eventos?')) {
      const events = await db.event.findMany({ where: { isActive: true }, orderBy: { startsAt: 'desc' } });
      return res.status(200).json(events);
    }

    // Patrocinadores
    if (url === '/api/patrocinadores' || url.startsWith('/api/patrocinadores?')) {
      const sponsors = await db.sponsor.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      return res.status(200).json(sponsors);
    }

    // Footer links
    if (url === '/api/links-rodape' || url.startsWith('/api/links-rodape?')) {
      const links = await db.footerLink.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      return res.status(200).json(links);
    }

    // Configurações
    if (url === '/api/configuracoes' || url.startsWith('/api/configuracoes?')) {
      const settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
      return res.status(200).json(settings || {});
    }

    // Tags
    if (url === '/api/tags' || url.startsWith('/api/tags?')) {
      const tags = await db.tag.findMany();
      return res.status(200).json(tags);
    }

    // Columnists
    if (url === '/api/cronistas' || url.startsWith('/api/cronistas?')) {
      return res.status(200).json([]);
    }

    // Test
    if (url === '/api/test') {
      return res.status(200).json({ test: 'ok' });
    }

    // Register article view (by IP hash + day bucket)
    // Register article view via GET /api/articles/view/:slug
    const viewMatch = url.match(/^\/api\/articles\/view\/([^?]+)$/);
    if (viewMatch && method === 'GET') {
      const slug = viewMatch[1];
      const article = await db.article.findUnique({ where: { slug }, select: { id: true } });
      if (!article) return res.status(200).json({ ok: true, skip: true });
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      const ipHash = Buffer.from(String(ip)).toString('base64').slice(0, 16);
      const ua = req.headers['user-agent'] || '';
      const now = new Date();
      const bucket = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      try {
        await db.articleView.create({ data: { articleId: article.id, ipHash, userAgent: ua, viewBucket: bucket } });
        await db.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } });
      } catch {}
      return res.status(200).json({ ok: true });
    }

    // Default
    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
