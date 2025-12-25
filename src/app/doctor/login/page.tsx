'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRoles } from '@/lib/auth/RolesProvider';
import { handleLoginRedirect } from '@/lib/auth/loginRedirect';
import LoginForm from '@/components/LoginForm';
import Layout from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';

export default function DoctorLoginPage() {
  const { user, loading } = useAuth();
  const { primaryRole, rolesLoading } = useRoles();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading && !rolesLoading) {
      // Use smart redirect to primary role dashboard
      handleLoginRedirect(user.id, router);
    }
  }, [user, loading, rolesLoading, router]);

  if (loading) {
    return (
      <Layout title="Login Dokter" subtitle="Masuk untuk mengakses panel dokter">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl">Memuat...</div>
        </div>
      </Layout>
    );
  }

  if (user) {
    return null; // Akan diarahkan ke /doctor
  }

  return (
    <Layout title="Login Dokter" subtitle="Masuk untuk mengakses panel dokter">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="elevated" className="max-w-md w-full">
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
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Gunakan akun dokter yang terdaftar
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
