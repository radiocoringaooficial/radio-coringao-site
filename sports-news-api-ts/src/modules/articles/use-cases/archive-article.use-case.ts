// src/modules/articles/use-cases/archive-article.use-case.ts
import type { IArticleAdminRepository } from '../repositories/article-admin.repository.interface';
import type { Role } from '../../../shared/entities';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors';
import { ErrorCode } from '../../../shared/errors/error-codes';
import { hasPermission } from '../../../shared/plugins/permissions.plugin';
import { logger as rootLogger, type Logger } from '../../../shared/logger';

export class ArchiveArticleUseCase {
  private readonly log: Logger;

  constructor(private readonly repo: IArticleAdminRepository, log?: Logger) {
    this.log = log ?? rootLogger.child({ useCase: 'ArchiveArticle' });
  }

  async execute(id: string, userRole: Role) {
    if (!hasPermission(userRole, 'articles:archive')) {
      throw new ForbiddenError('Seu cargo não permite arquivar artigos.');
    }

    const article = await this.repo.findById(id);
    if (!article) throw new NotFoundError('Artigo não encontrado.');

    const isFeatured = Boolean((article as any).isFeatured);
    const order = Number((article as any).order) || 0;
    this.log.debug({ articleId: id, isFeatured, order }, 'Verificação de destaque antes de arquivar');

    if ((article as any).status === 'ARCHIVED') {
      return { message: 'Artigo já está arquivado.', article };
    }

    if (isFeatured && order > 0) {
      throw new ConflictError(ErrorCode.ARTICLE_FEATURED_CANNOT_ARCHIVE, {
        articleId: id,
        order: (article as any).order,
        message: `Este artigo está em destaque na posição ${(article as any).order} da home. Publique outro artigo nessa mesma posição para liberar o arquivamento.`,
      });
    }

    const updated = await this.repo.update(id, { status: 'ARCHIVED' } as any);

    this.log.info({ articleId: id, userRole }, 'Artigo arquivado');

    return { message: 'Artigo arquivado com sucesso.', article: updated };
  }
}
