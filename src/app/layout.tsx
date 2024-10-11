import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hospital Dashboard",
  description: "Hospital management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <div className="flex h-screen bg-gray-100 text-gray-900">
          {/* Sidebar */}
          <aside className="w-64 bg-white p-6 shadow-md">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-teal-500 rounded-md mr-2"></div>
              <h1 className="text-xl font-semibold text-gray-900">Hospital</h1>
            </div>
            <nav>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                Dashboard
              </h2>
              <a
                href="#"
                className="flex items-center text-gray-700 py-2 hover:text-teal-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </a>
              <h2 className="text-sm font-semibold text-gray-600 mt-6 mb-2">
                Applications
              </h2>
              <a
                href="#"
                className="flex items-center text-gray-700 py-2 hover:text-teal-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Pages
              </a>
              <h2 className="text-sm font-semibold text-gray-600 mt-6 mb-2">
                Components
              </h2>
              <a
                href="#"
                className="flex items-center text-gray-700 py-2 hover:text-teal-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                UI Component
              </a>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
              <div className="relative">
                <span className="text-gray-700">{}</span> {/* Display current date and time */}
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              </div>
            </header>

            {/* child */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}