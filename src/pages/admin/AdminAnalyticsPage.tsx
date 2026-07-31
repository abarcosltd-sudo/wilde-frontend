import React from 'react';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { AreaChart, Donut, HorizontalBars } from '../../features/admin/components/charts/Charts';
import { Section, StatCard } from '../../features/admin/components/StatCard';
import {
  useGrowth,
  useMarket,
  useOverview,
  useTopCreators,
} from '../../features/admin/hooks/useAdminCollection';
import { useAdminStore } from '../../features/admin/store/adminStore';
import {
  formatMoney,
  formatNumber,
  formatPercent,
} from '../../features/admin/utils/format';

const AdminAnalyticsPage: React.FC = () => {
  const { range, setRange } = useAdminStore();
  const overview = useOverview();
  const growth = useGrowth(range);
  const market = useMarket(range);
  const creators = useTopCreators(range);

  const worksPerWriter =
    overview.data && overview.data.users ? overview.data.works / overview.data.users : 0;
  const chaptersPerWork =
    overview.data && overview.data.works ? overview.data.chapters / overview.data.works : 0;

  return (
    <AdminShell
      title="Analytics"
      subtitle="Growth, engagement and revenue. Counts are live from Firestore; long ranges are aggregated in the browser."
      toolbar={
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Date range">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              aria-pressed={range === days}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                range === days ? 'bg-indigo-600 text-white' : 'text-slate-600'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="New writers"
            value={formatNumber(growth.data?.newUsers)}
            hint={`${formatNumber(overview.data?.users)} total`}
            trend={growth.data?.signups}
            loading={growth.isLoading}
          />
          <StatCard
            label="Writers publishing"
            value={formatNumber(growth.data?.activeWriters)}
            hint="Unique authors with a new work"
            loading={growth.isLoading}
          />
          <StatCard
            label="Works per writer"
            value={worksPerWriter.toFixed(2)}
            hint="All time"
            loading={overview.isLoading}
          />
          <StatCard
            label="Chapters per work"
            value={chaptersPerWork.toFixed(1)}
            hint="Depth of finished pieces"
            loading={overview.isLoading}
          />
        </div>

        <Section title="Sign-ups" subtitle="Daily, with weekends visible as dips">
          <AreaChart data={growth.data?.signups ?? []} label="sign-ups" />
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Works started" subtitle="Daily">
            <AreaChart data={growth.data?.works ?? []} color="#0ea5e9" label="works" height={160} />
          </Section>
          <Section title="Community posts" subtitle="Daily">
            <AreaChart data={growth.data?.posts ?? []} color="#10b981" label="posts" height={160} />
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Gross volume" value={formatMoney(market.data?.gmv)} hint={`Last ${range} days`} loading={market.isLoading} />
          <StatCard label="Average order" value={formatMoney(market.data?.averageOrderValue)} loading={market.isLoading} />
          <StatCard label="Completion rate" value={formatPercent(market.data?.completionRate ?? 0)} loading={market.isLoading} />
          <StatCard
            label="Refund rate"
            value={formatPercent(market.data?.refundRate ?? 0)}
            tone={(market.data?.refundRate ?? 0) > 0.05 ? 'warning' : 'default'}
            loading={market.isLoading}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Revenue" subtitle="Order value per day">
            <AreaChart
              data={market.data?.gmvSeries ?? []}
              color="#f59e0b"
              label="revenue"
              valueFormatter={(v) => formatMoney(v)}
            />
          </Section>
          <Section title="Orders by status" subtitle={`Last ${range} days`}>
            <Donut data={market.data?.byStatus ?? []} />
          </Section>
        </div>

        <Section title="Top creators" subtitle="Works published, and reads those works earned">
          <HorizontalBars
            data={(creators.data ?? []).map((c) => ({ label: c.name, value: c.works }))}
          />
        </Section>
      </div>
    </AdminShell>
  );
};

export default AdminAnalyticsPage;
