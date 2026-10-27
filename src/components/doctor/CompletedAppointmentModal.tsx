'use client';

import React, { useEffect } from 'react';
import {
  X,
  FileText,
  Printer,
  Upload,
  History,
  Calendar,
  Clock,
  Building,
  User,
  HeartPulse,
  Activity,
  CheckCircle2,
  Sparkles,
  Plus,
  ExternalLink,
  FileImage,
} from 'lucide-react';

interface CompletedAppointmentModalProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrescriptionStudio: (appt: any) => void;
  onOpenReportUpload: (appt: any) => void;
  onOpenPatientHistory: (phone: string) => void;
  onViewPrescription: (prescription: any, appointment: any) => void;
}

export default function CompletedAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onOpenPrescriptionStudio,
  onOpenReportUpload,
  onOpenPatientHistory,
  onViewPrescription,
}: CompletedAppointmentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const medCase = appointment.medicalCase;
  const prescriptions = medCase?.prescriptions || [];
  const reports = medCase?.patientReports || appointment.reports || [];
  const investigations = medCase?.investigationOrders || [];
  const vitals = medCase?.vitals || prescriptions[0]?.vitals || {};

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto space-y-6"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Completed Consultation Record</span>
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                Serial #{appointment.serialNumber}
              </span>
              {medCase?.caseNumber && (
                <span className="font-mono text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  Case: {medCase.caseNumber}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {appointment.patientName}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-mono font-bold text-slate-800">{appointment.patientPhone}</span>
              <span>&bull;</span>
              <span>{appointment.chamber?.name}</span>
              <span>&bull;</span>
              <span>{new Date(appointment.appointmentDate).toDateString()} ({appointment.timeSlot})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Trace History Shortcut */}
            <button
              type="button"
              onClick={() => onOpenPatientHistory(appointment.patientPhone)}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-teal-200"
              title="Trace full past medical history by mobile number"
            >
              <History className="w-3.5 h-3.5" />
              <span>Trace History</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition text-xl font-bold"
              title="Close (Esc or click outside)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Symptoms / Chief Complaint Recorded at Consultation */}
        {appointment.problemDescription && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Patient Chief Complaint (C/C)
            </span>
            <p className="text-slate-800 font-medium italic">
              &ldquo;{appointment.problemDescription}&rdquo;
            </p>
          </div>
        )}

        {/* Clinical Examination, Diagnosis & Recorded Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Diagnosis & Findings */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Clinical Diagnosis (Dx)
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {medCase?.diagnosis || 'Clinical evaluation complete'}
              </p>
            </div>

            {medCase?.clinicalNotes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  On Examination (O/E) &amp; Clinical Notes
                </span>
                <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                  {medCase.clinicalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Vitals Recorded at Visit */}
          <div className="bg-teal-50/50 rounded-2xl border border-teal-100 p-4 space-y-2.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
              <span>Recorded Vitals</span>
            </span>

            <div className="space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Blood Pressure:</span>
                <span className="font-mono font-bold text-slate-900">{vitals.bp || '120/80 mmHg'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pulse:</span>
                <span className="font-mono font-bold text-slate-900">{vitals.pulse || '76'} bpm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Temperature:</span>
                <span className="font-mono font-bold text-slate-900">{vitals.temp || '98.6'} °F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weight:</span>
                <span className="font-mono font-bold text-slate-900">{vitals.weight || '65 kg'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sugar (RBS):</span>
                <span className="font-mono font-bold text-teal-700">{vitals.rbs || '6.2'} mmol/L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions Issued for this Consultation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Prescriptions Issued ({prescriptions.length})
              </h3>
            </div>

            {/* Button to issue a new / follow-up prescription to this case */}
            <button
              type="button"
              onClick={() => onOpenPrescriptionStudio(appointment)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Write New / Follow-Up Rx</span>
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
              <p>No prescription issued yet for this appointment.</p>
              <button
                type="button"
                onClick={() => onOpenPrescriptionStudio(appointment)}
                className="mt-2 text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Write prescription now in Prescription Studio</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx: any, rxIdx: number) => (
                <div
                  key={rx.id || rxIdx}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-0.5 rounded text-slate-800">
                        {rx.prescriptionNumber || `Rx #${rxIdx + 1}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(rx.createdAt || appointment.appointmentDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                        {rx.items?.length || 0} Medication(s)
                      </span>
                    </div>

                    {/* View / Print Official Single-Page A4 Prescription */}
                    <button
                      type="button"
                      onClick={() => onViewPrescription(rx, appointment)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View &amp; Print Official A4 Rx</span>
                    </button>
                  </div>

                  {/* Medicines Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {rx.items?.map((item: any, iIdx: number) => (
                      <div
                        key={item.id || iIdx}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 space-y-1"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900">
                            {item.brandName} {item.strength}
                          </span>
                          <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                            {item.dosageInstruction}
                          </span>
                        </div>
                        {item.genericName && (
                          <p className="text-[11px] text-slate-500 italic">{item.genericName}</p>
                        )}
                        <p className="text-[10px] text-teal-800 font-semibold">
                          {item.timing} &bull; For {item.durationDays} days
                        </p>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Advice & Dietary Instructions */}
                  {(rx.advice || rx.dietaryAdvice) && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      {rx.advice && (
                        <p className="text-slate-700">
                          <strong>Advice:</strong> {rx.advice}
                        </p>
                      )}
                      {rx.dietaryAdvice && (
                        <p className="text-teal-900">
                          <strong>Dietary:</strong> {rx.dietaryAdvice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advised Lab Tests / Investigations */}
        {investigations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Advised Investigations &amp; Lab Tests
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {investigations.map((inv: any, idx: number) => (
                <div
                  key={inv.id || idx}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-800 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>{inv.testName}</span>
                  {inv.instructions && (
                    <span className="text-[10px] text-slate-500">({inv.instructions})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Printed / Physical Lab Reports Uploaded (Photos & PDFs) */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Attached Printed Lab Reports ({reports.length})
              </h3>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => onOpenReportUpload(appointment)}
              className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-teal-200"
            >
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>+ Upload Printed Report (Photo or PDF)</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
              <p>No diagnostic lab reports uploaded yet for this appointment.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Both doctor and patient can snap a photo or upload a PDF of the printed pathology report anytime.
              </p>
              <button
                type="button"
                onClick={() => onOpenReportUpload(appointment)}
                className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report Photo / PDF Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((r: any, rIdx: number) => {
                const isImage =
                  r.fileType?.startsWith('image/') ||
                  r.fileUrl?.startsWith('data:image/') ||
                  /\.(jpg|jpeg|png|webp)/i.test(r.fileUrl || '');

                return (
                  <div
                    key={r.id || rIdx}
                    className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      {isImage && r.fileUrl && (
                        <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.fileUrl}
                            alt={r.testName || 'Lab report'}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                      )}

                      {!isImage && (
                        <div className="w-full h-24 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <FileText className="w-8 h-8 text-slate-400 mb-1" />
                          <span>PDF Document</span>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{r.testName || 'Diagnostic Report'}</h4>
                        {r.hospitalClinicName && (
                          <p className="text-[10px] text-slate-500">{r.hospitalClinicName}</p>
                        )}
                        <p className="text-[9px] text-slate-400">
                          Uploaded: {new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>

                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition text-center"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Full Report</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Close Summary
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReportUpload(appointment)}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-teal-200"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>+ Upload Report</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPrescriptionStudio(appointment)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition"
            >
              <FileText className="w-4 h-4" />
              <span>+ Write New Prescription</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}