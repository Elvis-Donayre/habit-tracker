import { useId } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}

/**
 * Minimal area sparkline drawn with SVG. Scales to its container width
 * (preserveAspectRatio none) so it can live inside any card.
 */
export function Sparkline({
  data,
  width = 280,
  height = 56,
  color = 'var(--color-accent)',
  fill = true,
  className = '',
}: SparklineProps) {
  const gradientId = useId();
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = height * 0.08;

  const points = data.map((value, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
