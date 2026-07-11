import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'def661xyl',
  api_key: '442261137748664',
  api_secret: '5trkPaPoG2d3WCox6iLrEOptj-A',
});

const prisma = new PrismaClient();

// Base path for images
const IMAGES_BASE = path.join(__dirname, '../../imagens');

// Mapping of article titles to local image files
const articleImageMap: Record<string, string> = {
  'Thiago Monteiro chega à semifinal do ATP 250 de Bastad': 'artigos-imagens/14620961_x240.jpg',
  'Classificação do Brasileirão 2026: Corinthians lidera': 'artigos-imagens/corinthians_goleia_o_taubate_em_terceira_partida_okbm.jpg',
  'AO VIVO: Corinthians x Palmeiras — Derby Paulista': 'artigos-imagens/55148738492_e8e22a02d8_o-860x573.webp',
  'Corinthians enfrenta o Peñarol na Libertadores': 'artigos-imagens/1694382539bcb41ccdc4363c6848a1d760f26c28a0.jpg',
  'Corinthians avança para semifinal da Copa do Brasil': 'artigos-imagens/1712988143d91d1b4d82419de8a614abce9cc0e6d4.jpg',
  'Garoto da base do Corinthians é convocado': 'artigos-imagens/16114182198b0dc65f996f98fd178a9defd0efa077.jpg',
  'Neo Química Arena recebe reforma': 'artigos-imagens/1571422677ab013ca67cf2d50796b0c11d1b8bc95d.jpg',
  'Corinthians Feminino goleia o Palmeiras': 'artigos-imagens/millene-comemora-gol-do-corinthians-contra-o-flamengo-na-supercopa-feminina-1676213654386_v2_4x3.jpg',
  'Corinthians x Palmeiras — Análise Tática': 'artigos-imagens/corinthians-depay-scaled-aspect-ratio-512-320-1.webp',
  'Memphis Depay: "O Corinthians é a maior paixão"': 'artigos-imagens/memphis-depay-deve-iniciar-o-confronto-diante-do-ds.jpg',
  'Renovação de contrato com Yuri Alberto': 'artigos-imagens/gustavo-henrique-rodrigo-coca-corinthians_fixed_large.webp',
  'Corinthians é o maior candidato ao hexa': 'artigos-imagens/jogadores_do_corinthians_comemorando_gol_na_n8aa.jpg',
  'Ramón Díaz é eleito melhor treinador': 'artigos-imagens/_113840941_27912580_2122986157934139_8111180633564001251_o.jpg.webp',
  'Corinthians negocia meia argentino': 'artigos-imagens/1778261246ca373d8541ebfad27ea80c4f12483607.png',
  'Copa do Mundo 2026: Neo Química Arena': 'artigos-imagens/GetTyImages-2247699932.webp',
  'Corinthians Basquete vence o Franca': 'artigos-imagens/images (1).jpeg',
  'Luta do século: Charles Oliveira': 'artigos-imagens/images (2).jpeg',
  'Stock Car: Thiago Camilo vence': 'artigos-imagens/images.jpeg',
  'César Cielo abre clínica de natação': 'artigos-imagens/rib4702.jpg',
  'Como está o Corinthians do exterior': 'artigos-imagens/presidente-do-corinthians-osmar-stabile-detonou-a-arbitragem-01.webp',
};

// Team logos mapping
const teamLogoMap: Record<string, string> = {
  'Corinthians': 'imagens-times/Corinthians.png',
  'Palmeiras': 'imagens-times/Palmeiras.png',
  'São Paulo FC': 'imagens-times/SãoPaulo.png',
  'Santos FC': 'imagens-times/Santos.png',
  'Flamengo': 'imagens-times/Flamengo.png',
  'Fluminense': 'imagens-times/FluminenseFC.png',
  'Botafogo': 'imagens-times/Escudo Botafogo.png',
  'Vasco da Gama': 'imagens-times/Clube Vasco Da Gama.png',
  'Grêmio': 'imagens-times/Gremio.svg.png',
  'Internacional': 'imagens-times/Internacional.svg.png',
  'Cruzeiro': 'imagens-times/Cruzeiro_1996.png',
  'Atlético Mineiro': 'imagens-times/Clube Atlético_Mineiro.svg.png',
  'Athletico Paranaense': 'imagens-times/Clube Athletico Paranaense.svg.png',
  'Fortaleza': 'imagens-times/Escudo_Associação_Ferroviária_de_Esportes.png',
  'Bahia': 'imagens-times/Esporte Clube Bahia_logo.svg.png',
  'Mirassol': 'imagens-times/Mirassol.png',
  'Novorizontino': 'imagens-times/Chapecoense.svg.png',
  'Inter de Limeira': 'imagens-times/Limeira.png',
  'São José EC': 'imagens-times/Saojosebasketball.png',
  'AC Milan': 'imagens-times/Club_Atlético_River_Plate_logo.svg.webp',
  'RB Bragantino': 'imagens-times/RedBullBragantino.png',
  'River Plate': 'imagens-times/Club_Atlético_River_Plate_logo.svg.webp',
  'Boca Juniors': 'imagens-times/Boca_Juniors_-_Novo_Escudo.svg.webp',
};

// Player photos mapping
const playerPhotoMap: Record<string, string> = {
  'Hugo Souza': 'jogadores imagens/11540329_hugo_souza_20241218124256.jpg',
  'Matheus Bidu': 'jogadores imagens/14254381_matheuzinho_20250725054805.png',
  'Memphis Depay': 'jogadores imagens/1778261246ca373d8541ebfad27ea80c4f12483607.png',
  'Yuri Alberto': 'jogadores imagens/177826297933d032e104b84201788eaa7de7a882ee.png',
  'Coronado': 'jogadores imagens/1778264028eb364cd5782d5655c3c6e09a84bf3dfc.png',
  'Fagner': 'jogadores imagens/17782642724e681ae9d4a5e5698f08e852a0255702.png',
  'Cacá': 'jogadores imagens/177826500424d19d22d523e2fe0205e40a7ce8211f.png',
  'Garçal': 'jogadores imagens/_k8gz.jpg',
  'Pedro Raul': 'jogadores imagens/felipe_longo_foto_3x4_73m5.jpg',
  'Wesley': 'jogadores imagens/images.jpeg',
};

async function uploadImage(localPath: string, folder: string): Promise<string | null> {
  const fullPath = path.join(IMAGES_BASE, localPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  Arquivo não encontrado: ${localPath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `radio-coringao/${folder}`,
      public_id: path.basename(localPath, path.extname(localPath)),
      overwrite: true,
    });
    return result.secure_url;
  } catch (error: any) {
    console.log(`   ❌ Erro ao upload ${localPath}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('📸 Upload de imagens para Cloudinary\n');
  console.log('━'.repeat(60));

  // 1. Upload article images
  console.log('\n📰 1. Imagens de artigos...');
  const articles = await prisma.article.findMany({ orderBy: { createdAt: 'asc' } });
  let articlesUpdated = 0;

  for (const article of articles) {
    // Find matching local image
    let localImage: string | null = null;
    for (const [titleKey, imagePath] of Object.entries(articleImageMap)) {
      if (article.title.includes(titleKey.substring(0, 20))) {
        localImage = imagePath;
        break;
      }
    }

    if (localImage) {
      const url = await uploadImage(localImage, 'articles');
      if (url) {
        await prisma.article.update({
          where: { id: article.id },
          data: { coverImage: url },
        });
        articlesUpdated++;
        console.log(`   ✅ ${article.title.substring(0, 50)}...`);
      }
    } else {
      console.log(`   ⚠️  Sem imagem mapeada: ${article.title.substring(0, 50)}...`);
    }
  }
  console.log(`   📊 ${articlesUpdated}/${articles.length} artigos atualizados`);

  // 2. Upload sponsor logos
  console.log('\n💼 2. Logo de patrocinador...');
  const sponsorLogo = await uploadImage('imagens patrocinadores/IMG_0297.PNG', 'sponsors');
  const sponsors = await prisma.sponsor.findMany();
  if (sponsorLogo && sponsors.length > 0) {
    await prisma.sponsor.update({
      where: { id: sponsors[0].id },
      data: { logoUrl: sponsorLogo },
    });
    console.log(`   ✅ ${sponsors[0].name} atualizado`);
  }

  // 3. Upload site logo
  console.log('\n🏷️  3. Logo do site...');
  const siteLogo = await uploadImage('logo-seo/IMG_0424.png', 'site');
  if (siteLogo) {
    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { logoUrl: siteLogo },
    });
    console.log('   ✅ Logo do site atualizado');
  }

  console.log('\n━'.repeat(60));
  console.log('🎉 Upload de imagens concluído!');
  console.log('━'.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
