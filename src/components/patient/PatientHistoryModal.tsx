'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Search,
  X,
  User,
  Phone,
  AlertTriangle,
  Heart,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
  Clock,
  Activity,
  Image as ImageIcon,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { PatientHistoryResponse } from '@/types/medicalCase';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onImportToPrescription?: (medicines: any[], vitals?: any, diagnosis?: string) => void;
}

export default function PatientHistoryModal({
  isOpen,
  onClose,
  initialPhone = '',
  onImportToPrescription,
}: PatientHistoryModalProps) {
  const toast = useToast();
  const [searchPhone, setSearchPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientHistoryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'reports' | 'vitals' | 'visits'>('prescriptions');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleSearch = async (phoneToSearch?: string) => {
    const target = (phoneToSearch || searchPhone).trim();
    if (!target) return;

    setLoading(true);
    try {
      const res = await api.get(`/medical-cases/patient-history/${encodeURIComponent(target)}`);
      if (res.data.success) {
        setPatientData(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retrieve patient history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialPhone) {
      setSearchPhone(initialPhone);
      handleSearch(initialPhone);
    }
  }, [isOpen, initialPhone]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header with Search Input */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">
                  Patient Medical History &amp; Diagnostic Tracer
                </h2>
                <p className="text-xs text-slate-300">
                  Search any patient by mobile number to trace past diagnoses, prescriptions, lab reports, and vitals.
                </p>
              </div>
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-2xl"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter Bangladeshi mobile number e.g. 01811112222 or +88017..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-teal-500/20"
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Trace Patient Record</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Phone Chips */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span>Quick Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchPhone('+8801811112222');
                  handleSearch('+8801811112222');
                }}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-teal-300 font-mono text-[11px] transition"
              >
                Rahim Uddin (01811112222)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {loading && (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Tracing patient history across all chambers and cases...</p>
            </div>
          )}

          {!loading && !patientData && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Phone className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Enter a mobile number above to begin diagnosis trace.</p>
              <p className="text-xs text-slate-400">
                You will see complete visit history, previously prescribed medications, and uploaded lab reports.
              </p>
            </div>
          )}

          {!loading && patientData && (
            <div className="space-y-6">
              
              {/* Patient Profile 360 Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                      {patientData.aiBrief?.displayName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {patientData.aiBrief?.displayName}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{patientData.aiBrief?.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      Total Visits: <strong>{patientData.appointmentsCount}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      Blood Group: <strong>{patientData.aiBrief?.bloodGroup}</strong>
                    </span>
                  </div>
                </div>

                {/* Medical Alerts (Allergies & Chronic Diseases) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Allergies Alert */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-900 block font-bold">Drug &amp; Food Allergies:</strong>
                      {patientData.aiBrief?.knownAllergies?.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patientData.aiBrief.knownAllergies.map((alg: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-rose-200/70 text-rose-900 font-bold text-[11px]"
                            >
                              {alg}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-rose-700 italic">No drug allergies reported.</span>
                      )}
                    </div>
                  </div>

                  {/* Chronic Conditions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <Heart className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-900 block font-bold">Chronic Conditions:</strong>
                      {patientData.aiBrief?.chronicConditions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patientData.aiBrief.chronicConditions.map((cond: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 font-bold text-[11px]"
                            >
                              {cond}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-700 italic">None recorded.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Instant Clinical Briefing Banner */}
                {patientData.aiBrief?.clinicalAlerts?.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>AI Diagnosis &amp; Risk Briefing for Attending Doctor:</span>
                    </div>
                    {patientData.aiBrief.clinicalAlerts.map((alert: string, idx: number) => (
                      <p key={idx} className="text-slate-700 text-[11px]">
                        &bull; {alert}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Tabs for History Breakdown */}
              <div className="flex border-b border-slate-200 text-xs font-bold gap-4">
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'prescriptions'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Past Prescriptions &amp; Medications ({patientData.pastMedicines?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Diagnostic Lab Reports ({patientData.reports?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('vitals')}
                  className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'vitals'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Vitals Trend ({patientData.vitalsHistory?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('visits')}
                  className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'visits'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Appointments History ({patientData.appointments?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: Past Prescriptions & Medications */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {onImportToPrescription && patientData.pastMedicines?.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <strong className="text-teal-900 font-bold block">
                          Instant Prescribing Assistant:
                        </strong>
                        <span className="text-teal-700 text-[11px]">
                          Quickly copy previously effective medicines into today&apos;s active consultation.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onImportToPrescription(
                            patientData.pastMedicines.slice(0, 4),
                            patientData.vitalsHistory?.[0]?.vitals,
                            patientData.aiBrief?.pastDiagnoses?.[0]
                          )
                        }
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Past Medicines to Studio</span>
                      </button>
                    </div>
                  )}

                  {/* Medicines Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">All Medicines Prescribed in Past Visits</h4>
                      <span className="text-[11px] text-slate-400">Sorted by Frequency</span>
                    </div>

                    {patientData.pastMedicines?.length === 0 ? (
                      <p className="p-6 text-center text-slate-400 text-xs">No previous medications on record.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {patientData.pastMedicines.map((med, idx) => (
                          <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {med.dosageForm} {med.brandName} {med.strength}
                                </span>
                                {med.timesPrescribed > 1 && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Prescribed {med.timesPrescribed}x
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px]">
                                Generic: <strong>{med.genericName}</strong> &bull; Dose: <span className="font-mono font-bold text-slate-700">{med.dosageInstruction}</span> ({med.timing})
                              </p>
                              {med.diagnosis && (
                                <p className="text-teal-700 text-[10px]">
                                  Prescribed for: <em>{med.diagnosis}</em>
                                </p>
                              )}
                            </div>

                            <div className="text-right sm:text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block">
                                Last Prescribed: {new Date(med.lastPrescribedDate).toLocaleDateString()}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600">
                                By {med.doctorName || 'Doctor'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Diagnostic Lab Reports */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {patientData.reports?.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p>No diagnostic test reports uploaded for this patient yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {patientData.reports.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm hover:border-teal-300 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{rep.testName}</h4>
                              <p className="text-xs text-slate-500">
                                {rep.hospitalClinicName || 'Diagnostic Lab'} &bull;{' '}
                                {new Date(rep.reportDate || rep.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                              {rep.fileType?.includes('pdf') ? 'PDF Document' : 'Image Scan'}
                            </span>
                          </div>

                          {/* Report Preview */}
                          {rep.fileUrl && !rep.fileUrl.endsWith('.pdf') ? (
                            <div
                              onClick={() => setPreviewImageUrl(rep.fileUrl)}
                              className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden cursor-pointer relative group border border-slate-200"
                            >
                              <img
                                src={rep.fileUrl}
                                alt={rep.testName}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <ExternalLink className="w-4 h-4" />
                                <span>Click to Enlarge</span>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={rep.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-teal-700 font-bold hover:bg-slate-100 transition"
                            >
                              <span>View Full Medical Report PDF</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* AI Findings Summary if present */}
                          {rep.aiSummary && (
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                              <span className="font-bold text-teal-800 block">AI Extracted Findings:</span>
                              <p className="italic">{rep.aiSummary}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Vitals Trend */}
              {activeTab === 'vitals' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs">Longitudinal Vitals Trend Over Time</h4>
                    <p className="text-[11px] text-slate-400">Tracks blood pressure, pulse, weight, and blood sugar across visits.</p>
                  </div>

                  {patientData.vitalsHistory?.length === 0 ? (
                    <p className="p-6 text-center text-slate-400 text-xs">No vitals recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {patientData.vitalsHistory.map((vh, idx) => (
                        <div key={idx} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {new Date(vh.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Recorded by {vh.doctorName || 'Doctor'} (Case {vh.caseNumber})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                            {vh.vitals?.bp && (
                              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-bold">
                                BP: {vh.vitals.bp} mmHg
                              </span>
                            )}
                            {vh.vitals?.pulse && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                                Pulse: {vh.vitals.pulse} bpm
                              </span>
                            )}
                            {vh.vitals?.temp && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                                Temp: {vh.vitals.temp}
                              </span>
                            )}
                            {vh.vitals?.weight && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                                Weight: {vh.vitals.weight}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Visit / Appointment History */}
              {activeTab === 'visits' && (
                <div className="space-y-3">
                  {patientData.appointments?.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Serial #{appt.serialNumber}
                          </span>
                          <span className="font-bold text-slate-900">{appt.chamber?.name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          Date: <strong>{new Date(appt.appointmentDate).toDateString()}</strong> ({appt.timeSlot}) &bull; Doctor: {appt.doctor?.user?.name}
                        </p>
                        {appt.problemDescription && (
                          <p className="text-slate-600 italic">&ldquo;{appt.problemDescription}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>BookMyDoctorBD Clinical History Trace</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition"
          >
            Close Window
          </button>
        </div>

      </div>

      {/* Full-screen Image Preview Lightbox */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={previewImageUrl}
            alt="Report Scan"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
