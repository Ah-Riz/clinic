/**
 * Not Provisioned User Component
 * Senior Developer Implementation - Clear UX for auth edge cases
 */

'use client';

interface NotProvisionedUserProps {
  userEmail?: string;
  onSignOut?: () => void;
}

/**
 * Component shown when user is authenticated but not provisioned with staff roles
 */
export default function NotProvisionedUser({ 
  userEmail, 
  onSignOut 
}: NotProvisionedUserProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Akun Belum Diaktifkan
          </h2>

          {/* Description */}
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>
              Akun Anda ({userEmail}) berhasil masuk, namun belum diberikan akses ke sistem.
            </p>
            <p>
              Hal ini terjadi karena:
            </p>
            <ul className="text-left space-y-1 ml-4 list-disc">
              <li>Akun staff belum dibuat oleh administrator</li>
              <li>Role/peran belum ditetapkan</li>
              <li>Status staff tidak aktif</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Langkah Selanjutnya:
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Hubungi administrator sistem untuk mengaktifkan akun dan menetapkan role yang sesuai.
              </p>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Keluar dari Akun
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Coba Lagi
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-500">
              Kode Error: AUTH_NOT_PROVISIONED
            </p>
            {userEmail && (
              <p className="text-xs text-gray-500 mt-1">
                Email: {userEmail}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
