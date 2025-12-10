'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/LoginForm';
import Layout from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout title="Login Admin" subtitle="Masuk untuk mengakses panel admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl">Memuat...</div>
        </div>
      </Layout>
    );
  }

  if (user) {
    return null;
  }

  return (
    <Layout title="Login Admin" subtitle="Masuk untuk mengakses panel admin">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="elevated" className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚙️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Login Admin
            </h1>
            <p className="text-gray-600">
              Masuk untuk mengakses panel admin
            </p>
          </div>
          <LoginForm 
            role="admin" 
            onSuccess={() => router.push('/admin')}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Gunakan akun admin yang terdaftar
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
