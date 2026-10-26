'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Upload,
  X,
  FileText,
  Sparkles,
  Building,
  Calendar,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileUp,
} from 'lucide-react';
import { PatientReport } from '@/types/report';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultName?: string;
  medicalCaseId?: string;
  onUploadSuccess?: (newReport: PatientReport) => void;
}

const COMMON_BANGLADESH_LABS = [
  'Popular Diagnostic Centre',
  'Ibn Sina Diagnostic & Consultation Centre',
  'Square Hospitals Diagnostic Lab',
  'Labaid Diagnostics',
  'Evercare Hospital Dhaka',
  'United Hospital Lab',
  'Medinova Medical Services',
  'Bio-Care Diagnostic Centre',
];

const COMMON_TESTS = [
  'Complete Blood Count (CBC) with ESR',
  'Fasting Blood Sugar (FBS)',
  'Random Blood Sugar (RBS)',
  'Glycated Hemoglobin (HbA1c)',
  'Fasting Lipid Profile',
  'Serum Creatinine & Electrolytes',
  'SGPT / ALT (Liver Function)',
  'Urine Routine & Microscopic (R/M/E)',
  'Ultrasonography (USG) of Whole Abdomen',
  'Chest X-Ray P/A View',
  '12-Lead Resting ECG',
  'Dengue NS1 Antigen & Platelet Count',
  'Serum TSH (Thyroid Stimulating Hormone)',
];

export default function ReportUploadModal({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultName = '',
  medicalCaseId,
  onUploadSuccess,
}: ReportUploadModalProps) {
  const toast = useToast();
  const [patientPhone, setPatientPhone] = useState(defaultPhone);
  const [patientName, setPatientName] = useState(defaultName);
  const [testName, setTestName] = useState('');
  const [hospitalClinicName, setHospitalClinicName] = useState('Popular Diagnostic Centre');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('image/jpeg');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // AI OCR / Report Analysis state
  const [rawOcrText, setRawOcrText] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle local file selection from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewDataUrl(result);
      setFileUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Report Parsing
  const handleRunAiAnalysis = async () => {
    if (!rawOcrText && !notes) {
      toast.warning('Please enter or paste report text/findings for AI clinical analysis.');
      return;
    }

    setAnalyzingAi(true);
    try {
      const res = await api.post('/ai/parse-report-prescription', {
        text: rawOcrText || notes,
        type: 'report',
      });
      if (res.data.success && res.data.data) {
        setAiAnalysisResult(res.data.data);
        if (res.data.data.testName && !testName) {
          setTestName(res.data.data.testName);
        }
        toast.success('AI report analysis completed successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI parsing encountered an issue.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Submit report to server
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName.trim()) {
      toast.warning('Please select or specify the test name.');
      return;
    }

    if (!fileUrl && !selectedFile) {
      toast.warning('Please select a report document or image from your device.');
      return;
    }

    setSubmitting(true);
    try {
      let res;

      // If user selected a file, we can upload via multipart FormData
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('testName', testName.trim());
        formData.append('patientPhone', patientPhone.trim());
        formData.append('patientName', patientName.trim());
        if (medicalCaseId) formData.append('medicalCaseId', medicalCaseId);
        formData.append('hospitalClinicName', hospitalClinicName);
        formData.append('reportDate', reportDate);
        if (notes) formData.append('notes', notes);

        res = await api.post('/medical-cases/reports/upload-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Fallback to base64 JSON payload
        res = await api.post('/medical-cases/reports/upload', {
          patientPhone: patientPhone.trim(),
          patientName: patientName.trim(),
          medicalCaseId: medicalCaseId || null,
          testName: testName.trim(),
          fileUrl,
          fileType,
          hospitalClinicName,
          reportDate,
          notes,
          aiSummary: aiAnalysisResult ? JSON.stringify(aiAnalysisResult) : null,
        });
      }

      if (res.data.success) {
        toast.success('Medical report uploaded and indexed successfully.');
        if (onUploadSuccess) {
          onUploadSuccess(res.data.report);
        }
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Upload className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Upload Patient Medical Report</h2>
              <p className="text-xs text-emerald-100">
                Direct device upload with AI report analyzer &amp; lifetime mobile index
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitReport} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Patient Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Patient Mobile Number *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 01711223344"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                required
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Reports are permanently indexed to this phone number
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Patient Full Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tanvir Hossain"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Test Name & Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diagnostic Test Name *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Complete Blood Count (CBC) with ESR"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
            />
            {/* Quick Test Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-100">
              {COMMON_TESTS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTestName(t)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-md transition ${
                    testName === t
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Centre & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Diagnostic Centre / Hospital</span>
              </label>
              <select
                value={hospitalClinicName}
                onChange={(e) => setHospitalClinicName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {COMMON_BANGLADESH_LABS.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
                <option value="Other Diagnostic Centre">Other Diagnostic Centre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Report Date</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* File Upload Selector (Device Upload) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Report Document / Image from Device *</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="report-file-input"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="report-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
              >
                <Upload className="w-8 h-8 text-emerald-600 animate-bounce" />
                <span className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click to choose report file from device'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Supports JPEG, PNG, WEBP, and PDF documents (Max 15 MB)
                </span>
              </label>

              {/* Preview if image */}
              {previewDataUrl && previewDataUrl.startsWith('data:image') && (
                <div className="mt-3 relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={previewDataUrl}
                    alt="Report Preview"
                    className="max-h-36 object-contain rounded-lg"
                  />
                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    Ready to upload
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Clinical OCR / Text Parsing Box */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="text-xs font-bold text-emerald-950">
                  AI Clinical OCR &amp; Diagnostic Parser
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={analyzingAi || (!rawOcrText && !notes)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition shadow-sm"
              >
                {analyzingAi ? 'Analyzing...' : 'Parse Findings'}
              </button>
            </div>

            <textarea
              rows={2}
              placeholder="Paste raw findings, lab values (e.g. Hemoglobin 10.2 g/dL, Platelets 85,000, ESR 45) or clinical impressions..."
              value={rawOcrText}
              onChange={(e) => setRawOcrText(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            {/* AI Result Card */}
            {aiAnalysisResult && (
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>AI Extracted Clinical Summary:</span>
                </div>
                {aiAnalysisResult.impression && (
                  <p className="text-slate-700 font-medium">
                    Impression: {aiAnalysisResult.impression}
                  </p>
                )}
                {aiAnalysisResult.abnormalFindings && (
                  <div className="text-rose-700 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Flags: {Array.isArray(aiAnalysisResult.abnormalFindings) ? aiAnalysisResult.abnormalFindings.join(', ') : aiAnalysisResult.abnormalFindings}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor / Patient Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician / Patient Remarks &amp; Clinical Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add any specific clinical notes, symptom correlation or follow-up instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? 'Uploading Report...' : 'Upload & Save Report'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

