'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const DOCTOR_DEVICE_ID = process.env.NEXT_PUBLIC_DOCTOR_DEVICE_ID ?? 'DOCTOR-001';

type QueueEntry = {
  id: string;
  number: number;
  status: string;
  queue_date: string;
  expires_at: string | null;
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

export default function DoctorQueuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () => createSupabaseBrowserClient({ 'x-device-id': DOCTOR_DEVICE_ID }),
    [],
  );

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [fetchingQueue, setFetchingQueue] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    existingPatientId: '',
    nik: '',
    name: '',
    dob: '',
    sex: 'male',
    phone: '',
    address: '',
    bypass: false,
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadQueue();

      // Subscribe to realtime changes on doctor_queue
      const channel = supabase
        .channel('doctor-queue-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctor_queue' },
          (payload) => {
            console.log('Doctor queue changed:', payload);
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

    // Get today's date in Asia/Jakarta timezone (YYYY-MM-DD)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('doctor_queue')
      .select(
        `id, number, queue_date, status, expires_at,
         visit:visit_id (
           id,
           status,
           patient:patient_id ( id, name, sex, dob )
         )`,
      )
      .eq('queue_date', today) // Only today's queue
      .in('status', ['waiting', 'called']) // Only active statuses
      .gt('expires_at', now) // Not expired (expires_at > now)
      .order('number', { ascending: true })
      .limit(100);

    if (error) {
      setActionError(error.message);
    } else {
      setQueue(((data ?? []) as unknown) as QueueEntry[]);
    }
    setFetchingQueue(false);
  }

  async function handleCallVisit(visitId: string, navigateAfter: boolean = true) {
    setActionMessage(null);
    setActionError(null);
    const { error } = await supabase.rpc('emr_doctor_call_patient', {
      p_visit_id: visitId,
      p_device_id: DOCTOR_DEVICE_ID,
    });
    if (error) {
      setActionError(error.message);
    } else {
      setActionMessage('Pasien berhasil dipanggil.');
      if (navigateAfter) {
        // Navigate to visit detail page for consultation
        router.push(`/doctor/visit/${visitId}`);
      } else {
        await loadQueue();
      }
    }
  }

  async function handleCallNext() {
    const nextEntry = queue.find((entry) => entry.status === 'waiting');
    if (!nextEntry || !nextEntry.visit) {
      setActionError('Tidak ada pasien menunggu.');
      return;
    }
    await handleCallVisit(nextEntry.visit.id);
  }

  async function handleManualRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      let patientId = manualForm.existingPatientId.trim() || null;
      let patientPayload: any = null;

      if (!patientId) {
        if (manualForm.nik.length !== 16) {
          throw new Error('NIK harus 16 digit untuk pasien baru.');
        }
        if (!manualForm.name || !manualForm.dob || !manualForm.address) {
          throw new Error('Nama, tanggal lahir, dan alamat wajib diisi untuk pasien baru.');
        }

        const { data: hashData, error: hashErr } = await supabase.functions.invoke('hash_nik', {
          body: { nik: manualForm.nik },
        });
        if (hashErr || !hashData) {
          throw new Error(hashErr?.message ?? 'Gagal melakukan hashing NIK');
        }

        const { data: encData, error: encErr } = await supabase.functions.invoke('encrypt_address', {
          body: { address: manualForm.address },
        });
        if (encErr || !encData) {
          throw new Error(encErr?.message ?? 'Gagal mengenkripsi alamat');
        }

        patientPayload = {
          nik_hash_lookup: hashData.nik_hash_lookup,
          nik_hash: hashData.nik_hash,
          nik_salt: hashData.nik_salt,
          name: manualForm.name,
          dob: manualForm.dob,
          sex: manualForm.sex,
          phone: manualForm.phone || null,
          address_b64: encData.ciphertext_b64,
        };
      }

      const { error } = await supabase.rpc('emr_doctor_register_visit', {
        p_device_id: DOCTOR_DEVICE_ID,
        p_patient_id: patientId,
        p_patient_new: patientPayload,
        p_bypass: manualForm.bypass,
      });

      if (error) {
        throw new Error(error.message);
      }

      setActionMessage('Registrasi manual berhasil.');
      setManualForm({
        existingPatientId: '',
        nik: '',
        name: '',
        dob: '',
        sex: 'male',
        phone: '',
        address: '',
        bypass: manualForm.bypass,
      });
      await loadQueue();
    } catch (err: any) {
      setActionError(err.message || 'Gagal melakukan registrasi manual.');
    } finally {
      setManualSubmitting(false);
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">👩‍⚕️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Antrian Dokter
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses antrian pasien
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Perangkat terdaftar</p>
              <p className="font-semibold text-slate-800">{DOCTOR_DEVICE_ID}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadQueue}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={fetchingQueue}
              >
                {fetchingQueue ? 'Memuat...' : 'Refresh Antrian'}
              </button>
              <button
                onClick={handleCallNext}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Panggil Berikutnya
              </button>
            </div>
          </div>
          {actionMessage && <p className="text-sm text-emerald-600">{actionMessage}</p>}
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Daftar Antrian Dokter</h2>
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
                        Belum ada antrian.
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
                              : entry.status === 'called'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => entry.visit && handleCallVisit(entry.visit.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            disabled={!entry.visit}
                          >
                            Panggil
                          </button>
                          {entry.visit && (
                            <button
                              onClick={() => router.push(`/doctor/visit/${entry.visit?.id}`)}
                              className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
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

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Registrasi Manual</h2>
            <p className="mb-4 text-sm text-slate-500">
              Masukkan ID pasien yang sudah ada atau isi data pasien baru. Aktifkan bypass untuk konsultasi tanpa antrian.
            </p>
            <form className="space-y-4" onSubmit={handleManualRegister}>
              <div>
                <label className="text-xs font-medium text-slate-500">ID Pasien (opsional)</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="UUID pasien"
                  value={manualForm.existingPatientId}
                  onChange={(e) => setManualForm({ ...manualForm, existingPatientId: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">atau isi data baru</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">NIK Pasien Baru</label>
                <input
                  type="text"
                  maxLength={16}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={manualForm.nik}
                  onChange={(e) => setManualForm({ ...manualForm, nik: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Nama Lengkap</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Tanggal Lahir</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={manualForm.dob}
                    onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Jenis Kelamin</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={manualForm.sex}
                    onChange={(e) => setManualForm({ ...manualForm, sex: e.target.value })}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                    <option value="unknown">Tidak diketahui</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Nomor Telepon</label>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="08xxxxxxxxxx"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Alamat</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={manualForm.bypass}
                  onChange={(e) => setManualForm({ ...manualForm, bypass: e.target.checked })}
                />
                Bypass antrian (langsung konsultasi)
              </label>

              <button
                type="submit"
                disabled={manualSubmitting}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {manualSubmitting ? 'Memproses...' : 'Registrasi Manual'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-right">
          <Link
            href="/doctor"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            &larr; Kembali ke dashboard dokter
          </Link>
        </div>
      </div>
    </div>
  );
}
