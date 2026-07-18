import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import Busboy from 'busboy';
import { sanitizePlainText } from '../src/shared/services/sanitize';
import { uploadImage } from '../src/shared/services/cloudinary';

// Cloudinary config
const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET;

async function uploadToCloudinary(buffer: Buffer, folder: string, mimeType: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD, api_key: CLOUDINARY_KEY, api_secret: CLOUDINARY_SECRET });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `radio-coringao/${folder}`, resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], transformation: [{ width: 1200, height: 675, crop: 'fill', quality: 'auto', fetch_format: 'auto' }] },
      (error: any, result: any) => { if (error || !result) reject(error || new Error('Upload failed')); else resolve(result.secure_url); },
    );
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

let prisma: any = null;

async function getPrisma() {
  if (prisma) return prisma;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  return prisma;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function verifyToken(req: VercelRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return jwt.verify(auth.slice(7), JWT_SECRET);
}

function parseMultipart(req: VercelRequest): Promise<{ fields: Record<string, any>; file?: { buffer: Buffer; filename: string; mimetype: string } }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart')) {
      return resolve({ fields: req.body || {} });
    }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = (req.url?.replace('/api/admin', '') || '/');
  const urlPath = url.split('?')[0];
  const urlObj = new URL(url, 'http://localhost');
  const method = req.method || 'GET';

  try {
    let db;
    try {
      db = await getPrisma();
    } catch (err: any) {
      console.error('Prisma connection error:', err?.message, err?.stack);
      return res.status(500).json({ error: 'Database connection failed', message: err?.message });
    }

    // ─── LOGIN ────────────────────────────────────────────────
    if (urlPath === '/login' && method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });

      const bcrypt = await import('bcryptjs');
      const user = await db.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

      const valid = await bcrypt.default.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Credenciais inváladas' });

      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, position: user.position, cargos: user.cargos },
      });
    }

    // All admin routes require auth
    let user: any;
    try { user = verifyToken(req); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    // Update lastSeenAt (fire-and-forget, non-blocking)
    db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

    // ─── JOB TITLES (Cargos Exibíveis) ──────────────────────
    if (urlPath === '/job-titles' || urlPath === '/job-titles/') {
      if (method === 'GET') {
        const titles = await db.jobTitle.findMany({ orderBy: { name: 'asc' } });
        return res.status(200).json(titles);
      }
      if (method === 'POST') {
        const { name } = req.body || {};
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
        const trimmed = name.trim();
        // Case-insensitive duplicate check: return existing if found
        const existing = await db.jobTitle.findFirst({ where: { name: { equals: trimmed, mode: 'insensitive' } } });
        if (existing) return res.status(200).json(existing);
        const title = await db.jobTitle.create({ data: { name: trimmed } });
        return res.status(201).json(title);
      }
    }

    const jobTitleMatch = urlPath.match(/^\/job-titles\/([^/]+)$/);
    if (jobTitleMatch && method === 'DELETE') {
      const id = jobTitleMatch[1];
      const existing = await db.jobTitle.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Cargo não encontrado' });
      await db.jobTitle.delete({ where: { id } });
      return res.status(204).end();
    }

    // ─── DASHBOARD ────────────────────────────────────────────
    if (urlPath === '/dashboard' || urlPath === '/dashboard/') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [total, published, draft, allArticles, recentViews, topViewedRaw] = await Promise.all([
        db.article.count(),
        db.article.count({ where: { status: 'PUBLISHED' } }),
        db.article.count({ where: { status: 'DRAFT' } }),
        db.article.findMany({ select: { status: true, createdAt: true } }),
        db.articleView.count({ where: { viewedAt: { gte: thirtyDaysAgo } } }),
        db.articleView.groupBy({
          by: ['articleId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ]);

      // Busca dados dos artigos mais vistos (IPs únicos por dia)
      const topIds = topViewedRaw.map((r) => r.articleId);
      const topArticles = topIds.length
        ? await db.article.findMany({
            where: { id: { in: topIds } },
            include: { category: { select: { name: true, color: true } }, author: { select: { name: true } } },
          })
        : [];
      const viewCountMap = new Map(topViewedRaw.map((r) => [r.articleId, r._count.id]));
      const topViewed = topArticles
        .map((a: any) => ({ ...a, viewCount: viewCountMap.get(a.id) || 0 }))
        .sort((a: any, b: any) => b.viewCount - a.viewCount);

      // Articles per month
      const monthMap: Record<string, { published: number; review: number }> = {};
      for (const a of allArticles) {
        const d = new Date(a.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[key]) monthMap[key] = { published: 0, review: 0 };
        if (a.status === 'PUBLISHED') monthMap[key].published++;
        else if (a.status === 'REVIEW') monthMap[key].review++;
      }
      const articlesPerMonth = Object.entries(monthMap).sort().map(([month, v]) => ({ month, ...v }));

      // Reads per month from articleView (unique IPs per day bucket)
      const allViews = await db.articleView.findMany({ select: { viewedAt: true } });
      const readsMonthMap: Record<string, { reads: number }> = {};
      for (const v of allViews) {
        const d = new Date(v.viewedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!readsMonthMap[key]) readsMonthMap[key] = { reads: 0 };
        readsMonthMap[key].reads++;
      }
      // Fill trailing 6 months with 0 for sparkline
      const filledReads: Record<string, { reads: number }> = {};
      const now2 = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        filledReads[key] = readsMonthMap[key] || { reads: 0 };
      }
      const readsPerMonth = Object.entries(filledReads).map(([month, v]) => ({ month, ...v }));

      // Fill trailing 6 months for articlesPerMonth too
      const filledArticles: Record<string, { published: number; review: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        filledArticles[key] = monthMap[key] || { published: 0, review: 0 };
      }
      const articlesPerMonthFilled = Object.entries(filledArticles).map(([month, v]) => ({ month, ...v }));

      return res.status(200).json({
        stats: { total, published, draft, totalViews: recentViews },
        topArticles: topViewed,
        articlesPerMonth: articlesPerMonthFilled,
        readsPerMonth,
      });
    }

    if (urlPath === '/dashboard/categorias' || urlPath === '/dashboard/categorias/') {
      const categories = await db.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { order: 'asc' } });
      return res.status(200).json(categories);
    }

    // ─── ARTICLES ─────────────────────────────────────────────
    if (urlPath === '/materias' || urlPath === '/materias/') {
      if (method === 'GET') {
        const urlObj = new URL(url, 'http://localhost');
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '20');
        const status = urlObj.searchParams.get('status');
        const category = urlObj.searchParams.get('category');
        const q = urlObj.searchParams.get('q');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (category) where.categoryId = category;
        if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }];

        const [data, total] = await Promise.all([
          db.article.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { category: true, author: { select: { id: true, name: true, email: true, role: true } }, tags: { include: { tag: true } } } }),
          db.article.count({ where }),
        ]);
        return res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
      }
      if (method === 'POST') {
        const { fields, file } = await parseMultipart(req);
        let coverImageUrl = fields.coverImage || undefined;
        if (file && file.buffer.length > 0) {
          coverImageUrl = await uploadToCloudinary(file.buffer, 'articles', file.mimetype);
        }
        const orderVal = parseInt(fields.order || '0', 10);
        if (orderVal > 0) {
          const conflicting = await db.article.findFirst({ where: { order: orderVal, isFeatured: true, status: 'PUBLISHED', id: { not: '' } }, select: { id: true, title: true } });
          if (conflicting) {
            await db.article.update({ where: { id: conflicting.id }, data: { order: 0, isFeatured: false } });
            console.log(`[ORDER SWAP] Posição #${orderVal} tirada de "${conflicting.title}" (${conflicting.id}) para o artigo atual.`);
          }
        }
        const article = await db.article.create({ data: { title: fields.title, subtitle: fields.subtitle ? sanitizePlainText(fields.subtitle) : null, slug: fields.slug || fields.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'), content: fields.content || '', excerpt: fields.excerpt, status: fields.status || 'DRAFT', type: fields.type || 'NEWS', isFeatured: fields.isFeatured === 'true', isBreaking: fields.isBreaking === 'true', authorId: user.id, authorCargo: fields.authorCargo || null, categoryId: fields.categoryId, coverImage: coverImageUrl, scheduledAt: fields.scheduledAt || null, publishedAt: fields.status === 'PUBLISHED' ? new Date() : null, order: orderVal } });
        return res.status(201).json(article);
      }
    }

    // Article by ID
    const articleMatch = urlPath.match(/^\/materias\/([^/]+)$/);
    if (articleMatch) {
      const id = articleMatch[1];
      if (method === 'GET') {
        const article = await db.article.findUnique({ where: { id }, include: { category: true, author: { select: { id: true, name: true, email: true, role: true } }, tags: { include: { tag: true } }, images: true } });
        return res.status(200).json(article);
      }
      if (method === 'PUT' || method === 'PATCH') {
        const { fields, file } = await parseMultipart(req);
        let coverImageUrl = fields.coverImage || undefined;
        if (file && file.buffer.length > 0) {
          coverImageUrl = await uploadToCloudinary(file.buffer, 'articles', file.mimetype);
        }
        const orderVal = parseInt(fields.order || '0', 10);
        if (orderVal > 0 && fields.isFeatured === 'true') {
          const conflicting = await db.article.findFirst({ where: { order: orderVal, isFeatured: true, status: 'PUBLISHED', id: { not: id } }, select: { id: true, title: true } });
          if (conflicting) {
            await db.article.update({ where: { id: conflicting.id }, data: { order: 0, isFeatured: false } });
            console.log(`[ORDER SWAP] Posição #${orderVal} tirada de "${conflicting.title}" (${conflicting.id}) para o artigo atual.`);
          }
        }
        const updateData: Record<string, any> = {};
        if (fields.title !== undefined) updateData.title = fields.title;
        if (fields.subtitle !== undefined) updateData.subtitle = fields.subtitle ? sanitizePlainText(fields.subtitle) : null;
        if (fields.slug !== undefined) updateData.slug = fields.slug;
        if (fields.content !== undefined) updateData.content = fields.content;
        if (fields.excerpt !== undefined) updateData.excerpt = fields.excerpt;
        if (fields.status !== undefined) updateData.status = fields.status;
        if (fields.type !== undefined) updateData.type = fields.type;
        if (fields.isFeatured !== undefined) updateData.isFeatured = fields.isFeatured === 'true';
        if (fields.isBreaking !== undefined) updateData.isBreaking = fields.isBreaking === 'true';
        if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
        if (coverImageUrl !== undefined) updateData.coverImage = coverImageUrl;
        if (fields.status === 'PUBLISHED') updateData.publishedAt = new Date();
        if (fields.scheduledAt !== undefined) updateData.scheduledAt = fields.scheduledAt || null;
        if (fields.coverImageAlt !== undefined) updateData.coverImageAlt = fields.coverImageAlt;
        if (fields.coverImageCredit !== undefined) updateData.coverImageCredit = fields.coverImageCredit;
        if (fields.order !== undefined) updateData.order = parseInt(fields.order, 10);
        if (fields.authorCargo !== undefined) updateData.authorCargo = fields.authorCargo || null;
        const article = await db.article.update({ where: { id }, data: updateData });
        return res.status(200).json(article);
      }
      if (method === 'DELETE') {
        await db.article.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // Article status
    const statusMatch = urlPath.match(/^\/materias\/([^/]+)\/status$/);
    if (statusMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = statusMatch[1];
      const { status } = req.body || {};
      await db.article.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined } });
      return res.status(200).json({ ok: true });
    }

    // ─── ARTICLES (alias /articles → same as /materias) ────────
    if (urlPath === '/articles' || urlPath === '/articles/') {
      if (method === 'GET') {
        const urlObj = new URL(url, 'http://localhost');
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '20');
        const status = urlObj.searchParams.get('status');
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status) where.status = status;
        const [data, total] = await Promise.all([
          db.article.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } } }),
          db.article.count({ where }),
        ]);
        return res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
      }
    }

    const articleIdMatch = urlPath.match(/^\/articles\/([^/]+)$/);
    if (articleIdMatch) {
      const id = articleIdMatch[1];
      if (method === 'GET') {
        const article = await db.article.findUnique({ where: { id }, include: { category: true, author: { select: { id: true, name: true, email: true, role: true } }, tags: { include: { tag: true } }, images: true } });
        return res.status(200).json(article);
      }
      if (method === 'PUT' || method === 'PATCH') {
        const { fields, file } = await parseMultipart(req);
        let coverImageUrl = fields.coverImage || undefined;
        if (file && file.buffer.length > 0) {
          coverImageUrl = await uploadToCloudinary(file.buffer, 'articles', file.mimetype);
        }
        const orderVal = parseInt(fields.order || '0', 10);
        if (orderVal > 0 && fields.isFeatured === 'true') {
          const conflicting = await db.article.findFirst({ where: { order: orderVal, isFeatured: true, status: 'PUBLISHED', id: { not: id } }, select: { id: true, title: true } });
          if (conflicting) {
            await db.article.update({ where: { id: conflicting.id }, data: { order: 0, isFeatured: false } });
            console.log(`[ORDER SWAP] Posição #${orderVal} tirada de "${conflicting.title}" (${conflicting.id}) para o artigo atual.`);
          }
        }
        const updateData: Record<string, any> = {};
        if (fields.title !== undefined) updateData.title = fields.title;
        if (fields.subtitle !== undefined) updateData.subtitle = fields.subtitle ? sanitizePlainText(fields.subtitle) : null;
        if (fields.slug !== undefined) updateData.slug = fields.slug;
        if (fields.content !== undefined) updateData.content = fields.content;
        if (fields.excerpt !== undefined) updateData.excerpt = fields.excerpt;
        if (fields.status !== undefined) updateData.status = fields.status;
        if (fields.type !== undefined) updateData.type = fields.type;
        if (fields.isFeatured !== undefined) updateData.isFeatured = fields.isFeatured === 'true';
        if (fields.isBreaking !== undefined) updateData.isBreaking = fields.isBreaking === 'true';
        if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
        if (coverImageUrl !== undefined) updateData.coverImage = coverImageUrl;
        if (fields.status === 'PUBLISHED') updateData.publishedAt = new Date();
        if (fields.scheduledAt !== undefined) updateData.scheduledAt = fields.scheduledAt || null;
        if (fields.coverImageAlt !== undefined) updateData.coverImageAlt = fields.coverImageAlt;
        if (fields.coverImageCredit !== undefined) updateData.coverImageCredit = fields.coverImageCredit;
        if (fields.order !== undefined) updateData.order = parseInt(fields.order, 10);
        if (fields.authorCargo !== undefined) updateData.authorCargo = fields.authorCargo || null;
        const article = await db.article.update({ where: { id }, data: updateData });
        return res.status(200).json(article);
      }
      if (method === 'DELETE') {
        await db.article.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    const articleStatusMatch = urlPath.match(/^\/articles\/([^/]+)\/status$/);
    if (articleStatusMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = articleStatusMatch[1];
      const { status } = req.body || {};
      await db.article.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined } });
      return res.status(200).json({ ok: true });
    }

    // Articles archive/unarchive
    const articleArchiveMatch = urlPath.match(/^\/articles\/([^/]+)\/archive$/);
    if (articleArchiveMatch && method === 'PATCH') {
      const id = articleArchiveMatch[1];
      await db.article.update({ where: { id }, data: { status: 'ARCHIVED' } });
      return res.status(200).json({ ok: true });
    }
    const articleUnarchiveMatch = urlPath.match(/^\/articles\/([^/]+)\/unarchive$/);
    if (articleUnarchiveMatch && method === 'PATCH') {
      const id = articleUnarchiveMatch[1];
      await db.article.update({ where: { id }, data: { status: 'DRAFT' } });
      return res.status(200).json({ ok: true });
    }

    // Content image upload (inline)
    if (urlPath === '/articles/content-image' && method === 'POST') {
      try {
        const { image } = req.body as any;
        if (!image || !image.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Envie uma imagem base64 válida.' });
        }
        const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!match) {
          return res.status(400).json({ error: 'Formato base64 inválido.' });
        }
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const url = await uploadImage(buffer, 'articles', mimeType);
        return res.status(200).json({ url });
      } catch (err: any) {
        console.error('[CONTENT_IMAGE] Error:', err.message);
        return res.status(500).json({ error: 'Falha ao fazer upload da imagem.' });
      }
    }

    // ─── CATEGORIES ───────────────────────────────────────────
    if (urlPath === '/categorias' || urlPath === '/categorias/') {
      if (method === 'GET') {
        const categories = await db.category.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { articles: true } } } });
        return res.status(200).json(categories);
      }
      if (method === 'POST') {
        const cat = await db.category.create({ data: { name: req.body.name, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: req.body.description, color: req.body.color, icon: req.body.icon, order: req.body.order || 0 } });
        return res.status(201).json(cat);
      }
    }

    const catMatch = urlPath.match(/^\/categorias\/([^/]+)$/);
    if (catMatch) {
      const id = catMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const updateData: any = { ...req.body };
        if (updateData.name && !updateData.slug) {
          updateData.slug = updateData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
        delete updateData.id;
        delete updateData.createdAt;
        const cat = await db.category.update({ where: { id }, data: updateData });
        return res.status(200).json(cat);
      }
      if (method === 'DELETE') {
        try {
          await db.$transaction(async (tx: any) => {
            const catToDelete = await tx.category.findUnique({ where: { id } });
            const fallbackSlug = catToDelete?.slug === 'sem-categoria' ? 'futebol' : 'sem-categoria';
            const fallback = await tx.category.upsert({
              where: { slug: fallbackSlug },
              update: {},
              create: { name: 'Sem Categoria', slug: 'sem-categoria', order: 999 },
            });
            await tx.article.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
            await tx.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
            await tx.category.delete({ where: { id } });
          });
          return res.status(200).json({ ok: true });
        } catch (delErr: any) {
          return res.status(500).json({ error: 'Falha ao deletar categoria', detail: delErr?.message });
        }
      }
    }

    // ─── BANNERS ──────────────────────────────────────────────
    if (urlPath === '/banners' || urlPath === '/banners/') {
      if (method === 'GET') {
        const banners = await db.banner.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(banners);
      }
      if (method === 'POST') {
        const banner = await db.banner.create({ data: { title: req.body.title, subtitle: req.body.subtitle, imageUrl: req.body.imageUrl, linkUrl: req.body.linkUrl, position: req.body.position || 'home-top', order: req.body.order || 0 } });
        return res.status(201).json(banner);
      }
    }

    const bannerMatch = urlPath.match(/^\/banners\/([^/]+)$/);
    if (bannerMatch) {
      const id = bannerMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const banner = await db.banner.update({ where: { id }, data: req.body });
        return res.status(200).json(banner);
      }
      if (method === 'DELETE') {
        await db.banner.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── MENU ─────────────────────────────────────────────────
    if (urlPath === '/menu' || urlPath === '/menu/') {
      if (method === 'GET') {
        const allItems = await db.menuItem.findMany({ orderBy: { order: 'asc' } });
        const parents = allItems.filter((i: any) => !i.parentId);
        const childrenMap = new Map<string, any[]>();
        for (const item of allItems) {
          if (item.parentId) {
            const list = childrenMap.get(item.parentId) || [];
            list.push(item);
            childrenMap.set(item.parentId, list);
          }
        }
        const result = parents.map((p: any) => ({ ...p, children: childrenMap.get(p.id) || [] }));
        return res.status(200).json(result);
      }
      if (method === 'POST') {
        const parentId = req.body.parentId || null;
        const requestedOrder = req.body.order ?? 0;
        // Shift existing items to make room
        await db.menuItem.updateMany({
          where: { parentId, order: { gte: requestedOrder } },
          data: { order: { increment: 1 } },
        });
        const item = await db.menuItem.create({ data: { label: req.body.label, url: req.body.url, target: req.body.target || '_self', order: requestedOrder, isActive: req.body.isActive ?? true, parentId } });
        return res.status(201).json(item);
      }
    }

    const menuMatch = urlPath.match(/^\/menu\/([^/]+)$/);
    if (menuMatch) {
      const id = menuMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const existing = await db.menuItem.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Item nao encontrado' });
        const parentId = req.body.parentId !== undefined ? req.body.parentId : existing.parentId;
        const newOrder = req.body.order !== undefined ? req.body.order : existing.order;
        if (newOrder !== existing.order) {
          // Remove from old position
          await db.menuItem.updateMany({
            where: { parentId: existing.parentId, order: { gt: existing.order } },
            data: { order: { decrement: 1 } },
          });
          // Make room at new position
          await db.menuItem.updateMany({
            where: { parentId, order: { gte: newOrder } },
            data: { order: { increment: 1 } },
          });
        }
        const updateData: any = { ...req.body };
        delete updateData.id;
        delete updateData.createdAt;
        const item = await db.menuItem.update({ where: { id }, data: updateData });
        return res.status(200).json(item);
      }
      if (method === 'DELETE') {
        const existing = await db.menuItem.findUnique({ where: { id } });
        await db.menuItem.deleteMany({ where: { parentId: id } });
        await db.menuItem.delete({ where: { id } });
        if (existing) {
          await db.menuItem.updateMany({
            where: { parentId: existing.parentId, order: { gt: existing.order } },
            data: { order: { decrement: 1 } },
          });
        }
        return res.status(204).end();
      }
    }

    // ─── SPONSORS ─────────────────────────────────────────────
    if (urlPath === '/patrocinadores' || urlPath === '/patrocinadores/') {
      if (method === 'GET') {
        const sponsors = await db.sponsor.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(sponsors);
      }
      if (method === 'POST') {
        const { fields, file } = await parseMultipart(req);
        let logoUrl = fields.logoUrl || undefined;
        if (file && file.buffer.length > 0) {
          logoUrl = await uploadToCloudinary(file.buffer, 'sponsors', file.mimetype);
        }
        const sponsor = await db.sponsor.create({ data: { name: fields.name, logoUrl, websiteUrl: fields.websiteUrl, description: fields.description, order: parseInt(fields.order || '0', 10) } });
        return res.status(201).json(sponsor);
      }
    }

    const sponsorMatch = urlPath.match(/^\/patrocinadores\/([^/]+)$/);
    if (sponsorMatch) {
      const id = sponsorMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const { fields, file } = await parseMultipart(req);
        let logoUrl = fields.logoUrl || undefined;
        if (file && file.buffer.length > 0) {
          logoUrl = await uploadToCloudinary(file.buffer, 'sponsors', file.mimetype);
        }
        const updateData: any = { ...fields };
        if (logoUrl) updateData.logoUrl = logoUrl;
        delete updateData.logo;
        const sponsor = await db.sponsor.update({ where: { id }, data: updateData });
        return res.status(200).json(sponsor);
      }
      if (method === 'DELETE') {
        await db.sponsor.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── EVENTS ───────────────────────────────────────────────
    if (urlPath === '/eventos' || urlPath === '/eventos/') {
      if (method === 'GET') {
        const events = await db.event.findMany({ orderBy: { startsAt: 'desc' } });
        return res.status(200).json(events);
      }
      if (method === 'POST') {
        const event = await db.event.create({ data: { title: req.body.title, slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: req.body.description, location: req.body.location, startsAt: req.body.startsAt, endsAt: req.body.endsAt, coverImage: req.body.coverImage } });
        return res.status(201).json(event);
      }
    }

    const eventMatch = urlPath.match(/^\/eventos\/([^/]+)$/);
    if (eventMatch) {
      const id = eventMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const event = await db.event.update({ where: { id }, data: req.body });
        return res.status(200).json(event);
      }
      if (method === 'DELETE') {
        await db.event.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── USERS ────────────────────────────────────────────────
    if (urlPath === '/users' || urlPath === '/users/') {
      if (method === 'GET') {
        const isActiveParam = req.query.isActive;
        const where = isActiveParam === 'true' ? { isActive: true } : {};
        const users = await db.user.findMany({ where, select: { id: true, name: true, email: true, role: true, avatar: true, position: true, cargos: true, isActive: true, createdAt: true, lastLoginAt: true, lastSeenAt: true }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json(users);
      }
      if (method === 'POST') {
        const { fields, file } = await parseMultipart(req);
        let avatarUrl = fields.avatar || undefined;
        if (file && file.buffer.length > 0) {
          avatarUrl = await uploadToCloudinary(file.buffer, 'avatars', file.mimetype);
        }
        const bcrypt = await import('bcryptjs');
        const hashed = await bcrypt.default.hash(fields.password, 12);
        const cargos = fields.cargos ? (typeof fields.cargos === 'string' ? fields.cargos.split(',').map((s: string) => s.trim()).filter(Boolean) : fields.cargos) : [];
        const isActive = fields.isActive !== undefined ? (fields.isActive === true || fields.isActive === 'true') : true;
        try {
          const newUser = await db.user.create({ data: { name: fields.name, email: fields.email, password: hashed, role: fields.role || 'JORNALISTA', position: fields.position, cargos, avatar: avatarUrl, isActive } });
          return res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
        } catch (err: any) {
          if (err?.code === 'P2002') {
            const field = err?.meta?.target?.includes('email') ? 'e-mail' : 'campo';
            return res.status(409).json({ error: `Já existe um usuário com esse ${field}.` });
          }
          throw err;
        }
      }
    }

    const userMatch = urlPath.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      const id = userMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const { fields, file } = await parseMultipart(req);
        let avatarUrl = fields.avatar || undefined;
        if (file && file.buffer.length > 0) {
          avatarUrl = await uploadToCloudinary(file.buffer, 'avatars', file.mimetype);
        }
        const data: any = { name: fields.name, email: fields.email, role: fields.role, position: fields.position, avatar: avatarUrl };
        if (fields.cargos !== undefined) {
          data.cargos = typeof fields.cargos === 'string' ? fields.cargos.split(',').map((s: string) => s.trim()).filter(Boolean) : fields.cargos;
        }
        if (fields.isActive !== undefined) data.isActive = fields.isActive === true || fields.isActive === 'true';
        if (fields.password) {
          const bcrypt = await import('bcryptjs');
          data.password = await bcrypt.default.hash(fields.password, 12);
        }
        const updated = await db.user.update({ where: { id }, data });
        return res.status(200).json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar, position: updated.position });
      }
      if (method === 'DELETE') {
        // Buscar dados do usuário pra snapshot antes de deletar
        const userToDelete = await db.user.findUnique({ where: { id }, select: { id: true, name: true, avatar: true, position: true } });
        if (!userToDelete) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Preencher snapshots nos artigos onde ele é autor (só nos que ainda não têm cada campo)
        await db.article.updateMany({
          where: { authorId: id, authorNameSnapshot: null },
          data: { authorNameSnapshot: userToDelete.name },
        });
        await db.article.updateMany({
          where: { authorId: id, authorAvatarSnapshot: null },
          data: { authorAvatarSnapshot: userToDelete.avatar },
        });
        // Preencher authorCargo só se ainda não estiver definido no artigo
        await db.article.updateMany({
          where: { authorId: id, authorCargo: null },
          data: { authorCargo: userToDelete.position },
        });

        // Deletar usuário — authorId será zerado automaticamente (SetNull)
        await db.user.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    const pwMatch = urlPath.match(/^\/users\/([^/]+)\/password$/);
    if (pwMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = pwMatch[1];
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.default.hash(req.body.newPassword, 12);
      await db.user.update({ where: { id }, data: { password: hashed } });
      return res.status(200).json({ ok: true });
    }

    // ─── SETTINGS ─────────────────────────────────────────────
    if (urlPath === '/configuracoes' || urlPath === '/configuracoes/') {
      if (method === 'GET') {
        const settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
        return res.status(200).json(settings || {});
      }
      if (method === 'PUT' || method === 'PATCH') {
        const updateData: any = {};
        for (const [key, val] of Object.entries(req.body)) {
          if (val !== undefined) updateData[key] = val;
        }
        // Validar URL do YouTube se liveStreamUrl vier preenchido
        if (updateData.liveStreamUrl && updateData.liveStreamUrl.trim()) {
          const url = updateData.liveStreamUrl.trim();
          const isYouTube = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)/.test(url);
          if (!isYouTube) {
            return res.status(400).json({ error: 'URL inválida. Use um link do YouTube (youtube.com/watch, youtu.be ou youtube.com/live).' });
          }
          updateData.liveStreamUrl = url;
        }
        const settings = await db.siteSettings.update({ where: { id: 'main' }, data: updateData });
        return res.status(200).json(settings);
      }
    }

    // ─── FOOTER LINKS ─────────────────────────────────────────
    if (urlPath === '/links-rodape' || urlPath === '/links-rodape/') {
      if (method === 'GET') {
        const links = await db.footerLink.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(links);
      }
      if (method === 'POST') {
        const { fields, file } = await parseMultipart(req);
        let imageUrl = fields.imageUrl || undefined;
        if (file && file.buffer.length > 0) {
          imageUrl = await uploadToCloudinary(file.buffer, 'footer', file.mimetype);
        }
        const link = await db.footerLink.create({ data: { label: fields.label, href: fields.href, imageUrl, description: fields.description, type: fields.type || 'link', order: parseInt(fields.order || '0', 10) } });
        return res.status(201).json(link);
      }
    }

    const linkMatch = urlPath.match(/^\/links-rodape\/([^/]+)$/);
    if (linkMatch) {
      const id = linkMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const { fields, file } = await parseMultipart(req);
        let imageUrl = fields.imageUrl || undefined;
        if (file && file.buffer.length > 0) {
          imageUrl = await uploadToCloudinary(file.buffer, 'footer', file.mimetype);
        }
        const updateData: any = { ...fields };
        if (imageUrl) updateData.imageUrl = imageUrl;
        const link = await db.footerLink.update({ where: { id }, data: updateData });
        return res.status(200).json(link);
      }
      if (method === 'DELETE') {
        await db.footerLink.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── TAGS ─────────────────────────────────────────────────
    if (urlPath === '/tags' || urlPath === '/tags/') {
      if (method === 'GET') {
        const tags = await db.tag.findMany();
        return res.status(200).json(tags);
      }
      if (method === 'POST') {
        const tag = await db.tag.create({ data: { name: req.body.name, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
        return res.status(201).json(tag);
      }
    }

    const tagMatch = urlPath.match(/^\/tags\/([^/]+)$/);
    if (tagMatch && method === 'DELETE') {
      await db.tag.delete({ where: { id: tagMatch[1] } });
      return res.status(204).end();
    }

    // ─── DASHBOARD ────────────────────────────────────────────
    if (urlPath.startsWith('/dashboard')) {
      if (urlPath === '/dashboard' || urlPath === '/dashboard/') {
        const [totalArticles, totalCategories, totalUsers, totalTags, totalBanners, totalSponsors, recentArticles] = await Promise.all([
          db.article.count(),
          db.category.count(),
          db.user.count(),
          db.tag.count(),
          db.banner.count(),
          db.sponsor.count(),
          db.article.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { category: true, author: { select: { name: true } } } }),
        ]);
        return res.status(200).json({ totalArticles, totalCategories, totalUsers, totalTags, totalBanners, totalSponsors, recentArticles });
      }

      if (urlPath === '/dashboard/categorias' || urlPath === '/dashboard/categorias/') {
        const categories = await db.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { order: 'asc' } });
        return res.status(200).json(categories);
      }

      if (urlPath.startsWith('/dashboard/articles-per-month')) {
        const urlObj = new URL(url, 'http://localhost');
        const months = parseInt(urlObj.searchParams.get('months') || '6');
        const articles = await db.article.findMany({ select: { status: true, createdAt: true } });
        const monthMap: Record<string, { published: number; review: number }> = {};
        for (const a of articles) {
          const d = new Date(a.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap[key]) monthMap[key] = { published: 0, review: 0 };
          if (a.status === 'PUBLISHED') monthMap[key].published++;
          else if (a.status === 'REVIEW') monthMap[key].review++;
        }
        // Fill trailing months with 0 so charts always have N data points
        const filled: Record<string, { published: number; review: number }> = {};
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          filled[key] = monthMap[key] || { published: 0, review: 0 };
        }
        const result = Object.entries(filled).map(([month, v]) => ({ month, ...v }));
        return res.status(200).json(result);
      }
      if (urlPath.startsWith('/dashboard/articles-per-year')) {
        const urlObj = new URL(url, 'http://localhost');
        const years = parseInt(urlObj.searchParams.get('years') || '5');
        const articles = await db.article.findMany({ select: { status: true, createdAt: true } });
        const yearMap: Record<string, { published: number; review: number; draft: number }> = {};
        for (const a of articles) {
          const y = String(new Date(a.createdAt).getFullYear());
          if (!yearMap[y]) yearMap[y] = { published: 0, review: 0, draft: 0 };
          if (a.status === 'PUBLISHED') yearMap[y].published++;
          else if (a.status === 'REVIEW') yearMap[y].review++;
          else if (a.status === 'DRAFT') yearMap[y].draft++;
        }
        // Fill trailing years with 0
        const filled: Record<string, { published: number; review: number; draft: number }> = {};
        const currentYear = new Date().getFullYear();
        for (let i = years - 1; i >= 0; i--) {
          const y = String(currentYear - i);
          filled[y] = yearMap[y] || { published: 0, review: 0, draft: 0 };
        }
        const result = Object.entries(filled).map(([year, v]) => ({ year, ...v }));
        return res.status(200).json(result);
      }
      if (urlPath.startsWith('/dashboard/views-per-month')) {
        const urlObj = new URL(url, 'http://localhost');
        const months = parseInt(urlObj.searchParams.get('months') || '6');
        const views = await db.articleView.findMany({ select: { viewedAt: true, ipHash: true } });
        const monthMap: Record<string, { reads: number; uniqueReaders: number; ips: Set<string> }> = {};
        for (const v of views) {
          const d = new Date(v.viewedAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap[key]) monthMap[key] = { reads: 0, uniqueReaders: 0, ips: new Set() };
          monthMap[key].reads++;
          monthMap[key].ips.add(v.ipHash);
        }
        // Fill trailing months with 0
        const filled: Record<string, { reads: number; uniqueReaders: number }> = {};
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const entry = monthMap[key];
          filled[key] = { reads: entry ? entry.reads : 0, uniqueReaders: entry ? entry.ips.size : 0 };
        }
        const result = Object.entries(filled).map(([month, v]) => ({ month, ...v }));
        return res.status(200).json(result);
      }
      if (urlPath.startsWith('/dashboard/views-per-year')) {
        const urlObj = new URL(url, 'http://localhost');
        const years = parseInt(urlObj.searchParams.get('years') || '5');
        const views = await db.articleView.findMany({ select: { viewedAt: true, ipHash: true } });
        const yearMap: Record<string, { reads: number; ips: Set<string> }> = {};
        for (const v of views) {
          const y = String(new Date(v.viewedAt).getFullYear());
          if (!yearMap[y]) yearMap[y] = { reads: 0, ips: new Set() };
          yearMap[y].reads++;
          yearMap[y].ips.add(v.ipHash);
        }
        // Fill trailing years with 0
        const filled: Record<string, { reads: number; uniqueReaders: number }> = {};
        const currentYear = new Date().getFullYear();
        for (let i = years - 1; i >= 0; i--) {
          const y = String(currentYear - i);
          const entry = yearMap[y];
          filled[y] = { reads: entry ? entry.reads : 0, uniqueReaders: entry ? entry.ips.size : 0 };
        }
        const result = Object.entries(filled).map(([year, v]) => ({ year, ...v }));
        return res.status(200).json(result);
      }
    }

    // ─── SETTINGS LOGO ────────────────────────────────────────
    if (urlPath === '/configuracoes/logo' && method === 'PUT') {
      const { file } = await parseMultipart(req);
      if (!file || file.buffer.length === 0) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }
      const logoUrl = await uploadToCloudinary(file.buffer, 'settings', file.mimetype);
      await db.siteSettings.update({ where: { id: 'main' }, data: { logoUrl } });
      return res.status(200).json({ logoUrl });
    }

    // ─── CONTENT IMAGE UPLOAD ─────────────────────────────────
    if (urlPath === '/articles/content-image' && method === 'POST') {
      try {
        const { image } = req.body as any;
        if (!image || !image.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Envie uma imagem base64 válida.' });
        }
        const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!match) {
          return res.status(400).json({ error: 'Formato base64 inválido.' });
        }
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const url = await uploadImage(buffer, 'articles', mimeType);
        return res.status(200).json({ url });
      } catch (err: any) {
        console.error('[CONTENT_IMAGE] Error:', err.message);
        return res.status(500).json({ error: 'Falha ao fazer upload da imagem.' });
      }
    }

    // ─── RESET VIEW COUNTS ────────────────────────────────────
    if (urlPath === '/reset-viewcounts' && method === 'POST') {
      // Zera todos os viewCount e recalcula a partir de articleView (IPs únicos por dia)
      await db.article.updateMany({ data: { viewCount: 0 } });
      const uniqueViews = await db.articleView.groupBy({
        by: ['articleId'],
        _count: { id: true },
      });
      let updated = 0;
      for (const row of uniqueViews) {
        await db.article.update({
          where: { id: row.articleId },
          data: { viewCount: row._count.id },
        });
        updated++;
      }
      return res.status(200).json({ ok: true, reset: true, articlesRecalculated: updated });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Admin handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
