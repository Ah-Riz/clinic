'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import Layout from '@/components/ui/Layout';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

export default function AdminPage() {
  const { signOut } = useAuth();

  const adminMenus = [
    { title: 'Manajemen Perangkat', href: '/admin/devices', icon: '📱', description: 'Kelola perangkat dan akses klinik' },
    { title: 'Manajemen Pengguna', href: '/admin/users', icon: '👥', description: 'Kelola akun staf dan peran' },
    { title: 'Inventaris', href: '/admin/inventory', icon: '📦', description: 'Stok obat dan manajemen batch' },
    { title: 'Manajemen Antrian', href: '/admin/queues', icon: '📋', description: 'Pantau dan kelola antrian pasien' },
    { title: 'Laporan', href: '/admin/reports', icon: '📊', description: 'Lihat statistik dan laporan klinik' },
    { title: 'Log Aktivitas', href: '/admin/audit', icon: '📝', description: 'Aktivitas sistem dan jejak audit' },
    { title: 'Tutup Harian', href: '/admin/closing', icon: '🔒', description: 'Prosedur akhir hari' },
  ];

  return (
    <RoleProtectedRoute requiredRoles={['admin']}>
      <Layout title="Dashboard Admin" subtitle="Manajemen dan pengawasan sistem lengkap">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🏥</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Online</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">247</h3>
          <p className="text-sm text-gray-600">Total Pasien Hari Ini</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">💰</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+18%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Rp 12,4jt</h3>
          <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">👨‍⚕️</span>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Aktif</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">8/12</h3>
          <p className="text-sm text-gray-600">Staf Aktif</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚠️</span>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Peringatan</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">3</h3>
          <p className="text-sm text-gray-600">Notifikasi Sistem</p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-3">Administrasi Sistem</h2>
            <p className="text-orange-50 max-w-2xl">
              Kontrol penuh atas operasi klinik, manajemen pengguna, pelacakan inventaris, dan pelaporan komprehensif
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm">
                Perangkat: {ADMIN_DEVICE_ID}
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm">
                Peran: Super Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Admin Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {adminMenus.map((menu, index) => (
          <Link key={index} href={menu.href} className="group">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{menu.icon}</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{menu.title}</h3>
              <p className="text-sm text-gray-600">{menu.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Pasien baru terdaftar via Kiosk</p>
                <p className="text-xs text-gray-500">2 menit lalu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Resep diproses oleh Farmasi</p>
                <p className="text-xs text-gray-500">5 menit lalu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Peringatan stok rendah: Paracetamol 500mg</p>
                <p className="text-xs text-gray-500">15 menit lalu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Dokter menyelesaikan konsultasi #245</p>
                <p className="text-xs text-gray-500">20 menit lalu</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Peringatan Sistem
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-yellow-300">
              <p className="text-sm font-medium text-gray-900">3 obat kedaluwarsa dalam 30 hari</p>
              <p className="text-xs text-gray-600 mt-1">Periksa inventaris untuk rotasi batch</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-yellow-300">
              <p className="text-sm font-medium text-gray-900">Backup database tertunda</p>
              <p className="text-xs text-gray-600 mt-1">Backup terakhir: 3 hari lalu</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-yellow-300">
              <p className="text-sm font-medium text-gray-900">5 perangkat perlu pembaruan heartbeat</p>
              <p className="text-xs text-gray-600 mt-1">Periksa status konektivitas perangkat</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
    </RoleProtectedRoute>
  );
}
