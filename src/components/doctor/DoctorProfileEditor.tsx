'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  User,
  Camera,
  Image as ImageIcon,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Stethoscope,
  Briefcase,
  DollarSign,
  Globe,
  FileBadge,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DoctorProfileEditorProps {
  onProfileUpdated?: () => void;
}

export default function DoctorProfileEditor({ onProfileUpdated }: DoctorProfileEditorProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bmdcRegNumber, setBmdcRegNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [degreesText, setDegreesText] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [aboutBio, setAboutBio] = useState('');
  const [languagesText, setLanguagesText] = useState('Bangla, English');
  const [baseConsultationFee, setBaseConsultationFee] = useState(1000);
  const [followUpFee, setFollowUpFee] = useState(600);
  const [digitalFollowUpFee, setDigitalFollowUpFee] = useState(300);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Gallery items: [{ id, url, title, category, date }]
  const [gallery, setGallery] = useState<any[]>([]);

  // Add new gallery photo form state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('achievement');

  // Load current doctor profile
  const loadDoctorProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/me/profile');
      if (res.data.success && res.data.doctor) {
        const doc = res.data.doctor;
        setDoctorData(doc);
        setName(doc.user?.name || '');
        setPhone(doc.user?.phone || '');
        setEmail(doc.user?.email || '');
        setBmdcRegNumber(doc.bmdcRegNumber || '');
        setGender(doc.gender || 'Male');
        setSpecialtiesText(doc.specialties?.join(', ') || '');
        setDegreesText(doc.degrees?.join(', ') || '');
        setExperienceYears(doc.experienceYears || 0);
        setAboutBio(doc.aboutBio || '');
        setLanguagesText(doc.languages?.join(', ') || 'Bangla, English');
        setBaseConsultationFee(doc.baseConsultationFee || 1000);
        setFollowUpFee(doc.followUpFee || 600);
        setDigitalFollowUpFee(doc.digitalFollowUpFee || 300);
        setProfilePhotoUrl(doc.profilePhotoUrl || '');
        setGallery(Array.isArray(doc.gallery) ? doc.gallery : []);
      }
    } catch (err: any) {
      console.error('Failed to load doctor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  // Handle local avatar file selection
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setProfilePhotoUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  // Handle local gallery photo file selection
  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setNewPhotoUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  // Add photo to gallery list
  const handleAddPhotoToGallery = () => {
    if (!newPhotoUrl) {
      toast.warning('Please select an image or enter a photo URL.');
      return;
    }

    const newItem = {
      id: `gal_${Date.now()}`,
      url: newPhotoUrl,
      title: newPhotoTitle || 'Doctor Achievement',
      category: newPhotoCategory,
      date: new Date().toLocaleDateString(),
    };

    setGallery([...gallery, newItem]);
    setNewPhotoUrl('');
    setNewPhotoTitle('');
    toast.info('Photo added to draft gallery. Click Save below to persist.');
  };

  // Remove photo from gallery
  const handleRemovePhoto = (id: string) => {
    setGallery(gallery.filter((g) => g.id !== id));
  };

  // Save full profile to backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        email,
        bmdcRegNumber,
        gender,
        specialties: specialtiesText.split(',').map((s) => s.trim()).filter(Boolean),
        degrees: degreesText.split(',').map((d) => d.trim()).filter(Boolean),
        experienceYears: parseInt(String(experienceYears), 10) || 0,
        aboutBio,
        languages: languagesText.split(',').map((l) => l.trim()).filter(Boolean),
        baseConsultationFee: parseFloat(String(baseConsultationFee)),
        followUpFee: parseFloat(String(followUpFee)),
        digitalFollowUpFee: parseFloat(String(digitalFollowUpFee)),
        profilePhotoUrl,
        gallery,
      };

      const res = await api.patch('/doctors/profile', payload);
      if (res.data.success) {
        toast.success('Doctor Profile & Photo Gallery successfully updated!');
        if (onProfileUpdated) onProfileUpdated();
        loadDoctorProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Loading your clinical profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Card 1: Avatar & Personal Information */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Doctor Profile &amp; Clinical Credentials</h2>
              <p className="text-xs text-slate-500">Manage BMDC credentials, degrees, consultation fees, and profile photo.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              Profile Score: {doctorData?.profileScore || 90}%
            </span>
          </div>

          {/* Profile Photo / Avatar Row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden border-2 border-teal-500 shadow-md flex items-center justify-center">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <label className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
            </div>

            <div className="space-y-1.5 flex-1 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Doctor Profile Photo</h3>
              <p className="text-slate-500">
                A professional high-resolution photo increases patient trust and directory consultation bookings.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition text-slate-700">
                  Browse Photo
                  <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                </label>
                <input
                  type="text"
                  placeholder="Or paste public Image URL..."
                  value={profilePhotoUrl.startsWith('data:') ? '' : profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Doctor Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Number (Login) *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">BMDC Registration Number *</label>
              <input
                type="text"
                placeholder="e.g. A-42195"
                value={bmdcRegNumber}
                onChange={(e) => setBmdcRegNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-teal-800"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
              />
            </div>
          </div>

          {/* Degrees & Specialties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Degrees &amp; Qualifications (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. MBBS (DMC), FCPS (Medicine), MD (Cardiology)"
                value={degreesText}
                onChange={(e) => setDegreesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Medical Specialties (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Cardiology, Internal Medicine, Hypertension"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
          </div>

          {/* Consultation Fees */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Consultation Fees Structure (BDT)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">First Physical Consultation (৳)</label>
                <input
                  type="number"
                  value={baseConsultationFee}
                  onChange={(e) => setBaseConsultationFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Physical Follow-up Fee (৳)</label>
                <input
                  type="number"
                  value={followUpFee}
                  onChange={(e) => setFollowUpFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Digital Follow-up Query Fee (৳)</label>
                <input
                  type="number"
                  value={digitalFollowUpFee}
                  onChange={(e) => setDigitalFollowUpFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* About Bio */}
          <div className="space-y-1 text-xs">
            <label className="font-bold text-slate-700 block">About / Professional Bio</label>
            <textarea
              rows={3}
              placeholder="Detailed description of clinical background, chamber consults, and fellowship expertise..."
              value={aboutBio}
              onChange={(e) => setAboutBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {/* Languages */}
          <div className="text-xs">
            <label className="font-bold text-slate-700 block mb-1">Consultation Languages (Comma-separated)</label>
            <input
              type="text"
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Card 2: Photo Gallery (Achievements, Certificates, Chamber Photos) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Doctor Photo Gallery &amp; Achievements</span>
              </h3>
              <p className="text-xs text-slate-500">
                Showcase degrees, medical awards, conference achievements, and chamber facility photos.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {gallery.length} Photo(s) in Gallery
            </span>
          </div>

          {/* Add Photo Row */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <span className="font-bold text-slate-800 block">Add New Photo to Gallery</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Photo Title / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Gold Medal in FCPS Clinical Cardiology 2024"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  value={newPhotoCategory}
                  onChange={(e) => setNewPhotoCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="achievement">Medical Achievement / Award</option>
                  <option value="certificate">Degree Certificate / Convocation</option>
                  <option value="chamber">Chamber / Clinical Setup</option>
                  <option value="conference">Conference / Fellowship</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="w-full px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-center font-bold cursor-pointer transition text-slate-700">
                  Select File
                  <input type="file" accept="image/*" onChange={handleGalleryFile} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or paste direct image URL (https://...)"
                value={newPhotoUrl.startsWith('data:') ? '' : newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddPhotoToGallery}
                className="px-5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Gallery</span>
              </button>
            </div>

            {/* Thumbnail Preview if selected */}
            {newPhotoUrl && (
              <div className="pt-2">
                <img
                  src={newPhotoUrl}
                  alt="Preview"
                  className="h-24 rounded-xl object-cover border border-slate-300"
                />
              </div>
            )}
          </div>

          {/* Gallery Grid Display */}
          {gallery.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No photos added to your gallery yet. Upload photos to enhance patient visibility.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {gallery.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm group relative"
                >
                  <div className="h-44 w-full bg-slate-200 overflow-hidden relative">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-700 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 text-xs space-y-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</h4>
                    {item.date && <p className="text-[10px] text-slate-400">{item.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Full Profile & Gallery'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

