// src/modules/articles/public/articles-public.routes.ts
//
// ⚠️ CÓDIGO MORTO EM PRODUÇÃO — O Fastify (src/app.ts) NÃO é deployado
// no Vercel. Todas as rotas públicas rodam via api/index.ts (serverless).
// A lógica de view tracking deste arquivo foi movida para api/index.ts.
// Este arquivo existe apenas para referência histórica e possíveis
// testes locais com o servidor Fastify.
import type { FastifyInstance } from 'fastify';
import { articlePublicController } from '../../../shared/container';
import { trendingQuerySchema } from '../articles.schema';
import { getVisitorHash } from '../../../shared/services/visitor';
import { prisma } from '../../../shared/database/prisma';

export async function articlePublicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/articles/trending', { schema: trendingQuerySchema }, articlePublicController.trending);

  // POST /articles/view — registra uma visualização do cliente (browser)
  // Chamado pelo frontend via useEffect para contar views reais por IP
  app.post('/articles/view', async (request, reply) => {
    const { slug } = request.body as { slug?: string };
    if (!slug) return reply.code(400).send({ error: 'slug é obrigatório.' });

    const article = await prisma.article.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!article) return reply.code(404).send({ error: 'Artigo não encontrado.' });

    const ipHash = getVisitorHash(request);
    const userAgent = request.headers['user-agent'];
    const isBot = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|googlebot|bingbot/i.test(userAgent || '');

    if (!isBot) {
      const now = new Date();
      const viewBucket = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      try {
        await prisma.articleView.create({
          data: {
            articleId: article.id,
            ipHash,
            userAgent: userAgent?.slice(0, 255) ?? null,
            viewBucket,
          },
        });
      } catch (err: any) {
        // P2002 = já registrou hoje, ignora
        if (err?.code !== 'P2002') throw err;
      }
    }

    return reply.send({ ok: true });
  });
}