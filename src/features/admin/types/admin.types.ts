/**
 * Core types for the WILDE admin panel.
 *
 * The panel is registry-driven: every screen (except Users and Analytics, which
 * have bespoke logic) is generated from a ContentTypeDef. Adding a new Firestore
 * collection to the admin means adding one entry to `config/contentTypes.ts`.
 */

export type AdminRole = 'superadmin' | 'admin' | 'moderator' | 'analyst';

export type Permission =
  | 'content.read'
  | 'content.write'
  | 'content.delete'
  | 'users.read'
  | 'users.write'
  | 'users.suspend'
  | 'users.role'
  | 'market.read'
  | 'market.write'
  | 'market.refund'
  | 'analytics.read'
  | 'audit.read';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  superadmin: [
    'content.read', 'content.write', 'content.delete',
    'users.read', 'users.write', 'users.suspend', 'users.role',
    'market.read', 'market.write', 'market.refund',
    'analytics.read', 'audit.read',
  ],
  admin: [
    'content.read', 'content.write', 'content.delete',
    'users.read', 'users.write', 'users.suspend',
    'market.read', 'market.write',
    'analytics.read', 'audit.read',
  ],
  moderator: [
    'content.read', 'content.write', 'content.delete',
    'users.read', 'users.suspend',
    'market.read',
    'analytics.read',
  ],
  analyst: ['content.read', 'users.read', 'market.read', 'analytics.read'],
};

export interface AdminIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: AdminRole | null;
  permissions: Permission[];
}

/* ------------------------------------------------------------------ */
/* Content type registry                                               */
/* ------------------------------------------------------------------ */

export type FieldKind =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'money'
  | 'boolean'
  | 'timestamp'
  | 'enum'
  | 'reference'
  | 'image'
  | 'array'
  | 'json';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** Show as a column in the list view. */
  column?: boolean;
  /** Editable in the record editor. Ids and timestamps default to read-only. */
  editable?: boolean;
  /** Allowed values for `enum` fields. */
  options?: string[];
  /** Collection this id points at, for `reference` fields. */
  refCollection?: string;
  /** Tailwind width class for the table column. */
  width?: string;
  hint?: string;
}

export type AdminGroup = 'content' | 'community' | 'market' | 'system';

export interface RowAction {
  id: string;
  label: string;
  /** Field/value pair written when the action runs. */
  patch: Record<string, unknown>;
  /** Only offer the action when the record matches this predicate. */
  when?: (record: AdminRecord) => boolean;
  tone?: 'default' | 'warning' | 'danger';
  permission: Permission;
  confirm?: string;
}

export interface ContentTypeDef {
  /** URL slug: /admin/c/:id */
  id: string;
  /** Firestore collection name. */
  collection: string;
  label: string;
  plural: string;
  group: AdminGroup;
  /** ionicons name, e.g. 'bookOutline'. */
  icon: string;
  /** Field used as the human-readable title of a record. */
  titleField: string;
  /** Field holding the owning user's uid, if any. */
  ownerField?: string;
  /** Field holding the creation timestamp. Drives sorting + analytics. */
  createdField?: string;
  /** Field holding a moderation/lifecycle status, if any. */
  statusField?: string;
  /** Fields searchable with a prefix query (needs a matching index). */
  searchFields?: string[];
  fields: FieldDef[];
  rowActions?: RowAction[];
  /** Hidden from the sidebar but still reachable by URL. */
  hidden?: boolean;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* Data access                                                         */
/* ------------------------------------------------------------------ */

export type AdminRecord = Record<string, any> & { id: string };

export interface ListQuery {
  collection: string;
  pageSize?: number;
  orderByField?: string;
  direction?: 'asc' | 'desc';
  /** Equality filters, e.g. { status: 'hidden' }. */
  filters?: Record<string, unknown>;
  /** Prefix search against `searchField`. */
  search?: string;
  searchField?: string;
  /** Opaque cursor returned by the previous page. */
  cursor?: unknown;
}

export interface Page<T> {
  items: T[];
  cursor: unknown;
  hasMore: boolean;
}

export interface AdminRepository {
  list(query: ListQuery): Promise<Page<AdminRecord>>;
  get(collection: string, id: string): Promise<AdminRecord | null>;
  /**
   * Several documents by id, for resolving the reference columns in a list view
   * without a request per row. Ids that don't exist are simply absent from the
   * result, so the caller must not assume order or length.
   */
  getMany(collection: string, ids: string[]): Promise<AdminRecord[]>;
  update(collection: string, id: string, patch: Record<string, unknown>): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  count(collection: string, filters?: Record<string, unknown>): Promise<number>;
  /** Records created inside a window — the raw material for the analytics charts. */
  since(collection: string, field: string, from: Date): Promise<AdminRecord[]>;
}

export interface AuditEntry {
  actorUid: string;
  actorEmail: string | null;
  action: string;
  collection: string;
  documentId: string;
  before?: unknown;
  after?: unknown;
  at: Date;
}
