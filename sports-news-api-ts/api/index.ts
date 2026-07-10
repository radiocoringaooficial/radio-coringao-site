import type { VercelRequest, VercelResponse } from '@vercel/node';

let prisma: any = null;

async function getPrisma() {
  if (prisma) return prisma;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  return prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '/';
  const method = req.method || 'GET';

  try {
    const db = await getPrisma();

    // Health
    if (url === '/api/health') {
      const count = await db.article.count();
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), articleCount: count });
    }

    // Notícias
    if (url === '/api/noticias' || url.startsWith('/api/noticias?')) {
      const articles = await db.article.findMany({
        where: { status: 'PUBLISHED' },
        take: 20,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, author: true },
      });
      return res.status(200).json(articles);
    }

    // Notícias por slug
    const slugMatch = url.match(/^\/api\/noticias\/([^?]+)/);
    if (slugMatch) {
      const article = await db.article.findFirst({
        where: { slug: slugMatch[1], status: 'PUBLISHED' },
        include: { category: true, author: true },
      });
      if (!article) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(article);
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
      const items = await db.menuItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      return res.status(200).json(items);
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

    // Default
    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
