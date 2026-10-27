'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
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
  ChevronLeft,
  ChevronRight,
  Filter,
  FileImage,
  ExternalLink,
} from 'lucide-react';

// New Sub-Components
import PrescriptionPrintView from '@/components/PrescriptionPrintView';
import CompletedAppointmentModal from '@/components/doctor/CompletedAppointmentModal';
import AppointmentReportUploadModal from '@/components/reports/AppointmentReportUploadModal';
import PatientHistoryModal from '@/components/PatientHistoryModal';
import ReportUploadModal from '@/components/ReportUploadModal';
import DoctorProfileEditor from '@/components/DoctorProfileEditor';
import ChamberSlotManager from '@/components/ChamberSlotManager';
import RoleGuard from '@/components/auth/RoleGuard';
import BdPhoneInput from '@/components/common/BdPhoneInput';
import { validateBdPhone } from '@/lib/phoneUtils';

export default function DoctorPortalPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [labTestSuggestions, setLabTestSuggestions] = useState<any[]>([]);
  const [activeTestIdx, setActiveTestIdx] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<
    'appointments' | 'cases' | 'chambers' | 'profile' | 'reports'
  >('appointments');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalCases, setMedicalCases] = useState<any[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in Appointment Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInChamberId, setWalkInChamberId] = useState('');
  const [walkInPatientName, setWalkInPatientName] = useState('');
  const [walkInPatientPhone, setWalkInPatientPhone] = useState('+8801');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInGender, setWalkInGender] = useState('Male');
  const [walkInComplaint, setWalkInComplaint] = useState('');
  const [walkInImmediateStudio, setWalkInImmediateStudio] = useState(true);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

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

  // Completed Appointment View Modal & Direct Report Upload
  const [selectedCompletedAppt, setSelectedCompletedAppt] = useState<any | null>(null);
  const [selectedApptForReportUpload, setSelectedApptForReportUpload] = useState<any | null>(null);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<any | null>(null);

  // Queue Filtering & Pagination
  const [queueFilterTab, setQueueFilterTab] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [queuePage, setQueuePage] = useState(1);
  const queuePageSize = 10;

  // Clinical Diagnosis Presets
  const DIAGNOSIS_PRESETS = [
    'Acute Viral Pharyngitis with URTI',
    'Essential Hypertension (Grade 1/2)',
    'Type 2 Diabetes Mellitus with Dyslipidemia',
    'Acute Gastroenteritis & Dehydration',
    'Bronchial Asthma with Acute Exacerbation',
    'Gastric Acidity / GERD with Dyspepsia',
    'Generalized Body Ache & Viral Fever',
    'Allergic Rhinitis with Sinusitis',
  ];

  // Lab Investigation Presets
  const INVESTIGATION_PRESETS = [
    'Complete Blood Count (CBC) with ESR',
    'Serum Creatinine & Electrolytes',
    'Fasting Blood Sugar (FBS) & HbA1c',
    'Fasting Lipid Profile',
    'Chest X-Ray P/A View',
    'Urine Routine Examination (R/M/E)',
    'Ultrasonogram (USG) of Whole Abdomen',
    'Serum SGPT (ALT) & Bilirubin',
  ];

  const DOSAGE_CHIPS = ['1+0+1', '1+1+1', '1+0+0', '0+0+1', '0+1+0', '1+1+1+1', '1 tsp 3 times'];
  const TIMING_CHIPS = ['After meal', 'Before meal', 'With food', 'Empty stomach', 'At bedtime'];
  const DURATION_CHIPS = [3, 5, 7, 10, 14, 30];
  const FORM_CHIPS = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Drops', 'Injection', 'Ointment', 'Inhaler'];
  const [followUpAdviceText, setFollowUpAdviceText] = useState('');

  // Load Doctor Data
  const fetchDoctorPortalData = async () => {
    setLoading(true);
    try {
      const [apptsRes, casesRes, subRes, profileRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/medical-cases'),
        api.get('/subscriptions/my-status'),
        api.get('/doctors/me/profile').catch(() => ({ data: { doctor: null } })),
      ]);

      if (apptsRes.data.success) setAppointments(apptsRes.data.appointments || []);
      if (casesRes.data.success) setMedicalCases(casesRes.data.cases || []);
      if (subRes.data.success) setSubscriptionInfo(subRes.data);
      if (profileRes?.data?.doctor?.chambers) {
        setChambers(profileRes.data.doctor.chambers);
        if (!walkInChamberId && profileRes.data.doctor.chambers.length > 0) {
          setWalkInChamberId(profileRes.data.doctor.chambers[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load doctor portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Register Walk-In Patient Directly (Immediately in system)
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInPatientName.trim()) {
      toast.error('Patient full name is required.');
      return;
    }

    const phoneValidation = validateBdPhone(walkInPatientPhone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.message || 'Please provide a valid Bangladeshi mobile number.');
      return;
    }

    const chamberId = walkInChamberId || chambers[0]?.id;
    if (!chamberId) {
      toast.error('Please configure at least one chamber before booking walk-in patients.');
      return;
    }

    setWalkInSubmitting(true);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const res = await api.post('/appointments/doctor-book', {
        chamberId,
        appointmentDate: todayIso,
        patientName: walkInPatientName.trim(),
        patientPhone: walkInPatientPhone.trim(),
        age: walkInAge.trim() || undefined,
        gender: walkInGender,
        problemDescription: walkInComplaint.trim() || undefined,
        status: walkInImmediateStudio ? 'CHECKED_IN' : 'CONFIRMED',
      });

      if (res.data.success) {
        toast.success(`Walk-in patient ${walkInPatientName} successfully registered!`);
        setShowWalkInModal(false);

        // Reset form
        setWalkInPatientName('');
        setWalkInPatientPhone('+8801');
        setWalkInAge('');
        setWalkInComplaint('');

        // Refresh Queue
        await fetchDoctorPortalData();

        // If doctor wants to open consultation studio right away
        if (walkInImmediateStudio && res.data.appointment) {
          handleOpenConsultationStudio(res.data.appointment);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register walk-in patient.');
    } finally {
      setWalkInSubmitting(false);
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
      toast.error(err.response?.data?.message || 'Failed to update status.');
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
      toast.warning('Please enter patient chief complaints or symptoms first.');
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
      toast.error(err.response?.data?.message || 'Failed to generate AI diagnosis.');
    } finally {
      setQuickDiagnoseLoading(false);
    }
  };

  
  // Lab test autocomplete search
  const handleLabTestSearch = async (query: string, index: number) => {
    setActiveTestIdx(index);
    if (!query || query.length < 1) {
      setLabTestSuggestions([]);
      return;
    }
    try {
      const res = await api.get(`/ai/lab-tests?q=${encodeURIComponent(query)}`);
      if (res.data.success && res.data.tests) {
        setLabTestSuggestions(res.data.tests.slice(0, 8));
      }
    } catch (e) {
      // silent
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
    toast.success('Patient history medications imported into Consultation Studio!');
  };

  // Save Prescription
  const handleSavePrescription = async () => {
    if (!activeConsultationAppt?.medicalCase?.id) {
      toast.warning('Medical Case not found. Please complete the appointment first.');
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

      toast.success('Official Prescription & Clinical Notes successfully issued to Medical Case!');
      setShowPrintModal(true);
      fetchDoctorPortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save prescription.');
    }
  };

    // Pending digital follow-ups needing doctor review
  const pendingFollowUps = appointments.flatMap((a) => {
    const followUps = a.medicalCase?.digitalFollowUps || [];
    return followUps
      .filter((f: any) => f.status !== 'COMPLETED' && (!f.doctorAdvice || f.status === 'PAID' || f.status === 'PENDING'))
      .map((f: any) => ({ ...f, appointment: a, medicalCase: a.medicalCase, patientName: a.patientName, patientPhone: a.patientPhone }));
  });

  // Queue Counts
  const waitingCount = appointments.filter((a) => ['REQUESTED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)).length;
  const consultCount = appointments.filter((a) => ['CONSULTATION_STARTED', 'IN_PROGRESS', 'IN_CHAMBER'].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    if (queueFilterTab === 'WAITING' && !['REQUESTED', 'CONFIRMED', 'CHECKED_IN'].includes(appt.status)) return false;
    if (queueFilterTab === 'IN_CONSULTATION' && !['CONSULTATION_STARTED', 'IN_PROGRESS', 'IN_CHAMBER'].includes(appt.status)) return false;
    if (queueFilterTab === 'COMPLETED' && appt.status !== 'COMPLETED') return false;
    if (queueFilterTab === 'CANCELLED' && !['CANCELLED', 'NO_SHOW'].includes(appt.status)) return false;

    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      const matchName = appt.patientName?.toLowerCase().includes(q);
      const matchPhone = appt.patientPhone?.toLowerCase().includes(q);
      const matchSerial = String(appt.serialNumber || '').includes(q);
      const matchApptNum = appt.appointmentNumber?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchSerial && !matchApptNum) return false;
    }

    return true;
  });

  const totalQueuePages = Math.max(1, Math.ceil(filteredAppointments.length / queuePageSize));
  const paginatedAppointments = filteredAppointments.slice((queuePage - 1) * queuePageSize, queuePage * queuePageSize);

  return (
    <RoleGuard
      allowedRoles={['DOCTOR', 'SUPER_ADMIN']}
      fallbackTitle="Doctor Clinical Portal Access"
      fallbackMessage="This portal is strictly reserved for BMDC-registered medical practitioners. Please sign in with your doctor credentials."
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 ${showPrintModal ? 'print:hidden' : ''}`}>
      
      {/* Pending Digital Follow-Ups High-Priority Glowing Alert */}
      {pendingFollowUps.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-amber-300 space-y-3 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-200 animate-spin" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  Immediate Clinical Review Required
                </span>
                <h3 className="text-base sm:text-lg font-extrabold mt-0.5">
                  {pendingFollowUps.length} Patient Digital Follow-Up(s) &amp; Lab Report(s) Awaiting Your Clinical Advice
                </h3>
                <p className="text-xs text-amber-100">
                  Patients have submitted digital queries and uploaded printed diagnostic reports. Review and send prescription advice.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {pendingFollowUps.slice(0, 3).map((fu, idx) => (
              <div key={fu.id || idx} className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{fu.patientName}</span>
                    <span className="font-mono text-[10px] text-teal-300 font-bold">{fu.patientPhone}</span>
                  </div>
                  <p className="text-slate-200 italic line-clamp-2">
                    &ldquo;{fu.patientQuery}&rdquo;
                  </p>
                  <div className="text-[10px] text-amber-200">
                    Case: {fu.medicalCase?.caseNumber || 'Medical Case'} &bull; Status: {fu.status}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCaseForReview({ ...fu.medicalCase, appointment: fu.appointment, patientUser: { name: fu.patientName, phone: fu.patientPhone } })}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Review Reports &amp; Send Advice</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Chamber Patient Queue</h2>
              <p className="text-xs text-slate-500">
                Filter patients by consultation stage, trace past history by mobile, view visit details &amp; print prescriptions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWalkInModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Walk-In Patient</span>
              </button>

              <button
                onClick={fetchDoctorPortalData}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
              </button>
            </div>
          </div>

          {/* Filtering Tabs & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setQueueFilterTab('ALL'); setQueuePage(1); }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  queueFilterTab === 'ALL'
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({appointments.length})
              </button>

              <button
                type="button"
                onClick={() => { setQueueFilterTab('WAITING'); setQueuePage(1); }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  queueFilterTab === 'WAITING'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Waiting / Checked-In ({waitingCount})
              </button>

              <button
                type="button"
                onClick={() => { setQueueFilterTab('IN_CONSULTATION'); setQueuePage(1); }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  queueFilterTab === 'IN_CONSULTATION'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                In Consultation ({consultCount})
              </button>

              <button
                type="button"
                onClick={() => { setQueueFilterTab('COMPLETED'); setQueuePage(1); }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  queueFilterTab === 'COMPLETED'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Completed ({completedCount})
              </button>

              {cancelledCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setQueueFilterTab('CANCELLED'); setQueuePage(1); }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    queueFilterTab === 'CANCELLED'
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Cancelled ({cancelledCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search patient, phone, serial..."
                value={queueSearch}
                onChange={(e) => { setQueueSearch(e.target.value); setQueuePage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No patient appointments scheduled for your chambers today.</p>
              <p className="text-xs text-slate-400 mt-1">
                Patients who arrive directly at your chamber can be added immediately into your live queue.
              </p>
              <button
                type="button"
                onClick={() => setShowWalkInModal(true)}
                className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Walk-In Patient Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedAppointments.map((appt) => {
                const isCompleted = appt.status === 'COMPLETED';
                const rxCount = appt.medicalCase?.prescriptions?.length || 0;
                const reportsCount = (appt.medicalCase?.patientReports?.length || 0) + (appt.reports?.length || 0);

                return (
                <div
                  key={appt.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    isCompleted ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20' : 'border-slate-200 hover:border-teal-300'
                  }`}
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. View Visit Details & What Happened */}
                        <button
                          type="button"
                          onClick={() => setSelectedCompletedAppt(appt)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          title="View what happened at this visit: diagnosis, vitals, prescriptions & tests"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Visit Details ({rxCount} Rx)</span>
                        </button>

                        {/* 2. Direct Report Upload for this Appointment */}
                        <button
                          type="button"
                          onClick={() => setSelectedApptForReportUpload(appt)}
                          className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1 transition border border-teal-200"
                          title="Upload printed lab report photo or PDF for this visit"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>+ Report</span>
                        </button>

                        {/* 3. Direct Print latest Prescription if exists */}
                        {rxCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const latestRx = appt.medicalCase.prescriptions[0];
                              setSelectedRxForPrint({
                                doctor: user?.doctorProfile || { name: user?.name },
                                chamber: appt.chamber,
                                patient: { name: appt.patientName, phone: appt.patientPhone },
                                rxData: {
                                  ...latestRx,
                                  caseNumber: appt.medicalCase?.caseNumber,
                                  items: latestRx.items || [],
                                  investigations: appt.medicalCase?.investigationOrders || [],
                                },
                              });
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                            title="Print official single-page A4 prescription"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Print Rx</span>
                          </button>
                        )}

                        {/* 4. Write New / Follow-up Prescription */}
                        <button
                          type="button"
                          onClick={() => handleOpenConsultationStudio(appt)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                          title="Write new prescription for this case (preserves past history)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Rx</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAppointments.length > queuePageSize && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Showing {((queuePage - 1) * queuePageSize) + 1} to {Math.min(queuePage * queuePageSize, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                  disabled={queuePage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalQueuePages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setQueuePage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition ${
                      queuePage === pageNum
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                  disabled={queuePage === totalQueuePages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveConsultationAppt(null);
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto space-y-6"
          >
            
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
              {/* Previous Prescriptions on File Alert */}
            {activeConsultationAppt?.medicalCase?.prescriptions?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      Case History: {activeConsultationAppt.medicalCase.prescriptions.length} Prescription(s) Already on File
                    </span>
                    <span className="text-emerald-700 block">
                      Saving will append this as Rx #{activeConsultationAppt.medicalCase.prescriptions.length + 1}. All previous prescriptions remain permanently preserved.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const latestRx = activeConsultationAppt.medicalCase.prescriptions[0];
                    setSelectedRxForPrint({
                      doctor: user?.doctorProfile || { name: user?.name },
                      chamber: activeConsultationAppt.chamber,
                      patient: { name: activeConsultationAppt.patientName, phone: activeConsultationAppt.patientPhone },
                      rxData: {
                        ...latestRx,
                        caseNumber: activeConsultationAppt.medicalCase.caseNumber,
                        items: latestRx.items || [],
                        investigations: activeConsultationAppt.medicalCase.investigationOrders || [],
                      },
                    });
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shrink-0 flex items-center gap-1 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Latest Rx</span>
                </button>
              </div>
            )}

            {/* Quick 1-Click Diagnosis Presets */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Diagnosis Presets (1-Click):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DIAGNOSIS_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDiagnosis(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      diagnosis === p
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-900 border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

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

                    {/* Quick Selection Chips (Dose, Meal, Duration) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-[10px]">
                      <span className="font-bold text-slate-500 uppercase mr-0.5">Dose:</span>
                      {DOSAGE_CHIPS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const updated = [...prescriptionItems];
                            updated[idx].dosageInstruction = d;
                            setPrescriptionItems(updated);
                          }}
                          className={`px-1.5 py-0.5 rounded font-mono font-bold transition ${
                            item.dosageInstruction === d
                              ? 'bg-teal-600 text-white'
                              : 'bg-white hover:bg-teal-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}

                      <span className="font-bold text-slate-500 uppercase ml-2 mr-0.5">Meal:</span>
                      {TIMING_CHIPS.slice(0, 3).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            const updated = [...prescriptionItems];
                            updated[idx].timing = t;
                            setPrescriptionItems(updated);
                          }}
                          className={`px-1.5 py-0.5 rounded font-medium transition ${
                            item.timing === t
                              ? 'bg-slate-800 text-white font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}

                      <span className="font-bold text-slate-500 uppercase ml-2 mr-0.5">Days:</span>
                      {DURATION_CHIPS.map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const updated = [...prescriptionItems];
                            updated[idx].durationDays = days;
                            setPrescriptionItems(updated);
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold transition ${
                            Number(item.durationDays) === days
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Investigations */}
            <div className="space-y-3 text-xs">
              {/* Quick Investigation Presets */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Laboratory Test Presets (1-Click to Advise):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INVESTIGATION_PRESETS.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!investigations.some((inv) => inv.testName === t)) {
                          setInvestigations([
                            ...investigations.filter((inv) => inv.testName.trim() !== ''),
                            { testName: t, instructions: 'Standard laboratory fasting protocol', urgency: 'NORMAL' },
                          ]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3 text-teal-600" />
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                        const val = e.target.value;
                        const updated = [...investigations];
                        updated[idx].testName = val;
                        setInvestigations(updated);
                        handleLabTestSearch(val, idx);
                      }}
                      onFocus={() => handleLabTestSearch(test.testName || 'a', idx)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium relative"
                    />
                    {activeTestIdx === idx && labTestSuggestions.length > 0 && (
                      <div className="absolute top-12 left-0 z-30 w-full sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-48 overflow-y-auto">
                        {labTestSuggestions.map((lt) => (
                          <div
                            key={lt.id}
                            onClick={() => {
                              const updated = [...investigations];
                              updated[idx].testName = lt.name;
                              if (lt.sampleCollectionNote) {
                                updated[idx].instructions = lt.sampleCollectionNote;
                              } else if (lt.fastingRequired) {
                                updated[idx].instructions = 'Overnight 10-12 hours fasting required';
                              }
                              setInvestigations(updated);
                              setLabTestSuggestions([]);
                              setActiveTestIdx(null);
                            }}
                            className="p-2 hover:bg-emerald-50 rounded-lg cursor-pointer text-xs"
                          >
                            <span className="font-bold text-slate-900 block">{lt.name}</span>
                            <span className="text-[10px] text-emerald-700">{lt.category} &bull; {lt.department}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCaseForReview(null);
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-auto"
          >
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
                    toast.success('Clinical advice sent to patient successfully.');
                    setSelectedCaseForReview(null);
                    setFollowUpAdviceText('');
                    fetchDoctorPortalData();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to send advice.');
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

      {/* ============================================================== */}
      {/* MODAL 5: Completed Appointment Details & Clinical Summary */}
      {/* ============================================================== */}
      <CompletedAppointmentModal
        appointment={selectedCompletedAppt}
        isOpen={Boolean(selectedCompletedAppt)}
        onClose={() => setSelectedCompletedAppt(null)}
        onOpenPrescriptionStudio={(appt) => {
          setSelectedCompletedAppt(null);
          handleOpenConsultationStudio(appt);
        }}
        onOpenReportUpload={(appt) => {
          setSelectedApptForReportUpload(appt);
        }}
        onOpenPatientHistory={(phone) => {
          setSelectedCompletedAppt(null);
          setHistoryTargetPhone(phone);
          setShowHistoryModal(true);
        }}
        onViewPrescription={(prescription, appt) => {
          setSelectedRxForPrint({
            doctor: user?.doctorProfile || { name: user?.name },
            chamber: appt.chamber,
            patient: { name: appt.patientName, phone: appt.patientPhone },
            rxData: {
              ...prescription,
              caseNumber: appt.medicalCase?.caseNumber,
              items: prescription.items || [],
              investigations: appt.medicalCase?.investigationOrders || [],
            },
          });
        }}
      />

      {/* ============================================================== */}
      {/* MODAL 6: Unified Appointment Report Upload Modal (Doctor & Patient) */}
      {/* ============================================================== */}
      <AppointmentReportUploadModal
        appointment={selectedApptForReportUpload}
        isOpen={Boolean(selectedApptForReportUpload)}
        onClose={() => setSelectedApptForReportUpload(null)}
        onUploadSuccess={() => {
          fetchDoctorPortalData();
        }}
      />

      {/* ============================================================== */}
      {/* MODAL 7: Prescription Print & Preview View for any prescription */}
      {/* ============================================================== */}
      {selectedRxForPrint && (
        <PrescriptionPrintView
          doctor={selectedRxForPrint.doctor}
          chamber={selectedRxForPrint.chamber}
          patient={selectedRxForPrint.patient}
          rxData={selectedRxForPrint.rxData}
          onClose={() => setSelectedRxForPrint(null)}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: Walk-In Chamber Patient Registration */}
      {/* ============================================================== */}
      {showWalkInModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWalkInModal(false);
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full max-w-xl shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Register Walk-In Patient
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add direct chamber walk-in patient to your queue &amp; start consultation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              {/* Chamber Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Consultation Chamber *
                </label>
                {chambers.length > 0 ? (
                  <select
                    value={walkInChamberId}
                    onChange={(e) => setWalkInChamberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  >
                    {chambers.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} — {ch.upazilaThana ? `${ch.upazilaThana}, ` : ''}{ch.district} (Fee: ৳{ch.consultationFee})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No active chambers found. Please create a chamber in the Chamber Slots tab first.
                  </p>
                )}
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mohammad Rahim"
                  value={walkInPatientName}
                  onChange={(e) => setWalkInPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium"
                  required
                />
              </div>

              {/* Patient BD Mobile Number */}
              <div>
                <BdPhoneInput
                  label="Patient BD Mobile Number *"
                  value={walkInPatientPhone}
                  onChange={setWalkInPatientPhone}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If the patient registers later with this number, all past prescriptions and medical cases will merge automatically.
                </p>
              </div>

              {/* Demographics: Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Age
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 34 Yrs"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Chief Complaint / Symptoms */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Chief Complaint / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High fever for 3 days, body ache, sore throat..."
                  value={walkInComplaint}
                  onChange={(e) => setWalkInComplaint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium"
                />
              </div>

              {/* Quick Action Preference */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="walkInAction"
                    checked={walkInImmediateStudio}
                    onChange={() => setWalkInImmediateStudio(true)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Start Consultation Studio Immediately
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Directly opens Prescription Studio to diagnose, record vitals &amp; print prescription now
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-slate-200/60">
                  <input
                    type="radio"
                    name="walkInAction"
                    checked={!walkInImmediateStudio}
                    onChange={() => setWalkInImmediateStudio(false)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Add to Waiting Queue Only
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Assigns serial number and adds to today&apos;s queue for later consultation
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  {walkInSubmitting ? (
                    <span>Registering Patient...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Confirm Walk-In Patient</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </RoleGuard>
  );
}
