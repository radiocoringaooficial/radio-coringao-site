// prisma/reset-view-counts.ts
// Reseta viewCount e recalcula baseado em IPs únicos reais (articleView)
// Execute com: npx tsx prisma/reset-view-counts.ts

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetando viewCount dos artigos...\n');

  // 1. Zera todos os viewCount
  const result = await prisma.article.updateMany({
    data: { viewCount: 0 },
  });
  console.log(`✅ ${result.count} artigos tiveram viewCount resetado para 0\n`);

  // 2. Recalcula viewCount baseado em IPs únicos reais da tabela articleView
  // Cada registro em articleView = 1 IP único por dia por artigo (constraint única)
  console.log('📊 Recalculando viewCount a partir de articleView (IPs únicos por dia)...\n');

  const uniqueViews = await prisma.articleView.groupBy({
    by: ['articleId'],
    _count: { id: true },
  });

  let updated = 0;
  for (const row of uniqueViews) {
    await prisma.article.update({
      where: { id: row.articleId },
      data: { viewCount: row._count.id },
    });
    updated++;
  }

  console.log(`✅ ${updated} artigos tiveram viewCount recalculado\n`);

  // 3. Lista os artigos para confirmar
  const articles = await prisma.article.findMany({
    select: { title: true, viewCount: true, status: true },
    orderBy: { viewCount: 'desc' },
  });

  console.log('📋 Artigos com views reais (por IP único/dia):');
  for (const a of articles) {
    console.log(`   [${a.status}] ${a.title} — ${a.viewCount} views`);
  }

  console.log('\n✅ Pronto! Views reais por IP único.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
