import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { DataTable } from '../../features/admin/components/DataTable';
import { RecordEditor } from '../../features/admin/components/RecordEditor';
import { EmptyState } from '../../features/admin/components/StatCard';
import { contentTypeById } from '../../features/admin/config/contentTypes';
import {
  useAdminCollection,
  useAdminMutations,
} from '../../features/admin/hooks/useAdminCollection';
import type { AdminRecord } from '../../features/admin/types/admin.types';

/**
 * One page serves every collection in the registry — /admin/c/works,
 * /admin/c/orders, /admin/c/audit and the rest all land here.
 */
const AdminCollectionPage: React.FC = () => {
  const { typeId } = useParams<{ typeId: string }>();
  const type = contentTypeById(typeId);
  const [active, setActive] = useState<AdminRecord | null>(null);

  if (!type) {
    return (
      <AdminShell title="Not found">
        <EmptyState
          title="No such collection"
          body={`"${typeId}" isn't in the content type registry. Add it to config/contentTypes.ts to manage it here.`}
        />
      </AdminShell>
    );
  }

  return <CollectionView key={type.id} typeId={type.id} active={active} setActive={setActive} />;
};

const CollectionView: React.FC<{
  typeId: string;
  active: AdminRecord | null;
  setActive: (record: AdminRecord | null) => void;
}> = ({ typeId, active, setActive }) => {
  const type = contentTypeById(typeId)!;
  const list = useAdminCollection(type);
  const { update, remove, bulkUpdate, bulkRemove } = useAdminMutations(type.collection);

  return (
    <AdminShell
      title={type.plural}
      subtitle={type.description}
      toolbar={
        <IonButton fill="clear" size="small" onClick={() => list.refetch()}>
          Refresh
        </IonButton>
      }
    >
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
    </AdminShell>
  );
};

export default AdminCollectionPage;
