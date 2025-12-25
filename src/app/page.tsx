'use client';

import Link from 'next/link';

export default function Home() {
  const roleCards = [
    {
      href: '/kiosk/login',
      title: 'Kiosk Pendaftaran',
      description: 'Registrasi pasien dan pencetakan nomor antrian.',
      gradient: 'from-blue-500 to-cyan-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      badges: ['Registrasi', 'Antrian'],
      buttonText: 'Masuk ke Kiosk',
      buttonVariant: 'primary'
    },
    {
      href: '/doctor/login',
      title: 'Portal Dokter',
      description: 'Kelola antrian dan catatan medis pasien.',
      gradient: 'from-emerald-500 to-teal-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      badges: ['Konsultasi', 'Rekam Medis'],
      buttonText: 'Masuk sebagai Dokter',
      buttonVariant: 'primary'
    },
    {
      href: '/pharmacy/login',
      title: 'Portal Farmasi',
      description: 'Proses resep dan pembayaran obat.',
      gradient: 'from-purple-500 to-pink-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badges: ['Resep', 'Pembayaran'],
      buttonText: 'Masuk ke Farmasi',
      buttonVariant: 'primary'
    },
    {
      href: '/admin/login',
      title: 'Portal Admin',
      description: 'Manajemen perangkat, pengguna, dan laporan.',
      gradient: 'from-gray-600 to-gray-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      badges: ['Manajemen', 'Laporan'],
      buttonText: 'Masuk sebagai Admin',
      buttonVariant: 'secondary'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">ClinicFlow</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Sistem Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Sistem Informasi Klinik ClinicFlow
          </h1>
          <p className="text-gray-600">
            Pilih portal sesuai peran Anda di klinik.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              {/* Icon */}
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4`}>
                {card.icon}
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h2>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {card.badges.map((badge, i) => (
                  <span 
                    key={i} 
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Button */}
              <Link 
                href={card.href}
                className={`block w-full py-2.5 rounded-lg text-center font-medium transition-all ${
                  card.buttonVariant === 'primary' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {card.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-gray-500 text-sm">© 2025 ClinicFlow – Sistem Informasi Klinik</p>
      </footer>
    </div>
  );
}
