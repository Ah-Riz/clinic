'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';

export default function DoctorLoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/doctor');
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
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👩‍⚕️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Dokter
          </h1>
          <p className="text-gray-600">
            Masuk untuk mengakses panel dokter
          </p>
        </div>
        <LoginForm 
          role="doctor" 
          onSuccess={() => router.push('/doctor')}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Gunakan akun dokter yang terdaftar
          </p>
        </div>
      </div>
    </div>
  );
}
