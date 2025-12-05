'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type StaffMember = {
  id: string;
  full_name: string | null;
  active: boolean;
  created_at: string;
  roles: string[];
};

type StaffRole = {
  id: string;
  staff_id: string;
  role: string;
};

const ROLE_OPTIONS = ['doctor', 'pharmacist', 'admin'] as const;

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadStaff();
    }
  }, [user]);

  async function loadStaff() {
    setFetching(true);
    try {
      // Load staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .order('full_name');

      // Load roles
      const { data: rolesData } = await supabase
        .from('staff_roles')
        .select('*');

      // Merge roles into staff
      const roleMap: Record<string, string[]> = {};
      (rolesData ?? []).forEach((r: StaffRole) => {
        if (!roleMap[r.staff_id]) roleMap[r.staff_id] = [];
        roleMap[r.staff_id].push(r.role);
      });

      const staffWithRoles = (staffData ?? []).map((s: any) => ({
        ...s,
        roles: roleMap[s.id] || [],
      }));

      setStaffList(staffWithRoles);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  function openEditStaff(staff: StaffMember) {
    setEditingStaff(staff);
    setFullName(staff.full_name || '');
    setSelectedRoles(staff.roles);
    setShowModal(true);
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function saveStaff() {
    if (!editingStaff) return;

    // Update staff name
    const { error: staffError } = await supabase
      .from('staff')
      .update({ full_name: fullName.trim() || null })
      .eq('id', editingStaff.id);

    if (staffError) {
      setActionMessage(`Error: ${staffError.message}`);
      return;
    }

    // Delete existing roles and re-insert
    await supabase.from('staff_roles').delete().eq('staff_id', editingStaff.id);

    if (selectedRoles.length > 0) {
      const rolesToInsert = selectedRoles.map((role) => ({
        staff_id: editingStaff.id,
        role,
      }));
      const { error: rolesError } = await supabase.from('staff_roles').insert(rolesToInsert);
      if (rolesError) {
        setActionMessage(`Error: ${rolesError.message}`);
        return;
      }
    }

    setActionMessage('Pengguna berhasil diperbarui');
    setShowModal(false);
    loadStaff();
  }

  async function toggleStaffActive(staff: StaffMember) {
    const { error } = await supabase
      .from('staff')
      .update({ active: !staff.active })
      .eq('id', staff.id);
    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      loadStaff();
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-700';
      case 'pharmacist':
        return 'bg-green-100 text-green-700';
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'doctor':
        return 'Dokter';
      case 'pharmacist':
        return 'Apoteker';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  }

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
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
              ← Kembali ke Admin
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
            <p className="text-sm text-slate-600 mt-1">
              Kelola staf dan peran. Untuk menambah pengguna baru, buat akun di Supabase Auth terlebih dahulu.
            </p>
          </div>
        </div>

        {actionMessage && (
          <div className={`rounded-lg p-3 text-sm ${actionMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {actionMessage}
          </div>
        )}

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="rounded-xl bg-white shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Peran</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className={!staff.active ? 'bg-slate-50 opacity-60' : ''}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {staff.full_name || '(Belum diset)'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                      {staff.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {staff.roles.length > 0 ? (
                          staff.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(role)}`}
                            >
                              {getRoleLabel(role)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">Tidak ada peran</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          staff.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {staff.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEditStaff(staff)}
                        className="text-blue-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStaffActive(staff)}
                        className="text-slate-500 hover:underline"
                      >
                        {staff.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Belum ada data pengguna. Buat akun di Supabase Auth terlebih dahulu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Catatan:</strong> Untuk menambah pengguna baru:
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Buat akun di Supabase Dashboard → Authentication → Users</li>
            <li>Insert ke tabel <code className="bg-blue-100 px-1 rounded">staff</code> dengan ID yang sama</li>
            <li>Refresh halaman ini dan edit peran pengguna</li>
          </ol>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit Pengguna</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Peran</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium border ${
                        selectedRoles.includes(role)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={saveStaff}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
