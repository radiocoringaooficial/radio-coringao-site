# Deploy na Vercel — Guia Rápido

## 1. Criar conta em vercel.com (login com GitHub)

## 2. Criar 3 projetos separados no painel

### Projeto 1: sports-news-api
- Import Git Repository → selecione `radio-coringao-final-project`
- **Root Directory:** `sports-news-api-ts`
- **Build Command:** `npx prisma generate && npx tsc`
- **Output Directory:** `.`
- Deploy

### Projeto 2: clube-api
- Import Git Repository → mesmo repositório
- **Root Directory:** `clube-api`
- **Build Command:** `npx prisma generate && npx tsc`
- **Output Directory:** `.`
- Deploy

### Projeto 3: frontend
- Import Git Repository → mesmo repositório
- **Root Directory:** `radio-coringao-frontend`
- **Framework:** Next.js (detectado automaticamente)
- Deploy

## 3. Criar banco PostgreSQL

Vercel → Storage → Create Database → PostgreSQL

Copie a `DATABASE_URL` (aparece após criar)

## 4. Variáveis de ambiente

### sports-news-api (Settings → Environment Variables)

```
DATABASE_URL         (cole do PostgreSQL)
JWT_SECRET           1c8e289be68f60140e60729aa2f0a12b34a107c847e3d71a3d5dc86b2fa06c12
JWT_EXPIRES_IN       7d
JWT_REFRESH_EXPIRES_IN 30d
NODE_ENV             production
CLOUDINARY_CLOUD_NAME  (seu cloud name do cloudinary.com)
CLOUDINARY_API_KEY     (sua api key)
CLOUDINARY_API_SECRET  (sua api secret)
CLOUDINARY_FOLDER    sports-news
ALLOWED_ORIGINS      https://seudominio.com.br
```

### clube-api (Settings → Environment Variables)

```
DATABASE_URL         (mesmo do PostgreSQL)
JWT_SECRET           1c8e289be68f60140e60729aa2f0a12b34a107c847e3d71a3d5dc86b2fa06c12
NODE_ENV             production
CORS_ORIGIN          https://seudominio.com.br
RATE_LIMIT_MAX       100
CLOUDINARY_CLOUD_NAME  (mesmo)
CLOUDINARY_API_KEY     (mesmo)
CLOUDINARY_API_SECRET  (mesmo)
```

### frontend (Settings → Environment Variables)

```
NEXT_PUBLIC_API_URL        https://NOME-SUA-NEWS-API.vercel.app/api
NEXT_PUBLIC_CLUBE_API_URL  https://NOME-SUA-CLUBE-API.vercel.app/api
NEXT_PUBLIC_SITE_URL       https://seudominio.com.br
NEXT_PUBLIC_USE_API        true
```

> Troque `NOME-SUA-NEWS-API` pelo nome que você deu ao projeto na Vercel

## 5. Rodar migrações do banco

Após o primeiro deploy, acesse o terminal da Vercel (em cada API) e execute:
```
npx prisma migrate deploy
```

## 6. Seed inicial (opcional)

Na sports-news-api, execute no terminal da Vercel:
```
npx tsx prisma/seed.ts
```
