import { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface FoodImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function FoodImage({
  src,
  alt,
  className = '',
  fallbackLabel,
}: FoodImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#2a2433] via-[#1d1e2c] to-[#3b151e] text-white/90 p-4 text-center ${className}`}
      >
        <UtensilsCrossed className="w-8 h-8 text-[#ff9f1c] mb-2 opacity-90" />
        <span className="text-xs font-medium leading-snug line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
