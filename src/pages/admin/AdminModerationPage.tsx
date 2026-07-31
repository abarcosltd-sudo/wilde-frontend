import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IonSpinner } from '@ionic/react';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { EmptyState, Section } from '../../features/admin/components/StatCard';
import { adminData } from '../../features/admin/services/adminData.service';
import { contentTypeById } from '../../features/admin/config/contentTypes';
import { useCan } from '../../features/admin/hooks/useAdminAuth';
import { formatCell, formatWhen, shortId } from '../../features/admin/utils/format';
import { useReferenceLabels } from '../../features/admin/hooks/useReferenceLabels';
import type { AdminRecord } from '../../features/admin/types/admin.types';

interface QueueDef {
  id: string;
  typeId: string;
  title: string;
  subtitle: string;
  filters: Record<string, unknown>;
  orderBy: string;
  resolve: { label: string; patch: Record<string, unknown> }[];
}

/** Everything waiting on a human decision, in the order it should be handled. */
const QUEUES: QueueDef[] = [
  {
    id: 'flagged-posts',
    typeId: 'posts',
    title: 'Flagged posts',
    subtitle: 'Reported by readers, still visible',
    filters: { status: 'flagged' },
    orderBy: 'createdAt',
    resolve: [
      { label: 'Keep up', patch: { status: 'visible', reportCount: 0 } },
      { label: 'Take down', patch: { status: 'hidden' } },
    ],
  },
  {
    id: 'flagged-comments',
    typeId: 'comments',
    title: 'Flagged comments',
    subtitle: 'Reported by readers, still visible',
    filters: { status: 'flagged' },
    orderBy: 'createdAt',
    resolve: [
      { label: 'Keep up', patch: { status: 'visible', reportCount: 0 } },
      { label: 'Take down', patch: { status: 'hidden' } },
    ],
  },
  {
    id: 'pending-listings',
    typeId: 'listings',
    title: 'Listings awaiting approval',
    subtitle: 'Sellers cannot trade until these clear',
    filters: { status: 'pending' },
    orderBy: 'createdAt',
    resolve: [
      { label: 'Approve', patch: { status: 'active' } },
      { label: 'Reject', patch: { status: 'rejected' } },
    ],
  },
  {
    id: 'disputed-orders',
    typeId: 'orders',
    title: 'Disputed orders',
    subtitle: 'Money is held until someone decides',
    filters: { status: 'disputed' },
    orderBy: 'createdAt',
    resolve: [
      { label: 'Side with seller', patch: { status: 'completed' } },
      { label: 'Cancel order', patch: { status: 'cancelled' } },
    ],
  },
];

const AdminModerationPage: React.FC = () => (
  <AdminShell
    title="Moderation"
    subtitle="Oldest first — anything sitting here is blocking someone."
  >
    <div className="space-y-5">
      {QUEUES.map((queue) => (
        <Queue key={queue.id} queue={queue} />
      ))}
    </div>
  </AdminShell>
);

const Queue: React.FC<{ queue: QueueDef }> = ({ queue }) => {
  const type = contentTypeById(queue.typeId)!;
  const can = useCan();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'queue', queue.id],
    queryFn: () =>
      adminData.list({
        collection: type.collection,
        filters: queue.filters,
        orderByField: queue.orderBy,
        direction: 'asc',
        pageSize: 10,
      }),
    refetchInterval: 60_000,
  });

  const resolve = async (record: AdminRecord, patch: Record<string, unknown>) => {
    setBusy(record.id);
    await adminData.update(type.collection, record.id, patch);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'queue', queue.id] }),
      qc.invalidateQueries({ queryKey: ['admin', 'analytics', 'overview'] }),
    ]);
    setBusy(null);
  };

  const items = data?.items ?? [];
  const preview = type.fields.find((f) => f.key === type.titleField) ?? type.fields[0];

  // Who posted the thing being moderated. Deciding whether a flagged comment is
  // abuse or a feud reads very differently with a name attached to it.
  const ownerField = type.ownerField ?? 'id';
  const ownerCollection =
    type.fields.find((f) => f.key === ownerField)?.refCollection ?? 'Users';
  const labelFor = useReferenceLabels(
    items.map((record) => ({ collection: ownerCollection, id: record[ownerField] })),
  );

  return (
    <Section
      title={queue.title}
      subtitle={queue.subtitle}
      action={
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
          {isLoading ? '…' : `${items.length}${data?.hasMore ? '+' : ''}`}
        </span>
      }
    >
      {isLoading ? (
        <IonSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing waiting" body="This queue is clear." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((record) => (
            <li key={record.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">{formatCell(preview, record)}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {labelFor(ownerCollection, record[ownerField]) ?? shortId(record[ownerField])} · {formatWhen(record[queue.orderBy])}
                  {record.reportCount ? ` · ${record.reportCount} reports` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                {queue.resolve.map((option, index) => (
                  <button
                    key={option.label}
                    disabled={busy === record.id || !can('content.write')}
                    onClick={() => resolve(record, option.patch)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      index === 0
                        ? 'bg-slate-900 text-white'
                        : 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    {busy === record.id ? '…' : option.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

export default AdminModerationPage;
