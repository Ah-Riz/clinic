import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Sistem Informasi Klinik
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Masuk sebagai?
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <Link
            href="/kiosk"
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl">🏥</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Kiosk</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Pendaftaran Pasien
            </p>
          </Link>

          <Link
            href="/doctor"
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl">👨‍⚕️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dokter</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Antrian & Konsultasi
            </p>
          </Link>

          <Link
            href="/pharmacy"
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl">💊</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Farmasi</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Resep & Pembayaran
            </p>
          </Link>

          <Link
            href="/admin"
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Manajemen Sistem
            </p>
          </Link>
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Next.js 16 + Supabase + Tailwind CSS</p>
        </div>
      </main>
    </div>
  );
}
