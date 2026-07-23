// src/shared/services/revalidate-frontend.ts
// Calls the frontend /api/revalidate endpoint to trigger on-demand ISR revalidation.

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://radiocoringao-frontend.vercel.app';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;

export async function revalidateFrontend(categorySlug?: string): Promise<void> {
  if (!REVALIDATE_SECRET) {
    // Silently skip if no secret configured (dev without revalidation)
    return;
  }

  try {
    const res = await fetch(`${FRONTEND_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REVALIDATE_SECRET}`,
      },
      body: JSON.stringify({ categorySlug }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[revalidate] Frontend revalidation returned ${res.status}`);
    }
  } catch (err) {
    // Non-critical — log but don't throw
    console.warn('[revalidate] Failed to revalidate frontend:', (err as Error).message);
  }
}
