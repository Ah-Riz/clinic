import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { RolesProvider } from "@/lib/auth/RolesProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Informasi Klinik",
  description: "EMR untuk klinik di Indonesia - SATUSEHAT Ready",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            <RolesProvider>
              {children}
            </RolesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
