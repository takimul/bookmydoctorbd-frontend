'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, Lock, Phone, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === 'SUPER_ADMIN') router.push('/admin');
        else if (res.data.user.role === 'DOCTOR') router.push('/doctor-portal');
        else router.push('/patient-portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to BookMyDoctorBD</h2>
          <p className="text-xs text-slate-500">
            Doctors, Patients, and System Administrators
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Quick Demo Switcher inside Login */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
          <p className="font-bold text-slate-700 text-center text-[11px] uppercase tracking-wider">
            ⚡ Quick Demo 1-Click Login:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                await quickLogin('SUPER_ADMIN');
                router.push('/admin');
              }}
              className="py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[10px]"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickLogin('DOCTOR');
                router.push('/doctor-portal');
              }}
              className="py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px]"
            >
              Dr. Tanvir
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickLogin('PATIENT');
                router.push('/patient-portal');
              }}
              className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px]"
            >
              Rahim (Patient)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Email or Mobile Number</label>
            <input
              type="text"
              required
              placeholder="e.g. superadmin@bookmydoctor.bd or +88017xxxxxxxx"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-brand-600 hover:underline">
            Register as Doctor or Patient
          </Link>
        </div>
      </div>
    </div>
  );
}

