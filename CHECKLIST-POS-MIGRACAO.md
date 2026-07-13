# Checklist pós-migração — 2026-07-13

## sports-news-api-ts (produção)

### (a) Login no admin
- [ ] Abrir `https://radiocoringao-news.vercel.app` no browser
- [ ] Fazer login com `admin@radiocoringao.com.br` / `RadioCoringao@2026`
- [ ] Confirmar que entra no dashboard sem erro
- [ ] Confirmar que o menu lateral carrega (27 itens, incluindo "Sub 20" sob Futebol)

### (b) Site público
- [ ] Abrir `https://radiocoringao-news.vercel.app/api/health` — deve retornar JSON com status ok
- [ ] Abrir `https://radiocoringao-news.vercel.app/api/noticias` — deve retornar 28 artigos
- [ ] Abrir `https://radiocoringao-news.vercel.app/api/categorias` — deve retornar categorias
- [ ] Abrir `https://radiocoringao-news.vercel.app/api/banners` — deve retornar 2 banners
- [ ] Abrir `https://radiocoringao-news.vercel.app/api/menu` — deve retornar menu completo

### (c) Dashboard admin
- [ ] Verificar "Mais Lidas" no dashboard — valores devem ser reais (baseados em articleView)
- [ ] Verificar gráficos de publicações por mês — devem mostrar 6 meses (Fev-Jul 2026)
- [ ] Verificar gráficos de visualizações — devem mostrar dados reais
- [ ] Navegar pelas páginas de detalhe de gráficos (materias-month, views-month, etc.)

### (d) Pendências conhecidas
- [ ] "Sub 20" duplicado com "Categoria Sub-20" — decidir qual manter (já removemos Categoria Sub-20, verificar)

---

## clube-api (produção)

### (a) API pública
- [ ] Abrir `https://radiocoringao-clube.vercel.app/api/health` ou endpoint equivalente
- [ ] Verificar que retorna dados do Corinthians (98 opponents, 18 competitions, etc.)

### (b) Integridade visual
- [ ] Conferir elenco (27 squad_members) — nomes e posições corretos
- [ ] Conferir classificação (129 standing_entries) — times e pontos corretos
- [ ] Conferir partidas (9 matches) — confrontos e placares corretos

### (c) Pendências conhecidas
- [ ] player_movements teve DELETE ALL + INSERT ALL — 12 IDs de produção foram trocados por IDs locais
- [ ] UNIQUE constraints criadas via SQL manual — migration documentada mas não aplicada via Prisma

---

## Segurança

### (a) Senhas Neon
- [ ] Resetar senha do banco `sports-news` (neondb @ ep-solitary-unit-acurdoty-pooler)
- [ ] Resetar senha do banco `clube` (neondb @ ep-damp-dream-accpghkf-pooler)
- [ ] Atualizar DATABASE_URL nos dois projetos Vercel

### (b) Variáveis Vercel para atualizar (após reset de senha)

**Projeto: radiocoringao-news (sports-news-api-ts)**
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_PRISMA_URL`
- `PGHOST` (não muda)
- `PGHOST_UNPOOLED` (não muda)
- `PGUSER` (não muda)
- `PGDATABASE` (não muda)
- `PGPASSWORD`
- `POSTGRES_PASSWORD`
- `POSTGRES_USER` (não muda)
- `POSTGRES_HOST` (não muda)
- `POSTGRES_DATABASE` (não muda)

**Projeto: radiocoringao-clube (clube-api)**
- Mesmas variáveis acima
