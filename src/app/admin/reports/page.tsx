'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type DailySummary = {
  date: string;
  totalPatients: number;
  totalVisits: number;
  completedVisits: number;
  totalRevenue: number;
  prescriptionsFilled: number;
};

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [fetching, setFetching] = useState(true);

  // Today's stats
  const [todayStats, setTodayStats] = useState({
    patients: 0,
    visits: 0,
    completed: 0,
    revenue: 0,
    prescriptions: 0,
  });

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, startDate, endDate]);

  async function loadReports() {
    setFetching(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get visits in date range
      const { data: visitsData } = await supabase
        .from('visits')
        .select('id, status, queue_date, created_at')
        .gte('queue_date', startDate)
        .lte('queue_date', endDate);

      // Get payments in date range
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, paid_at')
        .gte('paid_at', `${startDate}T00:00:00`)
        .lte('paid_at', `${endDate}T23:59:59`);

      // Get prescriptions in date range
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('id, created_at')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      // Get new patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, created_at')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      // Build daily summaries
      const dailyMap: Record<string, DailySummary> = {};
      
      // Initialize dates
      const current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        dailyMap[dateStr] = {
          date: dateStr,
          totalPatients: 0,
          totalVisits: 0,
          completedVisits: 0,
          totalRevenue: 0,
          prescriptionsFilled: 0,
        };
        current.setDate(current.getDate() + 1);
      }

      // Count patients
      (patientsData ?? []).forEach((p: any) => {
        const date = p.created_at.split('T')[0];
        if (dailyMap[date]) {
          dailyMap[date].totalPatients++;
        }
      });

      // Count visits
      (visitsData ?? []).forEach((v: any) => {
        const date = v.queue_date || v.created_at.split('T')[0];
        if (dailyMap[date]) {
          dailyMap[date].totalVisits++;
          if (v.status === 'completed') {
            dailyMap[date].completedVisits++;
          }
        }
      });

      // Count revenue
      (paymentsData ?? []).forEach((p: any) => {
        const date = p.paid_at.split('T')[0];
        if (dailyMap[date]) {
          dailyMap[date].totalRevenue += parseFloat(p.amount) || 0;
        }
      });

      // Count prescriptions
      (prescriptionsData ?? []).forEach((p: any) => {
        const date = p.created_at.split('T')[0];
        if (dailyMap[date]) {
          dailyMap[date].prescriptionsFilled++;
        }
      });

      const sortedSummaries = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
      setSummaries(sortedSummaries);

      // Today's stats
      const todaySummary = dailyMap[today];
      if (todaySummary) {
        setTodayStats({
          patients: todaySummary.totalPatients,
          visits: todaySummary.totalVisits,
          completed: todaySummary.completedVisits,
          revenue: todaySummary.totalRevenue,
          prescriptions: todaySummary.prescriptionsFilled,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  const totals = summaries.reduce(
    (acc, s) => ({
      patients: acc.patients + s.totalPatients,
      visits: acc.visits + s.totalVisits,
      completed: acc.completed + s.completedVisits,
      revenue: acc.revenue + s.totalRevenue,
      prescriptions: acc.prescriptions + s.prescriptionsFilled,
    }),
    { patients: 0, visits: 0, completed: 0, revenue: 0, prescriptions: 0 }
  );

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  function downloadCsv() {
    if (summaries.length === 0) {
      return;
    }

    const header = [
      'date',
      'totalPatients',
      'totalVisits',
      'completedVisits',
      'prescriptionsFilled',
      'totalRevenue',
    ];

    const rows = summaries.map((s) => [
      s.date,
      s.totalPatients.toString(),
      s.totalVisits.toString(),
      s.completedVisits.toString(),
      s.prescriptionsFilled.toString(),
      s.totalRevenue.toString(),
    ]);

    const csvLines = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `clinic-report-${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali ke Admin
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-600">Ringkasan aktivitas klinik berdasarkan tanggal</p>
        </div>

        {/* Today's Summary */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white shadow-lg">
          <h2 className="text-lg font-medium text-emerald-100">Hari Ini</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-3xl font-bold">{todayStats.patients}</p>
              <p className="text-sm text-emerald-200">Pasien Baru</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{todayStats.visits}</p>
              <p className="text-sm text-emerald-200">Kunjungan</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{todayStats.completed}</p>
              <p className="text-sm text-emerald-200">Selesai</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{todayStats.prescriptions}</p>
              <p className="text-sm text-emerald-200">Resep</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatCurrency(todayStats.revenue)}</p>
              <p className="text-sm text-emerald-200">Pendapatan</p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow">
          <div>
            <label className="text-xs font-medium text-slate-600">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadReports}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Download CSV
            </button>
          </div>
        </div>

        {/* Period Totals */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-slate-900">{totals.patients}</p>
            <p className="text-sm text-slate-600">Total Pasien Baru</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-blue-600">{totals.visits}</p>
            <p className="text-sm text-slate-600">Total Kunjungan</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-green-600">{totals.completed}</p>
            <p className="text-sm text-slate-600">Kunjungan Selesai</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-purple-600">{totals.prescriptions}</p>
            <p className="text-sm text-slate-600">Total Resep</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.revenue)}</p>
            <p className="text-sm text-slate-600">Total Pendapatan</p>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="rounded-xl bg-white shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Tanggal</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Pasien Baru</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Kunjungan</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Selesai</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Resep</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((s) => (
                  <tr key={s.date} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.totalPatients}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.totalVisits}</td>
                    <td className="px-4 py-3 text-right text-green-600">{s.completedVisits}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.prescriptionsFilled}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(s.totalRevenue)}
                    </td>
                  </tr>
                ))}
                {summaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-900">TOTAL</td>
                  <td className="px-4 py-3 text-right text-slate-900">{totals.patients}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{totals.visits}</td>
                  <td className="px-4 py-3 text-right text-green-700">{totals.completed}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{totals.prescriptions}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(totals.revenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
