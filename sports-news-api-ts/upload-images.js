const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'def661xyl',
  api_key: '442261137748664',
  api_secret: '5trkPaPoG2d3WCox6iLrEOptj-A',
});

const BASE_DIR = path.join(__dirname, '..', 'imagens');
const FOLDER = 'radio-coringao';

async function uploadFile(filePath, folder) {
  const fileName = path.basename(filePath);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `${FOLDER}/${folder}`,
      public_id: fileName.replace(/\.[^.]+$/, ''),
      resource_type: 'auto',
    });
    console.log(`  ✅ ${fileName} → ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.log(`  ❌ ${fileName}: ${err.message}`);
    return null;
  }
}

async function uploadDir(dirPath, folderName) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  if (files.length === 0) return;

  console.log(`\n📁 ${folderName} (${files.length} imagens)`);
  for (const file of files) {
    await uploadFile(path.join(dirPath, file), folderName);
  }
}

async function main() {
  console.log('🚀 Iniciando upload para Cloudinary...\n');

  await uploadDir(path.join(BASE_DIR, 'jogadores imagens'), 'jogadores');
  await uploadDir(path.join(BASE_DIR, 'imagens-times'), 'times');
  await uploadDir(path.join(BASE_DIR, 'artigos-imagens'), 'artigos');
  await uploadDir(path.join(BASE_DIR, 'imagens patrocinadores'), 'patrocinadores');
  await uploadDir(path.join(BASE_DIR, 'logo-seo'), 'logo');
  await uploadDir(path.join(BASE_DIR, 'social media'), 'social');

  console.log('\n✅ Upload concluído!');
}

main().catch(console.error);
