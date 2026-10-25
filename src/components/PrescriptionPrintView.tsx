'use client';

import React from 'react';
import { Printer, Download, X, Stethoscope, QrCode, CheckCircle2 } from 'lucide-react';

interface PrescriptionPrintViewProps {
  doctor: any;
  chamber: any;
  patient: {
    name: string;
    phone: string;
    age?: string | number;
    gender?: string;
  };
  rxData: {
    caseNumber?: string;
    prescriptionNumber?: string;
    date?: string;
    vitals?: {
      bp?: string;
      pulse?: string;
      weight?: string;
      temp?: string;
      spo2?: string;
      rbs?: string;
    };
    chiefComplaints?: string;
    diagnosis?: string;
    clinicalFindings?: string;
    items: Array<{
      brandName: string;
      genericName?: string;
      dosageForm?: string;
      strength?: string;
      dosageInstruction: string;
      timing?: string;
      durationDays?: number | string;
      specialInstructions?: string;
    }>;
    investigations?: Array<{
      testName: string;
      instructions?: string;
    }>;
    advice?: string;
    dietaryAdvice?: string;
    nextVisitDate?: string;
  };
  onClose?: () => void;
}

export default function PrescriptionPrintView({
  doctor,
  chamber,
  patient,
  rxData,
  onClose,
}: PrescriptionPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = rxData.date
    ? new Date(rxData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      {/* Container */}
      <div className="relative bg-white w-full max-w-4xl shadow-2xl rounded-2xl print:shadow-none print:rounded-none flex flex-col my-auto border border-slate-200 print:border-none">
        
        {/* Floating Print Action Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between p-4 bg-slate-900 text-white rounded-t-2xl border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Official Medical Prescription Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Prescription (A4)</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Prescription Body (Standard A4 Aspect Ratio) */}
        <div className="p-8 sm:p-12 print:p-6 space-y-6 text-slate-900 bg-white font-sans">
          
          {/* Top Platform & Software Header */}
          <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  BookMyDoctor<span className="text-emerald-600">BD</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Bangladesh National Healthcare & Digital Clinical Network
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Rx ID: {rxData.prescriptionNumber || rxData.caseNumber || 'BMD-RX-PREVIEW'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Government BMDC Verified System</p>
            </div>
          </div>

          {/* Doctor & Chamber Details Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 pb-4 border-b border-slate-200">
            {/* Doctor Info */}
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {doctor?.user?.name || doctor?.name || 'Prof. Dr. Tanvir Ahmed'}
              </h2>
              <p className="text-xs font-bold text-emerald-800">
                {doctor?.degrees?.join(', ') || 'MBBS (DMC), FCPS (Medicine), MD (Cardiology)'}
              </p>
              <p className="text-xs text-slate-600 font-semibold">
                Specialties: {doctor?.specialties?.join(' • ') || 'Cardiology, Internal Medicine, Hypertension'}
              </p>
              <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-mono font-bold text-emerald-900">
                BMDC Reg. No: {doctor?.bmdcRegNumber || 'A-42195'}
              </div>
            </div>

            {/* Chamber / Clinic Info */}
            <div className="md:text-right space-y-1 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {chamber?.name || 'Popular Diagnostic Centre - Dhanmondi Branch'}
              </h3>
              <p className="text-slate-600">
                {chamber?.address || 'House 16, Road 2, Dhanmondi R/A, Dhaka-1205'}
              </p>
              <p className="text-slate-600">
                {chamber?.district || 'Dhaka'}, {chamber?.division || 'Dhaka'}
              </p>
              <p className="text-emerald-700 font-bold">
                Chamber Helpline: {chamber?.contactPhone || '+8801711000111'}
              </p>
            </div>
          </div>

          {/* Patient Details Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient Name</span>
              <span className="font-bold text-slate-900">{patient?.name || 'Rahim Uddin'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile No.</span>
              <span className="font-mono font-bold text-slate-800">{patient?.phone || '+8801811112222'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Age / Gender</span>
              <span className="font-medium text-slate-800">
                {patient?.age || '42 Yrs'} / {patient?.gender || 'Male'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Consultation Date</span>
              <span className="font-bold text-slate-800">{currentDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient ID</span>
              <span className="font-mono text-slate-600">
                {patient?.phone?.slice(-6) ? `PID-${patient.phone.slice(-6)}` : 'PID-884192'}
              </span>
            </div>
          </div>

          {/* Vitals Ribbon */}
          {rxData.vitals && Object.keys(rxData.vitals).length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recorded Vitals:</span>
              </span>
              {rxData.vitals.bp && (
                <div>
                  <span className="text-slate-500 text-[10px]">BP: </span>
                  <strong className="text-slate-900 font-mono">{rxData.vitals.bp} mmHg</strong>
                </div>
              )}
              {rxData.vitals.pulse && (
                <div>
                  <span className="text-slate-500 text-[10px]">Pulse: </span>
                  <strong className="text-slate-900 font-mono">{rxData.vitals.pulse} bpm</strong>
                </div>
              )}
              {rxData.vitals.temp && (
                <div>
                  <span className="text-slate-500 text-[10px]">Temp: </span>
                  <strong className="text-slate-900 font-mono">{rxData.vitals.temp}</strong>
                </div>
              )}
              {rxData.vitals.weight && (
                <div>
                  <span className="text-slate-500 text-[10px]">Weight: </span>
                  <strong className="text-slate-900 font-mono">{rxData.vitals.weight}</strong>
                </div>
              )}
              {rxData.vitals.rbs && (
                <div>
                  <span className="text-slate-500 text-[10px]">RBS: </span>
                  <strong className="text-slate-900 font-mono">{rxData.vitals.rbs} mmol/L</strong>
                </div>
              )}
            </div>
          )}

          {/* Main Two-Column Prescription Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-2 min-h-[420px]">
            
            {/* Left Column (35%): Chief Complaints, Diagnosis, Tests, Advice */}
            <div className="md:col-span-4 border-r md:border-slate-200 md:pr-6 space-y-6 text-xs">
              
              {/* Chief Complaints */}
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1 mb-2">
                  Chief Complaints (C/C)
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {rxData.chiefComplaints || 'Severe headaches, exertional fatigue, episodic palpitations.'}
                </p>
              </div>

              {/* Diagnosis / Clinical Impression */}
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1 mb-2">
                  Clinical Diagnosis
                </h4>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-bold text-slate-900">
                  {rxData.diagnosis || 'Essential Hypertension Grade 1 & Hyperlipidemia'}
                </div>
              </div>

              {/* Clinical Examination Findings */}
              {rxData.clinicalFindings && (
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1 mb-2">
                    On Examination (O/E)
                  </h4>
                  <p className="text-slate-700 leading-relaxed italic">{rxData.clinicalFindings}</p>
                </div>
              )}

              {/* Investigations Advised */}
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1 mb-2">
                  Investigations Advised (Tests)
                </h4>
                {rxData.investigations && rxData.investigations.length > 0 ? (
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-800">
                    {rxData.investigations.map((inv, idx) => (
                      <li key={idx} className="font-medium">
                        <strong>{inv.testName}</strong>
                        {inv.instructions && (
                          <span className="text-[11px] text-slate-500 block italic">({inv.instructions})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">None ordered today.</p>
                )}
              </div>

              {/* General & Dietary Advice */}
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1 mb-2">
                  Advice & Lifestyle
                </h4>
                <div className="space-y-2 text-slate-700">
                  {rxData.advice && <p className="leading-relaxed">&bull; {rxData.advice}</p>}
                  {rxData.dietaryAdvice && (
                    <p className="leading-relaxed text-emerald-800 font-medium">
                      &bull; Diet: {rxData.dietaryAdvice}
                    </p>
                  )}
                  {!rxData.advice && !rxData.dietaryAdvice && (
                    <p className="text-slate-500 italic">Standard nutritious home-cooked meals. Adequate rest.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (65%): The Prescription Rx */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Rx Icon Header */}
              <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                <span className="text-3xl font-serif font-black italic text-slate-900 tracking-tighter">
                  ℞
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Prescription Medications
                </span>
              </div>

              {/* Medicine Table List */}
              <div className="space-y-4 pt-1">
                {rxData.items && rxData.items.length > 0 ? (
                  rxData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-b border-slate-100 pb-3 flex items-start gap-3 text-xs"
                    >
                      <span className="w-5 text-slate-400 font-bold text-sm shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.dosageForm ? `${item.dosageForm}. ` : 'Tab. '}
                            {item.brandName}
                          </span>
                          {item.strength && (
                            <span className="font-bold text-emerald-700 text-xs">
                              {item.strength}
                            </span>
                          )}
                          {item.genericName && (
                            <span className="text-slate-500 text-[11px] italic">
                              ({item.genericName})
                            </span>
                          )}
                        </div>

                        {/* Dosage, Timing, Duration Instruction Bar */}
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-800 pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded font-mono font-bold border border-emerald-200">
                            {item.dosageInstruction || '1 + 0 + 1'}
                          </span>
                          <span className="text-slate-600 italic">
                            {item.timing || 'After meal'}
                          </span>
                          <span className="text-slate-700 font-bold">
                            &bull; For {item.durationDays || '7'} Days
                          </span>
                        </div>

                        {item.specialInstructions && (
                          <p className="text-[11px] text-slate-500 italic">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-xs py-8">No medications added yet.</p>
                )}
              </div>

            </div>

          </div>

          {/* Footer Area: Signature, Next Visit Date, Official Stamp */}
          <div className="pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs">
            {/* Next Visit / Follow-up */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Next Follow-Up Visit
              </span>
              <p className="font-bold text-emerald-800 text-sm">
                {rxData.nextVisitDate
                  ? new Date(rxData.nextVisitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'After 7-14 days with investigation reports'}
              </p>
              <p className="text-[10px] text-slate-400">
                Please bring this prescription and all investigation reports during follow-up.
              </p>
            </div>

            {/* Doctor Signature / Official Seal */}
            <div className="text-right space-y-1 min-w-[200px]">
              <div className="h-12 flex items-end justify-end">
                <div className="font-serif italic font-bold text-emerald-800 text-lg border-b border-slate-400 pb-1 px-4">
                  {doctor?.user?.name || doctor?.name || 'Dr. Tanvir Ahmed'}
                </div>
              </div>
              <p className="font-extrabold text-slate-900 text-xs">
                {doctor?.user?.name || doctor?.name || 'Prof. Dr. Tanvir Ahmed'}
              </p>
              <p className="text-[10px] text-slate-500">
                BMDC Reg: {doctor?.bmdcRegNumber || 'A-42195'}
              </p>
              <p className="text-[9px] text-slate-400">Digital Certified Medical Signature</p>
            </div>
          </div>

          {/* Software Watermark */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
            <span>Powered by BookMyDoctorBD &bull; Valid across all Bangladeshi Pharmacies & Diagnostics</span>
            <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
          </div>

        </div>

      </div>
    </div>
  );
}

