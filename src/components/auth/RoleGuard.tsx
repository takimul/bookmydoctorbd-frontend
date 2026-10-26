'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ShieldAlert, Lock, ArrowRight, Home, LogIn } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallbackTitle,
  fallbackMessage,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center animate-pulse">
            <span className="font-extrabold text-brand-600 text-xl">BMD</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-500 animate-ping opacity-25" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Case 1: Unauthenticated
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Authentication Required
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              {fallbackTitle || 'Sign in to access this portal'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {fallbackMessage ||
                'This section contains protected clinical or administrative records and requires an authorized session.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/login"
              className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </Link>
            <Link
              href="/"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Authenticated but role unauthorized
  // Note: SUPER_ADMIN has master override
  const isAuthorized = user.role === 'SUPER_ADMIN' || allowedRoles.includes(user.role);

  if (!isAuthorized) {
    const getTargetPortal = () => {
      switch (user.role) {
        case 'DOCTOR':
          return { name: 'Doctor Portal', href: '/doctor-portal' };
        case 'PATIENT':
        case 'GUEST':
          return { name: 'Patient Portal', href: '/patient-portal' };
        case 'ADMIN':
        case 'SUPER_ADMIN':
          return { name: 'Admin Dashboard', href: '/admin' };
        default:
          return { name: 'Home', href: '/' };
      }
    };

    const targetPortal = getTargetPortal();

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Role Access Restricted
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Unauthorized Role Access
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              You are signed in as <strong className="text-slate-800">{user.name}</strong> with role{' '}
              <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 text-[11px]">
                {user.role}
              </span>
              . This portal is restricted to: <strong className="text-slate-800">{allowedRoles.join(', ')}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href={targetPortal.href}
              className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <span>Go to {targetPortal.name}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <span>Switch Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}
