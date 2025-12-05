'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

const PHARMACY_DEVICE_ID = process.env.NEXT_PUBLIC_PHARMACY_DEVICE_ID ?? 'PHARMACY-001';

export default function PharmacyPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">💊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Panel Farmasi
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses panel farmasi
          </p>
          <Link
            href="/pharmacy/login"
            className="w-full inline-block py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Login Farmasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-100">Panel Farmasi</p>
              <h1 className="mt-2 text-3xl font-semibold">Kelola resep dan pembayaran</h1>
              <p className="mt-3 max-w-3xl text-blue-50">
                Proses resep dari dokter, dispensi obat dengan sistem FEFO, dan terima pembayaran tunai.
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
              Device: {PHARMACY_DEVICE_ID}
            </div>
            <Link
              href="/pharmacy/queue"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Buka Antrian Resep
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm uppercase tracking-wide text-slate-400">Alur Utama</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Antrian Resep</h2>
            <p className="mt-2 text-sm text-slate-600">
              Lihat daftar resep masuk dari dokter, mulai proses, dan dispensi obat.
            </p>
            <Link
              href="/pharmacy/queue"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Buka Antrian →
            </Link>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm uppercase tracking-wide text-slate-400">Panduan</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Alur Kerja</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Resep masuk otomatis dari dokter</li>
              <li>• Klik "Proses" untuk mulai dispensi</li>
              <li>• Pilih batch obat (FEFO - First Expiry First Out)</li>
              <li>• Terima pembayaran tunai</li>
              <li>• Selesaikan kunjungan</li>
            </ul>
          </div>
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
