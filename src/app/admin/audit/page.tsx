'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type ActivityLog = {
  id: string;
  user_id: string | null;
  role: string | null;
  device_id: string | null;
  action: string | null;
  target_table: string | null;
  target_id: string | null;
  payload: any;
  created_at: string;
  staff_name?: string;
  device_name?: string;
};

export default function AdminAuditPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user, dateFilter]);

  async function loadLogs() {
    setFetching(true);
    try {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('staff_activity')
        .select('*, staff:staff(full_name), device:devices(name)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      setLogs(
        (data ?? []).map((log: any) => ({
          ...log,
          staff_name: log.staff?.full_name || null,
          device_name: log.device?.name || null,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  function getActionBadge(action: string | null) {
    if (!action) return 'bg-slate-100 text-slate-600';
    if (action.includes('create') || action.includes('insert') || action.includes('register')) {
      return 'bg-green-100 text-green-700';
    }
    if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-100 text-blue-700';
    }
    if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-700';
    }
    if (action.includes('login') || action.includes('logout')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-slate-100 text-slate-600';
  }

  function getRoleBadge(role: string | null) {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-700';
      case 'pharmacist':
        return 'bg-green-100 text-green-700';
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'kiosk':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  const uniqueActions = [...new Set(logs.map((l) => l.action).filter(Boolean))];
  const uniqueRoles = [...new Set(logs.map((l) => l.role).filter(Boolean))];

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (roleFilter && log.role !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/admin/login" className="text-blue-600 hover:underline">
          Login untuk mengakses halaman ini
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali ke Admin
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-600">Riwayat aktivitas staf dalam sistem</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow">
          <div>
            <label className="text-xs font-medium text-slate-600">Tanggal</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Aksi</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action!}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role!}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadLogs}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-slate-900">{filteredLogs.length}</p>
            <p className="text-sm text-slate-600">Total Aktivitas</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter((l) => l.role === 'doctor').length}
            </p>
            <p className="text-sm text-slate-600">Dokter</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-green-600">
              {filteredLogs.filter((l) => l.role === 'pharmacist').length}
            </p>
            <p className="text-sm text-slate-600">Apoteker</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-orange-600">
              {filteredLogs.filter((l) => l.role === 'kiosk').length}
            </p>
            <p className="text-sm text-slate-600">Kiosk</p>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="rounded-xl bg-white shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Staf</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Aksi</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Target</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {log.staff_name || log.user_id?.slice(0, 8) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.role && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(log.role)}`}>
                          {log.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.action && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {log.target_table && (
                        <span>
                          {log.target_table}
                          {log.target_id && <span className="text-slate-400"> #{log.target_id.slice(0, 8)}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {log.device_name || log.device_id || '-'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada aktivitas pada tanggal ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
