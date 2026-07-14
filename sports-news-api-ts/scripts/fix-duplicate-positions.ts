/**
 * Script para corrigir artigos featured com order duplicado.
 * 
 * Regra: para cada valor de order (1-12) que tenha mais de 1 artigo,
 * mantém o mais recente (createdAt) na posição e reseta os outros pra 0.
 * 
 * Uso: npx tsx scripts/fix-duplicate-positions.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Fix Duplicate Positions ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const featured = await prisma.article.findMany({
    where: { status: 'PUBLISHED', isFeatured: true, order: { gt: 0 } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, order: true, createdAt: true },
  });

  console.log(`Artigos featured com order > 0: ${featured.length}\n`);

  // Agrupar por order
  const byOrder = new Map<number, typeof featured>();
  for (const a of featured) {
    const o = a.order;
    if (!byOrder.has(o)) byOrder.set(o, []);
    byOrder.get(o)!.push(a);
  }

  let fixCount = 0;

  for (const [order, articles] of byOrder) {
    if (articles.length <= 1) continue;

    console.log(`Order ${order}: ${articles.length} artigos (CONFLITO)`);
    
    // Ordenar por createdAt desc — o mais recente fica na posição
    articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const keep = articles[0];
    const reset = articles.slice(1);

    console.log(`  MANTER: ${keep.id.slice(0, 12)}... "${keep.title.slice(0, 40)}"`);
    for (const a of reset) {
      console.log(`  RESETAR: ${a.id.slice(0, 12)}... "${a.title.slice(0, 40)}" → order=0`);
      if (!DRY_RUN) {
        await prisma.article.update({ where: { id: a.id }, data: { order: 0 } });
      }
      fixCount++;
    }
    console.log();
  }

  if (fixCount === 0) {
    console.log('Nenhum conflito encontrado.');
  } else {
    console.log(`Total de artigos resetados: ${fixCount}`);
    if (DRY_RUN) console.log('(DRY RUN — nenhuma alteração foi feita)');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
