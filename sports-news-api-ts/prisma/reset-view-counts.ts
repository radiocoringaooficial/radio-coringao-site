// prisma/reset-view-counts.ts
// Reseta os viewCount inflados para 0 no banco de dados
// Execute com: npx tsx prisma/reset-view-counts.ts

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetando viewCount dos artigos...\n');

  // Zera todos os viewCount
  const result = await prisma.article.updateMany({
    data: { viewCount: 0 },
  });

  console.log(`✅ ${result.count} artigos tiveram viewCount resetado para 0\n`);

  // Lista os artigos para confirmar
  const articles = await prisma.article.findMany({
    select: { title: true, viewCount: true, status: true },
    orderBy: { publishedAt: 'desc' },
  });

  console.log('📋 Artigos atuais:');
  for (const a of articles) {
    console.log(`   [${a.status}] ${a.title} — ${a.viewCount} views`);
  }

  console.log('\n✅ Pronto! Views reais começarão a ser contadas a partir de agora.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
