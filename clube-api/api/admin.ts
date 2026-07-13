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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Simple API key auth (no JWT needed for clube-api)
function verifyAuth(req: VercelRequest): boolean {
  const auth = req.headers.authorization;
  return !!auth && auth.length > 10;
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = req.url?.replace('/api/admin', '') || '/';
  const method = req.method || 'GET';
  const urlObj = new URL(rawUrl, 'http://localhost');
  const url = urlObj.pathname;

  // Auth: todas as rotas exceto POST /login
  if (!(url === '/login' && method === 'POST')) {
    if (!verifyAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const db = await getPrisma();

    // ─── LOGIN (simple - just verify user exists) ──────────────
    if (url === '/login' && method === 'POST') {
      return res.status(200).json({ token: 'clube-admin-token', user: { role: 'ADMIN' } });
    }

    // ─── TEAM ──────────────────────────────────────────────────
    if (url === '/team' && method === 'PATCH') {
      const team = await db.team.update({ where: { id: 'main' }, data: req.body });
      return res.status(200).json(team);
    }

    // ─── CATEGORIES ────────────────────────────────────────────
    if (url === '/categorias' || url === '/categorias/') {
      if (method === 'GET') {
        const categories = await db.category.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(categories);
      }
      if (method === 'POST') {
        const cat = await db.category.create({ data: { name: req.body.name, slug: req.body.slug, gender: req.body.gender || 'MALE', modality: req.body.modality || 'FOOTBALL', order: req.body.order || 0 } });
        return res.status(201).json(cat);
      }
    }

    const catMatch = url.match(/^\/categorias\/([^/]+)$/);
    if (catMatch && method === 'PATCH') {
      const cat = await db.category.update({ where: { id: catMatch[1] }, data: req.body });
      return res.status(200).json(cat);
    }
    if (catMatch && method === 'DELETE') {
      await db.category.delete({ where: { id: catMatch[1] } });
      return res.status(204).end();
    }

    // ─── COMPETITIONS ──────────────────────────────────────────
    if (url === '/competicoes' || url === '/competicoes/') {
      if (method === 'GET') {
        const competitions = await db.competition.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true } });
        return res.status(200).json(competitions);
      }
      if (method === 'POST') {
        const comp = await db.competition.create({ data: { name: req.body.name, season: req.body.season, categoryId: req.body.categoryId, slug: req.body.slug, status: req.body.status, tableFormat: req.body.tableFormat || 'single' } });
        return res.status(201).json(comp);
      }
    }

    const compMatch = url.match(/^\/competicoes\/([^/]+)$/);
    if (compMatch && method === 'PATCH') {
      const comp = await db.competition.update({ where: { id: compMatch[1] }, data: req.body });
      return res.status(200).json(comp);
    }
    if (compMatch && method === 'DELETE') {
      await db.competition.delete({ where: { id: compMatch[1] } });
      return res.status(204).end();
    }

    // ─── OPPONENTS ─────────────────────────────────────────────
    if (url === '/adversarios' || url === '/adversarios/') {
      if (method === 'GET') {
        const limit = parseInt(urlObj.searchParams.get('limit') || '200');
        const q = urlObj.searchParams.get('q');
        const where: any = {};
        if (q) where.name = { contains: q, mode: 'insensitive' };
        const [data, total] = await Promise.all([
          db.opponent.findMany({ where, orderBy: { name: 'asc' }, take: limit }),
          db.opponent.count({ where }),
        ]);
        return res.status(200).json({ data, total });
      }
      if (method === 'POST') {
        const opp = await db.opponent.create({ data: { name: req.body.name, shortName: req.body.shortName, logoUrl: req.body.logoUrl, stadium: req.body.stadium, city: req.body.city, color: req.body.color } });
        return res.status(201).json(opp);
      }
    }

    const oppMatch = url.match(/^\/adversarios\/([^/]+)$/);
    if (oppMatch && method === 'PATCH') {
      const opp = await db.opponent.update({ where: { id: oppMatch[1] }, data: req.body });
      return res.status(200).json(opp);
    }
    if (oppMatch && method === 'DELETE') {
      await db.opponent.delete({ where: { id: oppMatch[1] } });
      return res.status(204).end();
    }

    // ─── MATCHES ───────────────────────────────────────────────
    if (url === '/partidas' || url === '/partidas/') {
      if (method === 'GET') {
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '50');
        const competitionId = urlObj.searchParams.get('competitionId');
        const where: any = {};
        if (competitionId) where.competitionId = competitionId;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
          db.match.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit, include: { opponent: true, competition: { include: { category: true } } } }),
          db.match.count({ where }),
        ]);
        return res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
      }
      if (method === 'POST') {
        const match = await db.match.create({ data: { competitionId: req.body.competitionId, opponentId: req.body.opponentId, date: req.body.date, venue: req.body.venue, isHome: req.body.isHome ?? true, status: req.body.status || 'SCHEDULED', homeScore: req.body.homeScore, awayScore: req.body.awayScore, round: req.body.round, season: req.body.season || '2026' } });
        return res.status(201).json(match);
      }
    }

    const matchEdit = url.match(/^\/partidas\/([^/]+)$/);
    if (matchEdit && method === 'PATCH') {
      const match = await db.match.update({ where: { id: matchEdit[1] }, data: req.body });
      return res.status(200).json(match);
    }
    if (matchEdit && method === 'DELETE') {
      await db.match.delete({ where: { id: matchEdit[1] } });
      return res.status(204).end();
    }

    // ─── STANDINGS ─────────────────────────────────────────────
    if (url === '/classificacoes' || url === '/classificacoes/') {
      if (method === 'GET') {
        const standings = await db.standingEntry.findMany({
          orderBy: [{ competitionId: 'asc' }, { position: 'asc' }],
        });
        return res.status(200).json(standings);
      }
      if (method === 'POST') {
        const { competitionId, rows } = req.body;
        if (competitionId && rows) {
          await db.standingEntry.deleteMany({ where: { competitionId } });
          for (const row of rows) {
            await db.standingEntry.create({ data: { competitionId, ...row } });
          }
          return res.status(200).json({ ok: true });
        }
      }
    }

    // ─── SQUAD ─────────────────────────────────────────────────
    if (url === '/elenco' || url === '/elenco/') {
      if (method === 'GET') {
        const squad = await db.squadMember.findMany({ orderBy: { name: 'asc' }, include: { category: true } });
        return res.status(200).json(squad);
      }
      if (method === 'POST') {
        const member = await db.squadMember.create({ data: { categoryId: req.body.categoryId, name: req.body.name, position: req.body.position, shirtNumber: req.body.shirtNumber, photoUrl: req.body.photoUrl } });
        return res.status(201).json(member);
      }
    }

    const squadMatch = url.match(/^\/elenco\/([^/]+)$/);
    if (squadMatch && method === 'PATCH') {
      const member = await db.squadMember.update({ where: { id: squadMatch[1] }, data: req.body });
      return res.status(200).json(member);
    }
    if (squadMatch && method === 'DELETE') {
      await db.squadMember.delete({ where: { id: squadMatch[1] } });
      return res.status(204).end();
    }

    // ─── MOVEMENTS ─────────────────────────────────────────────
    if (url === '/movimentacoes' || url === '/movimentacoes/') {
      if (method === 'GET') {
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '50');
        const search = urlObj.searchParams.get('search');
        const archived = urlObj.searchParams.get('archived') === 'true';
        const season = urlObj.searchParams.get('season');
        const where: any = {};
        if (archived) where.isArchived = true;
        if (season) where.season = season;
        if (search) where.playerName = { contains: search, mode: 'insensitive' };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
          db.playerMovement.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit, include: { club: true, opponent: true, squadMember: true, category: true } }),
          db.playerMovement.count({ where }),
        ]);
        return res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
      }
      if (method === 'POST') {
        const movement = await db.playerMovement.create({ data: { squadMemberId: req.body.squadMemberId, type: req.body.type, date: req.body.date, playerName: req.body.playerName, clubId: req.body.clubId, categoryId: req.body.categoryId, notes: req.body.notes, season: req.body.season || '2026' } });
        return res.status(201).json(movement);
      }
    }

    const movMatch = url.match(/^\/movimentacoes\/([^/]+)$/);
    if (movMatch && method === 'PATCH') {
      const movement = await db.playerMovement.update({ where: { id: movMatch[1] }, data: req.body });
      return res.status(200).json(movement);
    }
    if (movMatch && method === 'DELETE') {
      await db.playerMovement.delete({ where: { id: movMatch[1] } });
      return res.status(204).end();
    }

    // ─── TRANSFER CLUBS ────────────────────────────────────────
    if (url === '/transfer-clubs' || url === '/transfer-clubs/') {
      if (method === 'GET') {
        const clubs = await db.transferClub.findMany({ orderBy: { name: 'asc' } });
        return res.status(200).json(clubs);
      }
      if (method === 'POST') {
        const club = await db.transferClub.create({ data: { name: req.body.name, logoUrl: req.body.logoUrl } });
        return res.status(201).json(club);
      }
    }

    const tcMatch = url.match(/^\/transfer-clubs\/([^/]+)$/);
    if (tcMatch && method === 'PATCH') {
      const club = await db.transferClub.update({ where: { id: tcMatch[1] }, data: req.body });
      return res.status(200).json(club);
    }
    if (tcMatch && method === 'DELETE') {
      await db.transferClub.delete({ where: { id: tcMatch[1] } });
      return res.status(204).end();
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Admin handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
