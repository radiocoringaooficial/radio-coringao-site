"use client";

import { useState, useEffect, useRef } from "react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function ImageWithFallback({
  src,
  alt,
  className,
  loading = "eager",
}: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!src) return;
    
    attemptedRef.current = false;
    setError(false);
    setLoaded(false);

    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      attemptedRef.current = true;
      return;
    }

    const handleLoad = () => {
      setLoaded(true);
      attemptedRef.current = true;
    };

    const handleError = () => {
      setError(true);
      attemptedRef.current = true;
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  if (!src || (error && !loaded)) {
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
      ref={imgRef}
      src={src}
      alt={alt}
      className={`${className} block`}
      loading={loading}
    />
  );
}