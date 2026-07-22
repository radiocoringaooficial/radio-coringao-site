/**
 * Comprime imagem no cliente antes de enviar ao servidor.
 *
 * Regras:
 *  - SVG: retorna o arquivo original sem processar (vetor não deve ser rasterizado)
 *  - Arquivo já pequeno (abaixo de skipIfUnderBytes): retorna sem processar
 *  - PNG/WebP: preserva o formato original (mantém transparência/alpha)
 *  - JPEG: converte e reduz qualidade progressivamente (0.85 → 0.4)
 *  - Redimensiona para no máximo `maxDim` px no maior lado
 *
 * Nota sobre PNG: como PNG não tem parâmetro de "quality", uma imagem PNG
 * muito complexa (ex: screenshot com muito texto/detalhe) pode continuar
 * grande mesmo depois de redimensionada para maxDim. Ao virar base64 no
 * editor de conteúdo, isso pode ultrapassar o limite de 4.5MB do Vercel.
 * Preservar transparência tem prioridade — se isso acontecer, a solução
 * é converter o PNG para JPEG antes de enviar (fora deste utilitário).
 */
export function compressImage(
  file: File,
  options?: { maxDim?: number; maxBytes?: number; skipIfUnderBytes?: number },
): Promise<File> {
  const maxDim = options?.maxDim ?? 2000;
  const maxBytes = options?.maxBytes ?? 2.2 * 1024 * 1024; // 2.2MB — folga para base64 ×1.33
  const skipIfUnderBytes = options?.skipIfUnderBytes ?? 1.5 * 1024 * 1024; // 1.5MB

  // SVG é vetor — não rasterizar
  if (file.type === 'image/svg+xml') return Promise.resolve(file);

  // Arquivo já pequeno o suficiente — não processar
  if (file.size <= skipIfUnderBytes) return Promise.resolve(file);

  // PNG e WebP podem ter transparência — preservar formato original
  const isPreservable = file.type === 'image/png' || file.type === 'image/webp';
  const outputType = isPreservable ? file.type : 'image/jpeg';
  const outputExt = isPreservable ? file.name.split('.').pop()! : 'jpg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      // PNG não tem quality ajustável — redimensionar é a única forma de reduzir
      if (isPreservable) {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao comprimir imagem'));
            resolve(new File([blob], file.name, { type: outputType }));
          },
          outputType,
        );
        return;
      }

      // JPEG: reduz qualidade progressivamente
      const tryCompress = (q: number) =>
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao comprimir imagem'));
            if (blob.size <= maxBytes || q <= 0.4) {
              const baseName = file.name.replace(/\.[^.]+$/, '');
              resolve(new File([blob], `${baseName}.${outputExt}`, { type: outputType }));
              return;
            }
            tryCompress(q - 0.15);
          },
          outputType,
          q,
        );

      tryCompress(0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = objectUrl;
  });
}
