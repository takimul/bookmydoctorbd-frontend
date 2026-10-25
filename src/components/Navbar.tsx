'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope,
  ShieldAlert,
  User,
  HeartHandshake,
  Cat,
  LogOut,
  Calendar,
  Layers,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Bar for Instant Switching */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              Active Environment: <strong className="text-white">NeonDB PostgreSQL + Prisma 7</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">One-Click Demo Switch:</span>
            <button
              onClick={() => quickLogin('SUPER_ADMIN')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'SUPER_ADMIN'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300'
              }`}
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => quickLogin('DOCTOR')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'DOCTOR'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-teal-300'
              }`}
            >
              🩺 Doctor (Prof. Tanvir)
            </button>
            <button
              onClick={() => quickLogin('PATIENT')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'PATIENT'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-blue-300'
              }`}
            >
              🧑 Patient (Rahim)
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:bg-brand-700 transition">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                BookMyDoctor<span className="text-brand-600">BD</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Bangladesh Healthcare Platform
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
            >
              Find Doctors
            </Link>

            <Link
              href="/veterinary"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition flex items-center gap-1.5"
            >
              <Cat className="w-4 h-4 text-amber-500" />
              <span>Veterinary (Cat-First)</span>
            </Link>

            {user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition flex items-center gap-1.5 border border-purple-200"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Super Admin Panel</span>
              </Link>
            )}

            {(user?.role === 'DOCTOR' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/doctor-portal"
                className="px-3 py-2 text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Doctor Portal</span>
              </Link>
            )}

            {user && (
              <Link
                href="/patient-portal"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>My Appointments & Cases</span>
              </Link>
            )}
          </nav>

          {/* User Section / Login */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-slate-100 text-slate-700">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition"
                >
                  Join as Doctor / Patient
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Find Doctors
          </Link>
          <Link
            href="/veterinary"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-amber-700 hover:bg-amber-50 rounded-md"
          >
            Veterinary (Cat-First)
          </Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-purple-700 bg-purple-50 rounded-md"
            >
              Super Admin Panel
            </Link>
          )}
          {(user?.role === 'DOCTOR' || user?.role === 'SUPER_ADMIN') && (
            <Link
              href="/doctor-portal"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-teal-800 bg-teal-50 rounded-md"
            >
              Doctor Portal
            </Link>
          )}
          {user && (
            <Link
              href="/patient-portal"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              My Appointments & Cases
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 uppercase">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 rounded-lg font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

