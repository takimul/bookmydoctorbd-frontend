import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BookMyDoctorBD | Bangladesh Healthcare & Doctor Booking Platform',
  description:
    'Search verified doctors, specialist chambers, veterinary & cat care across Dhaka, Chittagong, Sylhet and all divisions. Instant booking with guest OTP support, Medical Cases, digital follow-ups, and AI clinical intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 space-y-2">
                <p className="font-semibold text-slate-700">
                  BookMyDoctorBD &copy; 2026. Consolidated v1 Architectural Baseline.
                </p>
                <p>
                  Powered by Next.js, Express.js, TypeScript, and NeonDB PostgreSQL with Prisma 7.
                </p>
                <p className="text-slate-400">
                  Dhaka &bull; Chittagong &bull; Sylhet &bull; Rajshahi &bull; Khulna &bull; Barisal &bull; Rangpur &bull; Mymensingh
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

