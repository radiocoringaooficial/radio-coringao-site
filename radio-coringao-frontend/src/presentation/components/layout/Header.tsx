"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useNavStore } from "@/presentation/stores/navStore";
import { Menu, Search, X, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
import { SearchDropdown } from "@/presentation/components/layout/SearchDropdown";

interface SubItem {
  label: string;
  slug: string;
  description: string;
  lastResult?: { opponent: string; score: string; homeLogo?: string; awayLogo?: string };
  nextGame?: { opponent: string; date: string; time: string; homeLogo?: string; awayLogo?: string; round?: string | null };
  link?: string;
  articles?: { title: string; image: string; slug: string; excerpt?: string; categoryName?: string }[];
  transfers?: { type: string; playerName: string; playerPhoto: string; opponent: string; opponentLogo: string; date: string; id: string }[];
  standings?: { position: number; points: number; played: number } | null;
}

interface NavItem {
  label: string;
  slug: string;
  subItems?: SubItem[];
}

const CLUBE_API = "https://radio-coringao-clube-api.vercel.app/api";
const NEWS_API = "https://radio-coringao-news-api.vercel.app/api";
const CORINTHIANS_LOGO = "https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png";

const SPORT_CATEGORIES: Record<string, string> = {
  futebol: "principal",
  "futebol-feminino": "feminino",
  basquete: "basquete",
  futsal: "futsal",
  "sub-20": "sub-20",
  "sub-17": "sub-17",
};

const SPORT_NEWS_SLUG: Record<string, string> = {
  futebol: "futebol",
  "futebol-feminino": "futebol-feminino",
  basquete: "basquete",
  futsal: "futsal",
  "sub-20": "futebol-sub-20",
  "sub-17": "futebol-sub-20",
};

const URL_TO_SPORT_KEY: Record<string, string> = {
  "/esportes/futebol": "futebol",
  "/esportes/futebol-feminino": "futebol-feminino",
  "/esportes/sub-20": "sub-20",
  "/esportes/sub-17": "sub-17",
  "/esportes/basquete": "basquete",
  "/esportes/futsal": "futsal",
};

const URL_TO_TRANSFERS_KEY: Record<string, string> = {
  "/transferencias": "transferencias",
};

const URL_TO_NEWS_KEY: Record<string, string> = {
  "/noticias": "ultimas",
  "/noticias/category/futebol": "futebol",
  "/noticias/category/basquete": "basquete",
  "/noticias/category/futsal": "futsal",
  "/noticias/category/eventos": "eventos",
  "/noticias/category/politica": "politica",
  "/noticias/category/neo-quimica-arena": "neo-quimica-arena",
  "/noticias/category/fiel-torcedor": "fiel-torcedor",
};

function formatMatch(r: any, isHome: boolean) {
  if (!r) return null;
  return {
    opponent: r.opponent?.name || "?",
    score: `${r.homeScore ?? "?"} x ${r.awayScore ?? "?"}`,
    homeLogo: isHome ? CORINTHIANS_LOGO : (r.opponent?.logoUrl || undefined),
    awayLogo: isHome ? (r.opponent?.logoUrl || undefined) : CORINTHIANS_LOGO,
  };
}

function formatNextGame(n: any, isHome: boolean) {
  if (!n) return null;
  return {
    opponent: n.opponent?.name || "?",
    date: new Date(n.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
    time: new Date(n.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    homeLogo: isHome ? CORINTHIANS_LOGO : (n.opponent?.logoUrl || undefined),
    awayLogo: isHome ? (n.opponent?.logoUrl || undefined) : CORINTHIANS_LOGO,
    round: n.round || null,
  };
}

function mapArticles(raw: any[]) {
  return raw.map((a: any) => ({
    title: a.title || "",
    image: a.coverImage || "",
    slug: a.slug || "",
    excerpt: a.excerpt || "",
    categoryName: a.category?.name || "",
  }));
}

async function fetchJson(url: string): Promise<any[]> {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : d?.data || [];
  } catch { return []; }
}

function buildNavItems(data: Record<string, any>): NavItem[] {
  const menuItems = data.menu || [];
  if (menuItems.length === 0) return [];

  return menuItems.map((item: any) => {
    const slug = item.url?.replace(/^\//, "") || "";
    const children = (item.children || []).map((child: any) => {
      const childUrl = child.url || "";
      const sportKey = URL_TO_SPORT_KEY[childUrl];
      const newsKey = URL_TO_NEWS_KEY[childUrl];

      const sub: SubItem = {
        label: child.label,
        slug: childUrl.replace(/^\//, ""),
        description: "",
        link: childUrl.startsWith("/") ? childUrl : `/${childUrl}`,
      };

      if (sportKey && data[sportKey]) {
        sub.description = `${child.label} - Corinthians`;
        sub.lastResult = data[sportKey].lastResult;
        sub.nextGame = data[sportKey].nextGame;
        sub.articles = data[sportKey].articles;
      } else if (URL_TO_TRANSFERS_KEY[childUrl] && data.transferencias) {
        sub.description = "Últimas movimentações do Corinthians";
        sub.transfers = data.transferencias;
      } else if (newsKey && data[newsKey]) {
        sub.description = `${child.label}`;
        sub.articles = Array.isArray(data[newsKey]) ? data[newsKey] : data[newsKey]?.articles || [];
      }

      return sub;
    });

    if (item.label === "Classificações") {
      children.forEach((child: SubItem) => {
        const urlSlug = child.slug.split("/").pop() || "";
        if (data[urlSlug]) {
          child.standings = data[urlSlug];
        }
      });
    }

    return { label: item.label, slug, subItems: children.length > 0 ? children : undefined };
  });
}

export function Header() {
  const activeCategory = useNavStore((s) => s.activeCategory);
  const setActiveCategory = useNavStore((s) => s.setActiveCategory);
  const isMobileMenuOpen = useNavStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useNavStore((s) => s.toggleMobileMenu);
  const closeMobileMenu = useNavStore((s) => s.closeMobileMenu);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [navData, setNavData] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const d: Record<string, any> = {};

      // 1) Fetch matches + articles per sport in parallel
      const sportEntries = Object.entries(SPORT_CATEGORIES);
      const sportResults = await Promise.all(
        sportEntries.map(async ([sport, matchCat]) => {
          const newsSlug = SPORT_NEWS_SLUG[sport] || sport;
          const [recent, next, news] = await Promise.all([
            fetchJson(`${CLUBE_API}/partidas/recent?category=${matchCat}&limit=1`),
            fetchJson(`${CLUBE_API}/partidas/next?category=${matchCat}&limit=1`),
            fetchJson(`${NEWS_API}/noticias?category=${newsSlug}&limit=3`),
          ]);
          return { sport, recent: recent[0] || null, next: next[0] || null, news };
        })
      );

      for (const { sport, recent, next, news } of sportResults) {
        d[sport] = {
          lastResult: recent ? formatMatch(recent, recent.isHome) : null,
          nextGame: next ? formatNextGame(next, next.isHome) : null,
          articles: mapArticles(news),
        };
      }

      // 2) Standings per competition
      const COMPETITION_MAP: Record<string, string> = {
        "Brasileirão Série A": "brasileirao",
        "Libertadores": "libertadores",
        "Copa do Brasil": "copa-do-brasil",
        "Paulistão": "paulistao",
        "Copinha": "copinha",
      };
      try {
        const fetchTables = async (url: string) => {
          const r = await fetch(url);
          if (!r.ok) return [];
          const body = await r.json();
          return body?.tables || [];
        };
        const [principalTables, sub20Tables] = await Promise.all([
          fetchTables(`${CLUBE_API}/classificacoes/category/principal`),
          fetchTables(`${CLUBE_API}/classificacoes/category/sub-20`),
        ]);
        for (const table of [...principalTables, ...sub20Tables]) {
          const compName = table.competition?.name || "";
          const key = COMPETITION_MAP[compName];
          if (key) {
            const corinthians = (table.standings || []).find((s: any) => s.teamName?.includes("Corinthians"));
            if (corinthians) d[key] = { position: corinthians.position, points: corinthians.points, played: corinthians.played };
          }
        }
      } catch {}

      // 3) Extra news categories for Notícias and Eventos submenus
      const [ultimas, politica, eventos, neoArena, fielTorcedor, transfers] = await Promise.all([
        fetchJson(`${NEWS_API}/noticias?limit=6`),
        fetchJson(`${NEWS_API}/noticias?category=politica&limit=3`),
        fetchJson(`${NEWS_API}/noticias?category=eventos&limit=3`),
        fetchJson(`${NEWS_API}/noticias?category=neo-quimica-arena&limit=3`),
        fetchJson(`${NEWS_API}/noticias?category=fiel-torcedor&limit=3`),
        fetchJson(`${CLUBE_API}/movimentacoes/recent?limit=5&category=principal`),
      ]);
      d.ultimas = mapArticles(ultimas);
      d.politica = mapArticles(politica);
      d.eventos = mapArticles(eventos);
      d["neo-quimica-arena"] = mapArticles(neoArena);
      d["fiel-torcedor"] = mapArticles(fielTorcedor);
      const transferArr = Array.isArray(transfers) ? transfers : [];
      d.transferencias = transferArr.map((m: any) => ({
        type: m.type,
        playerName: m.playerName || "",
        playerPhoto: m.playerPhotoUrl || "",
        opponent: m.opponent?.name || "",
        opponentLogo: m.opponent?.logoUrl || "",
        date: m.date ? new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "",
        id: m.id,
      }));

      // 4) Menu structure
      const menuRaw = await fetchJson(`${NEWS_API}/menu`);
      d.menu = menuRaw
        .filter((m: any) => !m.parentId && m.isActive !== false)
        .sort((a: any, b: any) => a.order - b.order)
        .map((m: any) => ({
          label: m.label,
          url: m.url,
          children: (m.children || [])
            .filter((c: any) => c.isActive !== false)
            .sort((a: any, b: any) => a.order - b.order)
            .map((c: any) => ({ label: c.label, url: c.url })),
        }));

      setNavData(d);
    })();
  }, []);

  const navItems = useMemo(() => buildNavItems(navData), [navData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (openMenu) {
      const item = navItems.find((n) => n.slug === openMenu);
      if (item?.subItems?.length) setHoveredSub(item.subItems[0].label);
    }
  }, [openMenu, navItems]);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function openMenuDelayed(slug: string) { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); setOpenMenu(slug); }
  function closeMenuDelayed() { closeTimerRef.current = setTimeout(() => setOpenMenu(null), 120); }
  function cancelClose() { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }
  function handleNavClick(slug: string) {
    const item = navItems.find((n) => n.slug === slug);
    item?.subItems ? setOpenMenu(openMenu === slug ? null : slug) : setOpenMenu(null);
  }

  const activeNavItem = navItems.find((n) => n.slug === openMenu);
  const activeSubItem = activeNavItem?.subItems?.find((s) => s.label === hoveredSub);
  const isSportItem = !!(activeSubItem?.lastResult || activeSubItem?.nextGame);
  const hasArticles = !!(activeSubItem?.articles && activeSubItem.articles.length > 0);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface">
      {/* ─── Top bar ─── */}
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <Link href="/" onClick={closeMobileMenu}>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWKBx2Dj0ezWpowT-GAX-hfEtbPH1X8D66r6ZhSLqsnt_vyY9yjCXHRwWeFxRmm8iGUbnQ06Lrl3Iv3kldrJXnAqiDKrM156wrrnKwh-UQj-KUl3XzGntd1-5kJXKa4Mhk5d15JWrCZHxOW_EM3rX4JfLvSaaD_LZj-FbVIetGcH6EHT--LOJohLMFKAvbl2tMAQYti3oZVyVMiPBFhI0JDL5TLkQNr8ASfBxTghUckcBEch0Bpoh12A7Lj9UgLzl-xdga3p4BtBg" alt="Rádio Coringão" className="h-8 object-contain" />
          </Link>
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <div key={item.slug} className="relative" onMouseEnter={() => openMenuDelayed(item.slug)} onMouseLeave={closeMenuDelayed}>
              <Link href={item.subItems?.[0]?.link || `/${item.slug}`} className={`font-label-sm text-label-sm font-bold transition-colors hover:text-primary ${openMenu === item.slug ? "active text-primary" : "text-on-surface-variant"}`} onClick={() => setOpenMenu(null)}>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <AnimatePresence>
              {searchOpen && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="flex items-center overflow-hidden">
                  <input type="text" placeholder="Pesquisar..." autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } if (e.key === "Enter" && searchQuery.length >= 1) window.location.href = `/busca?q=${encodeURIComponent(searchQuery)}`; }}
                    className="w-48 rounded-lg border border-outline-variant bg-surface py-2 pl-3 pr-8 text-sm text-on-surface focus:border-secondary focus:outline-none" />
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={14} className="text-on-surface-variant" /></button>
                </motion.div>
              )}
            </AnimatePresence>
            <SearchDropdown query={searchQuery} visible={searchOpen && searchQuery.length >= 1} onClose={() => { setSearchOpen(false); setSearchQuery(""); }} />
          </div>
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors"><Search size={18} className="text-on-surface" /></button>
          <button onClick={toggleMobileMenu} className="lg:hidden p-2 rounded-full hover:bg-surface-container-low transition-colors"><Menu size={20} className="text-on-surface" /></button>
        </div>
      </div>

      {/* ─── Desktop Mega Menu ─── */}
      <AnimatePresence>
        {openMenu && activeNavItem && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 w-full border-b border-outline-variant bg-surface shadow-lg hidden lg:block"
            onMouseEnter={cancelClose} onMouseLeave={closeMenuDelayed}>
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
              <div className="grid grid-cols-12 gap-6">
                {/* ─── Sidebar ─── */}
                <div className="col-span-3">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{activeNavItem.label}</h3>
                  <div className="space-y-1">
                    {activeNavItem.subItems?.map((sub) => (
                      <button key={sub.label} onMouseEnter={() => setHoveredSub(sub.label)}
                        onClick={() => { window.location.href = sub.link || `/${sub.slug}`; closeMobileMenu(); }}
                        className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${hoveredSub === sub.label ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"}`}>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Content ─── */}
                <div className="col-span-9 overflow-y-auto pr-1">
                  {activeSubItem && (
                    <div className="space-y-4">
                      {/* Description */}
                      {activeSubItem.description && <p className="text-sm text-on-surface-variant leading-relaxed">{activeSubItem.description}</p>}

                      {/* Match cards */}
                      {isSportItem && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeSubItem.lastResult && (
                            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Último Resultado</p>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col items-center gap-1">
                                  {activeSubItem.lastResult.homeLogo ? <img src={activeSubItem.lastResult.homeLogo} alt="" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-[10px] font-bold text-primary">COR</span></div>}
                                  <span className="text-[9px] text-on-surface-variant">Corinthians</span>
                                </div>
                                <span className="text-xl font-black text-primary">{activeSubItem.lastResult.score}</span>
                                <div className="flex flex-col items-center gap-1">
                                  {activeSubItem.lastResult.awayLogo ? <img src={activeSubItem.lastResult.awayLogo} alt="" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center"><span className="text-[10px] font-bold text-on-surface-variant">{activeSubItem.lastResult.opponent?.slice(0, 3).toUpperCase()}</span></div>}
                                  <span className="text-[9px] text-on-surface-variant text-center max-w-[60px] truncate">{activeSubItem.lastResult.opponent}</span>
                                </div>
                              </div>
                            </div>
                          )}
                            {activeSubItem.nextGame && (
                              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Próximo Jogo</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col items-center gap-1">
                                    {activeSubItem.nextGame.homeLogo ? <img src={activeSubItem.nextGame.homeLogo} alt="" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-[10px] font-bold text-primary">COR</span></div>}
                                    <span className="text-[9px] text-on-surface-variant">Corinthians</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-black text-primary">VS</span>
                                    <span className="text-[9px] text-on-surface-variant">{activeSubItem.nextGame.date}</span>
                                    <span className="text-[9px] text-on-surface-variant">{activeSubItem.nextGame.time}</span>
                                    {activeSubItem.nextGame.round && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">{activeSubItem.nextGame.round}</span>}
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    {activeSubItem.nextGame.awayLogo ? <img src={activeSubItem.nextGame.awayLogo} alt="" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center"><span className="text-[10px] font-bold text-on-surface-variant">{activeSubItem.nextGame.opponent?.slice(0, 3).toUpperCase()}</span></div>}
                                    <span className="text-[9px] text-on-surface-variant text-center max-w-[60px] truncate">{activeSubItem.nextGame.opponent}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Standings */}
                      {activeSubItem.standings && (
                        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <img src={CORINTHIANS_LOGO} alt="Corinthians" className="w-8 h-8 object-contain" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Classificação do Corinthians</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                              <p className="text-3xl font-black text-primary leading-none">{activeSubItem.standings.position}º</p>
                              <p className="text-[9px] text-on-surface-variant mt-1">Posição</p>
                            </div>
                            <div className="h-10 w-px bg-outline-variant/30" />
                            <div className="text-center px-3">
                              <p className="text-2xl font-black text-on-surface leading-none">{activeSubItem.standings.points}</p>
                              <p className="text-[9px] text-on-surface-variant mt-1">Pontos</p>
                            </div>
                            <div className="h-10 w-px bg-outline-variant/30" />
                            <div className="text-center px-3">
                              <p className="text-2xl font-black text-on-surface leading-none">{activeSubItem.standings.played}</p>
                              <p className="text-[9px] text-on-surface-variant mt-1">Jogos</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── Articles ─── */}
                      {hasArticles && (
                        <div>
                          {isSportItem && <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Últimas Notícias</p>}
                          {activeSubItem.articles!.length > 3 ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <Link href={`/noticias/${activeSubItem.articles![0].slug}`} onClick={closeMobileMenu} className="col-span-2 block rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-surface-container-lowest">
                                  {activeSubItem.articles![0].image && <img src={activeSubItem.articles![0].image} alt="" className="w-full h-36 object-cover" />}
                                  <div className="p-3">
                                    {activeSubItem.articles![0].categoryName && <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary mb-1">{activeSubItem.articles![0].categoryName}</span>}
                                    <p className="text-sm font-bold text-on-surface line-clamp-2">{activeSubItem.articles![0].title}</p>
                                    {activeSubItem.articles![0].excerpt && <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1">{activeSubItem.articles![0].excerpt}</p>}
                                  </div>
                                </Link>
                                <div className="space-y-3">
                                  {activeSubItem.articles!.slice(1, 3).map((art, i) => (
                                    <Link key={`${art.slug}-${i}`} href={`/noticias/${art.slug}`} onClick={closeMobileMenu} className="flex gap-3 rounded-xl overflow-hidden hover:shadow-sm transition-shadow bg-surface-container-lowest p-2">
                                      {art.image && <img src={art.image} alt="" className="w-16 h-16 shrink-0 rounded-lg object-cover" />}
                                      <div className="min-w-0 flex-1 py-0.5">
                                        <p className="text-[11px] font-bold text-on-surface line-clamp-2">{art.title}</p>
                                        {art.excerpt && <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">{art.excerpt}</p>}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                {activeSubItem.articles!.slice(3, 6).map((art, i) => (
                                  <Link key={`${art.slug}-${i}`} href={`/noticias/${art.slug}`} onClick={closeMobileMenu} className="flex items-center gap-2 rounded-lg p-2 hover:bg-surface-container-low transition-colors">
                                    {art.image && <img src={art.image} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />}
                                    <div className="min-w-0"><p className="line-clamp-2 text-[11px] text-on-surface font-medium">{art.title}</p></div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-3">
                              <Link href={`/noticias/${activeSubItem.articles![0].slug}`} onClick={closeMobileMenu} className="col-span-2 block rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-surface-container-lowest">
                                {activeSubItem.articles![0].image && <img src={activeSubItem.articles![0].image} alt="" className="w-full h-36 object-cover" />}
                                <div className="p-3">
                                  <p className="text-sm font-bold text-on-surface line-clamp-2">{activeSubItem.articles![0].title}</p>
                                  {activeSubItem.articles![0].excerpt && <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1">{activeSubItem.articles![0].excerpt}</p>}
                                </div>
                              </Link>
                              <div className="space-y-3">
                                {activeSubItem.articles!.slice(1, 3).map((art, i) => (
                                  <Link key={`${art.slug}-${i}`} href={`/noticias/${art.slug}`} onClick={closeMobileMenu} className="flex gap-3 rounded-xl overflow-hidden hover:shadow-sm transition-shadow bg-surface-container-lowest p-2">
                                    {art.image && <img src={art.image} alt="" className="w-16 h-16 shrink-0 rounded-lg object-cover" />}
                                    <div className="min-w-0 flex-1 py-0.5">
                                      <p className="text-[11px] font-bold text-on-surface line-clamp-2">{art.title}</p>
                                      {art.excerpt && <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">{art.excerpt}</p>}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Transfers */}
                      {activeSubItem.transfers && activeSubItem.transfers.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Últimas Movimentações</p>
                          <div className="space-y-1.5">
                            {activeSubItem.transfers.map((t) => (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg p-2 bg-surface-container-lowest">
                                {t.playerPhoto && t.playerPhoto.length > 5 ? (
                                  <img src={t.playerPhoto} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-on-surface truncate">{t.playerName}</p>
                                  <div className="flex items-center gap-1">
                                    {t.type === 'ARRIVAL' || t.type === 'RETURN' ? <ArrowRight size={8} className="text-blue-500 shrink-0" /> : <ArrowLeft size={8} className="text-red-500 shrink-0" />}
                                    <span className="text-[9px] text-on-surface-variant truncate">{t.type === 'ARRIVAL' || t.type === 'RETURN' ? `de ${t.opponent}` : `para ${t.opponent}`}</span>
                                  </div>
                                </div>
                                <span className="text-[8px] text-on-surface-variant shrink-0">{t.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {!isSportItem && !activeSubItem.standings && !hasArticles && !activeSubItem.transfers?.length && (
                        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"><p className="text-xs text-on-surface-variant italic">Sem dados recentes</p></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Menu ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-outline-variant bg-surface">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.slug}>
                  <button onClick={() => handleNavClick(item.slug)} className="flex w-full items-center justify-between py-3 text-left font-headline text-sm font-bold text-on-surface">
                    {item.label}
                    {item.subItems && <ChevronRight size={16} className={`transition-transform ${openMenu === item.slug ? "rotate-90" : ""}`} />}
                  </button>
                  <AnimatePresence>
                    {openMenu === item.slug && item.subItems && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                        {item.subItems.map((sub) => (
                          <Link key={sub.label} href={sub.link || `/${sub.slug}`} onClick={closeMobileMenu} className="block py-2 text-sm text-on-surface-variant hover:text-primary">{sub.label}</Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
