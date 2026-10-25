'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Building,
  CreditCard,
  User,
  Send,
  Eye,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function DoctorPortalPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'appointments' | 'cases' | 'chambers' | 'leaves'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalCases, setMedicalCases] = useState<any[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Appointment Consultation / Prescription Studio State
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '76', weight: '65 kg', temp: '98.6 F' });
  const [advice, setAdvice] = useState('');
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([
    { brandName: '', genericName: '', dosageForm: 'Tablet', strength: '', dosageInstruction: '1+0+1', timing: 'After meal', durationDays: 7, specialInstructions: '' },
  ]);

  // Investigation orders
  const [investigations, setInvestigations] = useState<any[]>([
    { testName: '', instructions: '', urgency: 'NORMAL' },
  ]);

  // AI Autocomplete & Medicine Preference State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [activeItemIndexForAi, setActiveItemIndexForAi] = useState<number | null>(null);

  // AI Hospital Report & Prescription Software Note Taker State
  const [rawHospitalText, setRawHospitalText] = useState('');
  const [parsedReportData, setParsedReportData] = useState<any | null>(null);
  const [aiParsingLoading, setAiParsingLoading] = useState(false);

  // Digital Follow-up review response state
  const [selectedCaseForReview, setSelectedCaseForReview] = useState<any | null>(null);
  const [followUpAdviceText, setFollowUpAdviceText] = useState('');

  // Load Doctor Data
  const fetchDoctorPortalData = async () => {
    setLoading(true);
    try {
      const [apptsRes, casesRes, subRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/medical-cases'),
        api.get('/subscriptions/my-status'),
      ]);

      if (apptsRes.data.success) setAppointments(apptsRes.data.appointments || []);
      if (casesRes.data.success) setMedicalCases(casesRes.data.cases || []);
      if (subRes.data.success) setSubscriptionInfo(subRes.data);
    } catch (err: any) {
      console.error('Failed to load doctor portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorPortalData();
  }, []);

  // Update Appointment Status (Requested -> Confirmed -> Checked-in -> Consultation Started -> Completed)
  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status });
      if (res.data.success) {
        // If completed, open prescription studio immediately!
        if (status === 'COMPLETED') {
          const appt = appointments.find((a) => a.id === appointmentId);
          if (appt) {
            setActiveConsultationAppt({
              ...appt,
              medicalCase: res.data.medicalCase,
            });
          }
        }
        fetchDoctorPortalData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Medicine autocomplete search
  const handleMedicineSearch = async (query: string, index: number) => {
    setActiveItemIndexForAi(index);
    setAiSearchQuery(query);
    if (!query || query.length < 2) {
      setAiSuggestions([]);
      return;
    }
    try {
      const res = await api.post('/ai/medicine-autocomplete', {
        query,
        doctorId: user?.doctorProfile?.id,
      });
      if (res.data.success) {
        setAiSuggestions(res.data.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply chosen AI medicine suggestion
  const applyMedicineSuggestion = (suggestion: any, index: number) => {
    const updated = [...prescriptionItems];
    updated[index] = {
      ...updated[index],
      brandName: suggestion.brandName,
      genericName: suggestion.genericName,
      dosageForm: suggestion.dosageForm || 'Tablet',
      strength: suggestion.strength || '',
      dosageInstruction: suggestion.defaultDose || '1+0+1',
      timing: suggestion.defaultTiming || 'After meal',
      durationDays: suggestion.defaultDuration || 7,
    };
    setPrescriptionItems(updated);
    setAiSuggestions([]);
    setActiveItemIndexForAi(null);
  };

  // Parse Raw Hospital Report via AI Note Taker
  const handleParseHospitalReport = async () => {
    if (!rawHospitalText) return;
    setAiParsingLoading(true);
    try {
      const res = await api.post('/ai/parse-report-prescription', {
        rawReportText: rawHospitalText,
      });
      if (res.data.success) {
        setParsedReportData(res.data.data);
        if (res.data.data.suggestedClinicalNote) {
          setClinicalNotes((prev) =>
            prev ? `${prev}\n\n${res.data.data.suggestedClinicalNote}` : res.data.data.suggestedClinicalNote
          );
        }
        if (res.data.data.extractedVitals?.bp) {
          setVitals((v) => ({ ...v, bp: res.data.data.extractedVitals.bp }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiParsingLoading(false);
    }
  };

  // Issue Final Prescription for Medical Case
  const handleSavePrescription = async () => {
    if (!activeConsultationAppt?.medicalCase?.id) {
      alert('Medical Case not found.');
      return;
    }

    try {
      const caseId = activeConsultationAppt.medicalCase.id;

      // 1. Issue Prescription
      const validItems = prescriptionItems.filter((it) => it.brandName.trim() !== '');
      if (validItems.length > 0) {
        await api.post(`/medical-cases/${caseId}/prescriptions`, {
          vitals,
          advice,
          dietaryAdvice,
          nextVisitDate: nextVisitDate || null,
          items: validItems,
          diagnosis,
          clinicalNotes,
        });
      }

      // 2. Order Investigations
      const validTests = investigations.filter((t) => t.testName.trim() !== '');
      if (validTests.length > 0) {
        await api.post(`/medical-cases/${caseId}/investigations`, {
          tests: validTests,
        });
      }

      alert('Prescription and Clinical Notes successfully issued to Medical Case!');
      setActiveConsultationAppt(null);
      fetchDoctorPortalData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save prescription.');
    }
  };

  // Submit Digital Follow-up Advice
  const handleProvideDigitalAdvice = async (followUpId: string) => {
    if (!followUpAdviceText) return;
    try {
      const res = await api.post('/medical-cases/digital-followup/advice', {
        followUpId,
        doctorAdvice: followUpAdviceText,
      });
      if (res.data.success) {
        alert('Digital advice recorded and sent to patient.');
        setSelectedCaseForReview(null);
        setFollowUpAdviceText('');
        fetchDoctorPortalData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send advice.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portal Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              Doctor Clinical Workspace
            </span>
            {subscriptionInfo?.subscription && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                {subscriptionInfo.subscription.plan?.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {user?.name || 'Doctor Clinical Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage chamber queue, issue e-prescriptions with AI autocomplete, and review patient follow-up reports.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chamber Queue ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'cases' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medical Cases ({medicalCases.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Appointments / Chamber Queue */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Patient Appointments & Live Chamber Queue</h2>
            <button
              onClick={fetchDoctorPortalData}
              className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No appointments scheduled for your chambers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-base flex flex-col items-center justify-center shrink-0 border border-brand-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Serial</span>
                      <span>#{appt.serialNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{appt.patientName}</h4>
                        <span className="font-mono text-xs text-slate-500">{appt.patientPhone}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            appt.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'CONSULTATION_STARTED'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : appt.status === 'CHECKED_IN'
                              ? 'bg-amber-100 text-amber-800'
                              : appt.status === 'CONFIRMED'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {appt.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        <strong>Chamber:</strong> {appt.chamber?.name} &bull; Date:{' '}
                        {new Date(appt.appointmentDate).toDateString()} ({appt.timeSlot})
                      </p>

                      {appt.problemDescription && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 px-2 py-1 rounded-lg">
                          &ldquo;{appt.problemDescription}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Consultation Status Progression Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {appt.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                      >
                        Confirm Booking
                      </button>
                    )}

                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CHECKED_IN')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                      >
                        Patient Checked-in
                      </button>
                    )}

                    {appt.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONSULTATION_STARTED')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        Start Consultation
                      </button>
                    )}

                    {appt.status === 'CONSULTATION_STARTED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete & Open Prescription Studio</span>
                      </button>
                    )}

                    {appt.status === 'COMPLETED' && (
                      <button
                        onClick={() => setActiveConsultationAppt(appt)}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open Prescription Studio</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Medical Cases & Digital Follow-up Reviews */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Completed Consultation Medical Cases</h2>

          {medicalCases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No medical cases created yet.</p>
              <p className="text-xs text-slate-400">
                Medical cases are generated automatically when a chamber consultation reaches &apos;COMPLETED&apos; status.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {medicalCases.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {c.caseNumber}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <strong>{c.patientUser?.name || c.appointment?.patientName}</strong> &bull;{' '}
                        Chamber: {c.appointment?.chamber?.name}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full font-bold text-xs self-start">
                      Status: {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 font-semibold">Diagnosis:</p>
                      <p className="font-medium text-slate-800">{c.diagnosis || 'Under Evaluation'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">Clinical Notes:</p>
                      <p className="font-medium text-slate-800">{c.clinicalNotes || 'None'}</p>
                    </div>
                  </div>

                  {/* Digital Follow-up Section */}
                  {c.digitalFollowUps && c.digitalFollowUps.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Digital Follow-up Query:</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-amber-800">
                          Payment: {c.digitalFollowUps[0].paymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-800 italic">&ldquo;{c.digitalFollowUps[0].patientQuery}&rdquo;</p>

                      {c.digitalFollowUps[0].doctorAdvice ? (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                          <p className="font-bold text-brand-700">Your Clinical Advice:</p>
                          <p className="text-slate-700">{c.digitalFollowUps[0].doctorAdvice}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCaseForReview(c)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
                        >
                          Review Reports & Reply with Advice
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reports Count & Prescriptions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      {c.prescriptions?.length || 0} Prescription(s) &bull; {c.patientReports?.length || 0} Report(s) uploaded
                    </span>
                    <button
                      onClick={() => setActiveConsultationAppt({ ...c.appointment, medicalCase: c })}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Update Prescription / Order Labs &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULL-SCREEN MODAL: Prescription & Clinical Notes Studio (with AI Autocomplete & Note Taker) */}
      {activeConsultationAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveConsultationAppt(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Header */}
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                <Stethoscope className="w-4 h-4" />
                <span>Clinical Consultation & E-Prescription Studio</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Patient: {activeConsultationAppt.patientName} ({activeConsultationAppt.patientPhone})
              </h2>
              <p className="text-xs text-slate-500">
                Chamber: {activeConsultationAppt.chamber?.name} &bull; Case No:{' '}
                {activeConsultationAppt.medicalCase?.caseNumber || 'Generating...'}
              </p>
            </div>

            {/* AI Hospital Report Parser Card (Feature Highlight) */}
            <div className="mb-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>AI Hospital Report Note Taker (Popular / Square / Ibn Sina)</span>
                </span>
                <span className="text-[10px] text-slate-400">OCR & Lab Parameter Parser</span>
              </div>
              <p className="text-xs text-slate-300">
                Paste any diagnostic lab report text or notes from hospital software. AI will automatically extract vitals, flag abnormal values, and draft clinical notes.
              </p>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="e.g. Popular Diagnostic: BP 140/90, FBS 7.2 mmol/L, Total Cholesterol 240 mg/dL, LDL 155 mg/dL..."
                  value={rawHospitalText}
                  onChange={(e) => setRawHospitalText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={handleParseHospitalReport}
                  disabled={aiParsingLoading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiParsingLoading ? 'Parsing...' : 'Analyze & Take Notes'}</span>
                </button>
              </div>

              {parsedReportData && (
                <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-xs space-y-1">
                  <p className="font-bold text-brand-300">
                    Detected Hospital: {parsedReportData.detectedHospital}
                  </p>
                  {parsedReportData.abnormalFindings?.length > 0 && (
                    <div className="text-rose-300 font-semibold space-y-0.5">
                      <span>Abnormal Findings:</span>
                      {parsedReportData.abnormalFindings.map((f: string, idx: number) => (
                        <p key={idx} className="text-[11px]">&bull; {f}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vitals Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <label className="font-semibold text-slate-600">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="w-full px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Pulse (bpm)</label>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Weight</label>
                <input
                  type="text"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Temperature</label>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="w-full px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Diagnosis & Clinical Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Diagnosis / Clinical Impression</label>
                <input
                  type="text"
                  placeholder="e.g. Essential Hypertension Grade 1 & Hyperlipidemia"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Doctor Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Clinical notes, examination findings, symptom progression..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Prescriptions Items with AI Autocomplete */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>Prescribed Medications (with AI Autocomplete & BD Formulary)</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setPrescriptionItems([
                      ...prescriptionItems,
                      { brandName: '', genericName: '', dosageForm: 'Tablet', strength: '', dosageInstruction: '1+0+1', timing: 'After meal', durationDays: 7 },
                    ])
                  }
                  className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              <div className="space-y-2">
                {prescriptionItems.map((item, idx) => (
                  <div key={idx} className="relative bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-2 relative">
                        <label className="font-semibold text-slate-700">Brand Name</label>
                        <input
                          type="text"
                          placeholder="Type brand e.g. Napa, Angilock, Seclo"
                          value={item.brandName}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].brandName = e.target.value;
                            setPrescriptionItems(updated);
                            handleMedicineSearch(e.target.value, idx);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                        />

                        {/* AI Autocomplete Dropdown */}
                        {activeItemIndexForAi === idx && aiSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 z-30 w-72 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100">
                            {aiSuggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => applyMedicineSuggestion(sug, idx)}
                                className="w-full text-left p-2.5 hover:bg-brand-50 transition text-xs space-y-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{sug.brandName}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    {sug.dosageForm} {sug.strength}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">{sug.genericName}</p>
                                <p className="text-[10px] text-brand-600">
                                  Dosage: {sug.defaultDose} &bull; {sug.defaultTiming}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Dosage</label>
                        <input
                          type="text"
                          placeholder="1+0+1"
                          value={item.dosageInstruction}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].dosageInstruction = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Timing</label>
                        <input
                          type="text"
                          placeholder="After meal"
                          value={item.timing}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].timing = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Days</label>
                        <input
                          type="number"
                          placeholder="7"
                          value={item.durationDays}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].durationDays = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Investigations Ordering */}
            <div className="space-y-3 mb-6 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Order Diagnostic Tests</h3>
                <button
                  type="button"
                  onClick={() =>
                    setInvestigations([...investigations, { testName: '', instructions: '', urgency: 'NORMAL' }])
                  }
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Test
                </button>
              </div>

              <div className="space-y-2">
                {investigations.map((test, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Lipid Profile (Fasting 12 hours) or Chest X-Ray"
                      value={test.testName}
                      onChange={(e) => {
                        const updated = [...investigations];
                        updated[idx].testName = e.target.value;
                        setInvestigations(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g. Fasting required)"
                      value={test.instructions}
                      onChange={(e) => {
                        const updated = [...investigations];
                        updated[idx].instructions = e.target.value;
                        setInvestigations(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* General Advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Clinical Advice</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 30 minutes brisk walking daily. Monitor home BP chart."
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Dietary Restrictions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Avoid deep fried food, high sodium, and extra table salt."
                  value={dietaryAdvice}
                  onChange={(e) => setDietaryAdvice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveConsultationAppt(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrescription}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue Prescription & Update Case</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Follow-up Review Modal */}
      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Digital Follow-up: {selectedCaseForReview.patientUser?.name || 'Patient'}
              </h3>
              <p className="text-slate-500">Case No: {selectedCaseForReview.caseNumber}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-800">Patient Uploaded Question:</p>
              <p className="text-slate-700 italic">
                &ldquo;{selectedCaseForReview.digitalFollowUps?.[0]?.patientQuery}&rdquo;
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Doctor Advice / Medication Adjustment:</label>
              <textarea
                rows={4}
                placeholder="Write your clinical advice here. Patient has paid the digital follow-up fee..."
                value={followUpAdviceText}
                onChange={(e) => setFollowUpAdviceText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedCaseForReview(null)}
                className="px-4 py-2 border rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProvideDigitalAdvice(selectedCaseForReview.digitalFollowUps[0].id)}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl"
              >
                Send Advice to Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

