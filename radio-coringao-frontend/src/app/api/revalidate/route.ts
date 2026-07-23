import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!REVALIDATE_SECRET || authHeader !== `Bearer ${REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paths, categorySlug } = body as {
      paths?: string[];
      categorySlug?: string;
    };

    const revalidated: string[] = [];

    // Revalidate explicit paths
    if (paths?.length) {
      for (const p of paths) {
        revalidatePath(p);
        revalidated.push(p);
      }
    }

    // Revalidate category-specific pages
    if (categorySlug) {
      revalidatePath("/noticias");
      revalidatePath(`/noticias/category/${categorySlug}`);
      revalidated.push("/noticias", `/noticias/category/${categorySlug}`);
    }

    // Always revalidate the main news page
    if (!revalidated.includes("/noticias")) {
      revalidatePath("/noticias");
      revalidated.push("/noticias");
    }

    return NextResponse.json({ revalidated, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Revalidation failed" }, { status: 500 });
  }
}
