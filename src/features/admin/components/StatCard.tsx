import React from 'react';
import { IonSpinner } from '@ionic/react';

import { Sparkline } from './charts/Charts';
import type { SeriesPoint } from '../services/analytics.service';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: SeriesPoint[];
  tone?: 'default' | 'warning' | 'danger';
  loading?: boolean;
  onClick?: () => void;
}

const TONES = {
  default: 'border-slate-200',
  warning: 'border-amber-300 bg-amber-50/60',
  danger: 'border-rose-300 bg-rose-50/60',
};

export const StatCard: React.FC<StatCardProps> = ({
  label, value, hint, trend, tone = 'default', loading, onClick,
}) => {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-4 text-left transition-shadow ${TONES[tone]} ${
        onClick ? 'hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500' : ''
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-slate-900">
        {loading ? <IonSpinner name="dots" /> : value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      {trend && trend.length > 1 && (
        <div className="mt-2">
          <Sparkline data={trend} />
        </div>
      )}
    </Wrapper>
  );
};

export const Section: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, action, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5">
    <header className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);

export const EmptyState: React.FC<{ title: string; body: string; action?: React.ReactNode }> = ({
  title, body, action,
}) => (
  <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{body}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
