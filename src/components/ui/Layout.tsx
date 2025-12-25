'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Layout({ children, title, subtitle, showBack = false }: LayoutProps) {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Beranda', href: '/', icon: '🏠' },
    { name: 'Kiosk', href: '/kiosk/login', match: '/kiosk', icon: '📝' },
    { name: 'Dokter', href: '/doctor/login', match: '/doctor', icon: '👨‍⚕️' },
    { name: 'Farmasi', href: '/pharmacy/login', match: '/pharmacy', icon: '💊' },
    { name: 'Admin', href: '/admin/login', match: '/admin', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">ClinicFlow</h1>
                  <p className="text-xs text-gray-500 -mt-1">Sistem Klinik</p>
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => {
                const matchBase = 'match' in item && item.match ? item.match : item.href;
                const isActive =
                  pathname === matchBase || (
                    matchBase !== '/' && pathname.startsWith(matchBase + '/')
                  );

                return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );})}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 hidden sm:inline">Sistem Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      {title && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {showBack && (
              <Link
                href="/"
                className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            )}
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && <p className="mt-2 text-blue-100">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 ClinicFlow Medical System</p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">Powered by Next.js & Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
