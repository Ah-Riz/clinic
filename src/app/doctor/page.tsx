'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

const DOCTOR_DEVICE_ID = process.env.NEXT_PUBLIC_DOCTOR_DEVICE_ID ?? 'DOCTOR-001';

const quickLinks = [
  {
    title: 'Kelola Antrian',
    description: 'Lihat daftar pasien, panggil berikutnya, atau registrasi manual.',
    href: '/doctor/queue',
    cta: 'Buka Antrian',
  },
  {
    title: 'Kunjungan Aktif',
    description: 'Akses detail kunjungan melalui tombol “Detail” dari halaman antrian.',
    href: '/doctor/queue',
    cta: 'Masuk ke Kunjungan',
    subtle: true,
  },
];

const checklist = [
  'Masuk menggunakan akun dokter yang terdaftar di Supabase Auth.',
  'Pastikan perangkat ini menggunakan device ID resmi klinik.',
  'Pantau antrian secara berkala dan panggil pasien tepat waktu.',
  'Selesaikan catatan medis dan kirim resep ke farmasi setelah konsultasi.',
];

const securityNotes = [
  'Device gating aktif. Semua RPC memerlukan `x-device-id` yang cocok dengan perangkat dokter.',
  'Data alamat pasien tersimpan dalam bentuk terenkripsi; jangan menyalin plaintext ke catatan bebas.',
  'Gunakan kanal resmi untuk meminta bantuan admin saat terjadi gangguan.',
];

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">👩‍⚕️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Panel Dokter
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses panel dokter
          </p>
          <Link
            href="/doctor/login"
            className="w-full inline-block py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Login Dokter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">Panel Dokter</p>
          <h1 className="mt-2 text-3xl font-semibold">Kelola konsultasi secara terstruktur</h1>
          <p className="mt-3 max-w-3xl text-emerald-50">
            Mulai hari dengan memeriksa antrian aktif, panggil pasien yang menunggu, dan dokumentasikan hasil kunjungan secara
            lengkap sebelum mengirim ke farmasi.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-emerald-50">
            <span className="text-xs uppercase tracking-widest text-emerald-100">Device saat ini</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{DOCTOR_DEVICE_ID}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/doctor/queue"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-50"
            >
              Buka Antrian
            </Link>
            <span className="text-sm text-emerald-100">Atau pantau notifikasi realtime saat pengembangan M5 selesai.</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <div key={link.title} className="rounded-xl bg-white p-5 shadow">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alur {link.subtle ? 'lanjutan' : 'utama'}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{link.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{link.description}</p>
              <Link
                href={link.href}
                className={`mt-4 inline-flex items-center text-sm font-semibold ${link.subtle ? 'text-emerald-600' : 'text-emerald-700'}`}
              >
                {link.cta} <span className="ml-2">→</span>
              </Link>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold text-slate-900">Panduan singkat shift</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold text-slate-900">Catatan keamanan</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {securityNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Hubungi admin untuk perubahan device ID atau troubleshooting supabase session.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
