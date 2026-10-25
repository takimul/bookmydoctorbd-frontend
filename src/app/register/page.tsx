'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Doctor specific fields
  const [bmdcRegNumber, setBmdcRegNumber] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [degree, setDegree] = useState('MBBS');
  const [experienceYears, setExperienceYears] = useState('3');
  const [baseFee, setBaseFee] = useState('600');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload: any = {
        name,
        phone,
        email: email || undefined,
        password,
        role,
      };

      if (role === 'DOCTOR') {
        payload.doctorDetails = {
          bmdcRegNumber,
          specialties: [specialty],
          degrees: [degree],
          experienceYears: parseInt(experienceYears, 10),
          baseConsultationFee: parseFloat(baseFee),
          followUpFee: parseFloat(baseFee) * 0.6,
        };
      }

      const res = await api.post('/auth/register', payload);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        login(res.data.token, res.data.user);
        setTimeout(() => {
          if (role === 'DOCTOR') router.push('/doctor-portal');
          else router.push('/patient-portal');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500">
            Join BookMyDoctorBD as a Patient or Medical Specialist
          </p>
        </div>

        {/* Role Picker */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'PATIENT' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient Account</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('DOCTOR')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'DOCTOR' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Doctor Specialist</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder={role === 'DOCTOR' ? 'e.g. Dr. Sabrina Akhter' : 'e.g. Rahim Uddin'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mobile Phone (BD) *</label>
              <input
                type="text"
                required
                placeholder="+88017xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {/* Doctor Specific Registration Fields */}
          {role === 'DOCTOR' && (
            <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-3 mt-3">
              <p className="font-bold text-brand-900 text-xs">Doctor Medical Credentials:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">BMDC Reg No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-12345"
                    value={bmdcRegNumber}
                    onChange={(e) => setBmdcRegNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Dermatology & Venereology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Veterinary Medicine">Veterinary Medicine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Degree (e.g. MBBS, FCPS)"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="Years Exp"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="Fee (BDT)"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <p className="text-[10px] text-brand-800">
                Notice: Doctor accounts are placed in PENDING verification until Super Admin approves credentials.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}

