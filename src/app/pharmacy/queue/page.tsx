'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const PHARMACY_DEVICE_ID = process.env.NEXT_PUBLIC_PHARMACY_DEVICE_ID ?? 'PHARMACY-001';

type QueueEntry = {
  id: string;
  number: number;
  status: string;
  queue_date: string;
  created_at: string;
  visit: {
    id: string;
    status: string;
    patient?: {
      id: string;
      name: string;
      sex: string | null;
      dob: string | null;
    } | null;
  } | null;
};

export default function PharmacyQueuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () => createSupabaseBrowserClient({ 'x-device-id': PHARMACY_DEVICE_ID }),
    [],
  );

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [fetchingQueue, setFetchingQueue] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadQueue();

      // Subscribe to realtime changes on pharmacy_queue
      const channel = supabase
        .channel('pharmacy-queue-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pharmacy_queue' },
          (payload) => {
            console.log('Pharmacy queue changed:', payload);
            loadQueue(); // Refresh queue on any change
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'visits' },
          (payload) => {
            console.log('Visit status changed:', payload);
            loadQueue(); // Refresh when visit status changes
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function loadQueue() {
    setFetchingQueue(true);
    setActionError(null);

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    const { data, error } = await supabase
      .from('pharmacy_queue')
      .select(
        `id, number, queue_date, status, created_at,
         visit:visit_id (
           id,
           status,
           patient:patient_id ( id, name, sex, dob )
         )`,
      )
      .eq('queue_date', today)
      .in('status', ['waiting', 'processing'])
      .order('number', { ascending: true })
      .limit(100);

    if (error) {
      setActionError(error.message);
    } else {
      setQueue(((data ?? []) as unknown) as QueueEntry[]);
    }
    setFetchingQueue(false);
  }

  async function handleStartProcessing(visitId: string) {
    setActionMessage(null);
    setActionError(null);

    const { error } = await supabase.rpc('emr_pharmacy_start', {
      p_visit_id: visitId,
      p_device_id: PHARMACY_DEVICE_ID,
    });

    if (error) {
      setActionError(error.message);
    } else {
      setActionMessage('Memulai proses dispensi.');
      router.push(`/pharmacy/visit/${visitId}`);
    }
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">💊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Antrian Farmasi
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses antrian resep
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Perangkat terdaftar</p>
              <p className="font-semibold text-slate-800">{PHARMACY_DEVICE_ID}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadQueue}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={fetchingQueue}
              >
                {fetchingQueue ? 'Memuat...' : 'Refresh Antrian'}
              </button>
            </div>
          </div>
          {actionMessage && <p className="text-sm text-blue-600">{actionMessage}</p>}
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Antrian Resep Farmasi</h2>
            <span className="text-sm text-slate-500">{queue.filter((q) => q.status === 'waiting').length} menunggu</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Pasien</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                      Belum ada resep masuk.
                    </td>
                  </tr>
                )}
                {queue.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-3 py-3 font-semibold">{entry.number}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">
                        {entry.visit?.patient?.name ?? 'Pasien'}
                      </div>
                      <div className="text-xs text-slate-500">{entry.visit?.patient?.dob ?? '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          entry.status === 'waiting'
                            ? 'bg-amber-50 text-amber-700'
                            : entry.status === 'processing'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.status === 'waiting' ? 'Menunggu' : entry.status === 'processing' ? 'Diproses' : entry.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {entry.status === 'waiting' && entry.visit && (
                          <button
                            onClick={() => handleStartProcessing(entry.visit!.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Proses
                          </button>
                        )}
                        {entry.status === 'processing' && entry.visit && (
                          <button
                            onClick={() => router.push(`/pharmacy/visit/${entry.visit!.id}`)}
                            className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Lanjutkan
                          </button>
                        )}
                        {entry.visit && (
                          <button
                            onClick={() => router.push(`/pharmacy/visit/${entry.visit!.id}`)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Detail
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right">
          <Link
            href="/pharmacy"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            &larr; Kembali ke dashboard farmasi
          </Link>
        </div>
      </div>
    </div>
  );
}
