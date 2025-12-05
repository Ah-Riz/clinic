'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Panel Admin
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses panel admin
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
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Panel Admin</p>
              <h1 className="mt-2 text-3xl font-semibold">Manajemen Sistem Klinik</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Kelola perangkat, pengguna, inventori, dan laporan klinik.
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-lg bg-white/20 px-3 py-1 text-sm">
              Device: {ADMIN_DEVICE_ID}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/devices" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📱</div>
            <h2 className="text-xl font-semibold text-slate-900">Perangkat</h2>
            <p className="mt-2 text-sm text-slate-600">
              Register, approve, dan monitor perangkat klinik
            </p>
          </Link>

          <Link href="/admin/users" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">👥</div>
            <h2 className="text-xl font-semibold text-slate-900">Pengguna</h2>
            <p className="mt-2 text-sm text-slate-600">
              Kelola akun staf dan peran
            </p>
          </Link>

          <Link href="/admin/inventory" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-xl font-semibold text-slate-900">Inventori</h2>
            <p className="mt-2 text-sm text-slate-600">
              Kelola obat, batch, dan stok
            </p>
          </Link>

          <Link href="/admin/queues" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-semibold text-slate-900">Antrian</h2>
            <p className="mt-2 text-sm text-slate-600">
              Bersihkan antrian kedaluwarsa
            </p>
          </Link>

          <Link href="/admin/audit" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📜</div>
            <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
            <p className="mt-2 text-sm text-slate-600">
              Lihat aktivitas staf
            </p>
          </Link>

          <Link href="/admin/reports" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-slate-900">Laporan</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ringkasan harian dan laporan
            </p>
          </Link>

          <Link href="/admin/closing" className="rounded-xl bg-white p-6 shadow hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-xl font-semibold text-slate-900">Penutupan</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tutup hari dan finalisasi
            </p>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
