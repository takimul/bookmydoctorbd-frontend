import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DoctorProfileView from '@/components/doctor/DoctorProfileView';
import { DoctorProfile } from '@/types/doctor';
import { getValidApiBaseUrl } from '@/lib/api';

async function getDoctor(id: string): Promise<DoctorProfile | null> {
  const baseUrl = getValidApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/doctors/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 }, // ISR cache for 60 seconds
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.doctor : null;
  } catch (err) {
    console.error('Failed to fetch doctor profile for SSR:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctor(id);

  if (!doctor) {
    return {
      title: 'Doctor Profile | BookMyDoctorBD',
      description: 'Find verified specialist doctors and chamber visiting hours across Bangladesh.',
    };
  }

  const doctorName = doctor.user?.name || 'Verified Physician';
  const specialties = doctor.specialties?.length ? doctor.specialties.join(', ') : 'Specialist';
  const degrees = doctor.degrees?.length ? doctor.degrees.join(', ') : 'MBBS';
  const bmdc = doctor.bmdcRegNumber ? `(BMDC: ${doctor.bmdcRegNumber})` : '';

  return {
    title: `${doctorName} - ${specialties} ${bmdc} | BookMyDoctorBD`,
    description: `Book consultation with ${doctorName}, ${degrees}, specializing in ${specialties}. ${doctor.experienceYears} years experience. Live chamber slot booking available.`,
    openGraph: {
      title: `${doctorName} - ${specialties} | BookMyDoctorBD`,
      description: `${degrees} • ${doctor.experienceYears} Years Experience • BMDC Reg. ${doctor.bmdcRegNumber}`,
      images: doctor.profilePhotoUrl ? [doctor.profilePhotoUrl] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${doctorName} | BookMyDoctorBD`,
      description: `Verified BMDC specialist with online chamber booking.`,
    },
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctor(id);

  if (!doctor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <DoctorProfileView doctor={doctor} />
    </div>
  );
}
