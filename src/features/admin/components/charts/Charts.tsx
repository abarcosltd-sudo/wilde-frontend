import React, { useMemo, useState } from 'react';

import type { SeriesPoint } from '../../services/analytics.service';
import { formatNumber } from '../../utils/format';

/**
 * Hand-rolled SVG rather than a charting library: the repo has no chart
 * dependency and these four shapes don't justify adding ~100kb to the bundle
 * of a mobile app.
 */

interface AreaChartProps {
  data: SeriesPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (value: number) => string;
  label?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 180,
  color = '#4f46e5',
  valueFormatter = formatNumber,
  label = 'value',
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const pad = { top: 12, right: 8, bottom: 22, left: 36 };

  const { path, area, max, points } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
      ...d,
      x: pad.left + i * step,
      y: pad.top + innerH - (d.value / max) * innerH,
    }));

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = points.length
      ? `${path} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`
      : '';

    return { path, area, max, points };
  }, [data, height]);

  if (!data.length) return <EmptyChart height={height} />;

  const gradientId = `grad-${label.replace(/\s/g, '')}`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label} over time`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const y = pad.top + (height - pad.top - pad.bottom) * t;
          return (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={4} y={y + 4} fontSize="10" fill="#94a3b8">
                {valueFormatter(Math.round(max * (1 - t)))}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {points.map((p, i) => (
          <rect
            key={p.date}
            x={p.x - 6}
            y={pad.top}
            width={12}
            height={height - pad.top - pad.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {hover !== null && points[hover] && (
          <g>
            <line
              x1={points[hover].x}
              x2={points[hover].x}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke={color}
              strokeDasharray="3 3"
            />
            <circle cx={points[hover].x} cy={points[hover].y} r="4" fill={color} />
          </g>
        )}

        {points
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0)
          .map((p) => (
            <text key={`x-${p.date}`} x={p.x} y={height - 6} fontSize="10" fill="#94a3b8" textAnchor="middle">
              {p.label}
            </text>
          ))}
      </svg>

      <p className="mt-1 h-4 text-xs text-slate-500" aria-live="polite">
        {hover !== null && points[hover]
          ? `${points[hover].label}: ${valueFormatter(points[hover].value)} ${label}`
          : ''}
      </p>
    </div>
  );
};

interface BarsProps {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (value: number) => string;
}

export const HorizontalBars: React.FC<BarsProps> = ({
  data,
  color = '#4f46e5',
  valueFormatter = formatNumber,
}) => {
  if (!data.length) return <EmptyChart height={140} />;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="truncate capitalize text-slate-700">{d.label.replace(/_/g, ' ')}</span>
            <span className="ml-3 font-mono text-xs text-slate-500">{valueFormatter(d.value)}</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export const Donut: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const palette = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return <EmptyChart height={160} />;

  let offset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90" role="img" aria-label="Breakdown by status">
        {data.map((d, i) => {
          const length = (d.value / total) * circumference;
          const circle = (
            <circle
              key={d.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth="20"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
      </svg>

      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            <span className="capitalize text-slate-700">{d.label.replace(/_/g, ' ')}</span>
            <span className="font-mono text-xs text-slate-500">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Tiny inline trend line for stat cards. */
export const Sparkline: React.FC<{ data: SeriesPoint[]; color?: string }> = ({
  data,
  color = '#4f46e5',
}) => {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = 100 / (data.length - 1);
  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${i * step},${28 - (d.value / max) * 26}`)
    .join(' ');

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const EmptyChart: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400"
    style={{ height }}
  >
    No data in this range yet
  </div>
);
