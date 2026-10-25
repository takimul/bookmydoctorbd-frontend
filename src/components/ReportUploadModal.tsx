'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
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
} from 'lucide-react';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultName?: string;
  medicalCaseId?: string;
  onUploadSuccess?: (newReport: any) => void;
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
  const [patientPhone, setPatientPhone] = useState(defaultPhone);
  const [patientName, setPatientName] = useState(defaultName);
  const [testName, setTestName] = useState('');
  const [hospitalClinicName, setHospitalClinicName] = useState('Popular Diagnostic Centre');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('image/jpeg');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // AI OCR / Report Analysis state
  const [rawOcrText, setRawOcrText] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      alert('Please enter or paste report text/findings for AI analysis.');
      return;
    }
    setAnalyzingAi(true);
    try {
      const res = await api.post('/ai/parse-report-prescription', {
        rawReportText: rawOcrText || notes,
        hospitalName: hospitalClinicName,
      });
      if (res.data.success) {
        setAiAnalysisResult(res.data.data);
        if (res.data.data.suggestedClinicalNote) {
          setNotes((prev) => (prev ? `${prev}\n${res.data.data.suggestedClinicalNote}` : res.data.data.suggestedClinicalNote));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to analyze report.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Handle Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName) {
      alert('Test name is required.');
      return;
    }
    if (!fileUrl) {
      alert('Please upload an image/document or provide a report URL.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientPhone: patientPhone.trim() || undefined,
        patientName: patientName.trim() || undefined,
        medicalCaseId: medicalCaseId || undefined,
        testName,
        hospitalClinicName,
        reportDate,
        notes,
        fileUrl,
        fileType,
        aiSummary: aiAnalysisResult?.suggestedClinicalNote || (aiAnalysisResult?.abnormalFindings ? aiAnalysisResult.abnormalFindings.join('; ') : undefined),
      };

      const res = await api.post('/medical-cases/reports/upload', payload);
      if (res.data.success) {
        alert('Medical report uploaded and indexed successfully!');
        if (onUploadSuccess) onUploadSuccess(res.data.report);
        onClose();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Upload Diagnostic Medical Report</h2>
              <p className="text-xs text-slate-400">Attach patient investigation findings, scans, or lab slips.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          
          {/* Patient Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient Mobile Number *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 01811112222"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Test & Clinic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Investigation / Test Name *</label>
              <input
                type="text"
                list="tests-list"
                placeholder="e.g. Complete Blood Count (CBC)"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                required
              />
              <datalist id="tests-list">
                {COMMON_TESTS.map((t, idx) => (
                  <option key={idx} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Diagnostic Centre / Hospital</label>
              <input
                type="text"
                list="labs-list"
                placeholder="e.g. Popular Diagnostic Centre"
                value={hospitalClinicName}
                onChange={(e) => setHospitalClinicName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
              <datalist id="labs-list">
                {COMMON_BANGLADESH_LABS.map((lab, idx) => (
                  <option key={idx} value={lab} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Report Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Document Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="image/jpeg">Diagnostic Scan Image (JPEG/PNG)</option>
                <option value="application/pdf">Lab PDF Document</option>
              </select>
            </div>
          </div>

          {/* File Upload Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Report File / Document Scan *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Click to browse or drag & drop report image/PDF</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP, and PDF files</p>
            </div>

            {/* Direct URL alternative */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-500">Or paste public Image/PDF URL:</span>
              <input
                type="text"
                placeholder="https://example.com/reports/scan.jpg"
                value={fileUrl.startsWith('data:') ? '' : fileUrl}
                onChange={(e) => {
                  setFileUrl(e.target.value);
                  setPreviewDataUrl(e.target.value);
                }}
                className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
              />
            </div>

            {/* Image Preview */}
            {previewDataUrl && !fileType.includes('pdf') && (
              <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 relative inline-block">
                <img
                  src={previewDataUrl}
                  alt="Report Preview"
                  className="max-h-40 rounded-lg object-contain"
                />
                <span className="text-[10px] text-emerald-700 font-bold block mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> File ready for indexing
                </span>
              </div>
            )}
          </div>

          {/* AI Biomarker & Report OCR Section */}
          <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>AI Biomarker & Report Parser</span>
              </span>
              <span className="text-[10px] text-slate-400">Extracts vital signs & abnormal lab values</span>
            </div>

            <textarea
              rows={2}
              placeholder="Paste raw lab results or report notes e.g. Hb 10.5 gm/dl, FBS 8.2 mmol/L, Creatinine 1.4 mg/dL..."
              value={rawOcrText}
              onChange={(e) => setRawOcrText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400"
            />

            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={analyzingAi}
              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzingAi ? 'Analyzing Biomarkers...' : 'Run AI Analysis & Auto-Fill'}</span>
            </button>

            {aiAnalysisResult && (
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-[11px] space-y-1 text-slate-200">
                <p className="font-bold text-teal-300">
                  Detected Hospital: {aiAnalysisResult.detectedHospital}
                </p>
                {aiAnalysisResult.abnormalFindings?.length > 0 && (
                  <div className="text-rose-300 font-semibold space-y-0.5">
                    <span>Abnormal Biomarkers Flagged:</span>
                    {aiAnalysisResult.abnormalFindings.map((f: string, i: number) => (
                      <p key={i}>&bull; {f}</p>
                    ))}
                  </div>
                )}
                {aiAnalysisResult.suggestedClinicalNote && (
                  <p className="text-slate-300 italic pt-1">
                    Note: {aiAnalysisResult.suggestedClinicalNote}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Clinical Doctor Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Doctor Impression / Report Notes</label>
            <textarea
              rows={2}
              placeholder="Clinical summary or key findings to show on patient timeline..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Uploading...' : 'Save & Link to Patient History'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

