'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

const PHARMACY_DEVICE_ID = process.env.NEXT_PUBLIC_PHARMACY_DEVICE_ID ?? 'PHARMACY-001';

type VisitInfo = {
  id: string;
  status: string;
  queueDate: string | null;
  queueNumber: number | null;
  queueStatus: string | null;
  patient: {
    id: string;
    name: string;
    sex: string | null;
    dob: string | null;
    phone: string | null;
  };
};

type PrescriptionLine = {
  id: string;
  drug_name: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  medicine_id: string | null;
  parent_prescription_line_id: string | null;
  is_racik_ingredient: boolean;
  unit: string | null;
};

type PrescriptionData = {
  id: string;
  prescription_type: 'non_racik' | 'racik';
  sediaan: string | null;
  doctor_notes: string | null;
  additional_info: string | null;
  lines: PrescriptionLine[];
};

type MedicineBatch = {
  id: string;
  batch_no: string;
  expiry_date: string;
  quantity: number;
  medicine: {
    id: string;
    name: string;
    unit: string;
    price: number;
  } | null;
};

type DispenseItem = {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  batch_id: string | null;
  note: string;
  substitution: boolean;
};

export default function PharmacyVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': PHARMACY_DEVICE_ID }), []);

  const [visitInfo, setVisitInfo] = useState<VisitInfo | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [availableBatches, setAvailableBatches] = useState<MedicineBatch[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dispenseItems, setDispenseItems] = useState<DispenseItem[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [doctorNote, setDoctorNote] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void loadVisit();
    }
  }, [user, visitId]);

  async function loadVisit() {
    setFetching(true);
    setFetchError(null);
    setActionError(null);

    try {
      // Load visit data
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id,status,queue_date,patient_id')
        .eq('id', visitId)
        .maybeSingle();

      if (visitError || !visitData) {
        setFetchError('Kunjungan tidak ditemukan.');
        setVisitInfo(null);
        setFetching(false);
        return;
      }

      // Load patient, queue, prescriptions, and batches in parallel
      const [patientRes, queueRes, prescriptionsRes, batchesRes] = await Promise.all([
        supabase.from('patients').select('id,name,sex,dob,phone').eq('id', visitData.patient_id).maybeSingle(),
        supabase.from('pharmacy_queue').select('number,status').eq('visit_id', visitId).maybeSingle(),
        (async () => {
          const prescriptionRes = await supabase.from('prescriptions').select('id, doctor_notes').eq('visit_id', visitId).maybeSingle();
          const prescriptionId = prescriptionRes.data?.id ?? '00000000-0000-0000-0000-000000000000';
          const linesRes = await supabase
            .from('prescription_lines')
            .select('id, drug_name, dosage, frequency, duration, instructions, medicine_id, prescription_id')
            .eq('prescription_id', prescriptionId);
          return { lines: linesRes.data, doctorNotes: prescriptionRes.data?.doctor_notes };
        })(),
        supabase
          .from('medicine_batches')
          .select('id, batch_no, expiry_date, quantity, medicine:medicine_id(id, name, unit, price)')
          .gt('quantity', 0)
          .order('expiry_date', { ascending: true })
          .limit(200),
      ]);

      if (patientRes.error || !patientRes.data) {
        setFetchError('Data pasien tidak ditemukan.');
        setVisitInfo(null);
      } else {
        setVisitInfo({
          id: visitData.id,
          status: visitData.status,
          queueDate: visitData.queue_date,
          patient: patientRes.data,
          queueNumber: queueRes.data?.number ?? null,
          queueStatus: queueRes.data?.status ?? null,
        });
        // Transform prescription lines to new structure
        const prescriptionLines = prescriptionsRes.lines || [];
        const doctorNotes = prescriptionsRes.doctorNotes;
        
        // For now, create a single prescription object from the lines
        // In the future, the database query should be updated to support multiple prescriptions
        const prescriptionData: PrescriptionData[] = prescriptionLines.length > 0 ? [{
          id: prescriptionLines[0].prescription_id || 'temp-id',
          prescription_type: 'non_racik', // Default for existing data
          sediaan: null,
          doctor_notes: doctorNotes,
          additional_info: null,
          lines: prescriptionLines.map((line: any) => ({
            id: line.id,
            drug_name: line.drug_name,
            dosage: line.dosage,
            frequency: line.frequency,
            duration: line.duration,
            instructions: line.instructions,
            medicine_id: line.medicine_id,
            parent_prescription_line_id: null,
            is_racik_ingredient: false,
            unit: null
          }))
        }] : [];
        
        setPrescriptions(prescriptionData);
        setDoctorNote(doctorNotes || null);
        setAvailableBatches((batchesRes.data ?? []) as unknown as MedicineBatch[]);

        // Initialize dispense items from prescription lines
        const initialDispense = prescriptionData.flatMap((p: PrescriptionData) => p.lines).map((line: PrescriptionLine) => ({
          medicine_id: line.medicine_id ?? '',
          medicine_name: line.drug_name ?? '',
          quantity: 1,
          batch_id: null,
          note: '',
          substitution: false,
        }));
        setDispenseItems(initialDispense);
      }
    } catch (err) {
      console.error(err);
      setFetchError('Gagal memuat data kunjungan.');
    } finally {
      setFetching(false);
    }
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function updateDispenseItem(index: number, field: keyof DispenseItem, value: string | number | boolean) {
    setDispenseItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  }

  function addDispenseItem() {
    setDispenseItems((prev) => [
      ...prev,
      { medicine_id: '', medicine_name: '', quantity: 1, batch_id: null, note: '', substitution: false },
    ]);
  }

  function removeDispenseItem(index: number) {
    setDispenseItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleDispense() {
    setActionMessage(null);
    setActionError(null);
    setSubmitting(true);

    try {
      const validItems = dispenseItems.filter((item) => item.medicine_id && item.quantity > 0);
      
      if (validItems.length === 0) {
        throw new Error('Tidak ada obat untuk didispensasi.');
      }

      const items = validItems.map((item) => ({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        substitution: item.substitution,
        note: item.note || null,
      }));

      const { error } = await supabase.rpc('emr_pharmacy_dispense', {
        p_visit_id: visitId,
        p_items: items,
        p_device_id: PHARMACY_DEVICE_ID,
      });

      if (error) {
        throw new Error(error.message);
      }

      setActionMessage('Obat berhasil didispensasi.');
      await loadVisit();
    } catch (err: any) {
      setActionError(err.message || 'Gagal mendispensasi obat.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment() {
    setActionMessage(null);
    setActionError(null);
    setSubmitting(true);

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Jumlah pembayaran tidak valid.');
      }

      const { error } = await supabase.rpc('emr_pharmacy_payment', {
        p_visit_id: visitId,
        p_amount: amount,
        p_device_id: PHARMACY_DEVICE_ID,
      });

      if (error) {
        throw new Error(error.message);
      }

      setActionMessage('Pembayaran berhasil. Kunjungan selesai.');
      setTimeout(() => router.push('/pharmacy/queue'), 1500);
    } catch (err: any) {
      setActionError(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat sesi...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">Silakan login sebagai apoteker.</p>
        <Link href="/pharmacy/login" className="text-blue-600 hover:underline">
          Login Farmasi
        </Link>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat data kunjungan...</p>
      </div>
    );
  }

  if (!visitInfo || fetchError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-600">{fetchError ?? 'Data kunjungan tidak tersedia.'}</p>
        <Link href="/pharmacy/queue" className="text-blue-600 hover:underline">
          &larr; Kembali ke antrian farmasi
        </Link>
      </div>
    );
  }

  const isDispensed = ['dispensed', 'completed'].includes(visitInfo.status);
  const canDispense = visitInfo.status === 'seen_by_pharmacy' && !isDispensed;
  const canPay = visitInfo.status === 'dispensed';

  return (
    <RoleProtectedRoute requiredRoles={['pharmacist']}>
      <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link href="/pharmacy/queue" className="font-medium text-blue-600 hover:underline">
            &larr; Kembali ke antrian
          </Link>
          <span>/</span>
          <span>Visit #{visitInfo.id.slice(0, 8)}</span>
        </div>

        {/* Patient Info */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Pasien</p>
              <h1 className="text-2xl font-semibold text-slate-900">{visitInfo.patient.name}</h1>
              <div className="mt-2 text-sm text-slate-600">
                <p>Jenis kelamin: {visitInfo.patient.sex ?? 'N/A'}</p>
                <p>Tanggal lahir: {formatDate(visitInfo.patient.dob)}</p>
                <p>Telepon: {visitInfo.patient.phone ?? '-'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status kunjungan</p>
              <p className="mt-1 text-lg font-semibold capitalize">{visitInfo.status.replaceAll('_', ' ')}</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Nomor antrian</span>
                  <span className="font-semibold text-slate-800">{visitInfo.queueNumber ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Device</span>
                  <span className="font-semibold">{PHARMACY_DEVICE_ID}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {actionMessage && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">{actionMessage}</div>}
        {actionError && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>}

        {/* Doctor's Note for Pharmacy */}
        {doctorNote && (
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 shadow">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="font-semibold text-blue-900">Pesan dari Dokter</h3>
                <p className="mt-2 text-sm text-blue-800 whitespace-pre-wrap">{doctorNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prescription from Doctor */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Resep dari Dokter</h2>
          {prescriptions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Tidak ada resep untuk kunjungan ini.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {prescription.prescription_type === 'racik' ? 'Racikan' : 'Non-Racik'}
                      {prescription.sediaan && ` - ${prescription.sediaan}`}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {prescription.prescription_type === 'racik' ? 'Racik' : 'Regular'}
                    </span>
                  </div>
                  
                  {prescription.prescription_type === 'racik' ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-700">Jenis Sediaan: {prescription.sediaan}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Komposisi:</h4>
                        <div className="space-y-2">
                          {prescription.lines.filter(line => line.is_racik_ingredient).map((ingredient) => (
                            <div key={ingredient.id} className="flex justify-between text-sm">
                              <span>{ingredient.drug_name}</span>
                              <span>{ingredient.dosage} {ingredient.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {prescription.lines.find(line => !line.is_racik_ingredient) && (
                        <div className="pt-2 border-t">
                          <p className="text-sm"><strong>Jumlah:</strong> {prescription.lines.find(line => !line.is_racik_ingredient)?.dosage}</p>
                          <p className="text-sm"><strong>Aturan Pakai:</strong> {prescription.lines.find(line => !line.is_racik_ingredient)?.instructions}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-3 py-2 font-medium text-slate-600">Nama Obat</th>
                            <th className="px-3 py-2 font-medium text-slate-600">Dosis</th>
                            <th className="px-3 py-2 font-medium text-slate-600">Frekuensi</th>
                            <th className="px-3 py-2 font-medium text-slate-600">Durasi</th>
                            <th className="px-3 py-2 font-medium text-slate-600">Instruksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescription.lines.map((line: PrescriptionLine) => (
                            <tr key={line.id} className="border-b last:border-0">
                              <td className="px-3 py-3 font-medium">{line.drug_name ?? '-'}</td>
                              <td className="px-3 py-3">{line.dosage ?? '-'}</td>
                              <td className="px-3 py-3">{line.frequency ?? '-'}</td>
                              <td className="px-3 py-3">{line.duration ?? '-'}</td>
                              <td className="px-3 py-3">{line.instructions ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {prescription.additional_info && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800"><strong>Informasi Tambahan:</strong> {prescription.additional_info}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Dispense Section */}
        {canDispense && (
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Dispensasi Obat</h2>
              <button
                type="button"
                onClick={addDispenseItem}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                + Tambah Item
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Pilih batch obat (FEFO - First Expiry First Out)</p>

            <div className="mt-4 space-y-4">
              {dispenseItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item #{index + 1}</p>
                    {dispenseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDispenseItem(index)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-500">Batch Obat (FEFO)</label>
                      <select
                        value={item.medicine_id}
                        onChange={(e) => {
                          const batch = availableBatches.find((b) => b.medicine?.id === e.target.value);
                          updateDispenseItem(index, 'medicine_id', e.target.value);
                          updateDispenseItem(index, 'medicine_name', batch?.medicine?.name ?? '');
                          updateDispenseItem(index, 'batch_id', batch?.id ?? '');
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">-- Pilih Obat --</option>
                        {availableBatches.map((batch) => (
                          <option key={batch.id} value={batch.medicine?.id ?? ''}>
                            {batch.medicine?.name} - Batch {batch.batch_no} (Exp: {batch.expiry_date}, Stok: {batch.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateDispenseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={item.substitution}
                          onChange={(e) => updateDispenseItem(index, 'substitution', e.target.checked)}
                        />
                        Substitusi
                      </label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-slate-500">Catatan</label>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateDispenseItem(index, 'note', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Catatan untuk dispensi..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleDispense}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Dispensasi'}
              </button>
            </div>
          </section>
        )}

        {/* Payment Section */}
        {canPay && (
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Pembayaran Tunai</h2>
            <p className="mt-1 text-sm text-slate-500">Masukkan jumlah pembayaran dari pasien</p>
            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Jumlah (IDR)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="50000"
                />
              </div>
              <button
                type="button"
                onClick={handlePayment}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Terima Pembayaran & Selesaikan'}
              </button>
            </div>
          </section>
        )}

        {/* Completed */}
        {visitInfo.status === 'completed' && (
          <section className="rounded-2xl bg-green-50 p-6 shadow border border-green-200">
            <h2 className="text-lg font-semibold text-green-800">✓ Kunjungan Selesai</h2>
            <p className="mt-1 text-sm text-green-700">
              Pembayaran telah diterima dan kunjungan telah ditandai sebagai selesai.
            </p>
          </section>
        )}

        <div className="text-right">
          <Link
            href="/pharmacy/queue"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            &larr; Kembali ke antrian farmasi
          </Link>
        </div>
      </div>
    </div>
    </RoleProtectedRoute>
  );
}
