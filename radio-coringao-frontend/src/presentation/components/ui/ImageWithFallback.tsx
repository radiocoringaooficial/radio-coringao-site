"use client";

import { useState, useEffect } from "react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
}

const LOAD_TIMEOUT_MS = 10_000;

export function ImageWithFallback({
  src,
  alt,
  className,
}: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || loaded) return;
    const timer = setTimeout(() => setError(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, loaded]);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container ${className}`}
      >
        <span className="font-label-sm text-label-sm text-outline">
          Rádio Coringão
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} block`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}