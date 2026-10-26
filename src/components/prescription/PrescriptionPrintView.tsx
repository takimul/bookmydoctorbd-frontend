'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  FileDown,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { DoctorProfile, Chamber } from '@/types/doctor';

export interface PrescriptionPrintViewProps {
  doctor: Partial<DoctorProfile> & { name?: string; user?: { name: string; phone?: string } };
  chamber?: Partial<Chamber>;
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
  const toast = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentDate = rxData.date
    ? new Date(rxData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const doctorName = doctor?.user?.name || doctor?.name || 'Registered Medical Practitioner';
  const doctorDegrees = doctor?.degrees?.length ? doctor.degrees.join(', ') : 'MBBS, FCPS / MD';
  const doctorSpecialties = doctor?.specialties?.length ? doctor.specialties.join(' • ') : 'General Medicine & Specialist';
  const bmdcReg = doctor?.bmdcRegNumber || 'Verified BMDC';

  // 1. Direct PDF Download via html2pdf.js
  const handleDownloadPdf = async () => {
    const element = document.getElementById('bmd-prescription-sheet');
    if (!element) {
      toast.error('Prescription sheet element not found.');
      return;
    }

    setDownloadingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const filename = `Prescription_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${rxData.prescriptionNumber || rxData.caseNumber || 'BMD-RX'}.pdf`;

      const opt = {
        margin: [4, 6, 4, 6],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Prescription PDF downloaded successfully!');
    } catch (err: any) {
      console.error('Direct PDF generation error:', err);
      toast.error('Direct PDF download failed. Opening browser print...');
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 2. Direct Window Print (Bulletproof because component is portalled directly to document.body)
  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <>
      {/* Strict Single-Page A4 Print Stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                width: 210mm !important;
                height: auto !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all other direct children of body */
              body > *:not(#bmd-prescription-modal-root) {
                display: none !important;
                visibility: hidden !important;
              }
              #bmd-prescription-modal-root {
                display: block !important;
                position: static !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
                z-index: 9999999 !important;
              }
              #bmd-prescription-modal-root > div {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              .no-print {
                display: none !important;
              }
              #bmd-prescription-sheet {
                width: 210mm !important;
                max-width: 210mm !important;
                min-height: 295mm !important;
                box-sizing: border-box !important;
                margin: 0 auto !important;
                padding: 8mm 10mm !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .print-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      {/* Screen Backdrop Overlay with click-outside-to-close */}
      <div
        id="bmd-prescription-modal-root"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:h-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full max-w-4xl shadow-2xl rounded-2xl print:shadow-none print:rounded-none flex flex-col my-auto border border-slate-200 print:border-none print:w-full print:max-w-none"
        >
          {/* Action Bar (Hidden in Print) */}
          <div className="no-print flex items-center justify-between p-4 bg-slate-900 text-white rounded-t-2xl border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Clinical Prescription &bull; Single-Page A4 Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Direct PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                title="Download formatted single-page A4 PDF file"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              {/* Print / Save as PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                title="Open browser print dialog to Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                  title="Close preview (Esc or click outside)"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Single-Page Printable A4 Container */}
          <div
            id="bmd-prescription-sheet"
            className="prescription-sheet p-6 sm:p-8 print:p-0 text-slate-900 bg-white font-sans flex flex-col justify-between text-xs leading-normal"
          >
            <div className="space-y-3">
              {/* Header: Platform Branding & Prescription Number */}
              <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                      BookMyDoctor<span className="text-emerald-600">BD</span>
                    </h1>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      Bangladesh National Healthcare &bull; Digital Clinical Network
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                    Rx ID: {rxData.prescriptionNumber || rxData.caseNumber || 'BMD-RX-PREVIEW'}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-700 font-semibold mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>BMDC Verified System</span>
                  </div>
                </div>
              </div>

              {/* Doctor Credentials & Chamber Info */}
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-200">
                {/* Doctor Bio */}
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    {doctorName}
                  </h2>
                  <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                    {doctorDegrees}
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium">
                    {doctorSpecialties}
                  </p>
                  <div className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-mono font-bold text-emerald-900">
                    BMDC Reg: {bmdcReg}
                  </div>
                </div>

                {/* Chamber / Consultation Centre */}
                <div className="text-right space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 text-xs">
                    {chamber?.name || 'Specialist Consultation Chamber'}
                  </h3>
                  <p className="text-[10px] text-slate-600">
                    {chamber?.address || 'Healthcare Centre, Dhaka, Bangladesh'}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {chamber?.district || 'Dhaka'}, Bangladesh
                  </p>
                  {chamber?.contactPhone && (
                    <p className="text-[10px] text-emerald-700 font-bold">
                      Chamber: {chamber.contactPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Demographics Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] grid grid-cols-5 gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Patient Name</span>
                  <span className="font-bold text-slate-900 truncate block">{patient.name || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Mobile No.</span>
                  <span className="font-mono font-bold text-slate-800">{patient.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Age / Gender</span>
                  <span className="font-medium text-slate-800">
                    {patient.age || 'Adult'} / {patient.gender || 'Not Specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Date</span>
                  <span className="font-bold text-slate-800">{currentDate}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Patient ID</span>
                  <span className="font-mono text-slate-600">
                    {patient.phone ? `PID-${patient.phone.replace(/\D/g, '').slice(-6)}` : 'PID-WALKIN'}
                  </span>
                </div>
              </div>

              {/* Vitals Ribbon */}
              {rxData.vitals && Object.keys(rxData.vitals).length > 0 && (
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between text-[10px] gap-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-emerald-600" />
                    <span>Recorded Vitals:</span>
                  </span>
                  {rxData.vitals.bp && (
                    <div>
                      <span className="text-slate-500">BP: </span>
                      <strong className="text-slate-900 font-mono">{rxData.vitals.bp} mmHg</strong>
                    </div>
                  )}
                  {rxData.vitals.pulse && (
                    <div>
                      <span className="text-slate-500">Pulse: </span>
                      <strong className="text-slate-900 font-mono">{rxData.vitals.pulse} bpm</strong>
                    </div>
                  )}
                  {rxData.vitals.temp && (
                    <div>
                      <span className="text-slate-500">Temp: </span>
                      <strong className="text-slate-900 font-mono">{rxData.vitals.temp}</strong>
                    </div>
                  )}
                  {rxData.vitals.weight && (
                    <div>
                      <span className="text-slate-500">Wt: </span>
                      <strong className="text-slate-900 font-mono">{rxData.vitals.weight}</strong>
                    </div>
                  )}
                  {rxData.vitals.rbs && (
                    <div>
                      <span className="text-slate-500">RBS: </span>
                      <strong className="text-slate-900 font-mono">{rxData.vitals.rbs} mmol/L</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Two-Column Medical Body (Left: Clinical Notes | Right: Rx Medications) */}
              <div className="grid grid-cols-12 gap-4 pt-1 print:gap-3">
                {/* Left Column (30%): C/C, O/E, Diagnosis, Lab Investigations */}
                <div className="col-span-4 border-r border-slate-200 pr-3 space-y-3 text-[10.5px]">
                  {/* Chief Complaints */}
                  {rxData.chiefComplaints && (
                    <div>
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-0.5 mb-1">
                        Chief Complaints (C/C)
                      </div>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                        {rxData.chiefComplaints}
                      </p>
                    </div>
                  )}

                  {/* Clinical Findings / O/E */}
                  {rxData.clinicalFindings && (
                    <div>
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-0.5 mb-1">
                        On Examination (O/E)
                      </div>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                        {rxData.clinicalFindings}
                      </p>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {rxData.diagnosis && (
                    <div>
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-0.5 mb-1">
                        Clinical Diagnosis (Dx)
                      </div>
                      <p className="font-bold text-slate-900 leading-snug">
                        {rxData.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Advised Lab Tests & Investigations */}
                  {rxData.investigations && rxData.investigations.length > 0 && (
                    <div>
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-0.5 mb-1">
                        Investigations Advised
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-slate-800">
                        {rxData.investigations.map((inv, idx) => (
                          <li key={idx} className="leading-snug">
                            <span className="font-medium text-slate-900">{inv.testName}</span>
                            {inv.instructions && (
                              <span className="text-[9.5px] text-slate-500 block pl-3">
                                ({inv.instructions})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Visit Date */}
                  {rxData.nextVisitDate && (
                    <div className="pt-1">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-900">
                        Follow-up / Next Visit:
                      </div>
                      <p className="text-emerald-800 font-bold mt-0.5">
                        {rxData.nextVisitDate}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column (70%): Rx Medications List */}
                <div className="col-span-8 pl-1 space-y-3">
                  {/* Classic Medical Rx Symbol */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                    <span className="text-2xl font-serif font-black text-emerald-700 italic">
                      ℞
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Prescribed Medications
                    </span>
                  </div>

                  {/* Medicine List Table */}
                  <div className="space-y-2.5">
                    {rxData.items && rxData.items.length > 0 ? (
                      rxData.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="print-avoid-break pb-2 border-b border-slate-100 last:border-none"
                        >
                          <div className="flex items-baseline justify-between">
                            <div className="font-bold text-slate-900 text-[11.5px] flex items-center gap-1.5">
                              <span className="text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                              <span className="text-emerald-800 uppercase text-[10px] font-extrabold px-1 py-0.2 bg-emerald-50 rounded">
                                {item.dosageForm || 'Tab.'}
                              </span>
                              <span>{item.brandName}</span>
                              {item.strength && (
                                <span className="text-slate-600 font-medium text-[10.5px]">
                                  {item.strength}
                                </span>
                              )}
                            </div>
                            {item.durationDays && (
                              <span className="text-[10.5px] font-bold text-slate-800 shrink-0">
                                {item.durationDays} days
                              </span>
                            )}
                          </div>

                          {item.genericName && (
                            <div className="text-[9.5px] text-slate-500 italic pl-5">
                              ({item.genericName})
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10.5px] pl-5 mt-1 text-slate-700 font-medium">
                            <div className="font-mono font-bold text-emerald-950">
                              {item.dosageInstruction}
                            </div>
                            {item.timing && (
                              <div className="text-slate-600 text-[10px]">
                                {item.timing}
                              </div>
                            )}
                          </div>

                          {item.specialInstructions && (
                            <div className="text-[9.5px] text-amber-900 bg-amber-50/60 px-2 py-0.5 rounded mt-1 ml-5 border border-amber-200/50">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic text-[11px] py-4 text-center">
                        No medications listed for this consultation.
                      </div>
                    )}
                  </div>

                  {/* General Advice / Dietary Instructions */}
                  {(rxData.advice || rxData.dietaryAdvice) && (
                    <div className="mt-3 pt-2 border-t border-slate-200 space-y-1 text-[10.5px] bg-slate-50/60 p-2 rounded-lg">
                      <div className="font-bold text-[10px] uppercase text-emerald-900">
                        General Advice &amp; Lifestyle:
                      </div>
                      {rxData.advice && (
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {rxData.advice}
                        </p>
                      )}
                      {rxData.dietaryAdvice && (
                        <p className="text-emerald-900 font-medium leading-relaxed">
                          Diet: {rxData.dietaryAdvice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer: Doctor Signature Box, Digital Seal, and Platform Copyright */}
            <div className="pt-4 border-t border-slate-200 print-avoid-break mt-4">
              <div className="flex items-end justify-between">
                {/* Emergency note */}
                <div className="text-[9px] text-slate-500 max-w-xs space-y-0.5">
                  <p className="font-bold text-rose-700">In case of acute emergency:</p>
                  <p>Please report to the nearest hospital emergency department immediately.</p>
                  <p className="text-[8px] text-slate-400">Prescription verified on BookMyDoctorBD Digital Registry.</p>
                </div>

                {/* Doctor Signature Box */}
                <div className="text-right">
                  <div className="inline-block border-t border-slate-700 w-48 pt-1 text-center">
                    <p className="font-bold text-slate-900 text-[11px]">{doctorName}</p>
                    <p className="text-[9px] text-slate-500">Authorized Physician Signature &amp; Seal</p>
                    <p className="text-[8px] font-mono text-emerald-700 font-semibold">{bmdcReg}</p>
                  </div>
                </div>
              </div>

              {/* Watermark bar */}
              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                <span>BookMyDoctorBD &bull; Bangladesh Official Healthcare Network</span>
                <span>Single-Page A4 Medical Document &bull; Generated {currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
