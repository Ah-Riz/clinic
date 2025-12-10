'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { Alert, Loading } from '@/components/ui/Alert';
import Layout from '@/components/ui/Layout';

export default function KioskPage() {
  const { user, loading } = useAuth();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <Loading size="lg" text="Memuat aplikasi..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Layout title="Login Kiosk" subtitle="Akses sistem pendaftaran pasien">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card variant="elevated" className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Login Kiosk Diperlukan
              </h2>
              <p className="text-gray-600">
                Silakan masuk untuk mengakses pendaftaran pasien
              </p>
            </div>
            <LoginForm role="kiosk" />
          </Card>
        </div>
      </Layout>
    );
  }

  if (registrationComplete && queueNumber) {
    return (
      <Layout title="Pendaftaran Selesai" subtitle="Nomor antrian Anda telah dibuat">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card variant="elevated" className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pendaftaran Berhasil! 🎉
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-6">
              <p className="text-sm font-medium text-gray-600 mb-3">Nomor Antrian Anda</p>
              <div className="text-7xl font-bold text-blue-600">
                {queueNumber.toString().padStart(3, '0')}
              </div>
            </div>
            <Alert type="info" className="mb-6">
              Silakan menunggu di ruang tunggu. Anda akan dipanggil sesuai nomor antrian.
            </Alert>
            <Button
              onClick={() => {
                setRegistrationComplete(false);
                setQueueNumber(null);
                setNik('');
                setFullName('');
                setDob('');
                setSex('');
                setPhone('');
                setAddress('');
              }}
              variant="primary"
              size="lg"
              fullWidth
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Daftarkan Pasien Lain
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pendaftaran Pasien" subtitle="Lengkapi data pasien untuk membuat nomor antrian" showBack>
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Formulir Pendaftaran Pasien
            </h2>
            <p className="text-gray-600">Lengkapi semua field yang wajib diisi</p>
          </div>
          
          {error && (
            <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (!nik || nik.length !== 16) {
                setError('NIK harus 16 digit.');
                return;
              }
              if (!fullName || !dob || !sex || !address) {
                setError('Lengkapi semua field wajib.');
                return;
              }
              try {
                setSubmitting(true);
                const { data: hashData, error: hashErr } = await supabase.functions.invoke('hash_nik', {
                  body: { nik },
                });
                if (hashErr) {
                  throw new Error(hashErr.message || 'Gagal memproses NIK.');
                }
                if (!hashData?.nik_hash_lookup || !hashData?.nik_hash || !hashData?.nik_salt) {
                  throw new Error('Respon hashing NIK tidak lengkap.');
                }

                const { data: encData, error: encErr } = await supabase.functions.invoke('encrypt_address', {
                  body: { address },
                });
                if (encErr) {
                  throw new Error(encErr.message || 'Gagal mengenkripsi alamat.');
                }
                if (!encData?.ciphertext_b64) {
                  throw new Error('Respon enkripsi alamat tidak lengkap.');
                }

                const sexValue = sex as 'male' | 'female' | 'unknown';
                const { data: rpcData, error: rpcErr } = await supabase.rpc('emr_kiosk_register_patient', {
                  p_nik_hash_lookup: hashData.nik_hash_lookup,
                  p_nik_hash: hashData.nik_hash,
                  p_nik_salt: hashData.nik_salt,
                  p_name: fullName,
                  p_dob: dob,
                  p_sex: sexValue,
                  p_phone: phone || null,
                  p_address_b64: encData.ciphertext_b64,
                  p_device_id: 'KIOSK-001',
                });
                if (rpcErr) throw rpcErr;

                const qn = (rpcData as any)?.queue_number as number | undefined;
                if (!qn) throw new Error('Gagal mendapatkan nomor antrian');
                setQueueNumber(qn);
                setRegistrationComplete(true);
                setNik('');
                setFullName('');
                setDob('');
                setSex('');
                setPhone('');
                setAddress('');
              } catch (err: any) {
                setError(err?.message || 'Terjadi kesalahan. Coba lagi.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Input
              label="NIK (Nomor Induk Kependudukan)"
              type="text"
              maxLength={16}
              placeholder="16 digit NIK"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
              required
              helper="Masukkan 16 digit NIK sesuai KTP"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              }
            />

            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Nama sesuai KTP"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal Lahir"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />

              <Select
                label="Jenis Kelamin"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                options={[
                  { value: 'male', label: 'Laki-laki' },
                  { value: 'female', label: 'Perempuan' },
                ]}
                placeholder="Pilih jenis kelamin"
                required
              />
            </div>

            <Input
              label="Nomor Telepon"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helper="Contoh: 081234567890"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            <TextArea
              label="Alamat Lengkap"
              rows={3}
              placeholder="Alamat sesuai KTP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <Alert type="warning">
              <strong>Catatan Privasi:</strong> Data NIK dan alamat akan dienkripsi untuk melindungi privasi Anda.
            </Alert>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              icon={
                !submitting && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            >
              {submitting ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
