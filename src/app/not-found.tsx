import Link from 'next/link';
import { Stethoscope, ArrowLeft, Home, Search, Calendar } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-50 border-2 border-brand-200 text-brand-600 shadow-xl shadow-brand-100/50 mb-2">
          <Stethoscope className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
            Error 404 &bull; Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Diagnosis: Page Missing
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page or medical profile you are looking for does not exist or may have been relocated.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-left">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Navigation
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4 text-brand-500" />
              <span>Back to Homepage</span>
            </Link>
            <Link
              href="/#find-doctors"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition-colors text-sm font-medium"
            >
              <Search className="w-4 h-4 text-teal-500" />
              <span>Search Doctors &amp; Specialists</span>
            </Link>
            <Link
              href="/patient-portal"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition-colors text-sm font-medium"
            >
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>Patient Appointments &amp; Reports</span>
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to BookMyDoctorBD Home</span>
        </Link>
      </div>
    </div>
  );
}

