import { Star } from 'lucide-react';

export function RatingStars({
  value,
  size = 14,
  className = ''
}: {
  value: number;       // 0..5
  size?: number;
  className?: string;
}) {
  // Render 5 stars. A star is "filled" if its index <= floor(value). For a
  // half-fractional star (>=0.25 and <0.75 fraction) we render a half overlay.
  const full = Math.floor(value);
  const frac = value - full;
  const showHalf = frac >= 0.25 && frac < 0.75;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const half = !filled && i === full && showHalf;
        if (filled) {
          return <Star key={i} width={size} height={size} className="fill-amber-400 text-amber-400" />;
        }
        if (half) {
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star width={size} height={size} className="absolute inset-0 text-amber-400" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
                <Star width={size} height={size} className="fill-amber-400 text-amber-400" />
              </span>
            </span>
          );
        }
        return <Star key={i} width={size} height={size} className="text-slate-300 dark:text-slate-600" />;
      })}
    </span>
  );
}
