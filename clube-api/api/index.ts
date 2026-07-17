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

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '/';

  try {
    const db = await getPrisma();

    if (url === '/api/health') {
      return res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
    }

    if (url === '/api/categorias' || url.startsWith('/api/categorias?')) {
      const data = await db.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { order: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
        },
      });
      return res.status(200).json(data);
    }

    // GET /api/categorias/flat — all categories flat with parent info
    if (url === '/api/categorias/flat' || url.startsWith('/api/categorias/flat?')) {
      const data = await db.category.findMany({
        orderBy: { order: 'asc' },
        include: { parent: { select: { name: true } } },
      });
      return res.status(200).json(data);
    }

    const catSlugMatch = url.match(/^\/api\/categorias\/([^?]+)$/);
    if (catSlugMatch) {
      const slug = catSlugMatch[1];
      const cat = await db.category.findFirst({ where: { slug } });
      if (!cat) return res.status(404).json({ error: 'Category not found' });
      return res.status(200).json(cat);
    }

    if (url === '/api/competicoes' || url.startsWith('/api/competicoes?')) {
      const data = await db.competition.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/adversarios' || url.startsWith('/api/adversarios?')) {
      const data = await db.opponent.findMany({
        orderBy: { name: 'asc' },
        include: { categories: { include: { category: { select: { id: true, name: true } } } } },
      });
      return res.status(200).json(data);
    }

    if (url === '/api/partidas' || url.startsWith('/api/partidas?')) {
      const urlObj = new URL(url, 'http://localhost');
      const status = urlObj.searchParams.get('status');
      const archived = urlObj.searchParams.get('archived');
      const limitParam = parseInt(urlObj.searchParams.get('limit') || '50');
      const where: any = {};
      if (status) where.status = status;
      // Filter by archived status: default is false (not archived)
      if (archived === 'true') where.isArchived = true;
      else if (archived === 'false') where.isArchived = false;
      else where.isArchived = false;
      const data = await db.match.findMany({ where, orderBy: { date: 'desc' }, take: limitParam, include: { opponent: true, competition: { include: { category: true } } } });
      return res.status(200).json(data);
    }

    if (url === '/api/partidas/next' || url.startsWith('/api/partidas/next?')) {
      const urlObj = new URL(url, 'http://localhost');
      const category = urlObj.searchParams.get('category');
      const limitParam = parseInt(urlObj.searchParams.get('limit') || '5');
      const limit = Math.min(Math.max(limitParam, 1), 50);
      const where: any = { status: 'SCHEDULED', isArchived: false, date: { gte: new Date() } };
      if (category) {
        const cat = await db.category.findFirst({ where: { slug: category } });
        if (cat) {
          const compIds = (await db.competition.findMany({ where: { categoryId: cat.id } })).map((c: any) => c.id);
          if (compIds.length > 0) where.competitionId = { in: compIds };
          else return res.status(200).json([]);
        } else {
          return res.status(200).json([]);
        }
      }
      const data = await db.match.findMany({ where, orderBy: { date: 'asc' }, take: limit, include: { opponent: { select: { id: true, name: true, logoUrl: true } }, competition: { select: { id: true, name: true, category: { select: { slug: true } } } } } });
      return res.status(200).json(data);
    }

    if (url === '/api/partidas/recent' || url.startsWith('/api/partidas/recent?')) {
      const urlObj = new URL(url, 'http://localhost');
      const category = urlObj.searchParams.get('category');
      const limitParam = parseInt(urlObj.searchParams.get('limit') || '10');
      const limit = Math.min(Math.max(limitParam, 1), 50);
      const where: any = { status: 'FINISHED', isArchived: false };
      if (category) {
        const cat = await db.category.findFirst({ where: { slug: category } });
        if (cat) {
          const compIds = (await db.competition.findMany({ where: { categoryId: cat.id } })).map((c: any) => c.id);
          if (compIds.length > 0) where.competitionId = { in: compIds };
          else return res.status(200).json([]);
        } else {
          return res.status(200).json([]);
        }
      }
      const data = await db.match.findMany({ where, orderBy: { date: 'desc' }, take: limit, include: { opponent: { select: { id: true, name: true, logoUrl: true } }, competition: { select: { id: true, name: true, category: { select: { slug: true } } } } } });
      return res.status(200).json(data);
    }

    if (url === '/api/classificacoes' || url.startsWith('/api/classificacoes?')) {
      const data = await db.standingEntry.findMany({ orderBy: { position: 'asc' } });
      return res.status(200).json(data);
    }

    const classifMatch = url.match(/^\/api\/classificacoes\/(?!category\/)([^?]+)$/);
    if (classifMatch) {
      const id = classifMatch[1];
      let comp = null;
      try {
        comp = await db.competition.findUnique({ where: { id } });
      } catch {}
      if (!comp) {
        const all = await db.competition.findMany();
        comp = all.find((c: any) => slugify(c.name) === id);
      }
      if (!comp) return res.status(200).json([]);
      const data = await db.standingEntry.findMany({ where: { competitionId: comp.id }, orderBy: { position: 'asc' } });
      return res.status(200).json(data);
    }

    // /api/classificacoes/category/:slug
    const catClassifMatch = url.match(/^\/api\/classificacoes\/category\/([^?]+)$/);
    if (catClassifMatch) {
      const catSlug = catClassifMatch[1];
      const cat = await db.category.findFirst({ where: { slug: catSlug } });
      if (!cat) return res.status(200).json([]);
      const competitions = await db.competition.findMany({ where: { categoryId: cat.id } });
      const compIds = competitions.map((c: any) => c.id);
      const data = await db.standingEntry.findMany({ where: { competitionId: { in: compIds } }, orderBy: { position: 'asc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/elenco' || url.startsWith('/api/elenco?')) {
      const urlObj = new URL(url, 'http://localhost');
      const category = urlObj.searchParams.get('category');

      // Reactivate squad members whose LOAN_OUT returnDate has passed
      const now = new Date();
      const expiredLoans = await db.playerMovement.findMany({
        where: { type: 'LOAN_OUT', returnDate: { lte: now }, squadMemberId: { not: null } },
        select: { squadMemberId: true },
      });
      const toReactivate = [...new Set(expiredLoans.map((m) => m.squadMemberId).filter(Boolean))];
      if (toReactivate.length > 0) {
        await db.squadMember.updateMany({ where: { id: { in: toReactivate }, isActive: false }, data: { isActive: true, inactiveReason: null } });
      }

      // Build where clause: always filter by active or loaned
      const where: any = { OR: [{ isActive: true }, { inactiveReason: 'LOANED' }] };

      // If category slug is provided, filter by that category
      if (category && category.trim() !== '') {
        const categoryRecord = await db.category.findFirst({ where: { slug: category } });
        if (!categoryRecord) {
          return res.status(200).json([]);
        }
        where.category = { slug: category };
      }

      const data = await db.squadMember.findMany({ orderBy: { name: 'asc' }, where });
      return res.status(200).json(data);
    }

    if (url === '/api/team') {
      const data = await db.team.findUnique({ where: { id: 'main' } });
      return res.status(200).json(data || {});
    }

    if (url === '/api/transfer-clubs' || url.startsWith('/api/transfer-clubs?')) {
      const data = await db.transferClub.findMany({ orderBy: { name: 'asc' } });
      return res.status(200).json(data);
    }

    // /api/movimentacoes/recent
    if (url.startsWith('/api/movimentacoes/recent')) {
      const urlObj = new URL(url, 'http://localhost');
      const limit = parseInt(urlObj.searchParams.get('limit') || '10');
      const category = urlObj.searchParams.get('category');
      const where: any = {};
      if (category) {
        where.OR = [
          { category: { slug: category } },
          { squadMember: { category: { slug: category } } },
        ];
      }
      const data = await db.playerMovement.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true, gender: true } }, squadMember: { select: { id: true, name: true, photoUrl: true, shirtNumber: true, category: { select: { id: true, name: true, slug: true, gender: true } } } }, club: { select: { id: true, name: true, logoUrl: true } }, opponent: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { date: 'desc' },
        take: limit,
      });
      return res.status(200).json(data);
    }

    // /api/movimentacoes (admin)
    if (url.startsWith('/api/movimentacoes') && !url.includes('/recent')) {
      const data = await db.playerMovement.findMany({ orderBy: { date: 'desc' }, take: 50 });
      return res.status(200).json(data);
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
