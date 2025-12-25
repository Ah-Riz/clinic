'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import Layout from '@/components/ui/Layout';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

const PHARMACY_DEVICE_ID = process.env.NEXT_PUBLIC_PHARMACY_DEVICE_ID ?? 'PHARMACY-001';

export default function PharmacyPage() {
  const { signOut } = useAuth();

  return (
    <RoleProtectedRoute requiredRoles={['pharmacist']}>
      <Layout title="Dashboard Farmasi" subtitle="Penyiapan obat dan proses pembayaran">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📝</span>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Menunggu</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">8</h3>
            <p className="text-sm text-gray-600">Resep Menunggu</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💊</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Proses</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
            <p className="text-sm text-gray-600">Sedang Disiapkan</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Hari Ini</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">42</h3>
            <p className="text-sm text-gray-600">Pesanan Selesai</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💰</span>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Pendapatan</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Rp 3,2jt</h3>
            <p className="text-sm text-gray-600">Penjualan Hari Ini</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-3">Manajemen Farmasi</h2>
            <p className="text-purple-50 mb-4">
              Proses resep dari dokter dan kelola inventaris obat secara efisien
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pharmacy/queue"
                className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Proses Antrian
              </Link>
              <span className="inline-flex items-center px-3 py-2 bg-white/20 rounded-lg text-sm">
                Perangkat: {PHARMACY_DEVICE_ID}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              <Link href="/pharmacy/queue" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">Antrian Resep</h4>
                  <p className="text-sm text-gray-600">Lihat dan proses resep yang menunggu</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/pharmacy/queue" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">Inventaris Obat</h4>
                  <p className="text-sm text-gray-600">Cek level stok dan tanggal kedaluwarsa</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
              >
                <div>
                  <h4 className="font-semibold text-red-900">Keluar</h4>
                  <p className="text-sm text-red-600">Akhiri sesi Anda saat ini</p>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Inventory Alert */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Peringatan Inventaris
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Paracetamol 500mg - Stok rendah (sisa 15)
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Amoxicillin kedaluwarsa dalam 30 hari (Batch #A234)
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Vitamin C habis - perlu pemesanan ulang
              </li>
            </ul>
          </div>

          {/* Processing Tips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Panduan Pemrosesan</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Gunakan sistem FEFO untuk pemilihan obat
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verifikasi identitas pasien sebelum penyerahan
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Periksa ulang dosis dan instruksi
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Proses pembayaran sebelum penyerahan obat
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
    </RoleProtectedRoute>
  );
}
