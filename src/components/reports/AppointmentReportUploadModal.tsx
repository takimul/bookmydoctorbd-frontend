'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface AppointmentReportUploadModalProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Chest X-Ray P/A View',
  'Lipid Profile',
  'Serum Creatinine',
  'Random Blood Sugar (RBS)',
  'Fast Blood Sugar (FBS)',
  'Urine Routine (R/E)',
  'ECG / Echocardiogram',
  'Ultrasonogram (USG)',
  'Prescription Slip / Chamber Note',
];

const COMMON_HOSPITALS = [
  'Popular Diagnostic Centre',
  'Ibn Sina Diagnostic & Consultation',
  'Square Hospitals Diagnostic Lab',
  'LabAid Diagnostics',
  'United Hospital Lab',
  'National Healthcare Diagnostic',
];

export default function AppointmentReportUploadModal({
  appointment,
  isOpen,
  onClose,
  onUploadSuccess,
}: AppointmentReportUploadModalProps) {
  const toast = useToast();

  const [testName, setTestName] = useState('Complete Blood Count (CBC)');
  const [hospitalClinicName, setHospitalClinicName] = useState('Popular Diagnostic Centre');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('image/jpeg');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  // Handle local file picking (JPG, PNG, PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit. Please upload a smaller file or photo.');
      return;
    }

    setFileName(file.name);
    setFileType(file.type || 'image/jpeg');
    setFileSizeStr(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      toast.error('Please specify the Test / Investigation Name.');
      return;
    }

    if (!fileBase64) {
      toast.error('Please select or capture a printed report photo or PDF file.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.post(`/appointments/${appointment.id}/reports`, {
        testName: testName.trim(),
        fileUrl: fileBase64,
        fileType,
        hospitalClinicName: hospitalClinicName.trim() || undefined,
        reportDate,
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Report "${testName}" attached to appointment #${appointment.appointmentNumber}!`);
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-xl shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold border border-teal-100 shadow-sm shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Upload Printed Lab / Test Report
              </h3>
              <p className="text-xs text-slate-500">
                Attach printed report photos or PDFs to appointment #{appointment.appointmentNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Doctor Context Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient</span>
            <span className="font-extrabold text-slate-900">{appointment.patientName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
            <span className="font-mono font-bold text-slate-700">{appointment.patientPhone}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Attending Doctor</span>
            <span className="font-bold text-teal-800">Dr. {appointment.doctor?.user?.name || 'Physician'}</span>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select or Photograph Printed Report (Image or PDF) *
            </label>

            <div className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-4 bg-teal-50/40 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {fileBase64 ? (
                <div className="flex flex-col items-center gap-2">
                  {fileType.includes('pdf') ? (
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img src={fileBase64} alt="Report Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block truncate max-w-xs">{fileName}</span>
                    <span className="text-[11px] text-slate-500">{fileSizeStr} &bull; Click to change file</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    <span className="text-teal-700 font-bold">Click to browse photo / PDF</span> or snap photo on phone
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Supports JPG, PNG, WEBP, or PDF up to 15MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Test Name with Quick Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Test / Investigation Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Blood Count (CBC) or Chest X-Ray"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
            />

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_TESTS.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTestName(t)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                    testName === t
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Center / Hospital Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Diagnostic Center / Hospital Name
            </label>
            <input
              type="text"
              placeholder="e.g. Popular Diagnostic, Ibn Sina, Square Lab..."
              value={hospitalClinicName}
              onChange={(e) => setHospitalClinicName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_HOSPITALS.slice(0, 4).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHospitalClinicName(h)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                    hospitalClinicName === h
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Report Date & Observations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Report Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Notes / Findings (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Hb 10.5, ESR high"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              {uploading ? (
                <span>Uploading Report...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload &amp; Attach to Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

