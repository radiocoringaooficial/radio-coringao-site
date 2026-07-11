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
  'Fortaleza': 'imagens-times/FC_Cascavel.png',
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
  console.log('📸 Upload de imagens para Cloudinary (Clube API)\n');
  console.log('━'.repeat(60));

  // 1. Upload team logos
  console.log('\n⚽ 1. Logos de times...');
  const opponents = await prisma.opponent.findMany();
  let teamsUpdated = 0;

  for (const opponent of opponents) {
    const localImage = teamLogoMap[opponent.name];
    if (localImage) {
      const url = await uploadImage(localImage, 'teams');
      if (url) {
        await prisma.opponent.update({
          where: { id: opponent.id },
          data: { logoUrl: url },
        });
        teamsUpdated++;
        console.log(`   ✅ ${opponent.name}`);
      }
    }
  }
  console.log(`   📊 ${teamsUpdated}/${opponents.length} logos atualizados`);

  // 2. Upload player photos
  console.log('\n👤 2. Fotos de jogadores...');
  const players = await prisma.squadMember.findMany();
  let playersUpdated = 0;

  for (const player of players) {
    const localImage = playerPhotoMap[player.name];
    if (localImage) {
      const url = await uploadImage(localImage, 'players');
      if (url) {
        await prisma.squadMember.update({
          where: { id: player.id },
          data: { photoUrl: url },
        });
        playersUpdated++;
        console.log(`   ✅ ${player.name}`);
      }
    }
  }
  console.log(`   📊 ${playersUpdated}/${players.length} fotos atualizadas`);

  // 3. Upload Corinthians logo for team
  console.log('\n🏟️  3. Logo do Corinthians...');
  const corinthiansLogo = await uploadImage('imagens-times/Corinthians.png', 'team');
  if (corinthiansLogo) {
    await prisma.team.update({
      where: { id: 'main' },
      data: { logoUrl: corinthiansLogo },
    });
    console.log('   ✅ Logo do Corinthians atualizado');
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
