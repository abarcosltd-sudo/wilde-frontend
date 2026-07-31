import React, { useMemo, useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import {
  arrowDownOutline,
  arrowUpOutline,
  ellipsisHorizontal,
  searchOutline,
} from 'ionicons/icons';
import Swal from 'sweetalert2';

import { EmptyState } from './StatCard';
import { formatCell, humanise, statusTone } from '../utils/format';
import { useCan } from '../hooks/useAdminAuth';
import { useReferenceLabels } from '../hooks/useReferenceLabels';
import type { AdminRecord, ContentTypeDef, RowAction } from '../types/admin.types';

interface DataTableProps {
  type: ContentTypeDef;
  rows: AdminRecord[];
  loading: boolean;
  hasMore: boolean;
  fetchingMore: boolean;
  search: string;
  sortField?: string;
  direction: 'asc' | 'desc';
  activeFilters: Record<string, unknown>;
  onSearch: (value: string) => void;
  onFilter: (key: string, value: unknown) => void;
  onSort: (field: string) => void;
  onLoadMore: () => void;
  onOpen: (record: AdminRecord) => void;
  onRowAction: (record: AdminRecord, action: RowAction) => void;
  onBulk: (ids: string[], patch: Record<string, unknown>) => void;
  onBulkDelete: (ids: string[]) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  type, rows, loading, hasMore, fetchingMore, search, sortField, direction,
  activeFilters, onSearch, onFilter, onSort, onLoadMore, onOpen, onRowAction,
  onBulk, onBulkDelete,
}) => {
  const can = useCan();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [term, setTerm] = useState(search);

  const columns = useMemo(() => type.fields.filter((f) => f.column), [type]);
  const statusField = type.fields.find((f) => f.key === type.statusField);
  const searchable = !!type.searchFields?.length;

  // Every id in a reference column on this page, resolved to a name in one
  // batch rather than a lookup per cell.
  const referenceColumns = useMemo(
    () => columns.filter((f) => f.kind === 'reference' && f.refCollection),
    [columns],
  );
  const references = useMemo(
    () =>
      rows.flatMap((record) =>
        referenceColumns.map((field) => ({
          collection: field.refCollection as string,
          id: record[field.key],
        })),
      ),
    [rows, referenceColumns],
  );
  const labelFor = useReferenceLabels(references);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));

  const runAction = async (record: AdminRecord, action: RowAction) => {
    setMenuFor(null);
    if (action.confirm) {
      const result = await Swal.fire({
        title: action.label,
        text: action.confirm,
        icon: action.tone === 'danger' ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: action.label,
        confirmButtonColor: action.tone === 'danger' ? '#e11d48' : '#4f46e5',
      });
      if (!result.isConfirmed) return;
    }
    onRowAction(record, action);
  };

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    const result = await Swal.fire({
      title: `Delete ${ids.length} ${ids.length === 1 ? type.label.toLowerCase() : type.plural.toLowerCase()}?`,
      text: 'This cannot be undone. Hiding is reversible — deleting is not.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#e11d48',
    });
    if (result.isConfirmed) {
      onBulkDelete(ids);
      setSelected(new Set());
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        {searchable && (
          <form
            className="relative flex-1 min-w-[200px]"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(term.trim());
            }}
          >
            <IonIcon
              icon={searchOutline}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={`Search ${type.plural.toLowerCase()} by ${type.searchFields?.[0]}`}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </form>
        )}

        {statusField?.options && (
          <select
            value={String(activeFilters[statusField.key] ?? '')}
            onChange={(e) => onFilter(statusField.key, e.target.value || undefined)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statusField.options.map((option) => (
              <option key={option} value={option}>{humanise(option)}</option>
            ))}
          </select>
        )}

        <span className="ml-auto font-mono text-xs text-slate-500">
          {rows.length}{hasMore ? '+' : ''} loaded
        </span>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2 text-sm">
          <span className="font-medium text-indigo-900">{selected.size} selected</span>
          {statusField?.options && can('content.write') && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                onBulk([...selected], { [statusField.key]: e.target.value });
                setSelected(new Set());
                e.target.value = '';
              }}
              className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs"
              aria-label="Set status for selected"
            >
              <option value="">Set status…</option>
              {statusField.options.map((option) => (
                <option key={option} value={option}>{humanise(option)}</option>
              ))}
            </select>
          )}
          {can('content.delete') && (
            <button onClick={confirmBulkDelete} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white">
              Delete
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="text-xs text-indigo-700 underline">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><IonSpinner /></div>
      ) : rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={`No ${type.plural.toLowerCase()} match this view`}
            body={search ? 'Clear the search to see everything in this collection.' : 'Records will appear here as soon as the app writes them.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all loaded rows"
                  />
                </th>
                {columns.map((field) => (
                  <th key={field.key} className={`px-3 py-2 font-medium ${field.width ?? ''}`}>
                    <button
                      onClick={() => onSort(field.key)}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      {field.label}
                      {sortField === field.key && (
                        <IonIcon icon={direction === 'desc' ? arrowDownOutline : arrowUpOutline} />
                      )}
                    </button>
                  </th>
                ))}
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((record) => {
                const actions = (type.rowActions ?? []).filter(
                  (a) => can(a.permission) && (!a.when || a.when(record)),
                );

                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(record.id)}
                        onChange={() => toggle(record.id)}
                        aria-label={`Select ${record[type.titleField] ?? record.id}`}
                      />
                    </td>

                    {columns.map((field) => {
                      const resolved =
                        field.kind === 'reference' && field.refCollection
                          ? labelFor(field.refCollection, record[field.key])
                          : undefined;

                      return (
                        <td
                          key={field.key}
                          onClick={() => onOpen(record)}
                          className="cursor-pointer px-3 py-2 align-top text-slate-700"
                        >
                          {field.key === type.statusField ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(record[field.key])}`}>
                              {humanise(record[field.key] ?? 'unknown')}
                            </span>
                          ) : field.kind === 'boolean' ? (
                            <span className={record[field.key] ? 'text-emerald-600' : 'text-slate-400'}>
                              {record[field.key] ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <span
                              // A resolved name reads as prose; only an id that
                              // stayed an id still wants the monospace column.
                              className={
                                !resolved &&
                                (field.kind === 'reference' || field.kind === 'number' || field.kind === 'money')
                                  ? 'font-mono text-xs'
                                  : ''
                              }
                              title={resolved ? String(record[field.key]) : undefined}
                            >
                              {resolved ?? formatCell(field, record)}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="relative px-3 py-2 text-right">
                      {actions.length > 0 && (
                        <>
                          <button
                            onClick={() => setMenuFor(menuFor === record.id ? null : record.id)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-200"
                            aria-label={`Actions for ${record[type.titleField] ?? record.id}`}
                            aria-expanded={menuFor === record.id}
                          >
                            <IonIcon icon={ellipsisHorizontal} />
                          </button>
                          {menuFor === record.id && (
                            <div className="absolute right-2 top-9 z-20 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              {actions.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => runAction(record, action)}
                                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                                    action.tone === 'danger' ? 'text-rose-600' : 'text-slate-700'
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !loading && (
        <div className="border-t border-slate-200 p-3 text-center">
          <IonButton fill="clear" size="small" onClick={onLoadMore} disabled={fetchingMore}>
            {fetchingMore ? 'Loading…' : 'Load more'}
          </IonButton>
        </div>
      )}
    </div>
  );
};
