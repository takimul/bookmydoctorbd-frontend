'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import SlotBookingCard from '@/components/appointments/SlotBookingCard';
import {
  Search,
  MapPin,
  Stethoscope,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  Sparkles,
  Cat,
  ShieldCheck,
  ChevronRight,
  Phone,
  User,
  CreditCard,
  Building,
  AlertCircle,
  Lock,
  Users,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedSlotTitle, setSelectedSlotTitle] = useState('');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [symptom, setSymptom] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [isVeterinary, setIsVeterinary] = useState(false);
  const [maxFee, setMaxFee] = useState<number | ''>('');

  // Dropdown options
  const [specialtiesList, setSpecialtiesList] = useState<string[]>([]);
  const [locations, setLocations] = useState<{ divisions: string[]; districts: string[]; upazilas: string[] }>({
    divisions: [],
    districts: [],
    upazilas: [],
  });

  // AI Symptom Assistant state
  const [aiSymptomInput, setAiSymptomInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedChamber, setSelectedChamber] = useState<any | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [problemDescription, setProblemDescription] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isDoctorOnLeave, setIsDoctorOnLeave] = useState(false);
  const [doctorLeaveReason, setDoctorLeaveReason] = useState<string | null>(null);

  // Fetch doctors based on current filters
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (specialty) params.specialty = specialty;
      if (symptom) params.symptom = symptom;
      if (division) params.division = division;
      if (district) params.district = district;
      if (isVeterinary) params.isVeterinary = 'true';
      if (maxFee) params.maxFee = maxFee;

      const res = await api.get('/doctors', { params });
      if (res.data.success) {
        setDoctors(res.data.doctors || []);
        setTotalDoctors(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialty, symptom, division, district, isVeterinary, maxFee]);

  // Load filter metadata
  useEffect(() => {
    api.get('/doctors/specialties/list').then((res) => {
      if (res.data.success) setSpecialtiesList(res.data.specialties || []);
    });
    api.get('/doctors/locations/list').then((res) => {
      if (res.data.success) {
        setLocations({
          divisions: res.data.divisions || [],
          districts: res.data.districts || [],
          upazilas: res.data.upazilas || [],
        });
      }
    });
  }, []);

  // Update patient form if logged in user changes
  useEffect(() => {
    if (user) {
      setPatientName(user.name);
      setPatientPhone(user.phone);
      setOtpVerified(true);
        toast.success('Mobile phone verified successfully!');
    }
  }, [user]);

  // Fetch Chamber Live Slot Availabilities & Doctor Leave Schedule
  useEffect(() => {
    if (!selectedChamber?.id || !appointmentDate) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;
    const fetchChamberSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await api.get(`/appointments/chamber/${selectedChamber.id}/slots?date=${appointmentDate}`);
        if (isMounted && res.data.success) {
          setIsDoctorOnLeave(Boolean(res.data.isDoctorOnLeave));
          setDoctorLeaveReason(res.data.leaveReason || null);
          const slots = res.data.slots || [];
          setAvailableSlots(slots);
          const firstOpen = slots.find((s: any) => !s.isFull && !res.data.isDoctorOnLeave);
          setSelectedSlot(firstOpen || null);
        }
      } catch (err: any) {
        console.error('Error fetching chamber slots:', err);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    };

    fetchChamberSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedChamber?.id, appointmentDate]);

  // Handle AI Symptom Search Triage
  const handleAiSymptomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSymptomInput) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/clinical-notes-autocomplete', {
        chiefComplaint: aiSymptomInput,
        isVeterinary,
      });
      if (res.data.success) {
        setAiSuggestions(res.data.recommendation);
        setSymptom(aiSymptomInput);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Open booking modal
  const openBookingModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setSelectedChamber(doctor.chambers?.[0] || null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setIsDoctorOnLeave(false);
    setDoctorLeaveReason(null);
    setBookingSuccess(null);
    setOtpSent(false);
    setOtpCode('');
    if (user?.isPhoneVerified) {
      setOtpVerified(true);
    } else {
      setOtpVerified(false);
    }
  };

  // Request Guest OTP
  const handleRequestOtp = async () => {
    if (!patientPhone) {
      toast.warning('Please enter your mobile phone number first.');
      return;
    }
    try {
      const res = await api.post('/auth/guest-otp/request', {
        phone: patientPhone,
        name: patientName,
      });
      if (res.data.success) {
        setOtpSent(true);
        setDevOtp(res.data.devOtp || '123456');
        setOtpCode(res.data.devOtp || '123456');
        toast.info('OTP code sent to your mobile phone.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  // Verify Guest OTP
  const handleVerifyOtp = async () => {
    try {
      const res = await api.post('/auth/guest-otp/verify', {
        phone: patientPhone,
        otp: otpCode,
        name: patientName,
      });
      if (res.data.success) {
        setOtpVerified(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OTP verification failed.');
    }
  };

  // Confirm Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedChamber) return;
    if (!selectedSlot) {
      toast.warning('Please select an available appointment time slot.');
      return;
    }
    if (selectedSlot.isFull || isDoctorOnLeave) {
      toast.error('The selected slot is unavailable or fully booked. Please select another slot.');
      return;
    }
    if (!patientName || !patientPhone) {
      toast.warning('Please provide patient name and phone number.');
      return;
    }
    if (!user && !otpVerified) {
      toast.warning('Please verify your mobile number via OTP first.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/appointments/book', {
        doctorId: selectedDoctor.id,
        chamberId: selectedChamber.id,
        appointmentDate,
        timeSlot: selectedSlot.slotTitle,
        patientName,
        patientPhone,
        problemDescription,
        isGuestBooking: !user,
        otpVerified: true,
      });

      if (res.data.success) {
        setBookingSuccess(res.data.appointment);
        toast.success(`Appointment confirmed! Serial #${res.data.appointment?.serialNumber || 1}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner with Integrated Medical Search */}
      <section className="bg-gradient-to-b from-brand-50/70 via-slate-50 to-slate-50 border-b border-slate-200/80 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Bangladeshi Doctors &bull; Zero Booking Fee for Patients</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Find, Book & Follow-up with Bangladesh’s Top Doctors
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600">
              Chamber visits, automated Medical Cases, and digital report reviews. Guest booking supported with SMS verification.
            </p>
          </div>

          {/* Quick Search Card */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-4 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchDoctors();
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Keyword / Doctor search */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-slate-400" /> Doctor Name or Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Tanvir or Cardiology"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                />
              </div>

              {/* Specialty dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">All Specialties</option>
                  {specialtiesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Division / District */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Division / Area
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">All Divisions (Bangladesh)</option>
                  {locations.divisions.map((d) => (
                    <option key={d} value={d}>
                      {d} Division
                    </option>
                  ))}
                </select>
              </div>

              {/* Search submit button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Doctors</span>
                </button>
              </div>
            </form>

            {/* Quick Filter Badges */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-medium">Quick Filters:</span>
                <button
                  onClick={() => {
                    setIsVeterinary(!isVeterinary);
                  }}
                  className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
                    isVeterinary
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Cat className="w-3.5 h-3.5" />
                  <span>Veterinary / Cat-First</span>
                </button>

                <button
                  onClick={() => setSpecialty(specialty === 'Cardiology' ? '' : 'Cardiology')}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    specialty === 'Cardiology'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cardiology
                </button>

                <button
                  onClick={() => setSpecialty(specialty === 'Pediatrics' ? '' : 'Pediatrics')}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    specialty === 'Pediatrics'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Pediatrics (Child)
                </button>

                <button
                  onClick={() =>
                    setSpecialty(
                      specialty === 'Gynecology & Obstetrics' ? '' : 'Gynecology & Obstetrics'
                    )
                  }
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    specialty === 'Gynecology & Obstetrics'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Gynecology & Maternity
                </button>
              </div>

              {(search || specialty || symptom || division || isVeterinary || maxFee) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSpecialty('');
                    setSymptom('');
                    setDivision('');
                    setDistrict('');
                    setIsVeterinary(false);
                    setMaxFee('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Directory & AI Assistant */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Filter Sidebar & AI Symptom Checker */}
          <div className="space-y-6">
            {/* AI Smart Symptom Triage Box */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-500/20 rounded-full blur-xl" />
              <div className="flex items-center gap-2 mb-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>AI Clinical Assistant</span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                Not sure which specialist to see?
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Describe your symptoms or your cat/pet condition. AI will suggest matching medical disciplines.
              </p>

              <form onSubmit={handleAiSymptomSearch} className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="e.g. chest tight morning or kitten sneezing"
                  value={aiSymptomInput}
                  onChange={(e) => setAiSymptomInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? (
                    'Analyzing symptoms...'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Get AI Medical Suggestion</span>
                    </>
                  )}
                </button>
              </form>

              {aiSuggestions && (
                <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1">
                  <p className="font-semibold text-brand-300">
                    Clinical Impression: {aiSuggestions.diagnosis}
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Recommended investigations: {aiSuggestions.investigations?.slice(0, 2).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-600" />
                  <span>Refine Results</span>
                </h4>
                <span className="text-xs text-slate-500">{totalDoctors} doctor(s)</span>
              </div>

              {/* Consultation Fee Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex justify-between">
                  <span>Max Consultation Fee</span>
                  <span className="text-brand-600 font-bold">
                    {maxFee ? `${maxFee} BDT` : 'Any'}
                  </span>
                </label>
                <input
                  type="range"
                  min="300"
                  max="2500"
                  step="100"
                  value={maxFee || 2500}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>300 BDT</span>
                  <span>1500 BDT</span>
                  <span>2500 BDT</span>
                </div>
              </div>

              {/* Veterinary Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeterinary}
                    onChange={(e) => setIsVeterinary(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Cat className="w-3.5 h-3.5 text-amber-500" /> Feline & Pet Doctors
                    </span>
                    <p className="text-[10px] text-slate-500">Cat-first veterinary care</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right 3 Columns: Doctor Cards List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Available Doctors {specialty && `in ${specialty}`} {division && `(${division})`}
              </h2>
              <span className="text-xs text-slate-500">
                Sorted by medical relevance & rating
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500">Loading verified doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No doctors found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your specialty, division or fee filter to see available doctors.
                </p>
                <button
                  onClick={() => {
                    setSpecialty('');
                    setSearch('');
                    setDivision('');
                    setIsVeterinary(false);
                    setMaxFee('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              doctors.map((doctor) => {
                const primaryChamber = doctor.chambers?.[0];
                const isSponsored = doctor.isSponsored;

                return (
                  <div
                    key={doctor.id}
                    className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                      isSponsored
                        ? 'border-brand-300 ring-1 ring-brand-100 bg-gradient-to-r from-white via-white to-brand-50/20'
                        : 'border-slate-200'
                    } p-5 sm:p-6`}
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md">
                            {doctor.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                          {doctor.verificationStatus === 'VERIFIED' && (
                            <div
                              title="BMDC Verified Specialist"
                              className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow"
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                              {doctor.user.name}
                            </h3>
                            {isSponsored && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800">
                                Featured
                              </span>
                            )}
                            {doctor.isVeterinary && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Cat className="w-3 h-3" /> Cat & Pet Specialist
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-brand-700 font-semibold">
                            {doctor.degrees?.join(', ')}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                            <span className="font-medium text-slate-800">
                              {doctor.specialties?.join(' &bull; ')}
                            </span>
                            <span>&bull;</span>
                            <span>{doctor.experienceYears} Years Exp</span>
                          </div>

                          {/* BMDC & Rating */}
                          <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                              BMDC: {doctor.bmdcRegNumber}
                            </span>
                            <div className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{doctor.rating?.toFixed(1) || '4.9'}</span>
                              <span className="text-slate-400 font-normal">
                                ({doctor.totalReviews || 12} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Fee & Booking CTA */}
                      <div className="sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                            Consultation Fee
                          </p>
                          <p className="text-xl font-extrabold text-slate-900">
                            {doctor.baseConsultationFee} BDT
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            Follow-up: {doctor.followUpFee} BDT
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            onClick={() => openBookingModal(doctor)}
                            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-brand-500/20 transition flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Appointment</span>
                          </button>
                          <Link
                            href={`/doctors/${doctor.id}`}
                            className="px-4 py-2.5 border border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>View Profile &amp; Gallery</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Chambers Info */}
                    {doctor.chambers && doctor.chambers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {doctor.chambers.map((chamber: any) => (
                          <div
                            key={chamber.id}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5"
                          >
                            <Building className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800">{chamber.name}</p>
                              <p className="text-slate-500 text-[11px]">
                                {chamber.address}, {chamber.upazilaThana}, {chamber.district}
                              </p>
                              {chamber.schedules && chamber.schedules.length > 0 && (
                                <p className="text-[10px] text-brand-700 font-medium mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {chamber.schedules[0].startTime} - {chamber.schedules[0].endTime} (Shift max {chamber.schedules[0].maxPatientsPerShift} patients)
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal with Guest Mobile OTP Verification */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              &times;
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Booked!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your appointment with <strong>{selectedDoctor.user.name}</strong> has been registered.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Appointment No:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {bookingSuccess.appointmentNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient Serial:</span>
                    <span className="font-bold text-brand-600 text-sm">
                      Serial #{bookingSuccess.serialNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time Slot:</span>
                    <strong className="text-slate-800">
                      {bookingSuccess.timeSlot || selectedSlot?.slotTitle}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chamber:</span>
                    <span className="font-semibold text-slate-800">
                      {bookingSuccess.chamber?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(bookingSuccess.appointmentDate).toDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                    Chamber Appointment Booking
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedDoctor.user.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDoctor.specialties?.join(', ')} &bull; Fee: {selectedDoctor.baseConsultationFee} BDT
                  </p>
                </div>

                {/* Chamber Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Select Chamber</label>
                  <select
                    value={selectedChamber?.id || ''}
                    onChange={(e) => {
                      const ch = selectedDoctor.chambers?.find((c: any) => c.id === e.target.value);
                      setSelectedChamber(ch);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {selectedDoctor.chambers?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.upazilaThana})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Appointment Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                {/* Time Slot Picker Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>Select Appointment Time Slot</span>
                    </label>
                    {availableSlots.length > 0 && !isDoctorOnLeave && (
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                        {availableSlots.filter((s: any) => !s.isFull).length} of {availableSlots.length} shifts open
                      </span>
                    )}
                  </div>

                  {isDoctorOnLeave && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <div>
                        <strong className="block font-bold">Doctor is on scheduled leave on this date:</strong>
                        <span>{doctorLeaveReason || 'Consultation hours are closed. Please select another date.'}</span>
                      </div>
                    </div>
                  )}

                  {slotsLoading ? (
                    <div className="py-4 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 animate-pulse flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Checking slot capacities & doctor schedule...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableSlots.map((slot: any) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const isUnavailable = slot.isFull || isDoctorOnLeave;

                        return (
                          <button
                            type="button"
                            key={slot.id}
                            disabled={isUnavailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-600'
                                : isUnavailable
                                ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed'
                                : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                <span className="line-clamp-1">{slot.slotTitle}</span>
                              </div>

                              {isUnavailable ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>FULL</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                  {slot.availableCount} LEFT
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10.5px]">
                              <div className="flex items-center gap-1 text-slate-500 font-medium">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>
                                  Limit: {slot.bookedCount} / {slot.maxCapacity} booked
                                </span>
                              </div>

                              {isSelected && !isUnavailable && (
                                <span className="text-brand-700 font-bold text-[10px] flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-brand-600" />
                                  <span>Selected</span>
                                </span>
                              )}
                            </div>

                            {/* Micro Progress Bar */}
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  isUnavailable
                                    ? 'bg-rose-500'
                                    : slot.bookedCount / slot.maxCapacity > 0.7
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, (slot.bookedCount / slot.maxCapacity) * 100)}%`,
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center text-xs text-amber-800">
                      No chamber consultation slots scheduled for this day. Please choose another date.
                    </div>
                  )}
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Patient Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahim Uddin"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number (BD)
                    </label>
                    <input
                      type="text"
                      placeholder="+88017xxxxxxxx"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Guest Booking OTP Verification Section */}
                {!user && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>Guest Mobile Verification (Required)</span>
                      </span>
                      {otpVerified && (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>

                    {!otpVerified && (
                      <>
                        {!otpSent ? (
                          <button
                            type="button"
                            onClick={handleRequestOtp}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                          >
                            Send OTP via SMS
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-600">
                              Enter the 6-digit OTP code sent to your mobile:
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white font-mono"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                              >
                                Verify OTP
                              </button>
                            </div>
                            {devOtp && (
                              <p className="text-[10px] text-amber-800">
                                (Dev/Testing OTP: <strong>{devOtp}</strong>)
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Problem Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Chief Complaint / Symptoms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your symptoms or health concern..."
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading || !selectedSlot || selectedSlot.isFull || isDoctorOnLeave || (!user && !otpVerified)}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      'Securing appointment serial...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Appointment (Pay at Chamber)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Patient pays fee directly at the chamber counter. No online payment required for booking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

