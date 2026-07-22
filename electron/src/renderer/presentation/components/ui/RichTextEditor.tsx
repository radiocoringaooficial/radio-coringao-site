import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Highlighter, List, ListOrdered, Quote, ImagePlus, Heading1, Heading2, Heading3, Code, Undo, Redo, Link as LinkIcon, Loader2, X, Unlink } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { alert } from '@/presentation/stores/dialog-store';
import { compressImage } from '@/presentation/utils/image-compression';

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

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'editor-image-wrapper';
      wrapper.style.cssText = 'margin: 0.5rem 0;';

      const img = document.createElement('img');
      Object.entries(HTMLAttributes).forEach(([key, val]) => {
        if (val != null && val !== false) img.setAttribute(key, String(val));
      });
      img.style.cssText = 'max-width:100%;border-radius:8px;display:block;';
      wrapper.appendChild(img);

      const caption = document.createElement('p');
      caption.className = 'editor-image-credit';
      caption.style.cssText = node.attrs.credit ? 'display:block;' : 'display:none;';
      caption.textContent = (node.attrs.credit as string) || '';
      wrapper.appendChild(caption);

      return {
        dom: wrapper,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== 'image') return false;
          const attrs = updatedNode.attrs;
          if (img.getAttribute('src') !== attrs.src) img.setAttribute('src', attrs.src || '');
          if (img.getAttribute('alt') !== (attrs.alt || '')) img.setAttribute('alt', attrs.alt || '');
          const credit = (attrs.credit as string) || '';
          if (credit) {
            caption.textContent = credit;
            caption.style.display = 'block';
          } else {
            caption.style.display = 'none';
          }
          return true;
        },
      };
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

function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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
  const [editingLink, setEditingLink] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      CustomImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          class: 'editor-link',
        },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva o conteúdo do artigo...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Comprime antes de gerar base64 — evita payload > 4.5MB no Vercel
      const compressed = await compressImage(file);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
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

  const openLinkModal = () => {
    const isLink = editor.isActive('link');
    if (isLink) {
      const attrs = editor.getAttributes('link');
      setLinkValue(attrs.href || '');
      setEditingLink(true);
    } else {
      setLinkValue('');
      setEditingLink(false);
    }
    setLinkModalOpen(true);
  };

  const confirmLinkInsert = () => {
    const url = ensureHttps(linkValue);
    if (!url) {
      setLinkModalOpen(false);
      setLinkValue('');
      return;
    }

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'text',
        text: url,
        marks: [{ type: 'link', attrs: { href: url } }],
      }).run();
    }
    onChange(editor.getHTML());
    setLinkModalOpen(false);
    setLinkValue('');
    setEditingLink(false);
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    onChange(editor.getHTML());
    setLinkModalOpen(false);
    setLinkValue('');
    setEditingLink(false);
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
        <ToolbarButton onClick={openLinkModal} active={editor.isActive('link')} title={editor.isActive('link') ? 'Editar Link' : 'Inserir Link'} disabled={uploading}>
          <LinkIcon size={16} />
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
              <h3 className="font-headline text-sm font-bold text-on-surface">{editingLink ? 'Editar Link' : 'Inserir Link'}</h3>
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
              <p className="text-[10px] text-on-surface-variant mt-1.5">Se não houver texto selecionado, a URL será inserida como texto clicável.</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-outline-variant">
              {editingLink && (
                <button onClick={removeLink} className="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1">
                  <Unlink size={12} /> Remover
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setLinkModalOpen(false)} className="px-3 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                Cancelar
              </button>
              <button onClick={confirmLinkInsert} className="px-3 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                {editingLink ? 'Salvar' : 'Inserir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
