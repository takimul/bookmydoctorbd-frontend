'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ShieldAlert,
  UserPlus,
  Users,
  Award,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Building,
  RefreshCw,
  TrendingUp,
  FileText,
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [analytics, setAnalytics] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDoctor, setSearchDoctor] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State for Manual Doctor Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bmdcRegNumber: '',
    gender: 'Male',
    specialties: 'General Medicine',
    degrees: 'MBBS',
    experienceYears: '5',
    baseConsultationFee: '600',
    followUpFee: '400',
    aboutBio: '',
    isVeterinary: false,
    planCode: 'PRO',
    chamberName: 'Dhaka Specialist Consultation Chamber',
    chamberDivision: 'Dhaka',
    chamberDistrict: 'Dhaka',
    chamberUpazila: 'Dhanmondi',
    chamberAddress: 'House 12, Road 4, Dhanmondi',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  // Subscription Assignment Modal
  const [selectedDocForSub, setSelectedDocForSub] = useState<any | null>(null);
  const [subPlanCode, setSubPlanCode] = useState('PREMIUM');
  const [subDurationDays, setSubDurationDays] = useState('30');
  const [isTrialSub, setIsTrialSub] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, doctorsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/doctors', {
          params: {
            search: searchDoctor || undefined,
            status: statusFilter || undefined,
          },
        }),
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.overview);
      }
      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.doctors || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  // Handle Doctor Verification Status Change
  const handleUpdateStatus = async (
    doctorProfileId: string,
    newStatus: string,
    isSponsored?: boolean
  ) => {
    try {
      const res = await api.patch(`/admin/doctors/${doctorProfileId}/verify`, {
        verificationStatus: newStatus,
        ...(isSponsored !== undefined && { isSponsored, sponsoredDays: 30 }),
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Status updated.');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Handle Manual Doctor Account Creation
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        ...createForm,
        specialties: createForm.specialties.split(',').map((s) => s.trim()),
        degrees: createForm.degrees.split(',').map((d) => d.trim()),
        verificationStatus: 'VERIFIED', // Super Admin created doctors are verified immediately
      };

      const res = await api.post('/admin/doctors/create', payload);
      if (res.data.success) {
        setCreatedResult(res.data);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create doctor account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Subscription Plan Assignment (Basic/Pro/Premium/Trial)
  const handleAssignSubscription = async () => {
    if (!selectedDocForSub) return;
    setSubLoading(true);
    try {
      const res = await api.post(`/admin/doctors/${selectedDocForSub.id}/assign-subscription`, {
        planCode: subPlanCode,
        durationDays: parseInt(subDurationDays, 10),
        isTrial: isTrialSub,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Subscription assigned.');
        setSelectedDocForSub(null);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign subscription.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-3 border border-purple-400/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin Master Control &bull; Full Database Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            BookMyDoctorBD Super Admin Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            You have full authorization to manually create doctor accounts, manage subscriptions and free trials, review pending approvals, and inspect all platform records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setCreatedResult(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Doctor ID/Password Manually</span>
          </button>
          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Doctors</span>
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics.totalDoctors}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">
              {analytics.verifiedDoctors} Verified &bull; {analytics.pendingDoctors} Pending
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Doctors</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{analytics.pendingDoctors}</p>
            <p className="text-[10px] text-slate-500 mt-1">Requires approval</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Consults</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics.totalAppointments}</p>
            <p className="text-[10px] text-purple-600 font-medium mt-1">
              {analytics.completedConsultations} Completed
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Medical Cases</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics.totalMedicalCases}</p>
            <p className="text-[10px] text-teal-600 font-medium mt-1">Active case files</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Doctor MRR</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">
              {analytics.monthlySubscriptionMRR} <span className="text-xs">BDT</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">From active subscriptions</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Follow-up Rev</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-indigo-600">
              {analytics.totalFollowUpRevenueBDT} <span className="text-xs">BDT</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Digital review fees</p>
          </div>
        </div>
      )}

      {/* Doctor Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered Doctors Directory</h2>
            <p className="text-xs text-slate-500">
              Approve, verify, suspend, or assign subscriptions and free trials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAdminData();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Search name, phone, BMDC..."
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Doctor & BMDC</th>
                <th className="p-4">Specialties & Chambers</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">Subscription Plan</th>
                <th className="p-4">Profile Score</th>
                <th className="p-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doc) => {
                const sub = doc.subscription;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm">{doc.user?.name}</p>
                        <p className="text-slate-500">{doc.user?.email || 'No email'} &bull; {doc.user?.phone}</p>
                        <p className="font-mono text-[10px] text-brand-700">BMDC: {doc.bmdcRegNumber}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800">{doc.specialties?.join(', ')}</p>
                        <p className="text-[11px] text-slate-500">
                          {doc.chambers?.length || 0} Chamber(s): {doc.chambers?.[0]?.name || 'None registered'}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          doc.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : doc.verificationStatus === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                      {doc.isSponsored && (
                        <span className="block mt-1 text-[10px] text-purple-700 font-bold">
                          ★ Sponsored Listing Active
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {sub ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{sub.plan?.name}</span>
                          <p className="text-[10px] text-slate-500">
                            Valid until: {new Date(sub.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Active Plan</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${doc.profileScore || 30}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px]">
                          {doc.profileScore || 30}/100
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {doc.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Approve & Verify
                          </button>
                        )}

                        {doc.verificationStatus === 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'SUSPENDED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px]"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedDocForSub(doc);
                            setIsTrialSub(false);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[11px]"
                        >
                          Assign Plan / Trial
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(doc.id, doc.verificationStatus, !doc.isSponsored)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                        >
                          {doc.isSponsored ? 'Remove Sponsored' : 'Set Sponsored'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Doctor Account Manually */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
            >
              &times;
            </button>

            {createdResult ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Doctor Account Created!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  The doctor credentials have been provisioned in NeonDB PostgreSQL.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2">
                  <p className="font-bold text-slate-800">Login Credentials:</p>
                  <p className="font-mono">ID / Email: <strong>{createForm.email || createForm.phone}</strong></p>
                  <p className="font-mono">Password: <strong>{createForm.password}</strong></p>
                  <p className="font-mono">BMDC Reg No: <strong>{createForm.bmdcRegNumber}</strong></p>
                  <p className="text-emerald-700 font-bold">Status: VERIFIED & ACTIVE</p>
                </div>

                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedResult(null);
                  }}
                  className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                    <span>Create Doctor Account Manually (Super Admin)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Directly assign login ID and password for doctors. The account is auto-verified.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Doctor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Mahmudul Hasan"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">BMDC Reg Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-78901"
                      value={createForm.bmdcRegNumber}
                      onChange={(e) => setCreateForm({ ...createForm, bmdcRegNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+88017xxxxxxxx"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="doctor@hospital.bd"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Assigned Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doctor@12345"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Subscription Plan</label>
                    <select
                      value={createForm.planCode}
                      onChange={(e) => setCreateForm({ ...createForm, planCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="BASIC">Basic Doctor Plan (1 Chamber)</option>
                      <option value="PRO">Pro Doctor Plan (3 Chambers)</option>
                      <option value="PREMIUM">Premium Specialist Plan (Unlimited)</option>
                      <option value="TRIAL">14-Day Free Evaluation Trial</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Specialties (comma separated)</label>
                    <input
                      type="text"
                      value={createForm.specialties}
                      onChange={(e) => setCreateForm({ ...createForm, specialties: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Degrees</label>
                    <input
                      type="text"
                      value={createForm.degrees}
                      onChange={(e) => setCreateForm({ ...createForm, degrees: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Consultation Fee (BDT)</label>
                    <input
                      type="number"
                      value={createForm.baseConsultationFee}
                      onChange={(e) => setCreateForm({ ...createForm, baseConsultationFee: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Follow-up Fee (BDT)</label>
                    <input
                      type="number"
                      value={createForm.followUpFee}
                      onChange={(e) => setCreateForm({ ...createForm, followUpFee: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Chamber Information */}
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Initial Chamber Setup:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Chamber Name"
                      value={createForm.chamberName}
                      onChange={(e) => setCreateForm({ ...createForm, chamberName: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                    <select
                      value={createForm.chamberDivision}
                      onChange={(e) => setCreateForm({ ...createForm, chamberDivision: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Dhaka">Dhaka Division</option>
                      <option value="Chittagong">Chittagong Division</option>
                      <option value="Sylhet">Sylhet Division</option>
                      <option value="Rajshahi">Rajshahi Division</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Upazila / Thana (e.g. Dhanmondi)"
                      value={createForm.chamberUpazila}
                      onChange={(e) => setCreateForm({ ...createForm, chamberUpazila: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    {createLoading ? 'Provisioning Doctor Account in NeonDB...' : 'Create Doctor Account & Activate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Subscription Plan Assignment */}
      {selectedDocForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 text-xs">
            <button
              onClick={() => setSelectedDocForSub(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              &times;
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                Doctor Subscription Control
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {selectedDocForSub.user?.name}
              </h3>
              <p className="text-slate-500">
                Current Plan: {selectedDocForSub.subscription?.plan?.name || 'None'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="trialCheck"
                  checked={isTrialSub}
                  onChange={(e) => setIsTrialSub(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <label htmlFor="trialCheck" className="cursor-pointer">
                  <span className="font-bold text-purple-900">Assign 14-Day Free Trial</span>
                  <p className="text-[10px] text-purple-700">Zero cost trial assignable by Super Admin</p>
                </label>
              </div>

              {!isTrialSub && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Choose Subscription Plan</label>
                    <select
                      value={subPlanCode}
                      onChange={(e) => setSubPlanCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="BASIC">Basic Plan (999 BDT / 1 Chamber)</option>
                      <option value="PRO">Pro Plan (2,499 BDT / 3 Chambers)</option>
                      <option value="PREMIUM">Premium Specialist (4,999 BDT / Unlimited)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Duration (Days)</label>
                    <input
                      type="number"
                      value={subDurationDays}
                      onChange={(e) => setSubDurationDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAssignSubscription}
                disabled={subLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
              >
                {subLoading ? 'Updating subscription...' : 'Confirm Subscription Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

