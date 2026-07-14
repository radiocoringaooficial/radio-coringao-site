import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import Busboy from 'busboy';

const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET;

async function uploadToCloudinary(buffer: Buffer, folder: string, mimeType: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD, api_key: CLOUDINARY_KEY, api_secret: CLOUDINARY_SECRET });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `radio-coringao/${folder}`, resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }] },
      (error: any, result: any) => { if (error || !result) reject(error || new Error('Upload failed')); else resolve(result.secure_url); },
    );
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

function parseMultipart(req: VercelRequest): Promise<{ fields: Record<string, any>; file?: { buffer: Buffer; filename: string; mimetype: string } }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart')) return resolve({ fields: req.body || {} });
    const busboy = Busboy({ headers: { 'content-type': contentType } });
    const fields: Record<string, any> = {};
    let fileData: { buffer: Buffer; filename: string; mimetype: string } | undefined;
    busboy.on('field', (name: string, value: string) => { fields[name] = value; });
    busboy.on('file', (name: string, file: any, info: any) => {
      const chunks: Buffer[] = [];
      file.on('data', (chunk: Buffer) => chunks.push(chunk));
      file.on('end', () => { fileData = { buffer: Buffer.concat(chunks), filename: info.filename, mimetype: info.mimeType }; });
    });
    busboy.on('finish', () => resolve({ fields, file: fileData }));
    busboy.on('error', reject);
    const reqChunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => reqChunks.push(chunk));
    req.on('end', () => busboy.end(Buffer.concat(reqChunks)));
  });
}

let prisma: any = null;

async function getPrisma() {
  if (prisma) return prisma;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  return prisma;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function verifyToken(req: VercelRequest): any {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new Error('No Bearer token');
  const token = auth.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e: any) {
    throw new Error('JWT verify failed: ' + e.message);
  }
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
    try { verifyToken(req); } catch (e: any) {
      console.error('[auth]', e.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const db = await getPrisma();

    // ─── LOGIN ────────────────────────────────────────────────
    // clube-api não tem tabela de usuários — login é feito via sports-news.
    // Este endpoint existe por compatibilidade mas não é chamado pelo Electron.
    if (url === '/login' && method === 'POST') {
      return res.status(501).json({ error: 'Login via sports-news-api-ts' });
    }

    // ─── TEAM ──────────────────────────────────────────────────
    if (url === '/team' && method === 'GET') {
      const team = await db.team.findUnique({ where: { id: 'main' } });
      return res.status(200).json(team || {});
    }
    if (url === '/team' && method === 'PATCH') {
      const { fields, file } = await parseMultipart(req);
      let logoUrl = fields.logoUrl || undefined;
      if (file && file.buffer.length > 0) {
        logoUrl = await uploadToCloudinary(file.buffer, 'club', file.mimetype);
      }
      const updateData: any = { ...fields };
      if (logoUrl) updateData.logoUrl = logoUrl;
      delete updateData.logo;
      const team = await db.team.update({ where: { id: 'main' }, data: updateData });
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
        const { fields, file } = await parseMultipart(req);
        let logoUrl = fields.logoUrl || undefined;
        if (file && file.buffer.length > 0) {
          logoUrl = await uploadToCloudinary(file.buffer, 'opponents', file.mimetype);
        }
        const opp = await db.opponent.create({ data: { name: fields.name, shortName: fields.shortName, logoUrl, stadium: fields.stadium, city: fields.city, color: fields.color } });
        return res.status(201).json(opp);
      }
    }

    const oppMatch = url.match(/^\/adversarios\/([^/]+)$/);
    if (oppMatch && method === 'PATCH') {
      const { fields, file } = await parseMultipart(req);
      let logoUrl = fields.logoUrl || undefined;
      if (file && file.buffer.length > 0) {
        logoUrl = await uploadToCloudinary(file.buffer, 'opponents', file.mimetype);
      }
      const updateData: any = { ...fields };
      if (logoUrl) updateData.logoUrl = logoUrl;
      delete updateData.logo;
      const opp = await db.opponent.update({ where: { id: oppMatch[1] }, data: updateData });
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

    // ─── STANDINGS LOGO ────────────────────────────────────────
    if (url === '/classificacoes/logo' && method === 'POST') {
      const { file } = await parseMultipart(req);
      if (!file || file.buffer.length === 0) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }
      const logoUrl = await uploadToCloudinary(file.buffer, 'club', file.mimetype);
      return res.status(200).json({ logoUrl });
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
        const { fields, file } = await parseMultipart(req);
        let photoUrl = fields.photoUrl || undefined;
        if (file && file.buffer.length > 0) {
          photoUrl = await uploadToCloudinary(file.buffer, 'squad', file.mimetype);
        }
        const shirtNum = fields.shirtNumber ? parseInt(fields.shirtNumber, 10) : null;
        const member = await db.squadMember.create({ data: { categoryId: fields.categoryId, name: fields.name, position: fields.position, shirtNumber: isNaN(shirtNum) ? null : shirtNum, photoUrl } });
        return res.status(201).json(member);
      }
    }

    const squadMatch = url.match(/^\/elenco\/([^/]+)$/);
    if (squadMatch && method === 'PATCH') {
      const { fields, file } = await parseMultipart(req);
      let photoUrl = fields.photoUrl || undefined;
      if (file && file.buffer.length > 0) {
        photoUrl = await uploadToCloudinary(file.buffer, 'squad', file.mimetype);
      }
      const updateData: any = { ...fields };
      if (photoUrl) updateData.photoUrl = photoUrl;
      delete updateData.photo;
      if (updateData.shirtNumber) updateData.shirtNumber = parseInt(updateData.shirtNumber, 10);
      if (isNaN(updateData.shirtNumber)) updateData.shirtNumber = null;
      const member = await db.squadMember.update({ where: { id: squadMatch[1] }, data: updateData });
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

    // ─── FINANCE ───────────────────────────────────────────────
    // TODO: /evolution poderia ser uma única query groupBy por mês em vez de N queries sequenciais
    if (url.startsWith('/finance/')) {
      const financeUrl = url.replace('/finance', '');
      const season = urlObj.searchParams.get('season') || String(new Date().getFullYear());

      // GET /finance/month?month=YYYY-MM&season=YYYY
      if (financeUrl === '/month' && method === 'GET') {
        const month = urlObj.searchParams.get('month');
        if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });
        const [year, mon] = month.split('-').map(Number);
        const start = new Date(year, mon - 1, 1);
        const end = new Date(year, mon, 0, 23, 59, 59);

        const movements = await db.playerMovement.findMany({
          where: { season, date: { gte: start, lte: end } },
          select: { type: true, valueCents: true, loanValueCents: true, playerName: true, clubId: true },
        });

        const income = movements
          .filter((m: any) => ['DEPARTURE', 'LOAN_OUT'].includes(m.type))
          .reduce((sum: number, m: any) => sum + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);
        const expense = movements
          .filter((m: any) => ['ARRIVAL', 'LOAN_IN'].includes(m.type))
          .reduce((sum: number, m: any) => sum + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);

        const saleCandidates = movements.filter((m: any) => ['DEPARTURE', 'LOAN_OUT'].includes(m.type) && (m.valueCents ?? m.loanValueCents) != null);
        const biggestSale = saleCandidates.sort((a: any, b: any) => Number(b.valueCents ?? b.loanValueCents ?? 0) - Number(a.valueCents ?? a.loanValueCents ?? 0))[0] ?? null;

        const purchaseCandidates = movements.filter((m: any) => ['ARRIVAL', 'LOAN_IN'].includes(m.type) && (m.valueCents ?? m.loanValueCents) != null);
        const biggestPurchase = purchaseCandidates.sort((a: any, b: any) => Number(b.valueCents ?? b.loanValueCents ?? 0) - Number(a.valueCents ?? a.loanValueCents ?? 0))[0] ?? null;

        return res.status(200).json({
          incomeCents: String(income),
          expenseCents: String(expense),
          balanceCents: String(income - expense),
          movementsCount: movements.length,
          biggestSale: biggestSale ? { player: biggestSale.playerName, club: biggestSale.clubId, valueCents: String(biggestSale.valueCents ?? biggestSale.loanValueCents ?? 0) } : null,
          biggestPurchase: biggestPurchase ? { player: biggestPurchase.playerName, club: biggestPurchase.clubId, valueCents: String(biggestPurchase.valueCents ?? biggestPurchase.loanValueCents ?? 0) } : null,
        });
      }

      // GET /finance/evolution?months=12&season=YYYY
      if (financeUrl === '/evolution' && method === 'GET') {
        const months = Math.min(parseInt(urlObj.searchParams.get('months') || '12'), 60);
        const now = new Date();
        const result = [];

        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

          const movements = await db.playerMovement.findMany({
            where: { season, date: { gte: start, lte: end } },
            select: { type: true, valueCents: true, loanValueCents: true },
          });

          const income = movements
            .filter((m: any) => ['DEPARTURE', 'LOAN_OUT'].includes(m.type))
            .reduce((sum: number, m: any) => sum + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);
          const expense = movements
            .filter((m: any) => ['ARRIVAL', 'LOAN_IN'].includes(m.type))
            .reduce((sum: number, m: any) => sum + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);

          result.push({
            month: monthKey,
            incomeCents: String(income),
            expenseCents: String(expense),
            balanceCents: String(income - expense),
            movementsCount: movements.length,
          });
        }
        return res.status(200).json(result);
      }

      // GET /finance/club-ranking?season=YYYY
      if (financeUrl === '/club-ranking' && method === 'GET') {
        const movements = await db.playerMovement.findMany({
          where: { season, clubId: { not: null } },
          select: { clubId: true, type: true, valueCents: true, loanValueCents: true, club: { select: { name: true, logoUrl: true } } },
        });

        const clubMap = new Map<string, any>();
        for (const m of movements) {
          if (!m.clubId || !m.club) continue;
          if (!clubMap.has(m.clubId)) {
            clubMap.set(m.clubId, { clubName: m.club.name, logoUrl: m.club.logoUrl, soldToCents: 0, boughtFromCents: 0, movementsCount: 0 });
          }
          const entry = clubMap.get(m.clubId);
          const value = Number(m.valueCents ?? m.loanValueCents ?? 0);
          if (['DEPARTURE', 'LOAN_OUT'].includes(m.type)) entry.soldToCents += value;
          if (['ARRIVAL', 'LOAN_IN'].includes(m.type)) entry.boughtFromCents += value;
          entry.movementsCount++;
        }

        return res.status(200).json(
          Array.from(clubMap.values())
            .map((c: any) => ({ ...c, totalCents: String(c.soldToCents + c.boughtFromCents), soldToCents: String(c.soldToCents), boughtFromCents: String(c.boughtFromCents) }))
            .sort((a: any, b: any) => Number(b.totalCents) - Number(a.totalCents))
        );
      }
    }

    // ─── MOVEMENTS FINANCE (MovementsPage) ──────────────────────
    if (url.startsWith('/movimentacoes/finance') && method === 'GET') {
      const season = urlObj.searchParams.get('season') || String(new Date().getFullYear());

      const movements = await db.playerMovement.findMany({
        where: { season },
        select: { type: true, valueCents: true, loanValueCents: true, isFreeLoan: true, paysSalary: true },
      });

      const isIncome = (t: string) => ['DEPARTURE', 'LOAN_OUT'].includes(t);
      const isExpense = (t: string) => ['ARRIVAL', 'LOAN_IN'].includes(t);

      const revenue = movements.filter((m: any) => isIncome(m.type)).reduce((s: number, m: any) => s + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);
      const expenses = movements.filter((m: any) => isExpense(m.type)).reduce((s: number, m: any) => s + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);
      const loanOut = movements.filter((m: any) => m.type === 'LOAN_OUT').reduce((s: number, m: any) => s + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);
      const loanIn = movements.filter((m: any) => m.type === 'LOAN_IN').reduce((s: number, m: any) => s + Number(m.valueCents ?? m.loanValueCents ?? 0), 0);

      return res.status(200).json({
        revenue,
        expenses,
        netRevenue: revenue - expenses,
        total: movements.length,
        totalDepartures: movements.filter((m: any) => m.type === 'DEPARTURE').length,
        totalArrivals: movements.filter((m: any) => m.type === 'ARRIVAL').length,
        totalLoanOut: movements.filter((m: any) => m.type === 'LOAN_OUT').length,
        totalLoanIn: movements.filter((m: any) => m.type === 'LOAN_IN').length,
        totalReturns: movements.filter((m: any) => m.type === 'RETURN').length,
        loanOut,
        loanIn,
        freeLoans: movements.filter((m: any) => ['LOAN_OUT', 'LOAN_IN'].includes(m.type) && m.isFreeLoan).length,
        paidLoans: movements.filter((m: any) => ['LOAN_OUT', 'LOAN_IN'].includes(m.type) && !m.isFreeLoan).length,
        salaryPayers: movements.filter((m: any) => ['LOAN_OUT', 'LOAN_IN'].includes(m.type) && m.paysSalary).length,
      });
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
