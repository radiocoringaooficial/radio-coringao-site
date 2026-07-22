import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './presentation/stores/auth-store';
import { AdminLayout } from './presentation/components/layout/AdminLayout';
import { LoginPage } from './presentation/components/layout/LoginPage';
import { ToastContainer } from './presentation/components/ui/Toast';
import { Dialog } from './presentation/components/ui/Dialog';
import { Component, ReactNode } from 'react';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { ArticlesPage } from './presentation/pages/ArticlesPage';
import { ArticleEditPage } from './presentation/pages/ArticleEditPage';
import { CategoriesPage } from './presentation/pages/CategoriesPage';
import { BannersPage } from './presentation/pages/BannersPage';
import { MenuPage } from './presentation/pages/MenuPage';
import { SponsorsPage } from './presentation/pages/SponsorsPage';
import { EventsPage } from './presentation/pages/EventsPage';
import { UsersPage } from './presentation/pages/UsersPage';
import { SettingsPage } from './presentation/pages/SettingsPage';
import { SeoPage } from './presentation/pages/SeoPage';
import { FooterLinksPage } from './presentation/pages/FooterLinksPage';
import { TeamPage } from './presentation/pages/TeamPage';
import { ClubeCategoriesPage } from './presentation/pages/ClubeCategoriesPage';
import { CompetitionsPage } from './presentation/pages/CompetitionsPage';
import { OpponentsPage } from './presentation/pages/OpponentsPage';
import { MatchesPage } from './presentation/pages/MatchesPage';
import { SquadPage } from './presentation/pages/SquadPage';
import { MovementsPage } from './presentation/pages/MovementsPage';
import { AoVivoPage } from './presentation/pages/AoVivoPage';
import { AnuncieConoscoPage } from './presentation/pages/AnuncieConoscoPage';
import { DashboardArticlesMonthPage } from './presentation/pages/dashboard/DashboardArticlesMonthPage';
import { DashboardArticlesYearPage } from './presentation/pages/dashboard/DashboardArticlesYearPage';
import { DashboardViewsMonthPage } from './presentation/pages/dashboard/DashboardViewsMonthPage';
import { DashboardViewsYearPage } from './presentation/pages/dashboard/DashboardViewsYearPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(err: any) { return { hasError: true, error: err?.message || 'Erro' }; }
  render() {
    if (this.state.hasError) return (
      <div style={{padding:40,fontFamily:'sans-serif'}}><h1>Erro</h1><p>{this.state.error}</p><button onClick={() => window.location.reload()}>Recarregar</button></div>
    );
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ToastContainer />
        <Dialog />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <PrivateRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/materias" element={<ArticlesPage />} />
                  <Route path="/materias/new" element={<ArticleEditPage />} />
                  <Route path="/materias/:id" element={<ArticleEditPage />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/banners" element={<BannersPage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/patrocinadores" element={<SponsorsPage />} />
                  <Route path="/eventos" element={<EventsPage />} />
                  <Route path="/usuarios" element={<UsersPage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                  <Route path="/seo" element={<SeoPage />} />
                  <Route path="/links-rodape" element={<FooterLinksPage />} />
                  <Route path="/equipe" element={<TeamPage />} />
                  <Route path="/categorias-modalidades" element={<ClubeCategoriesPage />} />
                  <Route path="/competicoes" element={<CompetitionsPage />} />
                  <Route path="/adversarios" element={<OpponentsPage />} />
                  <Route path="/partidas" element={<MatchesPage />} />
                  <Route path="/elenco" element={<SquadPage />} />
                  <Route path="/movimentacoes" element={<MovementsPage />} />
                  <Route path="/ao-vivo" element={<AoVivoPage />} />
                  <Route path="/anuncie-conosco" element={<AnuncieConoscoPage />} />
                  <Route path="/dashboard/materias-month" element={<DashboardArticlesMonthPage />} />
                  <Route path="/dashboard/materias-year" element={<DashboardArticlesYearPage />} />
                  <Route path="/dashboard/views-month" element={<DashboardViewsMonthPage />} />
                  <Route path="/dashboard/views-year" element={<DashboardViewsYearPage />} />
                </Routes>
              </AdminLayout>
            </PrivateRoute>
          } />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
