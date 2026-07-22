import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/presentation/utils/image-compression';

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ currentImage, onUpload, onRemove, label = 'Imagem', className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState(currentImage || '');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      onUpload(compressed);
    } catch {
      // Fallback: usa o arquivo original se a compressão falhar
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onRemove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className={className}>
      <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">{label}</label>
      {preview ? (
        <div className="relative inline-block group">
          <img src={preview} alt="" className="h-28 rounded-lg object-contain border border-outline-variant bg-surface-container-low p-1" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X size={12} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 rounded-lg bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <span className="text-xs font-headline text-white bg-black/50 px-2 py-1 rounded">Trocar</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-outline-variant hover:border-on-surface-variant/30 hover:bg-surface-container-low'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/10' : 'bg-surface-container'}`}>
            {isDragging ? <ImageIcon size={20} className="text-primary" /> : <Upload size={18} className="text-on-surface-variant" />}
          </div>
          <div className="text-center">
            <p className={`text-sm font-headline font-bold ${isDragging ? 'text-primary' : 'text-on-surface'}`}>
              {isDragging ? 'Solte aqui' : 'Arraste a imagem'}
            </p>
            <p className="text-[11px] text-on-surface-variant">ou clique para selecionar</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleChange} className="hidden" />
    </div>
  );
}
