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
  Key,
  Calendar,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
} from 'lucide-react';
import { sanitizeBdPhoneInput, formatBdPhoneDisplay } from '@/lib/phoneUtils';
import RoleGuard from '@/components/auth/RoleGuard';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'doctors' | 'users' | 'appointments' | 'audit-logs' | 'analytics'>('doctors');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Password Visibility Toggle State for Super Admin Credentials Viewing
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Pagination states
  const [docPage, setDocPage] = useState(1);
  const docPageSize = 10;
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 10;
  const [apptPage, setApptPage] = useState(1);
  const apptPageSize = 10;

  // Overview / Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Doctors State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchDoctor, setSearchDoctor] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Appointments Management State
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [searchAppt, setSearchAppt] = useState('');
  const [apptStatusFilter, setApptStatusFilter] = useState('');

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

  // 1. Fetch Main Admin Data (Analytics + Doctors)
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

  // 2. Fetch Users List for User Management Tab
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          search: searchUser || undefined,
          role: roleFilter || undefined,
          limit: 100,
        },
      });
      if (res.data.success) {
        setUsersList(res.data.users || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Platform Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page: auditPage,
          limit: 20,
          action: auditActionFilter || undefined,
          targetType: auditTargetFilter || undefined,
          search: auditSearch || undefined,
        },
      });
      if (res.data.success) {
        setAuditLogs(res.data.logs || []);
        setAuditTotal(res.data.total || 0);
        setAuditTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // 3. Fetch Platform Appointments
  const fetchAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const res = await api.get('/admin/appointments', {
        params: {
          search: searchAppt || undefined,
          status: apptStatusFilter || undefined,
          limit: 100,
        },
      });
      if (res.data.success) {
        setAppointmentsList(res.data.appointments || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch appointments.');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    }
  }, [activeTab, roleFilter, apptStatusFilter, auditPage, auditActionFilter, auditTargetFilter]);

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
        toast.success(res.data.message || 'Doctor status updated.');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Handle Delete Doctor
  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to permanently delete Dr. ${doctorName}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/doctors/${doctorId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Doctor profile deleted.');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor.');
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
        verificationStatus: 'VERIFIED',
      };

      const res = await api.post('/admin/doctors/create', payload);
      if (res.data.success) {
        setCreatedResult(res.data);
        fetchAdminData();
        toast.success(`Doctor account for ${createForm.name} created successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create doctor account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Subscription Plan Assignment
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

  // Handle User Status Toggle (Freeze/Unfreeze)
  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, {
        isActive: !currentActive,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  // Handle User Role Change
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  // Handle User Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForReset || !newPasswordInput) return;
    setResetSubmitting(true);
    try {
      const res = await api.post(`/admin/users/${targetUserForReset.id}/reset-password`, {
        newPassword: newPasswordInput,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowResetPasswordModal(false);
        setTargetUserForReset(null);
        setNewPasswordInput('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Handle Appointment Status Force Update
  const handleUpdateApptStatus = async (apptId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/admin/appointments/${apptId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAppointments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update appointment status.');
    }
  };

  return (
    <RoleGuard
      allowedRoles={['SUPER_ADMIN', 'ADMIN']}
      fallbackTitle="Super Admin Master Control"
      fallbackMessage="This administrative console is strictly restricted to platform Super Administrators. Please sign in with an authorized Super Admin account."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Master Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-3 border border-purple-400/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Super Admin Master Control &bull; Full Database Oversight</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              BookMyDoctorBD Super Admin Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Universal control over doctors, verification workflows, subscription tiers, user accounts &amp; roles, and all platform appointments nationwide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
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
              onClick={() => {
                fetchAdminData();
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'appointments') fetchAppointments();
              }}
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
              <p className="text-[10px] text-slate-400 mt-1">Awaiting verification</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Platform Users</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{analytics.totalUsers}</p>
              <p className="text-[10px] text-slate-400 mt-1">Total registered accounts</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Appointments</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{analytics.totalAppointments}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                {analytics.completedConsultations} Completed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Medical Cases</span>
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{analytics.totalMedicalCases}</p>
              <p className="text-[10px] text-slate-400 mt-1">Issued clinical histories</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Est. Monthly MRR</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">
                ৳{analytics.monthlySubscriptionMRR?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Doctor Subscriptions</p>
            </div>
          </div>
        )}

        {/* Super Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'doctors'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Doctor Approvals &amp; Subscriptions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-white font-mono">
              {doctors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>User Accounts &amp; Role Management</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'appointments'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Platform Appointments Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('audit-logs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'audit-logs'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Platform Audit Logs</span>
            {auditTotal > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                {auditTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue &amp; Database Health</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DOCTOR APPROVALS & SUBSCRIPTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search doctor by name, phone, email, or BMDC Reg #..."
                  value={searchDoctor}
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Verification Statuses</option>
                  <option value="PENDING">PENDING Approvals</option>
                  <option value="VERIFIED">VERIFIED Only</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>

                <button
                  onClick={fetchAdminData}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Doctors Table */}
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold">
                Loading doctor directory from NeonDB...
              </div>
            ) : doctors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No doctors found matching query.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Doctor Bio &amp; BMDC</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Subscription Plan</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4">Sponsored</th>
                        <th className="py-3 px-4 text-right">Super Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {/* Paginated Doctors Slice */}
                      {doctors.slice((docPage - 1) * docPageSize, docPage * docPageSize).map((doc) => {
                        const sub = doc.subscription;
                        const isVerified = doc.verificationStatus === 'VERIFIED';
                        const isPending = doc.verificationStatus === 'PENDING';
                        const isSuspended = doc.verificationStatus === 'SUSPENDED';

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-sm">
                                Dr. {doc.user?.name || 'Doctor'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {doc.specialties?.join(', ') || 'Specialist'}
                              </div>
                              <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                                BMDC: {doc.bmdcRegNumber}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 space-y-0.5">
                              <div className="font-mono text-slate-800 font-bold">
                                {formatBdPhoneDisplay(doc.user?.phone || '')}
                              </div>
                              <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                                {doc.user?.email || 'No email provided'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {doc.chambers?.length || 0} Chambers configured
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {sub ? (
                                <div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    {sub.plan?.name || 'Active Plan'} ({sub.status})
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    Expires: {new Date(sub.endDate).toLocaleDateString('en-GB')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No active plan</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                    : isSuspended
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {doc.verificationStatus}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {doc.isSponsored ? (
                                <span className="px-2 py-0.5 bg-brand-500/10 text-brand-700 border border-brand-500/20 rounded font-bold text-[10px]">
                                  ★ Sponsored
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Organic</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* Quick Approve / Verify */}
                              {!isVerified && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(doc.id, 'VERIFIED')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                  title="Approve and mark BMDC Verified"
                                >
                                  Approve
                                </button>
                              )}

                              {/* Quick Suspend */}
                              {isVerified && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(doc.id, 'SUSPENDED')}
                                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
                                  title="Suspend doctor account"
                                >
                                  Suspend
                                </button>
                              )}

                              {/* Assign Plan / Trial */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocForSub(doc);
                                  setIsTrialSub(false);
                                }}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition"
                                title="Assign Subscription Plan or Free Trial"
                              >
                                Plan
                              </button>

                              {/* Delete Doctor */}
                              <button
                                type="button"
                                onClick={() => handleDeleteDoctor(doc.id, doc.user?.name || 'Doctor')}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="Permanently delete doctor profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Doctors Pagination Controls */}
                {doctors.length > docPageSize && (
                  <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50">
                    <span className="text-slate-500 font-medium">
                      Showing {((docPage - 1) * docPageSize) + 1} to {Math.min(docPage * docPageSize, doctors.length)} of {doctors.length} doctors
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                        disabled={docPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                        Page {docPage} of {Math.ceil(doctors.length / docPageSize)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocPage((p) => Math.min(Math.ceil(doctors.length / docPageSize), p + 1))}
                        disabled={docPage >= Math.ceil(doctors.length / docPageSize)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER ACCOUNTS & ROLE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search user by name, phone (+8801...), or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Platform Roles</option>
                  <option value="PATIENT">PATIENT</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="GUEST">GUEST</option>
                </select>

                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                >
                  Filter Users
                </button>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold">
                Loading users from database...
              </div>
            ) : usersList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No users found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">User Details</th>
                        <th className="py-3 px-4">Contact Phone &amp; Email</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Activity</th>
                        <th className="py-3 px-4 text-right">Super Admin Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {usersList.slice((userPage - 1) * userPageSize, userPage * userPageSize).map((u) => {
                        const isSelf = u.id === user?.id;

                        const roleBadgeColor = {
                          SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
                          ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                          DOCTOR: 'bg-teal-100 text-teal-800 border-teal-200',
                          PATIENT: 'bg-blue-100 text-blue-800 border-blue-200',
                          GUEST: 'bg-slate-100 text-slate-700 border-slate-200',
                        }[u.role as string] || 'bg-slate-100 text-slate-700';

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-600 text-white font-bold rounded">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Registered: {new Date(u.createdAt).toLocaleDateString('en-GB')}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 space-y-1">
                              <div className="font-mono text-slate-900 font-bold text-xs">
                                {formatBdPhoneDisplay(u.phone)}
                              </div>
                              {u.email && (
                                <div className="text-slate-500 text-[11px] truncate max-w-[160px]">
                                  {u.email}
                                </div>
                              )}
                              
                              {/* Super Admin Credentials Viewer (Password Show/Hide) */}
                              <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2 py-1 rounded-lg">
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-mono text-[11px] font-bold text-slate-800 tracking-wider">
                                  {revealedPasswords[u.id] ? (u.tempPassword || 'Encr-••••••') : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordReveal(u.id)}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition ml-auto"
                                  title={revealedPasswords[u.id] ? "Hide password" : "View temporary/reset password"}
                                >
                                  {revealedPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
                                </button>
                                {u.tempPassword && revealedPasswords[u.id] && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(u.tempPassword);
                                      toast.success('Temporary password copied to clipboard!');
                                    }}
                                    className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                                    title="Copy password"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleBadgeColor}`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-[11px] text-slate-500">
                              {u._count?.appointmentsAsPatient || 0} Appts &bull; {u._count?.medicalCases || 0} Cases
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* Change Role Selector */}
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                disabled={isSelf}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none border border-slate-300 disabled:opacity-50"
                                title="Change User System Role"
                              >
                                <option value="PATIENT">Patient</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                              </select>

                              {/* Toggle Active / Freeze */}
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                disabled={isSelf}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                                  u.isActive
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                                title={u.isActive ? 'Suspend User Account' : 'Reactivate User Account'}
                              >
                                {u.isActive ? 'Freeze' : 'Activate'}
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetUserForReset(u);
                                  setNewPasswordInput('');
                                  setShowResetPasswordModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                title="Manually Set New Password"
                              >
                                <Key className="w-3 h-3" />
                                <span>Reset Pwd</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Users Pagination Controls */}
                {usersList.length > userPageSize && (
                  <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50">
                    <span className="text-slate-500 font-medium">
                      Showing {((userPage - 1) * userPageSize) + 1} to {Math.min(userPage * userPageSize, usersList.length)} of {usersList.length} users
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                        Page {userPage} of {Math.ceil(usersList.length / userPageSize)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.min(Math.ceil(usersList.length / userPageSize), p + 1))}
                        disabled={userPage >= Math.ceil(usersList.length / userPageSize)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PLATFORM APPOINTMENTS OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by patient name, phone, doctor, or appt #..."
                  value={searchAppt}
                  onChange={(e) => setSearchAppt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAppointments()}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={apptStatusFilter}
                  onChange={(e) => setApptStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Appointment Statuses</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CHECKED_IN">CHECKED_IN</option>
                  <option value="CONSULTATION_STARTED">CONSULTATION_STARTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <button
                  onClick={fetchAppointments}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Appointments Table */}
            {appointmentsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold">
                Loading all platform appointments...
              </div>
            ) : appointmentsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No appointments found matching filter.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Appt # &amp; Date</th>
                        <th className="py-3 px-4">Patient Info</th>
                        <th className="py-3 px-4">Attending Doctor</th>
                        <th className="py-3 px-4">Chamber</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Super Admin Force Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {appointmentsList.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 text-[11.5px]">
                              {a.appointmentNumber}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(a.appointmentDate).toLocaleDateString('en-GB')} &bull; {a.timeSlot}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 space-y-0.5">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {a.patientName}
                            </div>
                            <div className="font-mono text-slate-600 font-bold">
                              {formatBdPhoneDisplay(a.patientPhone)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              Dr. {a.doctor?.user?.name || 'Physician'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              BMDC: {a.doctor?.bmdcRegNumber}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {a.chamber?.name || 'Main Chamber'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Serial #{a.serialNumber} &bull; {a.chamber?.district || 'Dhaka'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                a.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : a.status === 'CONFIRMED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : a.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={a.status}
                              onChange={(e) => handleUpdateApptStatus(a.id, e.target.value)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800 border border-slate-300 outline-none"
                            >
                              <option value="REQUESTED">Requested</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="CHECKED_IN">Checked-in</option>
                              <option value="CONSULTATION_STARTED">Consultation Started</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PLATFORM AUDIT LOGS (SUPER ADMIN POWER CONSOLE) */}
        {/* ========================================================================= */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-4">
            {/* Header & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Platform Administrative Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit logging tracking all administrative events, password changes, doctor creations &amp; approvals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Logs</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search logs by actor, action, details, IP, or ID..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Action Types</option>
                  <option value="DOCTOR_CREATED">DOCTOR_CREATED</option>
                  <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                  <option value="DOCTOR_STATUS_UPDATED">DOCTOR_STATUS_UPDATED</option>
                  <option value="ROLE_UPDATED">ROLE_UPDATED</option>
                  <option value="APPOINTMENT_REPORT_UPLOADED">REPORT_UPLOADED</option>
                </select>

                <select
                  value={auditTargetFilter}
                  onChange={(e) => { setAuditTargetFilter(e.target.value); setAuditPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Targets</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="USER">USER</option>
                  <option value="APPOINTMENT">APPOINTMENT</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            {auditLogsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold bg-white rounded-3xl border border-slate-200">
                Fetching secure platform audit trail from PostgreSQL database...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No audit logs found matching criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Actions performed by administrators and doctors will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Actor (User &amp; Role)</th>
                        <th className="py-3 px-4">Action Event</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Audit Details</th>
                        <th className="py-3 px-4 text-right">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {auditLogs.map((log) => {
                        const actionColor = {
                          DOCTOR_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          PASSWORD_RESET: 'bg-amber-100 text-amber-800 border-amber-200',
                          DOCTOR_STATUS_UPDATED: 'bg-blue-100 text-blue-800 border-blue-200',
                          ROLE_UPDATED: 'bg-purple-100 text-purple-800 border-purple-200',
                          APPOINTMENT_REPORT_UPLOADED: 'bg-teal-100 text-teal-800 border-teal-200',
                        }[log.action as string] || 'bg-slate-100 text-slate-700 border-slate-200';

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-mono text-slate-900 font-semibold text-[11px]">
                                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="font-mono text-slate-400 text-[10px]">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{log.actorName || 'System'}</div>
                              <span className="inline-block px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-600 mt-0.5">
                                {log.actorRole || 'SYSTEM'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${actionColor}`}>
                                {log.action}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800">{log.targetType || 'SYSTEM'}</span>
                              {log.targetId && (
                                <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                                  ID: {log.targetId}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              <p className="line-clamp-2 text-[11px] font-medium leading-relaxed">
                                {log.details || 'No additional details logged.'}
                              </p>
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                              {log.ipAddress || '127.0.0.1'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Audit Logs Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50">
                  <span className="text-slate-500 font-medium">
                    Showing page {auditPage} of {auditTotalPages} ({auditTotal} total logged events)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      disabled={auditPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                      {auditPage} / {auditTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                      disabled={auditPage >= auditTotalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REVENUE & DATABASE HEALTH */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Revenue Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Platform Revenue Streams (BDT)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        Doctor Subscription Revenue (MRR)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Monthly recurring from Basic, Pro, and Premium doctors
                      </span>
                    </div>
                    <span className="font-black text-emerald-700 text-base">
                      ৳{analytics.monthlySubscriptionMRR?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        Digital Follow-up Revenue
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Paid by patients for online test review advice
                      </span>
                    </div>
                    <span className="font-black text-indigo-700 text-base">
                      ৳{analytics.totalFollowUpRevenueBDT?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database & System Connection */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-5 h-5 text-brand-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Database &amp; Engine Status
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Database Engine</span>
                    <strong className="text-slate-900 font-mono">NeonDB Serverless PostgreSQL</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">ORM Adapter</span>
                    <strong className="text-slate-900 font-mono">@prisma/adapter-pg (v7.10)</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">AI Formulary Autocomplete</span>
                    <strong className="text-emerald-700 font-mono">Active (Generics &amp; Brands)</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Mobile Normalization</span>
                    <strong className="text-slate-900 font-mono">BD E.164 (+8801[3-9]XXXXXXXX)</strong>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">Prescription Engine</span>
                    <strong className="text-emerald-700 font-mono">A4 1-Page Vector &amp; PDF</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: RESET USER PASSWORD */}
        {/* ========================================================================= */}
        {showResetPasswordModal && targetUserForReset && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowResetPasswordModal(false);
              }
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-md shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Reset User Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Set a new password for <strong className="text-slate-800">{targetUserForReset.name}</strong> ({targetUserForReset.phone}).
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Secure Password *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    {resetSubmitting ? 'Resetting...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: MANUAL DOCTOR CREATION */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-2xl shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Manually Create Doctor Account
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {createdResult ? (
                <div className="space-y-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <h4 className="font-bold text-emerald-900 text-sm">Account Created Successfully!</h4>
                  <p className="text-xs text-emerald-800">{createdResult.message}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedResult(null);
                      setShowCreateModal(false);
                    }}
                    className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Doctor Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Tanvir Ahmed"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        BMDC Reg Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="A-12345"
                        value={createForm.bmdcRegNumber}
                        onChange={(e) => setCreateForm({ ...createForm, bmdcRegNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        BD Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01712345678"
                        value={createForm.phone}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, phone: sanitizeBdPhoneInput(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="dr.tanvir@hospital.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Password *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="Initial password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Subscription Plan
                      </label>
                      <select
                        value={createForm.planCode}
                        onChange={(e) => setCreateForm({ ...createForm, planCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="BASIC">Basic Plan (999 BDT)</option>
                        <option value="PRO">Pro Plan (2,499 BDT)</option>
                        <option value="PREMIUM">Premium Specialist (4,999 BDT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Degrees (comma separated)
                      </label>
                      <input
                        type="text"
                        value={createForm.degrees}
                        onChange={(e) => setCreateForm({ ...createForm, degrees: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Specialties (comma separated)
                      </label>
                      <input
                        type="text"
                        value={createForm.specialties}
                        onChange={(e) => setCreateForm({ ...createForm, specialties: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl shadow-md"
                    >
                      {createLoading ? 'Creating Doctor...' : 'Create & Verify Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: ASSIGN SUBSCRIPTION / FREE TRIAL */}
        {/* ========================================================================= */}
        {selectedDocForSub && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedDocForSub(null);
              }
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-md shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Assign Subscription / Free Trial
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocForSub(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600">
                  Doctor: <strong className="text-slate-900">Dr. {selectedDocForSub.user?.name}</strong> (BMDC: {selectedDocForSub.bmdcRegNumber})
                </p>

                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    id="trialCheck"
                    checked={isTrialSub}
                    onChange={(e) => setIsTrialSub(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="trialCheck" className="font-bold text-purple-900 cursor-pointer">
                    Grant 14-Day Free Trial (Full Platform Features)
                  </label>
                </div>

                {!isTrialSub && (
                  <>
                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Subscription Tier
                      </label>
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

                    <div>
                      <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        value={subDurationDays}
                        onChange={(e) => setSubDurationDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocForSub(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignSubscription}
                    disabled={subLoading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition"
                  >
                    {subLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
