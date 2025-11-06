'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';

export default function KioskPage() {
  const { user, loading } = useAuth();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);

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
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIK (Nomor Induk Kependudukan) *
              </label>
              <input
                type="text"
                maxLength={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="16 digit NIK"
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin *
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Call RPC to register patient
                // For now, simulate success
                setQueueNumber(Math.floor(Math.random() * 50) + 1);
                setRegistrationComplete(true);
              }}
            >
              Daftar Sekarang
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
