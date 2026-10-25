'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Cat, Calendar, CheckCircle2, Star, ShieldCheck, HeartPulse, Clock, Sparkles } from 'lucide-react';

export default function VeterinaryPage() {
  const [vetDoctors, setVetDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/doctors', { params: { isVeterinary: 'true' } })
      .then((res) => {
        if (res.data.success) {
          setVetDoctors(res.data.doctors || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-gradient-to-b from-amber-50/70 via-slate-50 to-slate-50 border-b border-slate-200/80 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-4">
              <Cat className="w-4 h-4 text-amber-600" />
              <span>Cat-First Veterinary Care &bull; Dedicated Feline & Small Animal Doctors</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Compassionate Cat & Pet Healthcare in Bangladesh
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600">
              Find verified veterinary practitioners specializing in feline viral boosters (FVRCP, Rabies), deworming, clinical surgery, nutrition, and emergency pet care.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cat className="w-5 h-5 text-amber-500" />
            <span>Verified Veterinary Specialists ({vetDoctors.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Cat-First Certified Practices</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading veterinary doctors...</div>
        ) : vetDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-500">
            No veterinary doctors found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vetDoctors.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-amber-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                    <Cat className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{doc.user?.name}</h3>
                    <p className="text-xs text-amber-700 font-semibold">{doc.degrees?.join(', ')}</p>
                    <p className="text-xs text-slate-600 mt-1">{doc.specialties?.join(' &bull; ')}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        REG: {doc.bmdcRegNumber}
                      </span>
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {doc.rating || '4.9'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <p className="font-bold text-slate-800">{doc.chambers?.[0]?.name}</p>
                  <p className="text-slate-500 text-[11px]">{doc.chambers?.[0]?.address}</p>
                  <p className="text-brand-700 font-bold mt-1">
                    Consultation Fee: {doc.baseConsultationFee} BDT &bull; Follow-up: {doc.followUpFee} BDT
                  </p>
                </div>

                <a
                  href={`/?search=${encodeURIComponent(doc.user.name)}`}
                  className="block text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Book Pet Consultation
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

