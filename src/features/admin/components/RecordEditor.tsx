import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import Swal from 'sweetalert2';

import { formatWhen, humanise, statusTone } from '../utils/format';
import { useCan } from '../hooks/useAdminAuth';
import { useReferenceLabels } from '../hooks/useReferenceLabels';
import type { AdminRecord, ContentTypeDef, FieldDef } from '../types/admin.types';

interface RecordEditorProps {
  type: ContentTypeDef;
  record: AdminRecord | null;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  saving?: boolean;
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

const Field: React.FC<{
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}> = ({ field, value, onChange }) => {
  switch (field.kind) {
    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case 'enum':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>{humanise(option)}</option>
          ))}
        </select>
      );
    case 'number':
    case 'money':
      return (
        <input
          type="number"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={inputClass}
        />
      );
    case 'text':
    case 'richtext':
      return (
        <textarea
          rows={field.kind === 'richtext' ? 10 : 4}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} font-normal`}
        />
      );
    case 'array':
      return (
        <input
          value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
          onChange={(e) => onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
          className={inputClass}
          placeholder="Comma separated"
        />
      );
    default:
      return (
        <input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
};

export const RecordEditor: React.FC<RecordEditorProps> = ({
  type, record, onClose, onSave, onDelete, saving,
}) => {
  const can = useCan();
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => setDraft({}), [record?.id]);

  // Above the early return: this is a hook, so it cannot be skipped when the
  // modal has no record. An empty list resolves to nothing and costs nothing.
  const references = useMemo(
    () =>
      record
        ? type.fields
            .filter((f) => f.kind === 'reference' && f.refCollection)
            .map((f) => ({ collection: f.refCollection as string, id: record[f.key] }))
        : [],
    [record, type.fields],
  );
  const labelFor = useReferenceLabels(references);

  if (!record) return null;

  const editable = type.fields.filter((f) => f.editable);
  const readOnly = type.fields.filter((f) => !f.editable);
  const dirty = Object.keys(draft).length > 0;
  const valueOf = (key: string) => (key in draft ? draft[key] : record[key]);

  const confirmDelete = async () => {
    const result = await Swal.fire({
      title: `Delete this ${type.label.toLowerCase()}?`,
      text: 'Permanent. If you only want it out of public view, set the status to hidden instead.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#e11d48',
    });
    if (result.isConfirmed) onDelete(record.id);
  };

  return (
    <IonModal isOpen={!!record} onDidDismiss={onClose}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="truncate">
            {String(record[type.titleField] ?? type.label)}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="light">
        <div className="mx-auto max-w-2xl space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-600">
              {type.collection}/{record.id}
            </span>
            {type.statusField && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(record[type.statusField])}`}>
                {humanise(record[type.statusField] ?? 'unknown')}
              </span>
            )}
          </div>

          {editable.length > 0 && can('content.write') && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              {editable.map((field) => (
                <div key={field.key}>
                  {field.kind !== 'boolean' && (
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                      {field.label}
                    </label>
                  )}
                  <Field
                    field={field}
                    value={valueOf(field.key)}
                    onChange={(value) => setDraft((d) => ({ ...d, [field.key]: value }))}
                  />
                  {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Record details
            </h3>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {readOnly.map((field) => {
                const resolved =
                  field.kind === 'reference' && field.refCollection
                    ? labelFor(field.refCollection, record[field.key])
                    : undefined;

                return (
                  <div key={field.key}>
                    <dt className="text-xs text-slate-500">{field.label}</dt>
                    {resolved ? (
                      /* The name is what identifies the record to a person, so it
                         leads. The id stays underneath because it is what you
                         copy into a query or quote in a bug report. */
                      <dd className="text-xs text-slate-800">
                        {resolved}
                        <span className="ml-1 break-all font-mono text-slate-400">
                          {String(record[field.key])}
                        </span>
                      </dd>
                    ) : (
                      <dd className="break-all font-mono text-xs text-slate-800">
                        {field.kind === 'timestamp'
                          ? formatWhen(record[field.key])
                          : field.kind === 'json'
                          ? JSON.stringify(record[field.key] ?? null)
                          : String(record[field.key] ?? '—')}
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="flex items-center gap-2 pb-8">
            <IonButton
              disabled={!dirty || saving}
              onClick={() => onSave(record.id, draft)}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </IonButton>
            {dirty && (
              <IonButton fill="clear" onClick={() => setDraft({})}>Discard</IonButton>
            )}
            {can('content.delete') && (
              <IonButton fill="clear" color="danger" className="ml-auto" onClick={confirmDelete}>
                Delete
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};
