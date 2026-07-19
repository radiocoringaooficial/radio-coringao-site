import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Highlighter, List, ListOrdered, Quote, ImagePlus, Heading1, Heading2, Heading3, Code, Undo, Redo, Link, Loader2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { alert } from '@/presentation/stores/dialog-store';

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Image.configure({ inline: false, allowBase64: true }),
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
      const credit = prompt('Crédito da foto (deixe em branco para pular):');
      if (credit && credit.trim()) {
        editor.chain().focus().insertContent(
          `<figure><img src="${data.url}" alt="" /><figcaption>${credit.trim()}</figcaption></figure>`
        ).run();
      } else {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
      onChange(editor.getHTML());
    } catch (err: any) {
      alert('Erro ao enviar imagem: ' + (err.message || 'Tente novamente'));
    }
    setUploading(false);
    e.target.value = '';
  };

  const addLink = () => {
    const url = prompt('URL do link:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
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
    </div>
  );
}
