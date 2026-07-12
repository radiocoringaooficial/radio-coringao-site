-- Reseta todos os viewCount dos artigos para 0
-- O site ainda não tem tráfego significativo, então viewCount deve começar limpo
-- Execute com: psql $DATABASE_URL -f prisma/reset-view-counts.sql
UPDATE articles SET "viewCount" = 0;

-- Limpa também a tabela article_views se tiver dados de teste
-- DESCOMENTE a linha abaixo se quiser limpar os dados de teste:
-- TRUNCATE article_views;
