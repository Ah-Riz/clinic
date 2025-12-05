'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';
import { supabase } from '@/lib/supabaseClient';

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🏥</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kiosk Pendaftaran
            </h1>
            <p className="text-gray-600">
              Login menggunakan akun kiosk
            </p>
          </div>
          <LoginForm role="kiosk" />
        </div>
      </div>
    );
  }

  if (registrationComplete && queueNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pendaftaran Berhasil!
          </h2>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-gray-600 mb-2">Nomor Antrian Anda</p>
            <div className="text-6xl font-bold text-blue-600">
              {queueNumber}
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Silakan menunggu. Anda akan dipanggil oleh dokter.
          </p>
          <button
            onClick={() => {
              setRegistrationComplete(false);
              setQueueNumber(null);
            }}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Daftar Pasien Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Formulir Pendaftaran Pasien
          </h1>
          
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIK (Nomor Induk Kependudukan) *
              </label>
              <input
                type="text"
                maxLength={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="16 digit NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama sesuai KTP"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin *
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  required
                >
                  <option value="">Pilih</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap *
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Alamat sesuai KTP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Data NIK dan alamat akan dienkripsi untuk privasi Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 text-white rounded-lg font-medium text-lg transition-colors ${
                submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
