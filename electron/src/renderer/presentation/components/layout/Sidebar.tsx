import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/presentation/stores/auth-store';
import { useUIStore } from '@/presentation/stores/ui-store';
import {
  LayoutDashboard, FileText, Tag, Menu, Trophy, Calendar, Users, Settings, Link,
  Shield, FolderOpen, Swords, Target, Gamepad2, BarChart3, UserCheck, ArrowLeftRight, Banknote,
  LogOut, ChevronLeft, ChevronRight, Radio, Megaphone,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: { label: string; path: string; icon: React.ReactNode }[];
}

const navSections: NavSection[] = [
  {
    title: 'Geral',
    items: [
      { label: 'Painel', path: '/', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { label: 'Artigos', path: '/materias', icon: <FileText size={18} /> },
      { label: 'Categorias', path: '/categorias', icon: <FolderOpen size={18} /> },
      { label: 'Ao Vivo', path: '/ao-vivo', icon: <Radio size={18} /> },
      { label: 'Menu', path: '/menu', icon: <Menu size={18} /> },
      { label: 'Patrocinadores', path: '/patrocinadores', icon: <Trophy size={18} /> },
      { label: 'Links do Rodapé', path: '/links-rodape', icon: <Link size={18} /> },
      { label: 'Anuncie Conosco', path: '/anuncie-conosco', icon: <Megaphone size={18} /> },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Usuários', path: '/usuarios', icon: <Users size={18} /> },
      { label: 'Configurações', path: '/configuracoes', icon: <Settings size={18} /> },
    ],
  },
  {
    title: 'Clube',
    items: [
      { label: 'Time', path: '/equipe', icon: <Shield size={18} /> },
      { label: 'Categorias/Modalidades', path: '/categorias-modalidades', icon: <FolderOpen size={18} /> },
      { label: 'Competições', path: '/competicoes', icon: <Trophy size={18} /> },
      { label: 'Adversários', path: '/adversarios', icon: <Target size={18} /> },
      { label: 'Partidas', path: '/partidas', icon: <Swords size={18} /> },
      { label: 'Elenco', path: '/elenco', icon: <UserCheck size={18} /> },
      { label: 'Movimentações', path: '/movimentacoes', icon: <ArrowLeftRight size={18} /> },
    ],
  },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`h-screen bg-primary text-white flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <span className="font-headline font-bold text-sm truncate">
            RC Admin
          </span>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1 text-[10px] font-headline font-bold uppercase tracking-wider text-white/40">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors ${
                    isActive
                      ? 'bg-secondary text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && user && (
          <p className="text-xs text-white/50 truncate mb-2 font-body">{user.name}</p>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-body ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sair"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
