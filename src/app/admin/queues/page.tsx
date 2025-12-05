'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type QueueEntry = {
  id: string;
  visit_id: string;
  queue_date: string;
  number: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  patient_name?: string;
};

export default function AdminQueuesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [doctorQueue, setDoctorQueue] = useState<QueueEntry[]>([]);
  const [pharmacyQueue, setPharmacyQueue] = useState<QueueEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadQueues();
    }
  }, [user]);

  async function loadQueues() {
    setFetching(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load doctor queue
      const { data: doctorData } = await supabase
        .from('doctor_queue')
        .select('*, visit:visits(patient:patients(name))')
        .gte('queue_date', today)
        .order('queue_date', { ascending: false })
        .order('number');

      // Load pharmacy queue
      const { data: pharmacyData } = await supabase
        .from('pharmacy_queue')
        .select('*, visit:visits(patient:patients(name))')
        .gte('queue_date', today)
        .order('queue_date', { ascending: false })
        .order('number');

      setDoctorQueue(
        (doctorData ?? []).map((q: any) => ({
          ...q,
          patient_name: q.visit?.patient?.name || 'Unknown',
        }))
      );
      setPharmacyQueue(
        (pharmacyData ?? []).map((q: any) => ({
          ...q,
          patient_name: q.visit?.patient?.name || 'Unknown',
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  async function clearExpiredDoctor() {
    setProcessing(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('doctor_queue')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .in('status', ['waiting', 'called'])
      .select();

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setActionMessage(`${data?.length || 0} antrian dokter ditandai kedaluwarsa`);
      loadQueues();
    }
    setProcessing(false);
  }

  async function clearExpiredPharmacy() {
    setProcessing(true);
    // Pharmacy queue doesn't have expires_at, so we clear old waiting entries
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cutoff = yesterday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pharmacy_queue')
      .update({ status: 'expired' })
      .lt('queue_date', cutoff)
      .eq('status', 'waiting')
      .select();

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setActionMessage(`${data?.length || 0} antrian farmasi ditandai kedaluwarsa`);
      loadQueues();
    }
    setProcessing(false);
  }

  async function clearAllExpired() {
    setProcessing(true);
    await clearExpiredDoctor();
    await clearExpiredPharmacy();
    setProcessing(false);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-700';
      case 'called':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-purple-100 text-purple-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'cleared':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'waiting':
        return 'Menunggu';
      case 'called':
        return 'Dipanggil';
      case 'processing':
        return 'Diproses';
      case 'expired':
        return 'Kedaluwarsa';
      case 'cleared':
        return 'Selesai';
      default:
        return status;
    }
  }

  const expiredDoctorCount = doctorQueue.filter(
    (q) => q.expires_at && new Date(q.expires_at) < new Date() && ['waiting', 'called'].includes(q.status)
  ).length;

  const expiredPharmacyCount = pharmacyQueue.filter(
    (q) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(q.queue_date) < yesterday && q.status === 'waiting';
    }
  ).length;

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
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
              ← Kembali ke Admin
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Manajemen Antrian</h1>
          </div>
          <button
            onClick={clearAllExpired}
            disabled={processing}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? 'Memproses...' : 'Bersihkan Semua Kedaluwarsa'}
          </button>
        </div>

        {actionMessage && (
          <div className={`rounded-lg p-3 text-sm ${actionMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {actionMessage}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Antrian Dokter</h2>
                <p className="text-sm text-slate-500">Total hari ini: {doctorQueue.length}</p>
              </div>
              {expiredDoctorCount > 0 && (
                <button
                  onClick={clearExpiredDoctor}
                  disabled={processing}
                  className="rounded-lg bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-200"
                >
                  Bersihkan {expiredDoctorCount} expired
                </button>
              )}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                <span>Menunggu: {doctorQueue.filter((q) => q.status === 'waiting').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-400"></span>
                <span>Dipanggil: {doctorQueue.filter((q) => q.status === 'called').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-400"></span>
                <span>Expired: {doctorQueue.filter((q) => q.status === 'expired').length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Antrian Farmasi</h2>
                <p className="text-sm text-slate-500">Total hari ini: {pharmacyQueue.length}</p>
              </div>
              {expiredPharmacyCount > 0 && (
                <button
                  onClick={clearExpiredPharmacy}
                  disabled={processing}
                  className="rounded-lg bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-200"
                >
                  Bersihkan {expiredPharmacyCount} expired
                </button>
              )}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                <span>Menunggu: {pharmacyQueue.filter((q) => q.status === 'waiting').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-purple-400"></span>
                <span>Diproses: {pharmacyQueue.filter((q) => q.status === 'processing').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-400"></span>
                <span>Expired: {pharmacyQueue.filter((q) => q.status === 'expired').length}</span>
              </div>
            </div>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Doctor Queue Table */}
            <div className="rounded-xl bg-white shadow overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 font-semibold text-blue-800">
                Antrian Dokter
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">No</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Pasien</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorQueue.slice(0, 20).map((q) => (
                    <tr key={q.id}>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{q.number}</td>
                      <td className="px-3 py-2 text-slate-700">{q.patient_name}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(q.status)}`}>
                          {getStatusLabel(q.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {doctorQueue.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                        Tidak ada antrian
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pharmacy Queue Table */}
            <div className="rounded-xl bg-white shadow overflow-hidden">
              <div className="bg-green-50 px-4 py-3 font-semibold text-green-800">
                Antrian Farmasi
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">No</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Pasien</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacyQueue.slice(0, 20).map((q) => (
                    <tr key={q.id}>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{q.number}</td>
                      <td className="px-3 py-2 text-slate-700">{q.patient_name}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(q.status)}`}>
                          {getStatusLabel(q.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pharmacyQueue.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                        Tidak ada antrian
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
