export type UserRole = 'PATIENT' | 'DOCTOR' | 'VET' | 'ADMIN' | 'SUPER_ADMIN' | 'GUEST';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: UserRole;
  isPhoneVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}
