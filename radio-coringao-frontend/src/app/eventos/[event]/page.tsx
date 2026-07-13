import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventData } from "@/infrastructure/data/events";
import { EventContent } from "@/presentation/components/events/EventContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface Props {
  params: Promise<{ event: string }>;
}

interface ApiEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  coverImage?: string;
  isActive: boolean;
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

async function fetchEventBySlug(slug: string): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_URL}/eventos/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data: ApiEvent = await res.json();
    if (!data.isActive) return null;
    return mapEvent(data);
  } catch {
    return null;
  }
}

async function fetchAllEventSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/eventos`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events: ApiEvent[] = Array.isArray(data) ? data : data?.data || [];
    return events.filter((e) => e.isActive).map((e) => e.slug);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event } = await params;
  const data = await fetchEventBySlug(event);
  if (!data) return { title: "Evento não encontrado" };
  return {
    title: `${data.name} - Rádio Coringão`,
    description: data.description,
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await fetchAllEventSlugs();
  return slugs.map((event) => ({ event }));
}

export default async function EventPage({ params }: Props) {
  const { event } = await params;
  const data = await fetchEventBySlug(event);
  if (!data) notFound();

  return <EventContent data={data} />;
}
