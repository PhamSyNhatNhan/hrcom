// src/types/mentor_booking_mentor.ts

export interface UserProfile {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    birthdate?: string;
    gender?: string;
}

export interface University {
    name: string;
    code: string;
}

export interface Major {
    name: string;
}

export interface UniversityMajor {
    universities?: University;
    majors?: Major;
}

export interface SubProfile {
    id: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
    university_majors?: UniversityMajor;
}

export interface BookingProfile extends UserProfile {
    sub_profiles?: SubProfile;
}

export interface MentorBooking {
    id: string;
    user_id: string;
    mentor_id: string;
    scheduled_date?: string;
    duration: number;
    session_type: 'online' | 'offline' | 'hybrid';
    contact_email: string;
    contact_phone?: string;
    user_notes?: string;
    mentor_notes?: string;
    admin_notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    completed_at?: string;
    profiles?: BookingProfile;
}

export interface MentorProfile {
    id: string;
    email: string;
    full_name: string;
    avatar?: string;
    headline?: string;
    description?: string;
    published: boolean;
    phone_number?: string;
    created_at: string;
    updated_at: string;
}

export interface BookingFilters {
    searchTerm: string;
    statusFilter: string;
    sessionTypeFilter: string;
}

export interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
}

export type NotificationType = 'success' | 'error' | 'warning';

export interface Notification {
    type: NotificationType;
    message: string;
}

export interface UpdateBookingStatusParams {
    booking_id: string;
    new_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    scheduled_date?: string;
}

export interface UpdateMentorNotesParams {
    booking_id: string;
    mentor_notes: string;
}