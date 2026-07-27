"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NextMatch } from "@/domain/entities";
import { NextMatchCard } from "@/presentation/components/news/NextMatchCard";

interface MatchCarouselProps {
  matches: (NextMatch & { title: string })[];
}

export function MatchCarousel({ matches }: MatchCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = matches.length;

  function scrollTo(index: number) {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / count;
    el.scrollTo({ left: cardWidth * index, behavior: "smooth" });
  }

  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % count;
      setActiveIndex(next);
      scrollTo(next);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeIndex, count]);

  function scrollLeft() {
    const prev = (activeIndex - 1 + count) % count;
    setActiveIndex(prev);
    scrollTo(prev);
  }

  function scrollRight() {
    const next = (activeIndex + 1) % count;
    setActiveIndex(next);
    scrollTo(next);
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {matches.map((match: any, i) => (
          <div
            key={match.id || match.title || i}
            className="min-w-full snap-start"
          >
            <NextMatchCard
              title={match.title}
              {...match}
              dots={count}
              activeDot={i === activeIndex ? i : -1}
              cardIndex={i}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              onClick={scrollLeft}
              className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <button
            onClick={scrollRight}
            className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
