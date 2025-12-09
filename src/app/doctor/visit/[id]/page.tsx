"use client";

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const DOCTOR_DEVICE_ID = process.env.NEXT_PUBLIC_DOCTOR_DEVICE_ID ?? "DOCTOR-001";
const severityOptions = ["mild", "moderate", "severe", "unknown"] as const;

type Severity = (typeof severityOptions)[number];

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

type AllergyRecord = {
  id: string;
  allergen: string | null;
  reaction: string | null;
  severity: Severity | null;
  created_at: string | null;
};

type VitalsDraft = {
  systolic: string;
  diastolic: string;
  heart_rate: string;
  temperature: string;
  resp_rate: string;
  spo2: string;
};

type DiagnosisDraft = {
  code: string;
  description: string;
  is_primary: boolean;
};

type PrescriptionDraft = {
  drug_name: string;
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type Medicine = {
  id: string;
  name: string;
  unit: string | null;
};

type ICD10Code = {
  code: string;
  title: string;
  chapter: string | null;
};

type AllergyDraft = {
  allergen: string;
  reaction: string;
  severity: Severity;
};

const defaultVitals: VitalsDraft = {
  systolic: "",
  diastolic: "",
  heart_rate: "",
  temperature: "",
  resp_rate: "",
  spo2: "",
};

const defaultDiagnosis: DiagnosisDraft = { code: "", description: "", is_primary: true };
const defaultPrescription: PrescriptionDraft = { drug_name: "", medicine_id: "", dosage: "", frequency: "", duration: "", instructions: "" };
const defaultAllergy: AllergyDraft = { allergen: "", reaction: "", severity: "unknown" };

export default function DoctorVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: visitId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ "x-device-id": DOCTOR_DEVICE_ID }), []);

  const [visitInfo, setVisitInfo] = useState<VisitInfo | null>(null);
  const [existingAllergies, setExistingAllergies] = useState<AllergyRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vitals, setVitals] = useState<VitalsDraft>(defaultVitals);
  const [anamnesis, setAnamnesis] = useState("");
  const [therapy, setTherapy] = useState("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisDraft[]>([{ ...defaultDiagnosis }]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDraft[]>([{ ...defaultPrescription }]);
  const [allergyDrafts, setAllergyDrafts] = useState<AllergyDraft[]>([{ ...defaultAllergy }]);
  const [pharmacyNote, setPharmacyNote] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState<number | null>(null);
  const [icd10Codes, setIcd10Codes] = useState<ICD10Code[]>([]);
  const [showIcd10Dropdown, setShowIcd10Dropdown] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      void loadVisit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, visitId]);

  async function loadVisit() {
    setFetching(true);
    setFetchError(null);
    setActionError(null);
    try {
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select("id,status,queue_date,patient_id")
        .eq("id", visitId)
        .maybeSingle();

      if (visitError || !visitData) {
        setFetchError("Kunjungan tidak ditemukan.");
        setVisitInfo(null);
        setExistingAllergies([]);
        setFetching(false);
        return;
      }

      const [patientRes, queueRes, allergiesRes] = await Promise.all([
        supabase.from("patients").select("id,name,sex,dob,phone").eq("id", visitData.patient_id).maybeSingle(),
        supabase.from("doctor_queue").select("number,status").eq("visit_id", visitId).maybeSingle(),
        supabase
          .from("allergies")
          .select("id, allergen, reaction, severity, created_at")
          .eq("patient_id", visitData.patient_id)
          .order("created_at", { ascending: false }),
      ]);

      if (patientRes.error || !patientRes.data) {
        setFetchError("Data pasien tidak ditemukan.");
        setVisitInfo(null);
        setExistingAllergies([]);
      } else {
        setVisitInfo({
          id: visitData.id,
          status: visitData.status,
          queueDate: visitData.queue_date,
          patient: patientRes.data,
          queueNumber: queueRes.data?.number ?? null,
          queueStatus: queueRes.data?.status ?? null,
        });
        setExistingAllergies(allergiesRes.data ?? []);
      }
    } catch (err) {
      console.error(err);
      setFetchError("Gagal memuat data kunjungan.");
    } finally {
      setFetching(false);
    }
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
    } catch (err) {
      return value;
    }
  }

  async function searchMedicines(query: string, index: number) {
    if (query.length < 2) {
      setMedicines([]);
      setShowMedicineDropdown(null);
      return;
    }

    setShowMedicineDropdown(index);

    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, unit")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10);

    if (error) {
      console.error("Medicine search error:", error);
      setMedicines([]);
    } else {
      setMedicines(data ?? []);
    }
  }

  function selectMedicine(index: number, medicine: Medicine) {
    setPrescriptions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, drug_name: medicine.name, medicine_id: medicine.id }
          : item
      )
    );
    setMedicines([]);
    setShowMedicineDropdown(null);
  }

  async function searchIcd10(query: string, index: number) {
    if (query.length < 2) {
      setIcd10Codes([]);
      setShowIcd10Dropdown(null);
      return;
    }

    setShowIcd10Dropdown(index);

    const { data, error } = await supabase
      .from("icd10_codes")
      .select("code, title, chapter")
      .or(`code.ilike.%${query}%,title.ilike.%${query}%`)
      .order("code")
      .limit(15);

    if (error) {
      console.error("ICD-10 search error:", error);
      setIcd10Codes([]);
    } else {
      setIcd10Codes(data ?? []);
    }
  }

  function selectIcd10(index: number, icd10: ICD10Code) {
    setDiagnoses((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, code: icd10.code, description: icd10.title }
          : item
      )
    );
    setIcd10Codes([]);
    setShowIcd10Dropdown(null);
  }

  function updateDiagnosis(index: number, field: keyof DiagnosisDraft, value: string | boolean) {
    setDiagnoses((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function updatePrescription(index: number, field: keyof PrescriptionDraft, value: string) {
    setPrescriptions((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  }

  function updateAllergyDraft(index: number, field: keyof AllergyDraft, value: string) {
    setAllergyDrafts((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)) as AllergyDraft[]);
  }

  function addDiagnosis() {
    setDiagnoses((prev) => [...prev, { ...defaultDiagnosis, is_primary: false }]);
  }

  function removeDiagnosis(index: number) {
    setDiagnoses((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  function addPrescription() {
    setPrescriptions((prev) => [...prev, { ...defaultPrescription }]);
  }

  function removePrescription(index: number) {
    setPrescriptions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  function addAllergyDraft() {
    setAllergyDrafts((prev) => [...prev, { ...defaultAllergy }]);
  }

  function removeAllergyDraft(index: number) {
    setAllergyDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  function buildClinicalPayload() {
    const payload: Record<string, unknown> = {};

    const vitalsPayload: Record<string, number> = {};
    if (vitals.systolic) vitalsPayload.systolic = Number(vitals.systolic);
    if (vitals.diastolic) vitalsPayload.diastolic = Number(vitals.diastolic);
    if (vitals.heart_rate) vitalsPayload.heart_rate = Number(vitals.heart_rate);
    if (vitals.temperature) vitalsPayload.temperature = Number(vitals.temperature);
    if (vitals.resp_rate) vitalsPayload.resp_rate = Number(vitals.resp_rate);
    if (vitals.spo2) vitalsPayload.spo2 = Number(vitals.spo2);
    if (Object.keys(vitalsPayload).length > 0) {
      payload.vitals = vitalsPayload;
    }

    const allergyPayload = allergyDrafts
      .filter((item) => item.allergen.trim().length > 0)
      .map((item) => ({
        allergen: item.allergen.trim(),
        reaction: item.reaction.trim() || null,
        severity: item.severity,
      }));
    if (allergyPayload.length > 0) {
      payload.allergies = allergyPayload;
    }

    if (anamnesis.trim()) {
      payload.anamnesis = anamnesis.trim();
    }

    if (therapy.trim()) {
      payload.therapy = therapy.trim();
    }

    const diagnosesPayload = diagnoses
      .filter((d) => d.code.trim())
      .map((d) => ({
        code: d.code.trim(),
        description: d.description.trim(),
        is_primary: d.is_primary,
      }));
    if (diagnosesPayload.length > 0) {
      payload.diagnoses = diagnosesPayload;
    }

    return payload;
  }

  function buildPrescriptionPayload() {
    return prescriptions
      .filter((p) => p.drug_name.trim())
      .map((p) => ({
        drug_name: p.drug_name.trim(),
        medicine_id: p.medicine_id || null,
        dosage: p.dosage.trim() || null,
        frequency: p.frequency.trim() || null,
        duration: p.duration.trim() || null,
        instructions: p.instructions.trim() || null,
      }));
  }

  async function handleSubmit(sendToPharmacy: boolean) {
    setActionMessage(null);
    setActionError(null);
    setSubmitting(true);
    try {
      const clinicalPayload = buildClinicalPayload();
      const prescriptionPayload = buildPrescriptionPayload();

      const { error } = await supabase.rpc("emr_doctor_finalize_visit", {
        p_visit_id: visitId,
        p_device_id: DOCTOR_DEVICE_ID,
        p_clinical_payload: clinicalPayload,
        p_prescriptions: prescriptionPayload,
        p_send_to_pharmacy: sendToPharmacy,
        p_pharmacy_note: pharmacyNote.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setActionMessage(sendToPharmacy ? "Kunjungan dikirim ke farmasi." : "Kunjungan selesai tanpa farmasi.");
      await loadVisit();
      setTimeout(() => router.push("/doctor/queue"), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data kunjungan.';
      setActionError(message);
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
        <p className="text-lg">Silakan login sebagai dokter.</p>
        <Link href="/" className="text-emerald-600 hover:underline">
          Kembali ke halaman utama
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
        <p className="text-lg text-red-600">{fetchError ?? "Data kunjungan tidak tersedia."}</p>
        <Link href="/doctor/queue" className="text-emerald-600 hover:underline">
          &larr; Kembali ke antrian dokter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link href="/doctor/queue" className="font-medium text-emerald-600 hover:underline">
            &larr; Kembali ke antrian
          </Link>
          <span>/</span>
          <span>Visit #{visitInfo.id.slice(0, 8)}</span>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Pasien</p>
              <h1 className="text-2xl font-semibold text-slate-900">{visitInfo.patient.name}</h1>
              <div className="mt-2 text-sm text-slate-600">
                <p>Jenis kelamin: {visitInfo.patient.sex ?? "N/A"}</p>
                <p>Tanggal lahir: {formatDate(visitInfo.patient.dob)}</p>
                <p>Telepon: {visitInfo.patient.phone ?? "-"}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status kunjungan</p>
              <p className="mt-1 text-lg font-semibold capitalize">{visitInfo.status.replaceAll("_", " ")}</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Nomor antrian</span>
                  <span className="font-semibold text-slate-800">{visitInfo.queueNumber ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status antrian</span>
                  <span className="capitalize">{visitInfo.queueStatus ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tanggal antre</span>
                  <span>{formatDate(visitInfo.queueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Perangkat</span>
                  <span className="font-semibold">{DOCTOR_DEVICE_ID}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {existingAllergies.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Riwayat alergi pasien</h2>
            <p className="text-sm text-slate-500">Data ini tersimpan sebelumnya sebagai referensi klinis.</p>
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {existingAllergies.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{item.allergen ?? "(tanpa nama)"}</p>
                    {item.reaction && <p className="text-slate-500">Reaksi: {item.reaction}</p>}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {item.severity ?? "unknown"} • {formatDate(item.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {actionMessage && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">{actionMessage}</div>}
        {actionError && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Tanda vital</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Sistolik (mmHg)", key: "systolic" as const },
                  { label: "Diastolik (mmHg)", key: "diastolic" as const },
                  { label: "Nadi (bpm)", key: "heart_rate" as const },
                  { label: "Suhu (°C)", key: "temperature" as const },
                  { label: "RR (x/menit)", key: "resp_rate" as const },
                  { label: "SpO₂ (%)", key: "spo2" as const },
                ].map((field) => (
                  <label key={field.key} className="text-slate-600">
                    <span className="text-xs font-medium text-slate-500">{field.label}</span>
                    <input
                      type="number"
                      step="any"
                      value={vitals[field.key]}
                      onChange={(e) => setVitals((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Anamnesis</h3>
              <textarea
                rows={5}
                value={anamnesis}
                onChange={(e) => setAnamnesis(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Keluhan utama, riwayat penyakit, dsb."
              />
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold text-slate-900">Rencana terapi</h3>
              <textarea
                rows={4}
                value={therapy}
                onChange={(e) => setTherapy(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Instruksi kepada pasien setelah konsultasi."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Diagnosa (ICD-10)</h3>
                <button type="button" onClick={addDiagnosis} className="text-sm font-medium text-emerald-600 hover:underline">
                  + Tambah diagnosa
                </button>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                {diagnoses.map((diag, index) => (
                  <div key={`diag-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnosa #{index + 1}</p>
                      {diagnoses.length > 1 && (
                        <button type="button" onClick={() => removeDiagnosis(index)} className="text-xs text-red-500 hover:underline">
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-xs font-medium text-slate-500">Kode ICD-10</label>
                        <input
                          type="text"
                          value={diag.code}
                          onChange={(e) => {
                            updateDiagnosis(index, "code", e.target.value.toUpperCase());
                            searchIcd10(e.target.value, index);
                          }}
                          onFocus={() => diag.code.length >= 2 && searchIcd10(diag.code, index)}
                          onBlur={() => setTimeout(() => setShowIcd10Dropdown(null), 200)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="Ketik kode atau nama penyakit..."
                          autoComplete="off"
                        />
                        {showIcd10Dropdown === index && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                            {icd10Codes.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-400">
                                Tidak ada kode ICD-10 ditemukan. Tambahkan di database.
                              </div>
                            ) : (
                              icd10Codes.map((icd) => (
                                <button
                                  key={icd.code}
                                  type="button"
                                  onClick={() => selectIcd10(index, icd)}
                                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-sm border-b border-slate-100 last:border-0"
                                >
                                  <span className="font-semibold text-emerald-700">{icd.code}</span>
                                  <span className="ml-2 text-slate-600">{icd.title}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Utama?</label>
                        <select
                          value={diag.is_primary ? "true" : "false"}
                          onChange={(e) => updateDiagnosis(index, "is_primary", e.target.value === "true")}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        >
                          <option value="true">Ya</option>
                          <option value="false">Tidak</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-500">Deskripsi (auto-filled)</label>
                      <textarea
                        rows={2}
                        value={diag.description}
                        onChange={(e) => updateDiagnosis(index, "description", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                        placeholder="Akan terisi otomatis dari kode ICD-10"
                        readOnly
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Resep</h3>
                <button type="button" onClick={addPrescription} className="text-sm font-medium text-emerald-600 hover:underline">
                  + Tambah obat
                </button>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                {prescriptions.map((rx, index) => (
                  <div key={`rx-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Obat #{index + 1}</p>
                      {prescriptions.length > 1 && (
                        <button type="button" onClick={() => removePrescription(index)} className="text-xs text-red-500 hover:underline">
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-xs font-medium text-slate-500">Nama obat</label>
                        <input
                          type="text"
                          value={rx.drug_name}
                          onChange={(e) => {
                            updatePrescription(index, "drug_name", e.target.value);
                            searchMedicines(e.target.value, index);
                          }}
                          onFocus={() => rx.drug_name.length >= 2 && searchMedicines(rx.drug_name, index)}
                          onBlur={() => setTimeout(() => setShowMedicineDropdown(null), 200)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="Ketik nama obat..."
                          autoComplete="off"
                        />
                        {showMedicineDropdown === index && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                            {medicines.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-400">
                                Tidak ada obat ditemukan. Tambahkan obat di menu Admin → Inventori.
                              </div>
                            ) : (
                              medicines.map((medicine) => (
                                <button
                                  key={medicine.id}
                                  type="button"
                                  onClick={() => selectMedicine(index, medicine)}
                                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-sm flex justify-between items-center"
                                >
                                  <span className="font-medium text-slate-800">{medicine.name}</span>
                                  {medicine.unit && (
                                    <span className="text-xs text-slate-500">{medicine.unit}</span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Dosis</label>
                        <input
                          type="text"
                          value={rx.dosage}
                          onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="500 mg"
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <label className="text-xs font-medium text-slate-500">
                        Frekuensi
                        <input
                          type="text"
                          value={rx.frequency}
                          onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="3x sehari"
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Durasi
                        <input
                          type="text"
                          value={rx.duration}
                          onChange={(e) => updatePrescription(index, "duration", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="5 hari"
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Instruksi
                        <input
                          type="text"
                          value={rx.instructions}
                          onChange={(e) => updatePrescription(index, "instructions", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                          placeholder="Sesudah makan"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Alergi</h3>
                <button type="button" onClick={addAllergyDraft} className="text-sm font-medium text-emerald-600 hover:underline">
                  + Tambah alergi
                </button>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                {allergyDrafts.map((allergy, index) => (
                  <div key={`allergy-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alergi #{index + 1}</p>
                      {allergyDrafts.length > 1 && (
                        <button type="button" onClick={() => removeAllergyDraft(index)} className="text-xs text-red-500 hover:underline">
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500">Alergen</label>
                        <input
                          type="text"
                          value={allergy.allergen}
                          onChange={(e) => updateAllergyDraft(index, "allergen", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Reaksi</label>
                        <input
                          type="text"
                          value={allergy.reaction}
                          onChange={(e) => updateAllergyDraft(index, "reaction", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-500">Keparahan</label>
                      <select
                        value={allergy.severity}
                        onChange={(e) => updateAllergyDraft(index, "severity", e.target.value as Severity)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {severityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pharmacy Note */}
        <div className="rounded-2xl bg-blue-50 p-5 shadow">
          <h3 className="text-lg font-semibold text-blue-900">💬 Pesan untuk Farmasi</h3>
          <p className="mt-1 text-sm text-blue-700">Catatan tambahan untuk apoteker (opsional)</p>
          <textarea
            value={pharmacyNote}
            onChange={(e) => setPharmacyNote(e.target.value)}
            placeholder="Contoh: Pasien alergi amoxicillin, harap ganti dengan alternatif..."
            className="mt-3 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Kirim ke farmasi
          </button>
        </div>
      </div>
    </div>
  );
}
