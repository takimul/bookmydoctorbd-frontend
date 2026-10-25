'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
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
import { Chamber, ChamberSchedule } from '@/types/doctor';

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
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [chambers, setChambers] = useState<Chamber[]>([]);

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
  const [selectedChamberForSlots, setSelectedChamberForSlots] = useState<Chamber | null>(null);
  const [schedules, setSchedules] = useState<Partial<ChamberSchedule>[]>([]);

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
        const chList: Chamber[] = res.data.doctor.chambers || [];
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
  const handleSelectChamber = (ch: Chamber) => {
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
        slotTitle: 'Night Shift (9:00 PM - 10:00 PM)',
        slotDurationMinutes: 15,
        maxPatientsPerShift: 10, // Doctor-configurable capacity!
        isActive: true,
      },
    ]);
  };

  // Remove slot
  const handleRemoveSlot = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  // Update schedule field
  const handleUpdateSchedule = (index: number, field: string, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
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
        toast.success('Chamber appointment slots & capacity limits saved successfully!');
        loadChambers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update chamber slots.');
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
            slotTitle: 'Night Shift (9:00 PM - 10:00 PM)',
            slotDurationMinutes: 15,
            maxPatientsPerShift: 10,
          },
        ],
      };

      const res = await api.post('/doctors/chambers', payload);
      if (res.data.success) {
        toast.success('New Chamber registered successfully!');
        setShowAddChamberModal(false);
        setChamberName('');
        setAddress('');
        setContactPhone('');
        loadChambers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add chamber.');
    }
  };

  // Direct Walk-in / Phone-in Appointment Booking
  const handleBookWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookChamberId || !patientName.trim() || !patientPhone.trim()) {
      toast.warning('Chamber, patient name, and mobile number are required.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        chamberId: bookChamberId,
        appointmentDate: bookDate,
        timeSlot: bookTimeSlot,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        age: patientAge,
        gender: patientGender,
        problemDescription,
      };

      const res = await api.post('/appointments/doctor-book', payload);
      if (res.data.success) {
        toast.success(
          `Success! Appointment confirmed. Serial #${res.data.appointment?.serialNumber || 1}.`
        );
        setShowWalkInModal(false);
        setPatientName('');
        setPatientPhone('');
        setProblemDescription('');
        if (onQueueUpdated) onQueueUpdated();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment.');
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
      {/* Top Banner & Action Buttons */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="max-w-xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Slot-Wise Smart Queue Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chambers &amp; Slot Capacity Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Configure visiting hours, chamber locations, and strict capacity limits per slot (e.g. 9-10 PM max 10 patients) to prevent overcrowding.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowAddChamberModal(true)}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Chamber</span>
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl flex items-center gap-2 backdrop-blur-sm transition"
          >
            <UserPlus className="w-4 h-4 text-teal-300" />
            <span>Book Patient into Slot</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Chamber List, Right Slot Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Chamber Selection (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Your Chambers ({chambers.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Click to edit slots</span>
          </h3>

          <div className="space-y-2">
            {chambers.map((ch) => {
              const isSelected = selectedChamberForSlots?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChamber(ch)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{ch.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ch.address}, {ch.upazilaThana}, {ch.district}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      Fee: <strong className="text-slate-900">৳ {ch.consultationFee}</strong>
                    </div>
                    <div className="text-[11px] text-teal-700 font-semibold">
                      {ch.schedules?.length || 0} active slot shift(s)
                    </div>
                  </div>
                </div>
              );
            })}

            {chambers.length === 0 && (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                <Building className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No chambers registered yet.</p>
                <button
                  onClick={() => setShowAddChamberModal(true)}
                  className="px-3 py-1.5 bg-teal-600 text-white font-bold rounded-lg text-xs"
                >
                  Add Chamber
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Slot Configuration for Selected Chamber (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          {selectedChamberForSlots ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Slot Shifts: {selectedChamberForSlots.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure patient capacity limits and visiting time ranges.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddSlot}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Shift Slot</span>
                  </button>

                  <button
                    onClick={handleSaveSlots}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Slot Items List */}
              <div className="space-y-3">
                {schedules.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                  >
                    {/* Day of Week */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Day of Week
                      </label>
                      <select
                        value={s.dayOfWeek ?? 6}
                        onChange={(e) =>
                          handleUpdateSchedule(idx, 'dayOfWeek', parseInt(e.target.value, 10))
                        }
                        className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Time Range */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Hours (Start - End)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={s.startTime || '21:00'}
                          onChange={(e) => handleUpdateSchedule(idx, 'startTime', e.target.value)}
                          className="w-full text-[11px] font-mono px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={s.endTime || '22:00'}
                          onChange={(e) => handleUpdateSchedule(idx, 'endTime', e.target.value)}
                          className="w-full text-[11px] font-mono px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Slot Title / Description */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Slot Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Night Slot (9-10 PM)"
                        value={s.slotTitle || ''}
                        onChange={(e) => handleUpdateSchedule(idx, 'slotTitle', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    {/* Capacity Limit per Shift (Doctor Limit) */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-teal-800 uppercase block mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-teal-600" />
                        <span>Limit (Max)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={s.maxPatientsPerShift ?? 10}
                        onChange={(e) =>
                          handleUpdateSchedule(
                            idx,
                            'maxPatientsPerShift',
                            parseInt(e.target.value, 10) || 10
                          )
                        }
                        className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-teal-300 rounded-lg text-teal-900 focus:outline-none"
                      />
                    </div>

                    {/* Delete Action */}
                    <div className="sm:col-span-1 text-right sm:text-center pt-2 sm:pt-4">
                      <button
                        onClick={() => handleRemoveSlot(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {schedules.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    No slot shifts configured for this chamber yet. Click &quot;Add Shift Slot&quot; above to set your hours and patient limits.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a chamber from the left column to manage its slots.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Chamber */}
      {showAddChamberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Register New Chamber</h3>
            
            <form onSubmit={handleCreateChamber} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chamber / Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Popular Diagnostic Centre, Dhanmondi Branch"
                  value={chamberName}
                  onChange={(e) => setChamberName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division *</label>
                  <input
                    type="text"
                    required
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District / City *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Upazila / Thana / Area *</label>
                <input
                  type="text"
                  required
                  value={upazilaThana}
                  onChange={(e) => setUpazilaThana(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Chamber Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 16, Road 2, Dhanmondi R/A, Dhaka-1205"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chamber Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+8801..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Fee</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Follow-up Fee</label>
                  <input
                    type="number"
                    value={followUpFee}
                    onChange={(e) => setFollowUpFee(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChamberModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Chamber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Walk-in / Phone-in Appointment Booking */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Book Walk-in / Chamber Patient
              </h3>
              <p className="text-xs text-slate-500">
                Directly book a patient into a specific chamber slot with serial number assignment.
              </p>
            </div>

            <form onSubmit={handleBookWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chamber *</label>
                <select
                  value={bookChamberId}
                  onChange={(e) => setBookChamberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  {chambers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot Label</label>
                  <input
                    type="text"
                    value={bookTimeSlot}
                    onChange={(e) => setBookTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anisul Haque"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01811223344"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="text"
                    placeholder="e.g. 35 Yrs"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chief Symptoms / Reason for Visit
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High fever for 2 days, joint ache..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm"
                >
                  {bookingLoading ? 'Assigning Serial...' : 'Confirm Walk-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
