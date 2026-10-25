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
  User,
  Send,
  Eye,
  Check,
  RefreshCw,
  Search,
  Upload,
  Printer,
  History,
  Activity,
  Award,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

// New Sub-Components
import PrescriptionPrintView from '@/components/PrescriptionPrintView';
import PatientHistoryModal from '@/components/PatientHistoryModal';
import ReportUploadModal from '@/components/ReportUploadModal';
import DoctorProfileEditor from '@/components/DoctorProfileEditor';
import ChamberSlotManager from '@/components/ChamberSlotManager';

export default function DoctorPortalPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'appointments' | 'cases' | 'chambers' | 'profile' | 'reports'
  >('appointments');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalCases, setMedicalCases] = useState<any[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Triggers
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTargetPhone, setHistoryTargetPhone] = useState('');
  const [showReportUploadModal, setShowReportUploadModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Active Consultation & Prescription Studio State
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<any | null>(null);
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalProblems, setClinicalProblems] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '76', weight: '65 kg', temp: '98.6 F', rbs: '6.2' });
  const [advice, setAdvice] = useState('');
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([
    {
      brandName: '',
      genericName: '',
      dosageForm: 'Tablet',
      strength: '',
      dosageInstruction: '1+0+1',
      timing: 'After meal',
      durationDays: 7,
      specialInstructions: '',
    },
  ]);

  // Investigation orders
  const [investigations, setInvestigations] = useState<any[]>([
    { testName: '', instructions: '', urgency: 'NORMAL' },
  ]);

  // AI Autocomplete & Medicine Preference State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [activeItemIndexForAi, setActiveItemIndexForAi] = useState<number | null>(null);

  // AI 1-Click Quick Diagnose State
  const [quickDiagnoseLoading, setQuickDiagnoseLoading] = useState(false);
  const [aiDiagnoseResult, setAiDiagnoseResult] = useState<any | null>(null);

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

  // Update Appointment Status
  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status });
      if (res.data.success) {
        if (status === 'COMPLETED') {
          const appt = appointments.find((a) => a.id === appointmentId);
          if (appt) {
            handleOpenConsultationStudio({
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

  // Open Consultation Studio and initialize fields
  const handleOpenConsultationStudio = (appt: any) => {
    setActiveConsultationAppt(appt);
    setChiefComplaints(appt.problemDescription || '');
    setDiagnosis(appt.medicalCase?.diagnosis || '');
    setClinicalNotes(appt.medicalCase?.clinicalNotes || '');
    setPrescriptionItems([
      {
        brandName: '',
        genericName: '',
        dosageForm: 'Tablet',
        strength: '',
        dosageInstruction: '1+0+1',
        timing: 'After meal',
        durationDays: 7,
        specialInstructions: '',
      },
    ]);
    setInvestigations([{ testName: '', instructions: '', urgency: 'NORMAL' }]);
  };

  // 1-Click AI Quick Diagnose & Auto-Prescribe
  const handleQuickDiagnose = async () => {
    if (!chiefComplaints && !activeConsultationAppt?.problemDescription) {
      alert('Please enter patient chief complaints or symptoms first.');
      return;
    }

    setQuickDiagnoseLoading(true);
    try {
      const res = await api.post('/ai/quick-diagnose', {
        chiefComplaint: chiefComplaints || activeConsultationAppt?.problemDescription,
        vitals,
        patientPhone: activeConsultationAppt?.patientPhone,
        doctorId: user?.doctorProfile?.id,
      });

      if (res.data.success && res.data.recommendation) {
        const rec = res.data.recommendation;
        setAiDiagnoseResult(rec);
        if (rec.diagnosis) setDiagnosis(rec.diagnosis);
        if (rec.clinicalProblems) setClinicalProblems(rec.clinicalProblems);
        if (rec.clinicalFindings) setClinicalNotes(rec.clinicalFindings);
        if (rec.lifestyleAdvice) setAdvice(rec.lifestyleAdvice);
        if (rec.dietaryAdvice) setDietaryAdvice(rec.dietaryAdvice);
        if (rec.medicines && rec.medicines.length > 0) {
          setPrescriptionItems(rec.medicines);
        }
        if (rec.investigations && rec.investigations.length > 0) {
          setInvestigations(rec.investigations.map((inv: string) => ({ testName: inv, instructions: 'Fasting if lipid/sugar' })));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate AI diagnosis.');
    } finally {
      setQuickDiagnoseLoading(false);
    }
  };

  // Medicine autocomplete search
  const handleMedicineSearch = async (query: string, index: number) => {
    setActiveItemIndexForAi(index);
    setAiSearchQuery(query);
    if (!query || query.length < 1) {
      setAiSuggestions([]);
      return;
    }
    try {
      const res = await api.post('/medicines/autocomplete', {
        query,
        doctorId: user?.doctorProfile?.id,
        diagnosis,
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
      specialInstructions: suggestion.isDoctorFavorite ? 'Doctor frequent choice' : '',
    };
    setPrescriptionItems(updated);
    setAiSuggestions([]);
    setActiveItemIndexForAi(null);
  };

  // Import medicines from Patient History modal
  const handleImportPastMedicines = (pastMeds: any[], pastVitals?: any, pastDiagnosis?: string) => {
    if (pastMeds && pastMeds.length > 0) {
      setPrescriptionItems(
        pastMeds.map((m) => ({
          brandName: m.brandName,
          genericName: m.genericName,
          dosageForm: m.dosageForm || 'Tablet',
          strength: m.strength || '',
          dosageInstruction: m.dosageInstruction || '1+0+1',
          timing: m.timing || 'After meal',
          durationDays: m.durationDays || 7,
          specialInstructions: 'Imported from past history',
        }))
      );
    }
    if (pastVitals) {
      setVitals((prev) => ({ ...prev, ...pastVitals }));
    }
    if (pastDiagnosis && !diagnosis) {
      setDiagnosis(pastDiagnosis);
    }
    setShowHistoryModal(false);
    alert('Patient history medications imported into Consultation Studio!');
  };

  // Save Prescription
  const handleSavePrescription = async () => {
    if (!activeConsultationAppt?.medicalCase?.id) {
      alert('Medical Case not found. Please complete the appointment first.');
      return;
    }

    try {
      const caseId = activeConsultationAppt.medicalCase.id;

      // 1. Issue Prescription
      const validItems = prescriptionItems.filter((it) => it.brandName.trim() !== '');
      if (validItems.length > 0) {
        await api.post(`/medical-cases/${caseId}/prescriptions`, {
          vitals,
          chiefComplaints,
          diagnosis,
          clinicalFindings: clinicalNotes,
          advice,
          dietaryAdvice,
          nextVisitDate: nextVisitDate || null,
          items: validItems,
        });
      }

      // 2. Order Investigations
      const validTests = investigations.filter((t) => t.testName.trim() !== '');
      if (validTests.length > 0) {
        await api.post(`/medical-cases/${caseId}/investigations`, {
          tests: validTests,
        });
      }

      alert('Official Prescription & Clinical Notes successfully issued to Medical Case!');
      setShowPrintModal(true);
      fetchDoctorPortalData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save prescription.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Clinical OS Dashboard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Doctor Clinical Operating System
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                BMDC Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.name || 'Prof. Dr. Tanvir Ahmed'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Trace patient history by mobile number, issue AI-powered prescriptions, upload lab reports, and manage chamber capacity slots.
            </p>
          </div>

          {/* Quick Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* CORE BUTTON: Trace Patient History by Mobile */}
            <button
              onClick={() => {
                setHistoryTargetPhone('');
                setShowHistoryModal(true);
              }}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition shrink-0"
            >
              <History className="w-4 h-4" />
              <span>Trace Patient by Mobile</span>
            </button>

            {/* Upload Report Button */}
            <button
              onClick={() => setShowReportUploadModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl flex items-center gap-2 border border-white/10 transition shrink-0"
            >
              <Upload className="w-4 h-4 text-teal-400" />
              <span>Upload Medical Report</span>
            </button>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Chamber Live Queue ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'cases'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Medical Cases ({medicalCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chambers')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'chambers'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Chamber Slots & Limits</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Profile & Photo Gallery</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* TAB 1: Chamber Queue & Live Appointments */}
      {/* ============================================================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Chamber Patient Queue</h2>
              <p className="text-xs text-slate-500">
                Click any patient&apos;s phone to trace complete past medical history, or start consultation studio.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDoctorPortalData}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No patient appointments scheduled for your chambers.</p>
              <p className="text-xs text-slate-400 mt-1">
                You can book walk-in chamber patients anytime from the Chamber Slots tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-teal-300 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 font-extrabold text-base flex flex-col items-center justify-center shrink-0 border border-teal-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Serial</span>
                      <span>#{appt.serialNumber}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{appt.patientName}</h4>

                        {/* Interactive Phone Pill that triggers Patient History Modal */}
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryTargetPhone(appt.patientPhone);
                            setShowHistoryModal(true);
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-mono text-xs font-bold flex items-center gap-1 transition"
                          title="Click to trace patient medical history"
                        >
                          <History className="w-3 h-3 text-teal-600" />
                          <span>{appt.patientPhone}</span>
                          <span className="text-[10px] text-teal-600 font-normal underline ml-0.5">Trace</span>
                        </button>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                        <p className="text-xs text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          Symptoms: &ldquo;{appt.problemDescription}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Consultation Progression Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Trace History Shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryTargetPhone(appt.patientPhone);
                        setShowHistoryModal(true);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>

                    {appt.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition"
                      >
                        Confirm Booking
                      </button>
                    )}

                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CHECKED_IN')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
                      >
                        Mark Checked-In
                      </button>
                    )}

                    {appt.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONSULTATION_STARTED')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}

                    {appt.status === 'CONSULTATION_STARTED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete & Open Prescription</span>
                      </button>
                    )}

                    {appt.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleOpenConsultationStudio(appt)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Prescription Studio</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: Completed Cases & Digital Follow-Ups */}
      {/* ============================================================== */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Completed Consultation Medical Cases</h2>

          {medicalCases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No medical cases created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {medicalCases.map((c) => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                          {c.caseNumber}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <strong>{c.patientUser?.name || c.appointment?.patientName}</strong> &bull;{' '}
                        Chamber: {c.appointment?.chamber?.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryTargetPhone(c.patientUser?.phone || c.appointment?.patientPhone);
                          setShowHistoryModal(true);
                        }}
                        className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold hover:bg-teal-100 flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Trace History</span>
                      </button>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-slate-500 font-semibold">Diagnosis:</p>
                      <p className="font-bold text-slate-800">{c.diagnosis || 'Under Evaluation'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">Clinical Notes:</p>
                      <p className="text-slate-700">{c.clinicalNotes || 'None'}</p>
                    </div>
                  </div>

                  {/* Digital Follow-up Section */}
                  {c.digitalFollowUps && c.digitalFollowUps.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Patient Follow-Up Query:</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-amber-800">
                          Payment: {c.digitalFollowUps[0].paymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-800 italic">&ldquo;{c.digitalFollowUps[0].patientQuery}&rdquo;</p>

                      {c.digitalFollowUps[0].doctorAdvice ? (
                        <div className="bg-white p-3 rounded-xl border border-amber-200">
                          <p className="font-bold text-teal-800">Your Clinical Advice:</p>
                          <p className="text-slate-700">{c.digitalFollowUps[0].doctorAdvice}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCaseForReview(c)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm"
                        >
                          Review & Reply with Advice
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      {c.prescriptions?.length || 0} Prescription(s) &bull; {c.patientReports?.length || 0} Report(s) uploaded
                    </span>
                    <button
                      onClick={() => handleOpenConsultationStudio({ ...c.appointment, medicalCase: c })}
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Prescription Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: Chambers & Slot Limits Management */}
      {/* ============================================================== */}
      {activeTab === 'chambers' && (
        <ChamberSlotManager onQueueUpdated={fetchDoctorPortalData} />
      )}

      {/* ============================================================== */}
      {/* TAB 4: Doctor Profile & Photo Gallery */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <DoctorProfileEditor onProfileUpdated={fetchDoctorPortalData} />
      )}

      {/* ============================================================== */}
      {/* MODAL: Full Consultation Studio (with AI Quick Diagnose & Bangladesh Formulary) */}
      {/* ============================================================== */}
      {activeConsultationAppt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4" />
                  <span>Clinical Consultation & E-Prescription Studio</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Patient: {activeConsultationAppt.patientName} ({activeConsultationAppt.patientPhone})
                </h2>
                <p className="text-xs text-slate-500">
                  Chamber: {activeConsultationAppt.chamber?.name} &bull; Case ID:{' '}
                  {activeConsultationAppt.medicalCase?.caseNumber || 'New Consultation'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Trace Patient History Button inside Consultation */}
                <button
                  type="button"
                  onClick={() => {
                    setHistoryTargetPhone(activeConsultationAppt.patientPhone);
                    setShowHistoryModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-teal-200"
                >
                  <History className="w-4 h-4" />
                  <span>Check Past History</span>
                </button>

                <button
                  onClick={() => setActiveConsultationAppt(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* AI 1-CLICK QUICK DIAGNOSE CARD (Main Feature Highlight) */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 space-y-3.5 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                  <span>AI Deep Clinical Diagnostic Assistant & Pattern Learning</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Learns your prescribing habits & auto-populates in 1 click
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Enter chief complaints below, then click &quot;AI 1-Click Quick Diagnose&quot; to auto-generate diagnosis, clinical problems, lab tests, and complete Bangladesh formulary medication regimens adapting to your prescribing history!
              </p>

              {/* Chief Complaints Input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. Fever for 4 days, sore throat, severe dry cough, body aches..."
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <button
                  type="button"
                  onClick={handleQuickDiagnose}
                  disabled={quickDiagnoseLoading}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-teal-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{quickDiagnoseLoading ? 'Diagnosing...' : 'AI 1-Click Quick Diagnose'}</span>
                </button>
              </div>

              {aiDiagnoseResult && (
                <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300">
                      Suggested Diagnosis: {aiDiagnoseResult.diagnosis}
                    </span>
                    {aiDiagnoseResult.doctorCustomized && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                        ⭐ Adapted to your prescribing patterns
                      </span>
                    )}
                  </div>
                  {aiDiagnoseResult.differentialDiagnoses?.length > 0 && (
                    <p className="text-slate-400 text-[11px]">
                      Differential Diagnoses: {aiDiagnoseResult.differentialDiagnoses.join(' • ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vitals Input Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Pulse (bpm)</label>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  placeholder="76"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Weight</label>
                <input
                  type="text"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  placeholder="65 kg"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Temperature</label>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  placeholder="98.6 F"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Sugar (RBS mmol/L)</label>
                <input
                  type="text"
                  value={vitals.rbs}
                  onChange={(e) => setVitals({ ...vitals, rbs: e.target.value })}
                  placeholder="6.2"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-teal-800"
                />
              </div>
            </div>

            {/* Diagnosis & Examination Findings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Primary Diagnosis *</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Viral Pharyngitis with Upper RTI"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Clinical Examination Findings (O/E)</label>
                <input
                  type="text"
                  placeholder="e.g. Pharynx congested, chest clear, no cervical lymphadenopathy..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Prescriptions Items with 20k+ Bangladesh Medicine Autocomplete */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Prescribed Medications (Bangladesh MedEx Formulary Autocomplete)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Type brand or generic to search across Square, Beximco, Incepta, Renata, etc. Doctor favorites appear first.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPrescriptionItems([
                      ...prescriptionItems,
                      {
                        brandName: '',
                        genericName: '',
                        dosageForm: 'Tablet',
                        strength: '',
                        dosageInstruction: '1+0+1',
                        timing: 'After meal',
                        durationDays: 7,
                        specialInstructions: '',
                      },
                    ])
                  }
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {prescriptionItems.map((item, idx) => (
                  <div key={idx} className="relative bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      
                      {/* Brand Name Input with Autocomplete */}
                      <div className="sm:col-span-4 relative">
                        <label className="font-bold text-slate-700 block mb-1">Brand Name *</label>
                        <input
                          type="text"
                          placeholder="Type brand e.g. Napa, Angilock, Seclo, Fexo..."
                          value={item.brandName}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].brandName = e.target.value;
                            setPrescriptionItems(updated);
                            handleMedicineSearch(e.target.value, idx);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                        />

                        {/* Autocomplete Dropdown List */}
                        {activeItemIndexForAi === idx && aiSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 z-30 w-80 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                            {aiSuggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => applyMedicineSuggestion(sug, idx)}
                                className="w-full text-left p-3 hover:bg-teal-50 transition text-xs space-y-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900">{sug.brandName}</span>
                                  {sug.isDoctorFavorite ? (
                                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full font-bold">
                                      ⭐ Your Favorite ({sug.frequencyCount}x)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                      {sug.dosageForm} {sug.strength}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">{sug.genericName}</p>
                                <p className="text-[10px] text-teal-700 font-semibold">
                                  Default: {sug.defaultDose} &bull; {sug.defaultTiming} &bull; {sug.manufacturer}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dosage Instruction (1+0+1) */}
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Dosage</label>
                        <input
                          type="text"
                          placeholder="1+0+1"
                          value={item.dosageInstruction}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].dosageInstruction = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-center"
                        />
                      </div>

                      {/* Timing */}
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Timing</label>
                        <input
                          type="text"
                          placeholder="After meal"
                          value={item.timing}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].timing = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      {/* Duration in Days */}
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Duration (Days)</label>
                        <input
                          type="number"
                          placeholder="7"
                          value={item.durationDays}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].durationDays = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-center font-bold"
                        />
                      </div>

                      {/* Delete Item */}
                      <div className="sm:col-span-2 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Investigations */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Order Lab Investigations / Diagnostic Tests</h4>
                <button
                  type="button"
                  onClick={() =>
                    setInvestigations([...investigations, { testName: '', instructions: '', urgency: 'NORMAL' }])
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lab Test</span>
                </button>
              </div>

              <div className="space-y-2">
                {investigations.map((test, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Complete Blood Count (CBC) with ESR or Chest X-Ray"
                      value={test.testName}
                      onChange={(e) => {
                        const updated = [...investigations];
                        updated[idx].testName = e.target.value;
                        setInvestigations(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Fasting 12 hours)"
                      value={test.instructions}
                      onChange={(e) => {
                        const updated = [...investigations];
                        updated[idx].instructions = e.target.value;
                        setInvestigations(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setInvestigations(investigations.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* General & Dietary Advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Clinical Advice & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lukewarm salt water gargle 3 times daily. Drink at least 2.5L water..."
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Dietary Restrictions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Restrict excess salt. Avoid oily deep-fried foods and chilled drinks..."
                  value={dietaryAdvice}
                  onChange={(e) => setDietaryAdvice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Next Visit Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Next Follow-Up Visit Date</label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Preview Actual Prescription</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveConsultationAppt(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Official Prescription</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: Patient History Tracker Modal (THE CORE FEATURE) */}
      {/* ============================================================== */}
      <PatientHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        initialPhone={historyTargetPhone}
        onImportToPrescription={handleImportPastMedicines}
      />

      {/* ============================================================== */}
      {/* MODAL 2: Report Upload Modal */}
      {/* ============================================================== */}
      <ReportUploadModal
        isOpen={showReportUploadModal}
        onClose={() => setShowReportUploadModal(false)}
        defaultPhone={activeConsultationAppt?.patientPhone || ''}
        defaultName={activeConsultationAppt?.patientName || ''}
        medicalCaseId={activeConsultationAppt?.medicalCase?.id}
        onUploadSuccess={() => {
          fetchDoctorPortalData();
        }}
      />

      {/* ============================================================== */}
      {/* MODAL 3: Actual Bangladesh Prescription Print & Preview */}
      {/* ============================================================== */}
      {showPrintModal && (
        <PrescriptionPrintView
          doctor={user?.doctorProfile || { name: user?.name }}
          chamber={activeConsultationAppt?.chamber}
          patient={{
            name: activeConsultationAppt?.patientName || 'Patient',
            phone: activeConsultationAppt?.patientPhone || '',
            age: '42 Yrs',
            gender: 'Male',
          }}
          rxData={{
            prescriptionNumber: `BMD-RX-${Math.floor(100000 + Math.random() * 900000)}`,
            caseNumber: activeConsultationAppt?.medicalCase?.caseNumber,
            date: new Date().toISOString(),
            vitals,
            chiefComplaints,
            diagnosis,
            clinicalFindings: clinicalNotes,
            items: prescriptionItems.filter((it) => it.brandName.trim() !== ''),
            investigations: investigations.filter((t) => t.testName.trim() !== ''),
            advice,
            dietaryAdvice,
            nextVisitDate,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Digital Follow-up Advice Reply */}
      {/* ============================================================== */}
      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-auto">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Digital Follow-Up: {selectedCaseForReview.patientUser?.name || 'Patient'}
                </h3>
                <p className="text-slate-500">Case No: {selectedCaseForReview.caseNumber}</p>
              </div>
              <button onClick={() => setSelectedCaseForReview(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-800">Patient Uploaded Query:</p>
              <p className="text-slate-700 italic">
                &ldquo;{selectedCaseForReview.digitalFollowUps?.[0]?.patientQuery}&rdquo;
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Doctor Clinical Advice / Medication Adjustments:</label>
              <textarea
                rows={4}
                placeholder="Write your clinical advice here. Patient has paid the digital follow-up fee..."
                value={followUpAdviceText}
                onChange={(e) => setFollowUpAdviceText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCaseForReview(null)}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!followUpAdviceText) return;
                  try {
                    await api.post('/medical-cases/digital-followup/advice', {
                      followUpId: selectedCaseForReview.digitalFollowUps[0].id,
                      doctorAdvice: followUpAdviceText,
                    });
                    alert('Clinical advice sent to patient successfully.');
                    setSelectedCaseForReview(null);
                    setFollowUpAdviceText('');
                    fetchDoctorPortalData();
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to send advice.');
                  }
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
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
