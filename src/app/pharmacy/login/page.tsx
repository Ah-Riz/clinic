'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';

export default function PharmacyLoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/pharmacy');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💊</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Farmasi
          </h1>
          <p className="text-gray-600">
            Masuk untuk mengakses panel farmasi
          </p>
        </div>
        <LoginForm 
          role="pharmacist" 
          onSuccess={() => router.push('/pharmacy')}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Gunakan akun apoteker yang terdaftar
          </p>
        </div>
      </div>
    </div>
  );
}
