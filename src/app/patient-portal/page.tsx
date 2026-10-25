'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Calendar,
  FileText,
  Clock,
  Sparkles,
  Users,
  Cat,
  Upload,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Printer,
} from 'lucide-react';
import PrescriptionPrintView from '@/components/PrescriptionPrintView';

export default function PatientPortalPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'family' | 'pets'>('timeline');

  // Digital Follow-up / Report Upload Modal
  const [selectedCaseForFollowUp, setSelectedCaseForFollowUp] = useState<any | null>(null);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<any | null>(null);
  const [uploadTestName, setUploadTestName] = useState('Lipid Profile Report');
  const [uploadFileUrl, setUploadFileUrl] = useState('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80');
  const [uploadHospital, setUploadHospital] = useState('Popular Diagnostic Centre');
  const [patientQuery, setPatientQuery] = useState('');
  const [digitalStep, setDigitalStep] = useState<'upload' | 'pay' | 'complete'>('upload');
  const [createdFollowUpId, setCreatedFollowUpId] = useState<string | null>(null);
  const [followUpFee, setFollowUpFee] = useState(300);

  // Family Member form
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    name: '',
    relationship: 'Mother',
    gender: 'Female',
    bloodGroup: 'B+',
    allergies: '',
    notes: '',
  });

  // Pet Profile form (Veterinary - Cat First)
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Cat',
    breed: 'Persian Longhair',
    gender: 'Female',
    weightKg: '3.5',
    isNeutered: true,
    notes: 'Indoor cat',
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patient/dashboard');
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Initiate Digital Follow-up
  const handleInitiateDigitalFollowUp = async () => {
    if (!selectedCaseForFollowUp) return;
    try {
      // 1. Upload report
      if (uploadTestName && uploadFileUrl) {
        await api.post(`/medical-cases/${selectedCaseForFollowUp.id}/reports`, {
          testName: uploadTestName,
          fileUrl: uploadFileUrl,
          hospitalClinicName: uploadHospital,
        });
      }

      // 2. Request Follow-up
      const res = await api.post(`/medical-cases/${selectedCaseForFollowUp.id}/digital-followup`, {
        patientQuery: patientQuery || 'Doctor, please review my uploaded test reports and advice on medication adjustments.',
      });

      if (res.data.success) {
        setCreatedFollowUpId(res.data.followUp.id);
        setFollowUpFee(res.data.fee || 300);
        setDigitalStep('pay');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate digital follow-up.');
    }
  };

  // Pay for Digital Follow-up via simulated bKash/Nagad
  const handlePayDigitalFollowUp = async (method: string) => {
    if (!createdFollowUpId) return;
    try {
      const res = await api.post('/medical-cases/digital-followup/pay', {
        followUpId: createdFollowUpId,
        paymentMethod: method,
      });
      if (res.data.success) {
        setDigitalStep('complete');
        toast.success('Digital follow-up request and payment processed successfully!');
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment simulation failed.');
    }
  };

  // Add Family Member
  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/patient/family-members', {
        ...familyForm,
        allergies: familyForm.allergies ? familyForm.allergies.split(',').map((a) => a.trim()) : [],
      });
      if (res.data.success) {
        setShowAddFamilyModal(false);
        toast.success('Family member added to medical profile.');
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add family member.');
    }
  };

  // Add Pet Profile (Cat First)
  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/patient/pets', petForm);
      if (res.data.success) {
        setShowAddPetModal(false);
        toast.success('Pet profile added successfully.');
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add pet profile.');
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 ${selectedRxForPrint ? 'print:hidden' : ''}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 uppercase tracking-wider">
            Patient Health Timeline & Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Welcome, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Access your completed consultation medical cases, digital prescription history, report uploads, family member records, and cat/pet vaccinations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'timeline' ? 'bg-white text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Health Timeline & Cases
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'family' ? 'bg-white text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Family Profiles ({dashboardData?.patientProfile?.familyMembers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'pets' ? 'bg-white text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Cat & Pets ({dashboardData?.patientProfile?.pets?.length || 0})
          </button>
        </div>
      </div>

      {/* Health Recommendations Alert (Consent-based) */}
      {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
        <div className="space-y-2">
          {dashboardData.recommendations.map((rec: any) => (
            <div
              key={rec.id}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">{rec.title}</h4>
                  <p className="text-amber-800 mt-0.5">{rec.message}</p>
                  {rec.suggestedSpecialty && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-amber-200/60 text-amber-900 rounded font-semibold text-[10px]">
                      Recommended Specialty: {rec.suggestedSpecialty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: Health Timeline & Medical Cases */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Medical Cases & Consultation Timeline</h2>
            <button
              onClick={fetchDashboard}
              className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {(!dashboardData?.medicalCases || dashboardData.medicalCases.length === 0) ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No Medical Cases created yet.</p>
              <p className="text-xs text-slate-400">
                Medical cases are generated automatically after a doctor completes your chamber consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dashboardData.medicalCases.map((medCase: any) => (
                <div
                  key={medCase.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
                >
                  {/* Case Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {medCase.caseNumber}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{medCase.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Doctor: <strong>{medCase.doctor?.user?.name}</strong> &bull; Date:{' '}
                        {new Date(medCase.createdAt).toDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-full">
                        {medCase.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCaseForFollowUp(medCase);
                          setDigitalStep('upload');
                        }}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Reports & Digital Follow-up</span>
                      </button>
                    </div>
                  </div>

                  {/* Diagnosis & Advice */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">Diagnosis:</p>
                      <p className="text-slate-800 font-medium">{medCase.diagnosis || 'Under Evaluation'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">Doctor Advice:</p>
                      <p className="text-slate-800 font-medium">{medCase.clinicalNotes || 'Follow-up as advised.'}</p>
                    </div>
                  </div>

                  {/* Prescriptions */}
                  {medCase.prescriptions && medCase.prescriptions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                          Prescription Medications
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRxForPrint({
                              doctor: medCase.doctor,
                              chamber: medCase.appointment?.chamber,
                              patient: { name: user?.name || 'Patient', phone: user?.phone || '' },
                              rxData: {
                                caseNumber: medCase.caseNumber,
                                diagnosis: medCase.diagnosis,
                                vitals: medCase.prescriptions[0].vitals,
                                advice: medCase.prescriptions[0].advice || medCase.clinicalNotes,
                                dietaryAdvice: medCase.prescriptions[0].dietaryAdvice,
                                nextVisitDate: medCase.prescriptions[0].nextVisitDate,
                                items: medCase.prescriptions[0].items || [],
                                investigations: medCase.investigationOrders || [],
                              },
                            })
                          }
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Print Official Prescription</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {medCase.prescriptions[0].items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1 shadow-sm"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-900">{item.brandName}</span>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                {item.dosageInstruction}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{item.genericName}</p>
                            <p className="text-[10px] text-brand-700 font-medium">
                              {item.timing} &bull; For {item.durationDays} days
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Reports & Digital Follow-up */}
                  {medCase.patientReports && medCase.patientReports.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                        Uploaded Investigation Reports
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {medCase.patientReports.map((r: any) => (
                          <div
                            key={r.id}
                            className="border border-slate-200 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{r.testName}</p>
                              <p className="text-[11px] text-slate-500">{r.hospitalClinicName}</p>
                              {r.aiSummary && (
                                <p className="text-[10px] text-brand-700 font-medium mt-1">
                                  AI Summary: {r.aiSummary}
                                </p>
                              )}
                            </div>
                            <a
                              href={r.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital Follow-up Advice */}
                  {medCase.digitalFollowUps && medCase.digitalFollowUps.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>Digital Follow-up Advice from Doctor</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Paid: {medCase.digitalFollowUps[0].paymentAmount} BDT
                        </span>
                      </div>
                      <p className="text-slate-700 italic">
                        &ldquo;{medCase.digitalFollowUps[0].patientQuery}&rdquo;
                      </p>
                      {medCase.digitalFollowUps[0].doctorAdvice && (
                        <div className="bg-white p-3 rounded-xl border border-teal-200">
                          <p className="font-bold text-slate-900">Doctor&apos;s Review Advice:</p>
                          <p className="text-slate-800 mt-0.5">{medCase.digitalFollowUps[0].doctorAdvice}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case Timeline Events */}
                  {medCase.timeline && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Medical Case Audit Timeline
                      </h5>
                      <div className="space-y-1.5">
                        {medCase.timeline.map((t: any) => (
                          <div key={t.id} className="flex items-start gap-2 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5" />
                            <div>
                              <span className="font-bold text-slate-800">{t.title}</span>
                              <span className="text-slate-400 text-[10px] ml-2">
                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <p className="text-slate-500 text-[11px]">{t.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Family Profiles */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Family Member Profiles</h2>
              <p className="text-xs text-slate-500">
                Book appointments and track medical cases on behalf of family members.
              </p>
            </div>
            <button
              onClick={() => setShowAddFamilyModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.patientProfile?.familyMembers?.map((m: any) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm text-xs">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {m.relationship}
                  </span>
                </div>
                <p className="text-slate-500">
                  Gender: {m.gender || 'Not specified'} &bull; Blood: {m.bloodGroup || 'Unknown'}
                </p>
                {m.allergies?.length > 0 && (
                  <p className="text-rose-600 font-medium">Allergies: {m.allergies.join(', ')}</p>
                )}
                {m.notes && <p className="text-slate-600 italic">{m.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Pet Profiles (Cat First) */}
      {activeTab === 'pets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cat className="w-5 h-5 text-amber-500" />
                <span>Pet Profiles & Cat-First Veterinary Vaccinations</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage feline immunizations (Rabies, FVRCP boosters) and veterinary records.
              </p>
            </div>
            <button
              onClick={() => setShowAddPetModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Pet Profile
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dashboardData?.patientProfile?.pets?.map((pet: any) => (
              <div key={pet.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Cat className="w-4 h-4 text-amber-500" />
                      <span>{pet.name}</span>
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      {pet.breed || 'Cat'} &bull; {pet.gender} &bull; {pet.weightKg || '3.5'} kg
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                    {pet.species}
                  </span>
                </div>

                {/* Vaccinations */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-700 text-[11px]">Vaccination Booster Schedules:</p>
                  {pet.vaccinations?.map((v: any) => (
                    <div
                      key={v.id}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{v.vaccineName}</p>
                        <p className="text-[10px] text-slate-500">
                          Due Date: {new Date(v.dueDate).toDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.isCompleted ? 'Completed' : 'Due Soon'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Digital Follow-up Workflow (Upload + Pay) */}
      {selectedCaseForFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                  Digital Follow-up & Lab Review
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Case: {selectedCaseForFollowUp.caseNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseForFollowUp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {digitalStep === 'upload' && (
              <div className="space-y-3">
                <p className="text-slate-600">
                  Upload your completed hospital lab reports. Doctor will review and send follow-up advice.
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Investigation / Test Name</label>
                  <input
                    type="text"
                    value={uploadTestName}
                    onChange={(e) => setUploadTestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Diagnostic Centre / Hospital</label>
                  <input
                    type="text"
                    value={uploadHospital}
                    onChange={(e) => setUploadHospital(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Report Document URL / File</label>
                  <input
                    type="text"
                    value={uploadFileUrl}
                    onChange={(e) => setUploadFileUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Question for Doctor</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your current status or ask doctor about your test results..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInitiateDigitalFollowUp}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Proceed to Follow-up Payment ({selectedCaseForFollowUp.doctor?.digitalFollowUpFee || 300} BDT) &rarr;
                </button>
              </div>
            )}

            {digitalStep === 'pay' && (
              <div className="space-y-4 text-center py-2">
                <CreditCard className="w-10 h-10 text-brand-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">
                  Pay Digital Follow-up Fee: {followUpFee} BDT
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Select your preferred Bangladeshi mobile wallet:
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handlePayDigitalFollowUp('bKash')}
                    className="p-3 rounded-xl border-2 border-pink-500 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs transition"
                  >
                    Pay with bKash
                  </button>
                  <button
                    onClick={() => handlePayDigitalFollowUp('Nagad')}
                    className="p-3 rounded-xl border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition"
                  >
                    Pay with Nagad
                  </button>
                </div>
              </div>
            )}

            {digitalStep === 'complete' && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Payment & Follow-up Submitted!</h4>
                <p className="text-slate-600">
                  Your doctor has been notified to review your reports. You will receive an in-app alert when advice is ready.
                </p>
                <button
                  onClick={() => setSelectedCaseForFollowUp(null)}
                  className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Family Member */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddFamilyMember}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-3"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Add Family Member</h3>
              <button
                type="button"
                onClick={() => setShowAddFamilyModal(false)}
                className="text-slate-400 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={familyForm.name}
                onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700">Relationship</label>
                <select
                  value={familyForm.relationship}
                  onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Blood Group</label>
                <select
                  value={familyForm.bloodGroup}
                  onChange={(e) => setFamilyForm({ ...familyForm, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Allergies (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Dust"
                value={familyForm.allergies}
                onChange={(e) => setFamilyForm({ ...familyForm, allergies: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-2"
            >
              Save Family Member
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Add Pet Profile (Cat First) */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddPet}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-3"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cat className="w-4 h-4 text-amber-500" />
                <span>Add Cat / Pet Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPetModal(false)}
                className="text-slate-400 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Pet Name *</label>
              <input
                type="text"
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700">Species</label>
                <select
                  value={petForm.species}
                  onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Cat">Cat (Feline - Priority)</option>
                  <option value="Dog">Dog</option>
                  <option value="Bird">Bird</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Breed</label>
                <input
                  type="text"
                  placeholder="e.g. Persian, Domestic"
                  value={petForm.breed}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={petForm.weightKg}
                onChange={(e) => setPetForm({ ...petForm, weightKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl mt-2"
            >
              Save Pet Profile
            </button>
          </form>
        </div>
      )}
      {selectedRxForPrint && (
        <PrescriptionPrintView
          doctor={selectedRxForPrint.doctor}
          chamber={selectedRxForPrint.chamber}
          patient={selectedRxForPrint.patient}
          rxData={selectedRxForPrint.rxData}
          onClose={() => setSelectedRxForPrint(null)}
        />
      )}
    </div>
  );
}

