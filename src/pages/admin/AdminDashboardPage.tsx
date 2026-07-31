import React from 'react';
import { useHistory } from 'react-router-dom';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { AreaChart, HorizontalBars } from '../../features/admin/components/charts/Charts';
import { Section, StatCard } from '../../features/admin/components/StatCard';
import {
  useGrowth,
  useMarket,
  useOverview,
  useTopCreators,
} from '../../features/admin/hooks/useAdminCollection';
import { useAdminStore } from '../../features/admin/store/adminStore';
import { formatMoney, formatNumber } from '../../features/admin/utils/format';

const RangePicker: React.FC = () => {
  const { range, setRange } = useAdminStore();
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Date range">
      {([7, 30, 90] as const).map((days) => (
        <button
          key={days}
          onClick={() => setRange(days)}
          aria-pressed={range === days}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            range === days ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
};

const AdminDashboardPage: React.FC = () => {
  const history = useHistory();
  const range = useAdminStore((s) => s.range);

  const overview = useOverview();
  const growth = useGrowth(range);
  const market = useMarket(range);
  const creators = useTopCreators(range);

  const needsAttention =
    (overview.data?.flagged ?? 0) +
    (overview.data?.pendingListings ?? 0) +
    (overview.data?.disputedOrders ?? 0);

  return (
    <AdminShell
      title="Overview"
      subtitle={`Platform health across the last ${range} days.`}
      toolbar={<RangePicker />}
    >
      <div className="space-y-5">
        {needsAttention > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-900">
              {needsAttention} {needsAttention === 1 ? 'item needs' : 'items need'} a decision:{' '}
              {overview.data?.flagged} flagged, {overview.data?.pendingListings} listings awaiting
              approval, {overview.data?.disputedOrders} disputed orders.
            </p>
            <button
              onClick={() => history.push('/admin/moderation')}
              className="ml-auto rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Open queue
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Writers"
            value={formatNumber(overview.data?.users)}
            hint={`${formatNumber(growth.data?.newUsers)} joined this period`}
            trend={growth.data?.signups}
            loading={overview.isLoading}
            onClick={() => history.push('/admin/users')}
          />
          <StatCard
            label="Works"
            value={formatNumber(overview.data?.works)}
            hint={`${formatNumber(overview.data?.chapters)} chapters`}
            trend={growth.data?.works}
            loading={overview.isLoading}
            onClick={() => history.push('/admin/c/works')}
          />
          <StatCard
            label="Community posts"
            value={formatNumber(overview.data?.posts)}
            hint={`${formatNumber(overview.data?.comments)} comments`}
            trend={growth.data?.posts}
            loading={overview.isLoading}
            onClick={() => history.push('/admin/c/posts')}
          />
          <StatCard
            label="Market volume"
            value={formatMoney(market.data?.gmv)}
            hint={`${formatNumber(market.data?.orders)} orders`}
            loading={market.isLoading}
            onClick={() => history.push('/admin/market')}
          />
        </div>

        <Section title="New writers" subtitle={`Sign-ups per day, last ${range} days`}>
          <AreaChart data={growth.data?.signups ?? []} label="sign-ups" />
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Work published" subtitle="New works per day">
            <AreaChart data={growth.data?.works ?? []} color="#0ea5e9" label="works" height={160} />
          </Section>

          <Section
            title="Most active writers"
            subtitle={`By works published in the last ${range} days`}
          >
            {creators.data?.length ? (
              <HorizontalBars
                data={creators.data.map((c) => ({ label: c.name, value: c.works }))}
              />
            ) : (
              <p className="text-sm text-slate-500">No works published in this range.</p>
            )}
          </Section>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboardPage;
