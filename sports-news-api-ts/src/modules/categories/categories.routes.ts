// src/modules/categories/categories.routes.ts
import type { FastifyInstance } from 'fastify';
import { categoryController } from '../../shared/container';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import { requirePermission } from '../../shared/plugins/permissions.plugin';

export async function categoryPublicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/categorias', categoryController.listPublic);
}

export async function categoryAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/categorias', categoryController.listAdmin);

  app.post(
    '/categorias',
    { preHandler: [requirePermission('categories:manage')], schema: createCategorySchema },
    categoryController.create,
  );

  app.patch(
    '/categorias/:id',
    { preHandler: [requirePermission('categories:manage')], schema: updateCategorySchema },
    categoryController.update,
  );

  app.delete(
    '/categorias/:id',
    { preHandler: [requirePermission('categories:delete')] },
    categoryController.delete,
  );
}
