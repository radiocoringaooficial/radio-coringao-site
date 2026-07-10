import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

async function getApp() {
  if (app) return app;

  console.log('Building Fastify app...');
  const { buildApp } = await import('../src/app');
  app = await buildApp();
  console.log('Fastify app built successfully');
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastify = await getApp();

    const result = await fastify.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers as Record<string, string>,
      body: req.body,
      query: req.query as Record<string, string>,
    });

    res.status(result.statusCode);
    Object.entries(result.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });
    res.send(result.payload);
  } catch (err: any) {
    console.error('Handler error:', err?.stack || err?.message || err);
    res.status(500).json({ error: 'Server error', message: err?.message || 'Unknown' });
  }
}
