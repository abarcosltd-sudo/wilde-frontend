import React, { useState } from 'react';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { DataTable } from '../../features/admin/components/DataTable';
import { RecordEditor } from '../../features/admin/components/RecordEditor';
import { AreaChart } from '../../features/admin/components/charts/Charts';
import { Section, StatCard } from '../../features/admin/components/StatCard';
import { contentTypeById } from '../../features/admin/config/contentTypes';
import {
  useAdminCollection,
  useAdminMutations,
  useMarket,
} from '../../features/admin/hooks/useAdminCollection';
import { useAdminStore } from '../../features/admin/store/adminStore';
import { formatMoney, formatNumber, formatPercent } from '../../features/admin/utils/format';
import type { AdminRecord } from '../../features/admin/types/admin.types';

const TABS = ['listings', 'orders', 'payments', 'jobs'] as const;
type Tab = (typeof TABS)[number];

const AdminMarketPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('listings');
  const range = useAdminStore((s) => s.range);
  const market = useMarket(range);

  return (
    <AdminShell title="Market" subtitle="Ghostwriter listings, orders, the payment ledger and job posts.">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Gross volume" value={formatMoney(market.data?.gmv)} hint={`Last ${range} days`} loading={market.isLoading} />
          <StatCard label="Orders" value={formatNumber(market.data?.orders)} loading={market.isLoading} />
          <StatCard label="Average order" value={formatMoney(market.data?.averageOrderValue)} loading={market.isLoading} />
          <StatCard
            label="Disputes + refunds"
            value={formatPercent(market.data?.refundRate ?? 0)}
            tone={(market.data?.refundRate ?? 0) > 0.05 ? 'warning' : 'default'}
            loading={market.isLoading}
          />
        </div>

        <Section title="Order value" subtitle={`Daily, last ${range} days`}>
          <AreaChart
            data={market.data?.gmvSeries ?? []}
            color="#f59e0b"
            label="revenue"
            valueFormatter={(v) => formatMoney(v)}
          />
        </Section>

        {/*
          Deliberately not an IonSegment. Ionic paints the selected segment with
          `--ion-color-primary`, which in this app is near-black in light mode
          and cream in dark — so these tabs came out black, and flipped colour
          on their own when `useAutoTheme` switched at 18:00, while the rest of
          the admin stayed light. The panel is light-only and styles itself, so
          the tabs do too, matching the range picker on the dashboard.
        */}
        <div
          role="tablist"
          aria-label="Market records"
          className="flex gap-1 rounded-lg bg-slate-100 p-1"
        >
          {TABS.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <MarketTable key={tab} typeId={tab} />
      </div>
    </AdminShell>
  );
};

const MarketTable: React.FC<{ typeId: string }> = ({ typeId }) => {
  const type = contentTypeById(typeId)!;
  const list = useAdminCollection(type);
  const { update, remove, bulkUpdate, bulkRemove } = useAdminMutations(type.collection);
  const [active, setActive] = useState<AdminRecord | null>(null);

  return (
    <>
      <DataTable
        type={type}
        rows={list.rows}
        loading={list.isLoading}
        hasMore={!!list.hasNextPage}
        fetchingMore={list.isFetchingNextPage}
        search={list.state.search}
        sortField={list.state.orderByField}
        direction={list.state.direction}
        activeFilters={list.state.filters}
        onSearch={list.setSearch}
        onFilter={list.setFilter}
        onSort={list.toggleSort}
        onLoadMore={() => list.fetchNextPage()}
        onOpen={setActive}
        onRowAction={(record, action) => update.mutate({ id: record.id, patch: action.patch })}
        onBulk={(ids, patch) => bulkUpdate.mutate({ ids, patch })}
        onBulkDelete={(ids) => bulkRemove.mutate(ids)}
      />
      <RecordEditor
        type={type}
        record={active}
        saving={update.isPending}
        onClose={() => setActive(null)}
        onSave={(id, patch) => update.mutate({ id, patch }, { onSuccess: () => setActive(null) })}
        onDelete={(id) => remove.mutate(id, { onSuccess: () => setActive(null) })}
      />
    </>
  );
};

export default AdminMarketPage;
