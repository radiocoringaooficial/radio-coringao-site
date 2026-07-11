import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Placeholder images from picsum.photos (reliable, free)
const articleImages = [
  'https://picsum.photos/seed/corinthians1/800/500',
  'https://picsum.photos/seed/corinthians2/800/500',
  'https://picsum.photos/seed/corinthians3/800/500',
  'https://picsum.photos/seed/corinthians4/800/500',
  'https://picsum.photos/seed/corinthians5/800/500',
  'https://picsum.photos/seed/corinthians6/800/500',
  'https://picsum.photos/seed/corinthians7/800/500',
  'https://picsum.photos/seed/corinthians8/800/500',
  'https://picsum.photos/seed/corinthians9/800/500',
  'https://picsum.photos/seed/corinthians10/800/500',
  'https://picsum.photos/seed/corinthians11/800/500',
  'https://picsum.photos/seed/corinthians12/800/500',
  'https://picsum.photos/seed/corinthians13/800/500',
  'https://picsum.photos/seed/corinthians14/800/500',
  'https://picsum.photos/seed/corinthians15/800/500',
  'https://picsum.photos/seed/corinthians16/800/500',
  'https://picsum.photos/seed/corinthians17/800/500',
  'https://picsum.photos/seed/corinthians18/800/500',
  'https://picsum.photos/seed/corinthians19/800/500',
  'https://picsum.photos/seed/corinthians20/800/500',
  'https://picsum.photos/seed/corinthians21/800/500',
  'https://picsum.photos/seed/corinthians22/800/500',
];

const bannerImages = [
  'https://picsum.photos/seed/banner1/1200/400',
  'https://picsum.photos/seed/banner2/1200/400',
  'https://picsum.photos/seed/banner3/1200/400',
];

const sponsorLogos = [
  'https://picsum.photos/seed/sponsor1/200/100',
  'https://picsum.photos/seed/sponsor2/200/100',
  'https://picsum.photos/seed/sponsor3/200/100',
  'https://picsum.photos/seed/sponsor4/200/100',
];

async function main() {
  console.log('🔧 Corrigindo URLs de imagens...\n');

  // Fix article cover images
  const articles = await prisma.article.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`📰 Artigos encontrados: ${articles.length}`);

  for (let i = 0; i < articles.length; i++) {
    const imgUrl = articleImages[i % articleImages.length];
    await prisma.article.update({
      where: { id: articles[i].id },
      data: { coverImage: imgUrl },
    });
  }
  console.log(`   ✅ ${articles.length} capas de artigos atualizadas`);

  // Fix banner images
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`🖼️  Banners encontrados: ${banners.length}`);

  for (let i = 0; i < banners.length; i++) {
    const imgUrl = bannerImages[i % bannerImages.length];
    await prisma.banner.update({
      where: { id: banners[i].id },
      data: { imageUrl: imgUrl },
    });
  }
  console.log(`   ✅ ${banners.length} imagens de banners atualizadas`);

  // Fix sponsor logos
  const sponsors = await prisma.sponsor.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`💼 Patrocinadores encontrados: ${sponsors.length}`);

  for (let i = 0; i < sponsors.length; i++) {
    const logoUrl = sponsorLogos[i % sponsorLogos.length];
    await prisma.sponsor.update({
      where: { id: sponsors[i].id },
      data: { logoUrl },
    });
  }
  console.log(`   ✅ ${sponsors.length} logos de patrocinadores atualizados`);

  // Fix event images
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`📅 Eventos encontrados: ${events.length}`);

  for (let i = 0; i < events.length; i++) {
    const imgUrl = `https://picsum.photos/seed/event${i + 1}/800/400`;
    await prisma.event.update({
      where: { id: events[i].id },
      data: { coverImage: imgUrl },
    });
  }
  console.log(`   ✅ ${events.length} imagens de eventos atualizadas`);

  // Fix site settings logo
  await prisma.siteSettings.update({
    where: { id: 'main' },
    data: {
      logoUrl: 'https://picsum.photos/seed/logo/200/200',
      faviconUrl: 'https://picsum.photos/seed/favicon/32/32',
    },
  });
  console.log(`   ✅ Logo e favicon do site atualizados`);

  console.log('\n🎉 Todas as imagens corrigidas!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
