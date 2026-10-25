'use client';

import React, { useState } from 'react';
import { Award, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { DoctorGalleryItem } from '@/types/doctor';

interface DoctorGalleryProps {
  gallery: any;
  doctorName: string;
}

export default function DoctorGallery({ gallery, doctorName }: DoctorGalleryProps) {
  const [activeItem, setActiveItem] = useState<DoctorGalleryItem | null>(null);

  const items: DoctorGalleryItem[] = Array.isArray(gallery)
    ? gallery
    : typeof gallery === 'string'
    ? (() => {
        try {
          const parsed = JSON.parse(gallery);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900 text-base">Achievements &amp; Photo Gallery</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {items.length} verified item{items.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid of gallery thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setActiveItem(item)}
            className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition"
          >
            <img
              src={item.url}
              alt={item.title || `${doctorName} Achievement ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
              <span className="text-[11px] text-white font-semibold line-clamp-1 flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-emerald-400" />
                {item.title || 'View photo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800 text-white">
              <div className="font-semibold text-sm truncate">
                {activeItem.title || `${doctorName} - Credential & Gallery`}
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black/40">
              <img
                src={activeItem.url}
                alt={activeItem.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {activeItem.title && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 text-center font-medium">
                {activeItem.title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
