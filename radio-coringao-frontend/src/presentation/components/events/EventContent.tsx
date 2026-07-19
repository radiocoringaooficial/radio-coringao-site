"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EventData, EventCategory } from "@/infrastructure/data/events";
import { Pagination } from "@/presentation/components/ui/Pagination";

interface EventContentProps {
  data: EventData;
}

const ITEMS_PER_PAGE = 4;

function TeamLogo({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
      <span className="text-[13px] font-bold text-on-primary">{initials}</span>
    </div>
  );
}

function EditorialGrid({ items, heroImage }: { items: { id: string; title: string; description: string; date: string; image?: string }[]; heroImage: string }) {
  const hero = items[0];
  const side = items.slice(1, 3);

  if (!hero) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 grid grid-cols-1 gap-[5px] lg:grid-cols-[55%_45%]"
    >
      <Link
        href="#"
        className="group relative block min-h-[320px] overflow-hidden rounded-sm lg:row-span-2 lg:min-h-[500px]"
      >
        <img
          src={hero.image || heroImage}
          alt={hero.title}
          className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6">
          <span className="mb-2 inline-block bg-white/20 px-2 py-1 font-label-sm text-label-sm text-white backdrop-blur-sm">
            {hero.date}
          </span>
          <h2 className="font-headline-md text-[17px] leading-snug font-bold text-white md:text-[20px]">
            {hero.title}
          </h2>
          <p className="mt-2 text-[13px] leading-snug text-white/80">
            {hero.description}
          </p>
        </div>
      </Link>

      {side.map((item) => (
        <Link
          key={item.id}
          href="#"
          className="group relative block min-h-[200px] overflow-hidden rounded-sm"
        >
          <img
            src={item.image || heroImage}
            alt={item.title}
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-3 md:p-4">
            <span className="mb-1 inline-block bg-white/20 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-sm">
              {item.date}
            </span>
            <h3 className="font-headline-md text-[14px] font-bold text-white">
              {item.title}
            </h3>
          </div>
        </Link>
      ))}
    </motion.div>
  );
}

function EventCardsGrid({ items, heroImage }: { items: EventData["items"] extends undefined ? { id: string; title: string; description: string; date: string; image?: string; venue?: string; time?: string }[] : NonNullable<EventData["items"]>; heroImage: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const usePagination = items.length > ITEMS_PER_PAGE;
  const paginatedItems = usePagination
    ? items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : items;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paginatedItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <div className="group flex h-[320px] flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={item.image || heroImage}
                  alt={item.title}
                  className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="mb-2 text-[11px] font-bold text-secondary">{item.date}</span>
                <h3 className="mb-2 line-clamp-2 font-headline-md text-headline-md font-bold text-primary">
                  {item.title}
                </h3>
                <p className="mb-3 line-clamp-2 flex-1 font-body-md text-body-md text-on-surface-variant">
                  {item.description}
                </p>
                {item.venue && (
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {item.venue}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {usePagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}

function CategoriesView({ data }: { data: EventData }) {
  const [activeTab, setActiveTab] = useState(0);
  const categories = data.categories || [];

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-outline-variant">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`whitespace-nowrap px-4 py-3 font-label-sm text-label-sm font-bold transition-colors ${
              activeTab === i
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Editorial Grid for first 3 items */}
      {categories[activeTab] && categories[activeTab].items.length > 0 && (
        <EditorialGrid items={categories[activeTab].items} heroImage={data.heroImage} />
      )}

      {/* Remaining items as cards */}
      {categories[activeTab] && categories[activeTab].items.length > 3 && (
        <EventCardsGrid items={categories[activeTab].items.slice(3)} heroImage={data.heroImage} />
      )}
    </>
  );
}

function NextGamesView({ data }: { data: EventData }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {data.items?.map((item, i) => {
        const [home, away] = item.title.split(" x ");
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-bold text-secondary">{item.date}</span>
              {item.time && (
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                  {item.time}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <TeamLogo name={home || ""} />
                <span className="text-[12px] font-bold text-primary">{home}</span>
              </div>
              <span className="text-xl font-bold text-outline">X</span>
              <div className="flex flex-col items-center gap-2">
                <TeamLogo name={away || ""} />
                <span className="text-[12px] font-bold text-primary">{away}</span>
              </div>
            </div>
            <p className="mb-1 text-center text-[12px] font-bold text-on-surface-variant">
              {item.description}
            </p>
            {item.venue && (
              <div className="flex items-center justify-center gap-1 text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                {item.venue}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function EventContent({ data }: EventContentProps) {
  const renderContent = () => {
    if (data.categories) {
      return <CategoriesView data={data} />;
    }
    if (data.slug === "proximos-jogos") {
      return <NextGamesView data={data} />;
    }
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items?.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary">
              <span className="mb-2 text-[12px] font-bold text-secondary">{item.date}</span>
              <h3 className="mb-2 font-headline-md text-headline-md font-bold text-primary">
                {item.title}
              </h3>
              <p className="mb-3 flex-1 font-body-md text-body-md text-on-surface-variant">
                {item.description}
              </p>
              {item.venue && (
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                  {item.venue}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-8 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative z-10">
          <h1 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile font-bold md:text-headline-lg">
            {data.name}
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-white/70">
            {data.description}
          </p>
        </div>
      </motion.div>

      {renderContent()}
    </div>
  );
}
