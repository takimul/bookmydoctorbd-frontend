'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Clock, Users, Calendar, AlertCircle, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { AppointmentSlotAvailability, ChamberSlotsResponse } from '@/types/appointment';
import { Chamber } from '@/types/doctor';

interface SlotBookingCardProps {
  chamber: Chamber;
  onSelectSlot: (slot: AppointmentSlotAvailability, date: string) => void;
  selectedSlotTitle?: string;
  selectedDate?: string;
}

export default function SlotBookingCard({
  chamber,
  onSelectSlot,
  selectedSlotTitle,
  selectedDate: initialDate,
}: SlotBookingCardProps) {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [slotsData, setSlotsData] = useState<ChamberSlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch slots for this chamber & date
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/appointments/chamber/${chamber.id}/slots?date=${selectedDate}`);
        if (isMounted && res.data.success) {
          setSlotsData(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.response?.data?.message || 'Could not fetch time slot availability.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [chamber.id, selectedDate]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Chamber Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">{chamber.name}</h4>
          <p className="text-xs text-slate-500">{chamber.address}, {chamber.district}</p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Doctor Leave Banner */}
      {slotsData?.isDoctorOnLeave && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <div>
            <strong className="block font-bold">Doctor is on scheduled leave on this date:</strong>
            <span>{slotsData.leaveReason || 'Visiting hours are paused. Please select another date.'}</span>
          </div>
        </div>
      )}

      {/* Slots Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Available Appointment Slots:</span>
          {slotsData && (
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {slotsData.availableSlotsCount} of {slotsData.totalSlots} slots open
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
            Checking live slot capacities...
          </div>
        ) : slotsData && slotsData.slots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {slotsData.slots.map((slot) => {
              const isSelected = selectedSlotTitle === slot.slotTitle;
              const isUnavailable = slot.isFull || slotsData.isDoctorOnLeave;

              return (
                <button
                  type="button"
                  key={slot.id}
                  disabled={isUnavailable}
                  onClick={() => onSelectSlot(slot, selectedDate)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                      : isUnavailable
                      ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{slot.slotTitle}</span>
                    </div>

                    {isUnavailable ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>FULL</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        {slot.availableCount} LEFT
                      </span>
                    )}
                  </div>

                  {/* Slot capacity meter */}
                  <div className="mt-2 flex items-center justify-between text-[10.5px]">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>
                        Capacity: {slot.bookedCount} / {slot.maxCapacity} booked
                      </span>
                    </div>

                    {!isUnavailable && (
                      <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                        Select <ChevronRight className="w-3 h-3" />
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
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100">
            No consultation shifts configured for this day. Please pick another date.
          </div>
        )}
      </div>
    </div>
  );
}

