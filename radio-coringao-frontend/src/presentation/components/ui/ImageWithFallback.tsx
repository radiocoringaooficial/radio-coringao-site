"use client";

import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
}: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
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
    <>
      {!loaded && (
        <div className={`animate-pulse bg-surface-container ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? "block" : "hidden"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </>
  );
}