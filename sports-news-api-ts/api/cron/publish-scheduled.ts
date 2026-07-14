import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proteção: só Vercel Cron pode chamar este endpoint
function verifyCronSecret(req: VercelRequest): boolean {
  const auth = req.headers.authorization;
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Sem secret configurado, permite (dev)
  return auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const now = new Date();
    const safeNow = new Date(now.getTime() - 30_000);

    const articles = await prisma.article.findMany({
      where: {
        scheduledAt: { lte: safeNow },
        status: { in: ['DRAFT', 'REVIEW'] },
      },
      select: { id: true, title: true, scheduledAt: true },
    });

    if (articles.length === 0) {
      await prisma.$disconnect();
      return res.status(200).json({ published: 0, message: 'No articles to publish' });
    }

    const results = await Promise.allSettled(
      articles.map((article) =>
        prisma.article.update({
          where: { id: article.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: article.scheduledAt ?? now,
          },
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    await prisma.$disconnect();

    return res.status(200).json({
      published: succeeded,
      failed,
      total: articles.length,
      articles: articles.map((a) => ({ id: a.id, title: a.title })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
