import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Highlighter, List, ListOrdered, Quote, ImagePlus, Heading1, Heading2, Heading3, Code, Undo, Redo, Link, Loader2, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { alert } from '@/presentation/stores/dialog-store';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      credit: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-credit'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.credit) return {};
          return { 'data-credit': attributes.credit };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({ onClick, active, children, title, disabled }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded transition-all duration-150 ${active ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Credit modal state
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditValue, setCreditValue] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState('');

  // Link modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      CustomImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva o conteúdo do artigo...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await newsApi.post('/admin/articles/content-image', { image: base64 });
      setPendingImageUrl(data.url);
      setCreditValue('');
      setCreditModalOpen(true);
    } catch (err: any) {
      alert('Erro ao enviar imagem: ' + (err.message || 'Tente novamente'));
    }
    setUploading(false);
    e.target.value = '';
  };

  const confirmImageInsert = () => {
    const credit = creditValue.trim() || undefined;
    editor.chain().focus().setImage({ src: pendingImageUrl, credit } as any).run();
    onChange(editor.getHTML());
    setCreditModalOpen(false);
    setPendingImageUrl('');
    setCreditValue('');
  };

  const cancelImageInsert = () => {
    setCreditModalOpen(false);
    setPendingImageUrl('');
    setCreditValue('');
  };

  const addLink = () => {
    setLinkValue('');
    setLinkModalOpen(true);
  };

  const confirmLinkInsert = () => {
    if (linkValue.trim()) {
      editor.chain().focus().setLink({ href: linkValue.trim() }).run();
    }
    setLinkModalOpen(false);
    setLinkValue('');
  };

  return (
    <div className="tiptap-editor">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-surface-container-low border-b border-outline-variant">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1" disabled={uploading}>
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2" disabled={uploading}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3" disabled={uploading}>
          <Heading3 size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-outline-variant mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito" disabled={uploading}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico" disabled={uploading}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado" disabled={uploading}>
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Grifar" disabled={uploading}>
          <Highlighter size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código" disabled={uploading}>
          <Code size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-outline-variant mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista" disabled={uploading}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista Numerada" disabled={uploading}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação" disabled={uploading}>
          <Quote size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-outline-variant mx-1" />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Inserir Imagem do Computador" disabled={uploading}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </ToolbarButton>
        <ToolbarButton onClick={addLink} title="Inserir Link" disabled={uploading}>
          <Link size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-outline-variant mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer" disabled={uploading}>
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer" disabled={uploading}>
          <Redo size={16} />
        </ToolbarButton>
        {uploading && <span className="text-[10px] text-on-surface-variant ml-2">Enviando imagem...</span>}
      </div>
      <EditorContent editor={editor} />

      {/* Credit Modal */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelImageInsert} />
          <div className="relative bg-surface-container-lowest rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h3 className="font-headline text-sm font-bold text-on-surface">Crédito da Foto</h3>
              <button onClick={cancelImageInsert} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><X size={16} /></button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={creditValue}
                onChange={(e) => setCreditValue(e.target.value)}
                placeholder="Ex: Foto: João Silva / Reprodução"
                className="input-field text-sm w-full"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') confirmImageInsert(); }}
              />
              <p className="text-[10px] text-on-surface-variant mt-1.5">Opcional. Deixe em branco para inserir sem crédito.</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-outline-variant">
              <button onClick={cancelImageInsert} className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                Cancelar
              </button>
              <button onClick={confirmImageInsert} className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                Inserir Imagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLinkModalOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h3 className="font-headline text-sm font-bold text-on-surface">Inserir Link</h3>
              <button onClick={() => setLinkModalOpen(false)} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><X size={16} /></button>
            </div>
            <div className="p-4">
              <input
                type="url"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="https://exemplo.com"
                className="input-field text-sm w-full"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') confirmLinkInsert(); }}
              />
            </div>
            <div className="flex gap-2 p-4 border-t border-outline-variant">
              <button onClick={() => setLinkModalOpen(false)} className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                Cancelar
              </button>
              <button onClick={confirmLinkInsert} className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                Inserir Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
