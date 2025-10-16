// ============================================
// AUTH USER TYPES
// ============================================

export interface AuthUser {
    id: string;
    email: string;
    role: 'user' | 'mentor' | 'admin' | 'superadmin';
    profile?: UserProfile;
}

export interface UserProfile {
    id: string;
    full_name: string;
    image_url?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    birthdate?: string;
    phone_number?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// REGISTRATION TYPES
// ============================================

export interface RegisterFormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    birthDate: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface ForgotPasswordFormData {
    email: string;
}

export interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

// ============================================
// ONBOARDING TYPES
// ============================================

export interface MenteeSetupFormData {
    university_major_id: string;
    description: string;
}

export interface MentorRegistrationFormData {
    email: string;
    phone: string;
    notes: string;
}

export interface University {
    id: string;
    name: string;
    code: string;
}

export interface Major {
    id: string;
    name: string;
}

export interface UniversityMajor {
    id: string;
    university_id: string;
    major_id: string;
    universities: University;
    majors: Major;
}

export interface MentorRegistration {
    id: string;
    user_id: string;
    email: string;
    phone?: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by?: string;
    reviewed_at?: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// RPC FUNCTION TYPES
// ============================================

export interface AuthUserRegiCreateMenteeParams {
    p_user_id: string;
    p_university_major_id?: string;
    p_description?: string;
}

export interface AuthUserRegiCreateMentorParams {
    p_user_id: string;
    p_email: string;
    p_phone?: string;
    p_notes?: string;
}

export interface AuthUserRegiGetUniversitiesResult {
    id: string;
    name: string;
    code: string;
}

export interface AuthUserRegiGetMajorsResult {
    id: string;
    name: string;
}

export interface AuthUserRegiGetUniversityMajorsParams {
    p_university_id?: string;
}

export interface AuthUserRegiGetUniversityMajorsResult {
    id: string;
    university_id: string;
    major_id: string;
    university_name: string;
    university_code: string;
    major_name: string;
}

export interface AuthUserRegiCheckMentorStatusParams {
    p_user_id: string;
}

export interface AuthUserRegiCheckMentorStatusResult {
    has_registration: boolean;
    latest_status?: 'pending' | 'approved' | 'rejected';
    latest_registration_date?: string;
    admin_notes?: string;
}

export interface AuthUserRegiMentorRegistrationResult {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    admin_notes?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AuthResponse<T = AuthUser> {
    user: T | null;
    error: string | null;
    needsVerification?: boolean;
}

export interface RpcResponse<T = any> {
    data: T | null;
    error: string | null;
}

// ============================================
// HELPER TYPES
// ============================================

export interface GenderOption {
    id: number;
    name: string;
    value: 'Nam' | 'Nữ' | 'Khác';
}