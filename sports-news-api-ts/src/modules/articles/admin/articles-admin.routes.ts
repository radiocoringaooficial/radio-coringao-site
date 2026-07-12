// src/modules/articles/admin/articles-admin.routes.ts
import type { FastifyInstance } from 'fastify';
import { articleAdminController } from '../../../shared/container';
import { updateArticleStatusSchema } from '../articles.schema';
import { requirePermission } from '../../../shared/plugins/permissions.plugin';
import { createUploadHandler } from '../../../shared/plugins/upload.plugin';
import { prisma } from '../../../shared/database/prisma';
import { uploadImage } from '../../../shared/services/cloudinary';

const uploadArticle = createUploadHandler('articles');

export async function articleAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/materias',        articleAdminController.list);
  app.get('/articles/search', articleAdminController.search);
  app.get('/articles/:id',    articleAdminController.getById);

  // Upload de imagem inline do conteúdo (base64 → Cloudinary)
  app.post('/articles/content-image', { preHandler: [requirePermission('articles:edit_own')] }, async (request, reply) => {
    const { image } = request.body as { image?: string };
    if (!image || !image.startsWith('data:image/')) {
      return reply.code(400).send({ error: 'Envie uma imagem base64 válida.' });
    }

    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return reply.code(400).send({ error: 'Formato base64 inválido.' });
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const url = await uploadImage(buffer, 'articles', mimeType);
    return reply.send({ url });
  });

  app.post(
    '/materias',
    { preHandler: [requirePermission('articles:create'), uploadArticle] },
    articleAdminController.create,
  );

  app.patch(
    '/articles/:id',
    { preHandler: [requirePermission('articles:edit_own'), uploadArticle] },
    articleAdminController.update,
  );

  app.patch(
    '/articles/:id/status',
    { preHandler: [requirePermission('articles:submit')], schema: updateArticleStatusSchema },
    articleAdminController.updateStatus,
  );

  app.delete(
    '/articles/:id',
    { preHandler: [requirePermission('articles:delete')] },
    articleAdminController.delete,
  );

  app.post(
    '/articles/:id/images',
    { preHandler: [uploadArticle] },
    articleAdminController.addImage,
  );

  app.delete('/articles/:id/images/:imageId', articleAdminController.deleteImage);

  // ── Arquivo ────────────────────────────────────────────────
  app.patch(
    '/articles/:id/archive',
    { preHandler: [requirePermission('articles:archive')] },
    articleAdminController.archive,
  );

  app.patch(
    '/articles/:id/unarchive',
    { preHandler: [requirePermission('articles:archive')] },
    articleAdminController.unarchive,
  );

  // ── Resetar viewCount de todos os artigos ────────────────
  app.post('/articles/reset-view-counts', { preHandler: [requirePermission('articles:delete')] }, async (_request, reply) => {
    const result = await prisma.article.updateMany({ data: { viewCount: 0 } });
    return reply.send({ reset: true, count: result.count });
  });
}
