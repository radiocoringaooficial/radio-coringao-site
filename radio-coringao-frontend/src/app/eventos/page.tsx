import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventData } from "@/infrastructure/data/events";
import { EventArticlesGrid } from "@/presentation/components/events/EventArticlesGrid";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

export const metadata: Metadata = {
  title: "Eventos - Rádio Coringão",
  description: "Todos os eventos do Corinthians em um só lugar.",
};

interface ApiEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  coverImage?: string;
  isActive?: boolean;
  categories?: {
    id: string;
    name: string;
    order: number;
    items: {
      id: string;
      title: string;
      description: string;
      date?: string;
      time?: string;
      venue?: string;
      status: string;
      image?: string;
      link?: string;
      order: number;
    }[];
  }[];
}

function mapEvent(apiEvent: ApiEvent): EventData {
  return {
    name: apiEvent.title,
    slug: apiEvent.slug,
    description: apiEvent.description,
    heroImage: apiEvent.coverImage || "",
    categories: apiEvent.categories?.map((cat) => ({
      name: cat.name,
      items: cat.items
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.date || "",
          time: item.time,
          venue: item.venue,
          status: item.status as "agendado" | "encerrado" | "em andamento",
          image: item.image,
          link: item.link,
        })),
    })),
    items: undefined,
  };
}

async function fetchEvents(): Promise<EventData[]> {
  try {
    const res = await fetch(`${API_URL}/eventos`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events: ApiEvent[] = Array.isArray(data) ? data : data?.data || [];
    return events.filter((e) => e.isActive !== false).map(mapEvent);
  } catch {
    return [];
  }
}

async function fetchEventosArticles() {
  try {
    const res = await fetch(`${API_URL}/noticias?category=eventos&limit=100`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const [events, articles] = await Promise.all([fetchEvents(), fetchEventosArticles()]);

  if (events.length === 0 && articles.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-8">
        <h1 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
          Eventos
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Todos os eventos do Corinthians em um só lugar.
        </p>
      </div>

      {/* Eventos (entidades) */}
      {events.length > 0 && (
        <>
          <h2 className="mb-4 font-headline-md text-headline-md text-primary">Calendário</h2>
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.slug}
                href={`/eventos/${event.slug}`}
                className="group overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary"
              >
                {event.heroImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={event.heroImage}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="mb-2 font-headline-md text-headline-md font-bold text-primary">
                    {event.name}
                  </h2>
                  <p className="line-clamp-2 font-body-md text-body-md text-on-surface-variant">
                    {event.description}
                  </p>
                  {event.categories && event.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.categories.map((cat) => (
                        <span
                          key={cat.name}
                          className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant"
                        >
                          {cat.name} ({cat.items.length})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Notícias da categoria Eventos */}
      {articles.length > 0 && (
        <>
          <h2 className="mb-4 font-headline-md text-headline-md text-primary">Notícias de Eventos</h2>
          <EventArticlesGrid articles={articles} />
        </>
      )}
    </div>
  );
}
