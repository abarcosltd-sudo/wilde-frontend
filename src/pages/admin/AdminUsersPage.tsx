import React, { useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';

import { AdminShell } from '../../features/admin/components/AdminShell';
import { EmptyState, Section } from '../../features/admin/components/StatCard';
import { adminData } from '../../features/admin/services/adminData.service';
import { adminApi } from '../../features/admin/services/rest.repository';
import {
  useAdminCollection,
  useAdminMutations,
} from '../../features/admin/hooks/useAdminCollection';
import { useCan } from '../../features/admin/hooks/useAdminAuth';
import {
  formatNumber,
  formatWhen,
  humanise,
  statusTone,
} from '../../features/admin/utils/format';
import type { AdminRecord, ContentTypeDef } from '../../features/admin/types/admin.types';

/** Users get their own screen: roles and suspension are not ordinary field edits. */
const USER_TYPE: ContentTypeDef = {
  id: 'users',
  collection: 'Users',
  label: 'User',
  plural: 'Users',
  group: 'system',
  icon: 'peopleOutline',
  titleField: 'displayName',
  createdField: 'createdAt',
  statusField: 'status',
  searchFields: ['username', 'displayName', 'email'],
  fields: [
    { key: 'displayName', label: 'Name', kind: 'string', column: true, editable: true },
    { key: 'username', label: 'Username', kind: 'string', column: true },
    { key: 'email', label: 'Email', kind: 'string', column: true },
    { key: 'status', label: 'Status', kind: 'enum', column: true,
      options: ['active', 'suspended', 'deactivated'] },
    { key: 'role', label: 'Role', kind: 'enum', column: true,
      options: ['', 'analyst', 'moderator', 'admin', 'superadmin'] },
    { key: 'createdAt', label: 'Joined', kind: 'timestamp', column: true },
  ],
};

const ROLES = ['analyst', 'moderator', 'admin', 'superadmin'] as const;

const AdminUsersPage: React.FC = () => {
  const can = useCan();
  const list = useAdminCollection(USER_TYPE, 30);
  const { update } = useAdminMutations('Users');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<AdminRecord | null>(null);

  const suspend = async (user: AdminRecord) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `Suspend ${user.displayName ?? user.username ?? 'this user'}?`,
      input: 'text',
      inputLabel: 'Reason shown to the user',
      inputPlaceholder: 'Repeated harassment in group posts',
      showCancelButton: true,
      confirmButtonText: 'Suspend',
      confirmButtonColor: '#e11d48',
      inputValidator: (value) => (value ? null : 'Give a reason — the user sees it'),
    });
    if (!isConfirmed) return;

    try {
      await adminApi.suspendUser(user.id, reason as string);
    } catch {
      // Backend route not live yet: fall back to the status field so the app's
      // own guards still lock the account out.
      await update.mutateAsync({
        id: user.id,
        patch: { status: 'suspended', suspensionReason: reason },
      });
    }
    list.refetch();
  };

  const reinstate = async (user: AdminRecord) => {
    try {
      await adminApi.reinstateUser(user.id);
    } catch {
      await update.mutateAsync({
        id: user.id,
        patch: { status: 'active', suspensionReason: null },
      });
    }
    list.refetch();
  };

  const changeRole = async (user: AdminRecord) => {
    const { value: role, isConfirmed } = await Swal.fire({
      title: 'Set admin role',
      input: 'select',
      inputOptions: {
        '': 'No admin access',
        ...Object.fromEntries(ROLES.map((r) => [r, humanise(r)])),
      },
      inputValue: user.role ?? '',
      showCancelButton: true,
      confirmButtonText: 'Set role',
      text: 'The role is written as a signed custom claim by the backend. Firestore rules read that claim, so this is what actually grants access.',
    });
    if (!isConfirmed) return;

    try {
      await adminApi.setUserRole(user.id, (role as string) || null);
      list.refetch();
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Role not changed',
        text: 'Custom claims can only be set server-side. Add POST /admin/users/:uid/role to wilde-backend, then try again.',
      });
    }
  };

  return (
    <AdminShell
      title="Users"
      subtitle="Accounts, admin roles and suspensions."
      toolbar={<IonButton fill="clear" size="small" onClick={() => list.refetch()}>Refresh</IonButton>}
    >
      <div className="space-y-4">
        <form
          className="relative max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            list.setSearch(term.trim());
          }}
        >
          <IonIcon
            icon={searchOutline}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by username"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </form>

        <div className="rounded-xl border border-slate-200 bg-white">
          {list.isLoading ? (
            <div className="flex justify-center py-16"><IonSpinner /></div>
          ) : list.rows.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No users match" body="Try a different username, or clear the search." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Admin role</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.rows.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="cursor-pointer px-3 py-2" onClick={() => setSelected(user)}>
                        <p className="font-medium text-slate-800">{user.displayName ?? '—'}</p>
                        <p className="font-mono text-xs text-slate-500">
                          {user.username ? `@${user.username}` : user.email ?? user.id}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(user.status ?? 'active')}`}>
                          {humanise(user.status ?? 'active')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs capitalize text-slate-600">
                        {user.role ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {formatWhen(user.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {can('users.role') && (
                          <button onClick={() => changeRole(user)} className="mr-3 text-xs text-indigo-600 underline">
                            Role
                          </button>
                        )}
                        {can('users.suspend') && (
                          user.status === 'suspended' ? (
                            <button onClick={() => reinstate(user)} className="text-xs text-emerald-600 underline">
                              Reinstate
                            </button>
                          ) : (
                            <button onClick={() => suspend(user)} className="text-xs text-rose-600 underline">
                              Suspend
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list.hasNextPage && (
            <div className="border-t border-slate-200 p-3 text-center">
              <IonButton fill="clear" size="small" onClick={() => list.fetchNextPage()}>
                Load more
              </IonButton>
            </div>
          )}
        </div>

        {selected && <UserActivity user={selected} onClose={() => setSelected(null)} />}
      </div>
    </AdminShell>
  );
};

/** What this account has actually done — the context you need before acting on it. */
const UserActivity: React.FC<{ user: AdminRecord; onClose: () => void }> = ({ user, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-activity', user.id],
    queryFn: async () => {
      const [works, posts, comments, listings, orders, followers] = await Promise.all([
        adminData.count('Works', { authorId: user.id }),
        adminData.count('Posts', { authorId: user.id }),
        adminData.count('Comments', { authorId: user.id }),
        adminData.count('GhostwriterListings', { userId: user.id }),
        adminData.count('Orders', { buyerId: user.id }),
        adminData.count('Follows', { followingId: user.id }),
      ]);
      return { works, posts, comments, listings, orders, followers };
    },
  });

  const stats: [string, number | undefined][] = [
    ['Works', data?.works],
    ['Posts', data?.posts],
    ['Comments', data?.comments],
    ['Listings', data?.listings],
    ['Orders placed', data?.orders],
    ['Followers', data?.followers],
  ];

  return (
    <Section
      title={user.displayName ?? user.username ?? user.id}
      subtitle={`Account ${user.id}`}
      action={<IonButton fill="clear" size="small" onClick={onClose}>Close</IonButton>}
    >
      {isLoading ? (
        <IonSpinner />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <p className="font-mono text-lg font-semibold text-slate-900">{formatNumber(value)}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      {user.suspensionReason && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Suspended: {user.suspensionReason}
        </p>
      )}
    </Section>
  );
};

export default AdminUsersPage;
