import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.articleView.deleteMany({}),
    prisma.article.updateMany({ data: { viewCount: 0 } }),
  ]);
  console.log('Reset concluído: article_views apagado e viewCount zerado.');
}

main()
  .catch((e) => { console.error('Erro:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
