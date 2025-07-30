import { useState, useRef, useEffect, memo } from "react";
import { cn } from "../lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = memo(
  ({
    src,
    alt,
    className,
    width,
    height,
    placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNiAyNkwyMCAyMEwxNCAyNk0yMCAyMFYzNCIgc3Ryb2tlPSIjOTlBM0FFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K",
    onLoad,
    onError,
  }: LazyImageProps) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [inView, setInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const ref = imgRef.current;
      if (!ref) return;
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        },
      );
      observer.observe(ref);
      return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
      setLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setError(true);
      onError?.();
    };

    return (
      <div
        ref={imgRef}
        className={cn("relative overflow-hidden", className)}
        style={{ width, height }}
        aria-busy={!loaded && !error}
      >
        {!loaded && !error && (
          <img
            src={placeholder}
            alt="Imagem em carregamento"
            className="absolute inset-0 w-full h-full object-cover blur-sm"
            aria-hidden="true"
            width={width}
            height={height}
          />
        )}

        {inView && !error && (
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            width={width}
            height={height}
          />
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400" role="alert" aria-label="Erro ao carregar imagem">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    );
  },
);

LazyImage.displayName = "LazyImage";

export default LazyImage;
