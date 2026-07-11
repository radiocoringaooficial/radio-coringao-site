import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url?.replace('/api/admin', '') || '/';
  const method = req.method || 'GET';

  try {
    const db = await getPrisma();

    // ─── LOGIN ────────────────────────────────────────────────
    if (url === '/login' && method === 'POST') {
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, position: user.position },
      });
    }

    // All admin routes require auth
    let user: any;
    try { user = verifyToken(req); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    // ─── DASHBOARD ────────────────────────────────────────────
    if (url === '/dashboard' || url === '/dashboard/') {
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

    if (url === '/dashboard/categorias' || url === '/dashboard/categorias/') {
      const categories = await db.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { order: 'asc' } });
      return res.status(200).json(categories);
    }

    // ─── ARTICLES ─────────────────────────────────────────────
    if (url === '/materias' || url.startsWith('/materias?')) {
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
        const body = req.body;
        const article = await db.article.create({ data: { title: body.title, slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), content: body.content || '', excerpt: body.excerpt, status: body.status || 'DRAFT', type: body.type || 'NEWS', isFeatured: body.isFeatured || false, isBreaking: body.isBreaking || false, authorId: body.authorId || user.id, categoryId: body.categoryId, coverImage: body.coverImage, publishedAt: body.status === 'PUBLISHED' ? new Date() : null } });
        return res.status(201).json(article);
      }
    }

    // Article by ID
    const articleMatch = url.match(/^\/materias\/([^/]+)$/);
    if (articleMatch) {
      const id = articleMatch[1];
      if (method === 'GET') {
        const article = await db.article.findUnique({ where: { id }, include: { category: true, author: { select: { id: true, name: true, email: true, role: true } }, tags: { include: { tag: true } }, images: true } });
        return res.status(200).json(article);
      }
      if (method === 'PUT' || method === 'PATCH') {
        const body = req.body;
        const article = await db.article.update({ where: { id }, data: { title: body.title, slug: body.slug, content: body.content, excerpt: body.excerpt, status: body.status, type: body.type, isFeatured: body.isFeatured, isBreaking: body.isBreaking, categoryId: body.categoryId, coverImage: body.coverImage, publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined } });
        return res.status(200).json(article);
      }
      if (method === 'DELETE') {
        await db.article.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // Article status
    const statusMatch = url.match(/^\/materias\/([^/]+)\/status$/);
    if (statusMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = statusMatch[1];
      const { status } = req.body || {};
      await db.article.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined } });
      return res.status(200).json({ ok: true });
    }

    // ─── ARTICLES (alias /articles → same as /materias) ────────
    if (url === '/articles' || url.startsWith('/articles?')) {
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

    const articleIdMatch = url.match(/^\/articles\/([^/]+)$/);
    if (articleIdMatch) {
      const id = articleIdMatch[1];
      if (method === 'GET') {
        const article = await db.article.findUnique({ where: { id }, include: { category: true, author: { select: { id: true, name: true, email: true, role: true } }, tags: { include: { tag: true } }, images: true } });
        return res.status(200).json(article);
      }
      if (method === 'PUT' || method === 'PATCH') {
        const body = req.body;
        const article = await db.article.update({ where: { id }, data: { title: body.title, slug: body.slug, content: body.content, excerpt: body.excerpt, status: body.status, type: body.type, isFeatured: body.isFeatured, isBreaking: body.isBreaking, categoryId: body.categoryId, coverImage: body.coverImage, publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined } });
        return res.status(200).json(article);
      }
      if (method === 'DELETE') {
        await db.article.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    const articleStatusMatch = url.match(/^\/articles\/([^/]+)\/status$/);
    if (articleStatusMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = articleStatusMatch[1];
      const { status } = req.body || {};
      await db.article.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined } });
      return res.status(200).json({ ok: true });
    }

    // Articles archive/unarchive
    const articleArchiveMatch = url.match(/^\/articles\/([^/]+)\/archive$/);
    if (articleArchiveMatch && method === 'PATCH') {
      const id = articleArchiveMatch[1];
      await db.article.update({ where: { id }, data: { status: 'ARCHIVED' } });
      return res.status(200).json({ ok: true });
    }
    const articleUnarchiveMatch = url.match(/^\/articles\/([^/]+)\/unarchive$/);
    if (articleUnarchiveMatch && method === 'PATCH') {
      const id = articleUnarchiveMatch[1];
      await db.article.update({ where: { id }, data: { status: 'DRAFT' } });
      return res.status(200).json({ ok: true });
    }

    // Content image upload (inline)
    if (url === '/articles/content-image' && method === 'POST') {
      return res.status(200).json({ url: '' });
    }

    // ─── CATEGORIES ───────────────────────────────────────────
    if (url === '/categorias' || url === '/categorias/') {
      if (method === 'GET') {
        const categories = await db.category.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { articles: true } } } });
        return res.status(200).json(categories);
      }
      if (method === 'POST') {
        const cat = await db.category.create({ data: { name: req.body.name, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: req.body.description, color: req.body.color, icon: req.body.icon, order: req.body.order || 0 } });
        return res.status(201).json(cat);
      }
    }

    const catMatch = url.match(/^\/categorias\/([^/]+)$/);
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
        const count = await db.article.count({ where: { categoryId: id } });
        if (count > 0) {
          let fallback = await db.category.findFirst({ where: { name: 'Sem Categoria' } });
          if (!fallback) {
            fallback = await db.category.create({ data: { name: 'Sem Categoria', slug: 'sem-categoria', order: 999 } });
          }
          await db.article.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
        }
        await db.category.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── BANNERS ──────────────────────────────────────────────
    if (url === '/banners' || url === '/banners/') {
      if (method === 'GET') {
        const banners = await db.banner.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(banners);
      }
      if (method === 'POST') {
        const banner = await db.banner.create({ data: { title: req.body.title, subtitle: req.body.subtitle, imageUrl: req.body.imageUrl, linkUrl: req.body.linkUrl, position: req.body.position || 'home-top', order: req.body.order || 0 } });
        return res.status(201).json(banner);
      }
    }

    const bannerMatch = url.match(/^\/banners\/([^/]+)$/);
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
    if (url === '/menu' || url === '/menu/') {
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
        const item = await db.menuItem.create({ data: { label: req.body.label, url: req.body.url, target: req.body.target || '_self', order: req.body.order || 0, isActive: req.body.isActive ?? true, parentId: req.body.parentId || null } });
        return res.status(201).json(item);
      }
    }

    const menuMatch = url.match(/^\/menu\/([^/]+)$/);
    if (menuMatch) {
      const id = menuMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const item = await db.menuItem.update({ where: { id }, data: req.body });
        return res.status(200).json(item);
      }
      if (method === 'DELETE') {
        await db.menuItem.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── SPONSORS ─────────────────────────────────────────────
    if (url === '/patrocinadores' || url === '/patrocinadores/') {
      if (method === 'GET') {
        const sponsors = await db.sponsor.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(sponsors);
      }
      if (method === 'POST') {
        const sponsor = await db.sponsor.create({ data: { name: req.body.name, logoUrl: req.body.logoUrl, websiteUrl: req.body.websiteUrl, description: req.body.description, order: req.body.order || 0 } });
        return res.status(201).json(sponsor);
      }
    }

    const sponsorMatch = url.match(/^\/patrocinadores\/([^/]+)$/);
    if (sponsorMatch) {
      const id = sponsorMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const sponsor = await db.sponsor.update({ where: { id }, data: req.body });
        return res.status(200).json(sponsor);
      }
      if (method === 'DELETE') {
        await db.sponsor.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── EVENTS ───────────────────────────────────────────────
    if (url === '/eventos' || url === '/eventos/') {
      if (method === 'GET') {
        const events = await db.event.findMany({ orderBy: { startsAt: 'desc' } });
        return res.status(200).json(events);
      }
      if (method === 'POST') {
        const event = await db.event.create({ data: { title: req.body.title, slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: req.body.description, location: req.body.location, startsAt: req.body.startsAt, endsAt: req.body.endsAt, coverImage: req.body.coverImage } });
        return res.status(201).json(event);
      }
    }

    const eventMatch = url.match(/^\/eventos\/([^/]+)$/);
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
    if (url === '/users' || url === '/users/') {
      if (method === 'GET') {
        const users = await db.user.findMany({ select: { id: true, name: true, email: true, role: true, avatar: true, position: true, isActive: true, createdAt: true, lastLoginAt: true }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json(users);
      }
      if (method === 'POST') {
        const bcrypt = await import('bcryptjs');
        const hashed = await bcrypt.default.hash(req.body.password, 12);
        const newUser = await db.user.create({ data: { name: req.body.name, email: req.body.email, password: hashed, role: req.body.role || 'JORNALISTA', position: req.body.position, avatar: req.body.avatar } });
        return res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
      }
    }

    const userMatch = url.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      const id = userMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const data: any = { name: req.body.name, email: req.body.email, role: req.body.role, position: req.body.position, avatar: req.body.avatar, isActive: req.body.isActive };
        if (req.body.password) {
          const bcrypt = await import('bcryptjs');
          data.password = await bcrypt.default.hash(req.body.password, 12);
        }
        const updated = await db.user.update({ where: { id }, data });
        return res.status(200).json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
      }
      if (method === 'DELETE') {
        await db.user.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    const pwMatch = url.match(/^\/users\/([^/]+)\/password$/);
    if (pwMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = pwMatch[1];
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.default.hash(req.body.newPassword, 12);
      await db.user.update({ where: { id }, data: { password: hashed } });
      return res.status(200).json({ ok: true });
    }

    // ─── SETTINGS ─────────────────────────────────────────────
    if (url === '/configuracoes' || url === '/configuracoes/') {
      if (method === 'GET') {
        const settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
        return res.status(200).json(settings || {});
      }
      if (method === 'PUT' || method === 'PATCH') {
        const settings = await db.siteSettings.update({ where: { id: 'main' }, data: req.body });
        return res.status(200).json(settings);
      }
    }

    // ─── FOOTER LINKS ─────────────────────────────────────────
    if (url === '/links-rodape' || url === '/links-rodape/') {
      if (method === 'GET') {
        const links = await db.footerLink.findMany({ orderBy: { order: 'asc' } });
        return res.status(200).json(links);
      }
      if (method === 'POST') {
        const link = await db.footerLink.create({ data: { label: req.body.label, href: req.body.href, imageUrl: req.body.imageUrl, description: req.body.description, type: req.body.type || 'link', order: req.body.order || 0 } });
        return res.status(201).json(link);
      }
    }

    const linkMatch = url.match(/^\/links-rodape\/([^/]+)$/);
    if (linkMatch) {
      const id = linkMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const link = await db.footerLink.update({ where: { id }, data: req.body });
        return res.status(200).json(link);
      }
      if (method === 'DELETE') {
        await db.footerLink.delete({ where: { id } });
        return res.status(204).end();
      }
    }

    // ─── TAGS ─────────────────────────────────────────────────
    if (url === '/tags' || url === '/tags/') {
      if (method === 'GET') {
        const tags = await db.tag.findMany();
        return res.status(200).json(tags);
      }
      if (method === 'POST') {
        const tag = await db.tag.create({ data: { name: req.body.name, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
        return res.status(201).json(tag);
      }
    }

    const tagMatch = url.match(/^\/tags\/([^/]+)$/);
    if (tagMatch && method === 'DELETE') {
      await db.tag.delete({ where: { id: tagMatch[1] } });
      return res.status(204).end();
    }

    // ─── DASHBOARD ────────────────────────────────────────────
    if (url.startsWith('/dashboard')) {
      if (url === '/dashboard' || url === '/dashboard/') {
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

      if (url === '/dashboard/categorias' || url === '/dashboard/categorias/') {
        const categories = await db.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { order: 'asc' } });
        return res.status(200).json(categories);
      }

      if (url.startsWith('/dashboard/articles-per-year')) {
        return res.status(200).json([]);
      }
      if (url.startsWith('/dashboard/articles-per-month')) {
        return res.status(200).json([]);
      }
      if (url.startsWith('/dashboard/views-per-year')) {
        return res.status(200).json([]);
      }
      if (url.startsWith('/dashboard/views-per-month')) {
        return res.status(200).json([]);
      }
    }

    // ─── SETTINGS LOGO ────────────────────────────────────────
    if (url === '/configuracoes/logo' && method === 'PUT') {
      return res.status(200).json({ ok: true });
    }

    // ─── CONTENT IMAGE UPLOAD ─────────────────────────────────
    if (url === '/articles/content-image' && method === 'POST') {
      return res.status(200).json({ url: '' });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('Admin handler error:', err?.message);
    return res.status(500).json({ error: 'Server error', message: err?.message });
  }
}
