'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type Device = {
  id: string;
  device_id: string;
  name: string;
  role_type: string;
  status: string;
  assigned_user_id: string | null;
  last_heartbeat_at: string | null;
  registered_at: string | null;
};

type NewDevice = {
  device_id: string;
  name: string;
  role_type: string;
  assigned_user_id: string;
};

const roleTypes = ['kiosk', 'doctor', 'pharmacy', 'admin'] as const;

export default function AdminDevicesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(
    () => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }),
    [],
  );

  const [devices, setDevices] = useState<Device[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState<NewDevice>({
    device_id: '',
    name: '',
    role_type: 'kiosk',
    assigned_user_id: '',
  });

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user]);

  async function loadDevices() {
    setFetching(true);
    setActionError(null);

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      setActionError(error.message);
    } else {
      setDevices(data ?? []);
    }
    setFetching(false);
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage(null);
    setActionError(null);
    setSubmitting(true);

    try {
      if (!newDevice.device_id.trim() || !newDevice.name.trim()) {
        throw new Error('Device ID dan nama wajib diisi.');
      }

      const { error } = await supabase.from('devices').insert({
        device_id: newDevice.device_id.trim(),
        name: newDevice.name.trim(),
        role_type: newDevice.role_type,
        status: 'approved',
        assigned_user_id: newDevice.assigned_user_id.trim() || null,
        registered_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      setActionMessage('Perangkat berhasil ditambahkan.');
      setNewDevice({ device_id: '', name: '', role_type: 'kiosk', assigned_user_id: '' });
      setShowAddForm(false);
      await loadDevices();
    } catch (err: any) {
      setActionError(err.message || 'Gagal menambahkan perangkat.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(device: Device) {
    setActionMessage(null);
    setActionError(null);

    const newStatus = device.status === 'approved' ? 'blocked' : 'approved';

    const { error } = await supabase
      .from('devices')
      .update({ status: newStatus })
      .eq('id', device.id);

    if (error) {
      setActionError(error.message);
    } else {
      setActionMessage(`Perangkat ${device.device_id} sekarang ${newStatus === 'approved' ? 'aktif' : 'diblokir'}.`);
      await loadDevices();
    }
  }

  async function handleDeleteDevice(device: Device) {
    if (!confirm(`Yakin ingin menghapus perangkat ${device.device_id}?`)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', device.id);

    if (error) {
      setActionError(error.message);
    } else {
      setActionMessage(`Perangkat ${device.device_id} berhasil dihapus.`);
      await loadDevices();
    }
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function getHeartbeatStatus(lastHeartbeat: string | null) {
    if (!lastHeartbeat) return { text: 'Belum pernah', color: 'text-slate-400' };
    
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) return { text: 'Online', color: 'text-green-600' };
    if (minutes < 15) return { text: `${minutes} menit lalu`, color: 'text-amber-600' };
    return { text: 'Offline', color: 'text-red-600' };
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Manajemen Perangkat
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses halaman ini
          </p>
          <Link
            href="/admin/login"
            className="w-full inline-block py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
          >
            Login Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link href="/admin" className="font-medium text-slate-700 hover:underline">
            &larr; Kembali ke Admin
          </Link>
          <span>/</span>
          <span>Perangkat</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Perangkat</h1>
            <p className="text-sm text-slate-500">Register, approve, dan monitor perangkat klinik</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            {showAddForm ? 'Tutup Form' : '+ Tambah Perangkat'}
          </button>
        </div>

        {actionMessage && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
            {actionMessage}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleAddDevice} className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tambah Perangkat Baru</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500">Device ID</label>
                <input
                  type="text"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="KIOSK-001, DOCTOR-001, dll"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Nama Perangkat</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="PC Kiosk Lobby"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Tipe Role</label>
                <select
                  value={newDevice.role_type}
                  onChange={(e) => setNewDevice({ ...newDevice, role_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {roleTypes.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Assigned User ID (opsional)</label>
                <input
                  type="text"
                  value={newDevice.assigned_user_id}
                  onChange={(e) => setNewDevice({ ...newDevice, assigned_user_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="UUID user (untuk kiosk)"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-800 px-6 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perangkat'}
              </button>
            </div>
          </form>
        )}

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Perangkat</h2>
            <button
              onClick={loadDevices}
              className="text-sm text-slate-600 hover:underline"
              disabled={fetching}
            >
              {fetching ? 'Memuat...' : 'Refresh'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="px-3 py-2">Device ID</th>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Tipe</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Heartbeat</th>
                  <th className="px-3 py-2">Terdaftar</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                      Belum ada perangkat terdaftar.
                    </td>
                  </tr>
                )}
                {devices.map((device) => {
                  const heartbeat = getHeartbeatStatus(device.last_heartbeat_at);
                  return (
                    <tr key={device.id} className="border-b last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-800">{device.device_id}</td>
                      <td className="px-3 py-3">{device.name}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {device.role_type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            device.status === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {device.status === 'approved' ? 'Aktif' : 'Diblokir'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium ${heartbeat.color}`}>
                          {heartbeat.text}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDateTime(device.registered_at)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(device)}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              device.status === 'approved'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {device.status === 'approved' ? 'Blokir' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
