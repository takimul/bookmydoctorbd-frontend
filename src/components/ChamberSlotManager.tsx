'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Building,
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  MapPin,
  Phone,
  AlertCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface ChamberSlotManagerProps {
  onQueueUpdated?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];

export default function ChamberSlotManager({ onQueueUpdated }: ChamberSlotManagerProps) {
  const [loading, setLoading] = useState(true);
  const [chambers, setChambers] = useState<any[]>([]);

  // Chamber Add/Edit modal state
  const [showAddChamberModal, setShowAddChamberModal] = useState(false);
  const [chamberName, setChamberName] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazilaThana, setUpazilaThana] = useState('Dhanmondi');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [consultationFee, setConsultationFee] = useState(1200);
  const [followUpFee, setFollowUpFee] = useState(700);

  // Slot Management State for selected chamber
  const [selectedChamberForSlots, setSelectedChamberForSlots] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Walk-in / Phone-in Appointment Booking modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [bookChamberId, setBookChamberId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookTimeSlot, setBookTimeSlot] = useState('9:00 PM - 10:00 PM');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [problemDescription, setProblemDescription] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load Doctor's Chambers & Schedules
  const loadChambers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/me/profile');
      if (res.data.success && res.data.doctor) {
        const chList = res.data.doctor.chambers || [];
        setChambers(chList);
        if (chList.length > 0 && !selectedChamberForSlots) {
          setSelectedChamberForSlots(chList[0]);
          setSchedules(chList[0].schedules || []);
          setBookChamberId(chList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load chambers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChambers();
  }, []);

  // Select chamber to view/edit slots
  const handleSelectChamber = (ch: any) => {
    setSelectedChamberForSlots(ch);
    setSchedules(ch.schedules || []);
    setBookChamberId(ch.id);
  };

  // Add new slot to schedule
  const handleAddSlot = () => {
    setSchedules([
      ...schedules,
      {
        dayOfWeek: 6,
        startTime: '21:00',
        endTime: '22:00',
        slotTitle: 'Night Slot (9:00 PM - 10:00 PM)',
        slotDurationMinutes: 15,
        maxPatientsPerShift: 10, // Doctor-configurable limit!
        isActive: true,
      },
    ]);
  };

  // Save Slots for Selected Chamber
  const handleSaveSlots = async () => {
    if (!selectedChamberForSlots) return;

    try {
      const payload = {
        id: selectedChamberForSlots.id,
        name: selectedChamberForSlots.name,
        division: selectedChamberForSlots.division,
        district: selectedChamberForSlots.district,
        upazilaThana: selectedChamberForSlots.upazilaThana,
        address: selectedChamberForSlots.address,
        contactPhone: selectedChamberForSlots.contactPhone,
        consultationFee: selectedChamberForSlots.consultationFee,
        followUpFee: selectedChamberForSlots.followUpFee,
        schedules,
      };

      const res = await api.post('/doctors/chambers', payload);
      if (res.data.success) {
        alert('Chamber appointment slots & capacity limits saved successfully!');
        loadChambers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update chamber slots.');
    }
  };

  // Add New Chamber
  const handleCreateChamber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: chamberName,
        division,
        district,
        upazilaThana,
        address,
        contactPhone,
        consultationFee,
        followUpFee,
        schedules: [
          {
            dayOfWeek: 6,
            startTime: '21:00',
            endTime: '22:00',
            slotTitle: 'Night Slot (9:00 PM - 10:00 PM)',
            slotDurationMinutes: 15,
            maxPatientsPerShift: 10,
          },
        ],
      };

      const res = await api.post('/doctors/chambers', payload);
      if (res.data.success) {
        alert('New Chamber registered successfully!');
        setShowAddChamberModal(false);
        loadChambers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add chamber.');
    }
  };

  // Direct Walk-in / Phone-in Appointment Booking
  const handleBookWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookChamberId || !patientName || !patientPhone) {
      alert('Chamber, patient name, and mobile number are required.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        chamberId: bookChamberId,
        appointmentDate: bookDate,
        timeSlot: bookTimeSlot,
        patientName,
        patientPhone,
        age: patientAge,
        gender: patientGender,
        problemDescription,
      };

      const res = await api.post('/appointments/doctor-book', payload);
      if (res.data.success) {
        alert(`Success! Appointment confirmed. Serial #${res.data.appointment?.serialNumber}.`);
        setShowWalkInModal(false);
        setPatientName('');
        setPatientPhone('');
        setProblemDescription('');
        if (onQueueUpdated) onQueueUpdated();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Loading chambers and slot limits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Chambers & Slot Capacity Management
          </h2>
          <p className="text-xs text-slate-500">
            Define appointment slots (e.g. 9 to 10 PM) and set maximum patient capacity (e.g. max 10 patients) per slot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Direct Book Button */}
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Book Walk-in Patient</span>
          </button>

          <button
            onClick={() => setShowAddChamberModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Chamber</span>
          </button>
        </div>
      </div>

      {/* Chamber Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {chambers.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleSelectChamber(ch)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
              selectedChamberForSlots?.id === ch.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4 text-teal-400" />
            <span>{ch.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-teal-200">
              {ch.schedules?.length || 0} Slots
            </span>
          </button>
        ))}
      </div>

      {/* Selected Chamber's Schedule & Slot Capacity Editor */}
      {selectedChamberForSlots && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                  Active Chamber
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedChamberForSlots.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedChamberForSlots.address}, {selectedChamberForSlots.upazilaThana}, {selectedChamberForSlots.district}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSlot}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shift / Slot</span>
            </button>
          </div>

          {/* Slots Table */}
          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No appointment slots configured for this chamber yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Click &quot;Add Shift / Slot&quot; to configure your visiting hours.</p>
              </div>
            ) : (
              schedules.map((slot, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center"
                >
                  {/* Day of Week */}
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Day of Week</label>
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[idx].dayOfWeek = parseInt(e.target.value, 10);
                        setSchedules(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Title / Name */}
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Slot Name / Time Window</label>
                    <input
                      type="text"
                      placeholder="e.g. 9:00 PM - 10:00 PM"
                      value={slot.slotTitle || `${slot.startTime} - ${slot.endTime}`}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[idx].slotTitle = e.target.value;
                        setSchedules(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  {/* Start & End Time */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Time (24h)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx].startTime = e.target.value;
                          setSchedules(updated);
                        }}
                        className="w-full px-1.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx].endTime = e.target.value;
                          setSchedules(updated);
                        }}
                        className="w-full px-1.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* DOCTOR CONFIGURABLE CAPACITY LIMIT */}
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-emerald-800 block mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Max Patients Limit *</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="10"
                        value={slot.maxPatientsPerShift || 10}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx].maxPatientsPerShift = parseInt(e.target.value, 10) || 10;
                          setSchedules(updated);
                        }}
                        className="w-24 px-2.5 py-1.5 rounded-xl border-2 border-emerald-500 bg-white font-extrabold text-emerald-800 text-center text-sm shadow-sm"
                      />
                      <span className="text-[11px] text-slate-500">
                        Patients max capacity
                      </span>
                    </div>
                  </div>

                  {/* Delete Slot */}
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSchedules(schedules.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Save Slots Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Patients booking this slot will be capped automatically by your set limit.</span>
            </div>

            <button
              type="button"
              onClick={handleSaveSlots}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Shifts & Slot Limits</span>
            </button>
          </div>

        </div>
      )}

      {/* MODAL 1: Direct Walk-In / Phone-In Patient Booking from Dashboard */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Book Chamber Walk-In Patient</h3>
                  <p className="text-xs text-slate-400">Instantly register a patient into the live queue.</p>
                </div>
              </div>
              <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-white">
                <Trash2 className="w-5 h-5 opacity-0" /> {/* spacer */}
                &times;
              </button>
            </div>

            <form onSubmit={handleBookWalkIn} className="p-6 space-y-4 text-xs">
              
              {/* Select Chamber */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chamber Location *</label>
                <select
                  value={bookChamberId}
                  onChange={(e) => setBookChamberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  required
                >
                  {chambers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time Slot Window *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 PM - 10:00 PM"
                    value={bookTimeSlot}
                    onChange={(e) => setBookTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    required
                  />
                </div>
              </div>

              {/* Patient Name & Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 01811112222"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="text"
                    placeholder="e.g. 45"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Chief Problem / Symptoms */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chief Symptoms / Problem</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High fever for 3 days, dry cough, severe body ache..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{bookingLoading ? 'Booking...' : 'Confirm Walk-in Serial'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Chamber Modal */}
      {showAddChamberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Register New Chamber</h3>
                  <p className="text-xs text-slate-400">Add a hospital or consultation chamber location.</p>
                </div>
              </div>
              <button onClick={() => setShowAddChamberModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateChamber} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chamber Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Popular Diagnostic Centre - Dhanmondi Branch"
                  value={chamberName}
                  onChange={(e) => setChamberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Upazila / Area</label>
                  <input
                    type="text"
                    value={upazilaThana}
                    onChange={(e) => setUpazilaThana(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Chamber Address *</label>
                <input
                  type="text"
                  placeholder="e.g. House 16, Road 2, Dhanmondi R/A, Dhaka-1205"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chamber Serial Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +8801711000111"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (৳)</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Follow-up Fee (৳)</label>
                  <input
                    type="number"
                    value={followUpFee}
                    onChange={(e) => setFollowUpFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChamberModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Chamber</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

