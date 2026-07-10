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

  try {
    const db = await getPrisma();

    if (url === '/api/health') {
      return res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
    }

    if (url === '/api/categorias' || url.startsWith('/api/categorias?')) {
      const data = await db.category.findMany({ orderBy: { order: 'asc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/competicoes' || url.startsWith('/api/competicoes?')) {
      const data = await db.competition.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/adversarios' || url.startsWith('/api/adversarios?')) {
      const data = await db.opponent.findMany({ orderBy: { name: 'asc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/partidas' || url.startsWith('/api/partidas?')) {
      const data = await db.match.findMany({ orderBy: { date: 'desc' }, take: 50 });
      return res.status(200).json(data);
    }

    if (url === '/api/classificacoes' || url.startsWith('/api/classificacoes?')) {
      const data = await db.standingEntry.findMany({ orderBy: { position: 'asc' } });
      return res.status(200).json(data);
    }

    if (url === '/api/elenco' || url.startsWith('/api/elenco?')) {
      const data = await db.squadMember.findMany({ orderBy: { name: 'asc' } });
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

    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
