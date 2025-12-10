'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Layout from '@/components/ui/Layout';

const DOCTOR_DEVICE_ID = process.env.NEXT_PUBLIC_DOCTOR_DEVICE_ID ?? 'DOCTOR-001';

export default function DoctorPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/doctor/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <Layout title="Dashboard Dokter" subtitle="Ringkasan antrian dan kunjungan hari ini">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">👥</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Menunggu</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
          <p className="text-sm text-gray-600">Pasien dalam Antrian</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">✅</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Hari Ini</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">28</h3>
          <p className="text-sm text-gray-600">Kunjungan Selesai</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⏱️</span>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Rata-rata</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">15 menit</h3>
          <p className="text-sm text-gray-600">Per Konsultasi</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Banner */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-3">Kelola Konsultasi Hari Ini</h2>
            <p className="text-emerald-50 mb-4">
              Buka halaman antrian untuk melihat pasien yang menunggu. Panggil pasien berikutnya ketika siap.
            </p>
            <ul className="text-sm text-emerald-100 mb-4 space-y-1">
              <li>• Buka halaman antrian untuk melihat pasien yang menunggu</li>
              <li>• Panggil pasien berikutnya ketika siap</li>
              <li>• Lengkapi catatan medis sebelum mengirim resep</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/doctor/queue"
                className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Buka Antrian Dokter
              </Link>
              <span className="inline-flex items-center px-3 py-2 bg-white/20 rounded-lg text-sm">
                Perangkat: {DOCTOR_DEVICE_ID}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              <Link href="/doctor/queue" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">Antrian Pasien</h4>
                  <p className="text-sm text-gray-600">Lihat dan panggil pasien yang menunggu</p>
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

        {/* Side Alert */}
        <div>
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Catatan Penting Keamanan
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Gunakan akun dokter pribadi, jangan dibagi
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Pastikan bekerja dari perangkat yang sudah disetujui admin
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Jangan menyalin alamat lengkap pasien ke catatan bebas
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
