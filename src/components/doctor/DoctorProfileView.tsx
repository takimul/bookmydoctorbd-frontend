'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  Award,
  Phone,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  User,
  Heart,
  Share2,
} from 'lucide-react';
import { DoctorProfile, Chamber } from '@/types/doctor';
import { AppointmentSlotAvailability } from '@/types/appointment';
import SlotBookingCard from '@/components/appointments/SlotBookingCard';
import DoctorGallery from '@/components/doctor/DoctorGallery';

interface DoctorProfileViewProps {
  doctor: DoctorProfile;
}

export default function DoctorProfileView({ doctor }: DoctorProfileViewProps) {
  const toast = useToast();

  const doctorName = doctor.user?.name || 'Verified Physician';
  const bmdc = doctor.bmdcRegNumber || 'Verified BMDC';
  const specialties = Array.isArray(doctor.specialties) ? doctor.specialties : [];
  const degrees = Array.isArray(doctor.degrees) ? doctor.degrees : [];
  const languages = Array.isArray(doctor.languages) ? doctor.languages : [];
  const chambers = Array.isArray(doctor.chambers) ? doctor.chambers : [];
  const rating = typeof doctor.rating === 'number' ? doctor.rating.toFixed(1) : '5.0';
  const totalReviews = doctor.totalReviews || 0;
  const experienceYears = doctor.experienceYears || 0;
  const baseFee = doctor.baseConsultationFee || 500;
  const followUpFee = doctor.followUpFee || 300;

  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(
    chambers.length > 0 ? chambers[0] : null
  );
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlotAvailability | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Booking Form State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  const handleSelectSlot = (slot: AppointmentSlotAvailability, date: string) => {
    setSelectedSlot(slot);
    setAppointmentDate(date);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim() || !patientPhone.trim()) {
      toast.warning('Please enter patient name and mobile number.');
      return;
    }

    if (!selectedChamber || !selectedSlot) {
      toast.warning('Please select a chamber and an available time slot.');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await api.post('/appointments/book', {
        doctorId: doctor.id,
        chamberId: selectedChamber.id,
        appointmentDate,
        timeSlot: selectedSlot.slotTitle,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        problemDescription: problemDescription.trim() || null,
        isGuestBooking: true,
        otpVerified: true,
      });

      if (res.data.success) {
        toast.success(
          `Appointment confirmed! Serial #${res.data.appointment?.serialNumber || 1}`
        );
        setBookingSuccessData(res.data.appointment);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to complete booking. Please try another slot.'
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.info('Doctor profile link copied to clipboard.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Doctor Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-0 opacity-60 pointer-events-none" />

        {/* Profile Picture */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-100 border-2 border-emerald-500/30 overflow-hidden shadow-md flex items-center justify-center">
            {doctor.profilePhotoUrl ? (
              <img
                src={doctor.profilePhotoUrl}
                alt={doctorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Stethoscope className="w-16 h-16 text-emerald-600/70" />
            )}
          </div>
          {doctor.verificationStatus === 'VERIFIED' && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-xl shadow-md border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-3 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {doctorName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>BMDC: {bmdc}</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-800 mt-1">
                {degrees.length > 0 ? degrees.join(', ') : 'MBBS'}
              </p>
            </div>

            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </button>
          </div>

          {/* Specialties Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {specialties.map((spec) => (
              <span
                key={spec}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Meta Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Experience</span>
              <span className="font-extrabold text-slate-800">{experienceYears} Years</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Rating</span>
              <span className="font-extrabold text-slate-800 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-slate-400 font-normal">({totalReviews})</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Consultation Fee</span>
              <span className="font-extrabold text-emerald-700">৳ {baseFee}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Follow-up Fee</span>
              <span className="font-extrabold text-slate-800">৳ {followUpFee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      {doctor.aboutBio && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-slate-900">About the Physician</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {doctor.aboutBio}
          </p>
          {languages.length > 0 && (
            <div className="pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Consultation Languages: </span>
              {languages.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Doctor Gallery & Certifications Component */}
      <DoctorGallery gallery={doctor.gallery} doctorName={doctorName} />

      {/* Chamber Selection & Slot-Wise Booking System */}
      <div className="space-y-4" id="book-slot">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Chamber Schedules &amp; Slot-Wise Booking
          </h2>
          <p className="text-xs text-slate-500">
            Select a chamber location to view real-time remaining slot capacity (set by the physician).
          </p>
        </div>

        {/* Chamber Selector Tabs */}
        {chambers.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {chambers.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setSelectedChamber(c);
                    setSelectedSlot(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedChamber?.id === c.id
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{c.name}</span>
                  <span className="opacity-80 text-[10px]">({c.district})</span>
                </button>
              ))}
            </div>

            {/* Selected Chamber's Slot Availability Card */}
            {selectedChamber && (
              <SlotBookingCard
                chamber={selectedChamber}
                onSelectSlot={handleSelectSlot}
                selectedSlotTitle={selectedSlot?.slotTitle}
                selectedDate={appointmentDate}
              />
            )}
          </div>
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
            No active chambers configured for this doctor currently. Please check back soon.
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingModalOpen && selectedSlot && selectedChamber && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Confirm Chamber Appointment</h3>
                <p className="text-xs text-emerald-100">
                  {doctorName} &bull; {selectedChamber.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            {bookingSuccessData ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Appointment Successfully Booked!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your appointment serial number has been reserved.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serial Number:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      #{bookingSuccessData.serialNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Appointment Code:</span>
                    <strong className="text-slate-900 font-mono">
                      {bookingSuccessData.appointmentNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date &amp; Time Slot:</span>
                    <strong className="text-emerald-800">
                      {appointmentDate} &bull; {selectedSlot.slotTitle}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <strong className="text-slate-900 font-bold">
                      ৳ {selectedChamber.consultationFee} (Pay at chamber counter)
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccessData(null);
                    setBookingModalOpen(false);
                    setSelectedSlot(null);
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {/* Slot Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-slate-900">{appointmentDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Slot:</span>
                    <strong className="text-emerald-800 font-bold">{selectedSlot.slotTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Availability:</span>
                    <span className="font-semibold text-emerald-700">
                      {selectedSlot.availableCount} of {selectedSlot.maxCapacity} spots available
                    </span>
                  </div>
                </div>

                {/* Patient Information */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01711223344"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brief Problem / Chief Complaint (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fever for 3 days, body pain..."
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    {bookingSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
