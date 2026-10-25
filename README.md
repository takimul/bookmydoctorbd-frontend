# BookMyDoctorBD — Next.js Frontend Web Application

Modern, responsive patient, doctor, and administrator web application built for the Bangladesh healthcare ecosystem.

## Core Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS & Lucide React
- **Client**: Axios with bearer token interceptors & React Context session state

## User Portals & Features
- **Public & Guest Search**: Multi-criteria doctor discovery by specialty, symptom, division, and fee range. Guest booking with mobile SMS OTP.
- **Super Admin Dashboard (`/admin`)**:
  - Manually create doctor login ID & password from dashboard.
  - Verification workflow management (`VERIFIED`, `PENDING`, `SUSPENDED`).
  - Assign subscription plans (Basic, Pro, Premium, 14-day Free Trial).
  - Platform analytics (MRR, total consultations, cases).
- **Doctor Clinical Suite (`/doctor-portal`)**:
  - Live chamber serial queue progression.
  - E-Prescription Studio with Bangladeshi brand drug AI autocomplete.
  - AI Hospital Report Note Taker (parses reports from Popular, Square, Ibn Sina).
- **Patient Health Timeline (`/patient-portal`)**:
  - Medical Cases, e-prescriptions, and lab reports history.
  - Digital Follow-up: upload reports, ask questions, pay via bKash/Nagad.
  - Family members management.
  - Cat-First pet profiles & vaccination booster tracker.
- **Veterinary Hub (`/veterinary`)**: Cat-first veterinary doctors and clinics.

## Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
