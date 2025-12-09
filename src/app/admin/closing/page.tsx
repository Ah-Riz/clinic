'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type ClosingSummary = {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  doctorQueueWaiting: number;
  doctorQueueCalled: number;
  pharmacyQueueWaiting: number;
  pharmacyQueueProcessing: number;
  totalRevenue: number;
  paymentCount: number;
};

export default function AdminClosingPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [summary, setSummary] = useState<ClosingSummary | null>(null);
  const [fetching, setFetching] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadSummary();
    }
  }, [user]);

  async function loadSummary() {
    setFetching(true);
    try {
      // Get visits for today
      const { data: visitsData } = await supabase
        .from('visits')
        .select('id, status')
        .eq('queue_date', today);

      // Get doctor queue
      const { data: doctorQueueData } = await supabase
        .from('doctor_queue')
        .select('id, status')
        .eq('queue_date', today);

      // Get pharmacy queue
      const { data: pharmacyQueueData } = await supabase
        .from('pharmacy_queue')
        .select('id, status')
        .eq('queue_date', today);

      // Get payments for today
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .gte('paid_at', `${today}T00:00:00`)
        .lte('paid_at', `${today}T23:59:59`);

      const visits = visitsData ?? [];
      const doctorQueue = doctorQueueData ?? [];
      const pharmacyQueue = pharmacyQueueData ?? [];
      const payments = paymentsData ?? [];

      setSummary({
        totalVisits: visits.length,
        completedVisits: visits.filter((v) => v.status === 'completed').length,
        pendingVisits: visits.filter((v) => !['completed', 'expired'].includes(v.status)).length,
        doctorQueueWaiting: doctorQueue.filter((q) => q.status === 'waiting').length,
        doctorQueueCalled: doctorQueue.filter((q) => q.status === 'called').length,
        pharmacyQueueWaiting: pharmacyQueue.filter((q) => q.status === 'waiting').length,
        pharmacyQueueProcessing: pharmacyQueue.filter((q) => q.status === 'processing').length,
        totalRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount as any) || 0), 0),
        paymentCount: payments.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  async function performClosing() {
    if (!summary) return;
    
    setClosing(true);
    setClosingMessage(null);

    try {
      const { data, error } = await supabase.rpc('emr_admin_close_day', {
        p_target_date: today,
        p_device_id: ADMIN_DEVICE_ID,
      });

      if (error) throw error;

      await supabase.from('staff_activity').insert({
        user_id: user?.id,
        role: 'admin',
        action: 'daily_closing',
        target_table: 'visits',
        payload: {
          date: today,
          summary: {
            visits_closed: summary.pendingVisits,
            doctor_queue_cleared: summary.doctorQueueWaiting + summary.doctorQueueCalled,
            pharmacy_queue_cleared: summary.pharmacyQueueWaiting + summary.pharmacyQueueProcessing,
            rpc_result: data ?? null,
          },
        },
      });

      setClosingMessage('✅ Penutupan harian berhasil! Semua antrian dan kunjungan tertunda telah ditangani oleh sistem.');
      setConfirmClose(false);
      loadSummary();
    } catch (err: any) {
      setClosingMessage(`❌ Error: ${err.message ?? 'Gagal melakukan penutupan harian.'}`);
    } finally {
      setClosing(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function downloadClosingCsv() {
    if (!summary) return;

    const header = [
      'date',
      'totalVisits',
      'completedVisits',
      'pendingVisits',
      'doctorQueueWaiting',
      'doctorQueueCalled',
      'pharmacyQueueWaiting',
      'pharmacyQueueProcessing',
      'totalRevenue',
      'paymentCount',
    ];

    const row = [
      today,
      summary.totalVisits.toString(),
      summary.completedVisits.toString(),
      summary.pendingVisits.toString(),
      summary.doctorQueueWaiting.toString(),
      summary.doctorQueueCalled.toString(),
      summary.pharmacyQueueWaiting.toString(),
      summary.pharmacyQueueProcessing.toString(),
      summary.totalRevenue.toString(),
      summary.paymentCount.toString(),
    ];

    const csv = `${header.join(',')}\n${row.join(',')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `closing-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const hasPendingItems = summary && (
    summary.pendingVisits > 0 ||
    summary.doctorQueueWaiting > 0 ||
    summary.doctorQueueCalled > 0 ||
    summary.pharmacyQueueWaiting > 0 ||
    summary.pharmacyQueueProcessing > 0
  );

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
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali ke Admin
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Penutupan Harian</h1>
          <p className="text-sm text-slate-600">
            Tanggal: <span className="font-semibold">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
          </p>
        </div>

        {closingMessage && (
          <div className={`rounded-lg p-4 ${closingMessage.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {closingMessage}
          </div>
        )}

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : summary ? (
          <>
            {/* Daily Summary */}
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-slate-900">Ringkasan Hari Ini</h2>
              
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Kunjungan</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-2xl font-bold text-slate-900">{summary.totalVisits}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{summary.completedVisits}</p>
                      <p className="text-xs text-slate-500">Selesai</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{summary.pendingVisits}</p>
                      <p className="text-xs text-slate-500">Tertunda</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Pendapatan</h3>
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(summary.totalRevenue)}</p>
                    <p className="text-sm text-emerald-600">{summary.paymentCount} transaksi</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Antrian Dokter</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                      <span className="text-sm">Menunggu: <strong>{summary.doctorQueueWaiting}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-400"></span>
                      <span className="text-sm">Dipanggil: <strong>{summary.doctorQueueCalled}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Antrian Farmasi</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                      <span className="text-sm">Menunggu: <strong>{summary.pharmacyQueueWaiting}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-purple-400"></span>
                      <span className="text-sm">Diproses: <strong>{summary.pharmacyQueueProcessing}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing Action */}
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-slate-900">Tutup Hari Ini</h2>
              <p className="mt-2 text-sm text-slate-600">
                Penutupan harian akan menandai semua antrian yang tersisa dan kunjungan yang belum selesai sebagai "kedaluwarsa".
              </p>

              {hasPendingItems ? (
                <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-4">
                  <p className="font-medium text-orange-800">⚠️ Peringatan</p>
                  <p className="mt-1 text-sm text-orange-700">
                    Masih ada {summary.pendingVisits} kunjungan tertunda, {summary.doctorQueueWaiting + summary.doctorQueueCalled} antrian dokter, 
                    dan {summary.pharmacyQueueWaiting + summary.pharmacyQueueProcessing} antrian farmasi yang akan ditandai kedaluwarsa.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="font-medium text-green-800">✅ Semua Clear</p>
                  <p className="mt-1 text-sm text-green-700">
                    Tidak ada antrian atau kunjungan tertunda. Anda dapat menutup hari ini.
                  </p>
                </div>
              )}

              {!confirmClose ? (
                <button
                  onClick={() => setConfirmClose(true)}
                  className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
                >
                  Tutup Hari Ini
                </button>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-red-600">
                    Apakah Anda yakin ingin menutup hari ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmClose(false)}
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={performClosing}
                      disabled={closing}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {closing ? 'Memproses...' : 'Ya, Tutup Sekarang'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={downloadClosingCsv}
                    className="mt-4 w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Download CSV Ringkasan Hari Ini
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
