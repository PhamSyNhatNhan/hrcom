// src/types/mentor_booking_admin.ts

export interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    email: string;
    phone_number?: string;
    description?: string;
}

export interface Profile {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    gender?: string;
    birthdate?: string;
    sub_profiles?: SubProfile;
}

export interface SubProfile {
    id: string;
    profile_id: string;
    university_major_id?: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
    university_majors?: UniversityMajor;
}

export interface UniversityMajor {
    id: string;
    university_id?: string;
    major_id?: string;
    universities?: University;
    majors?: Major;
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

export interface MentorReview {
    id: string;
    booking_id: string;
    user_id: string;
    mentor_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
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
    profiles?: Profile;
    mentors?: Mentor;
    mentor_reviews?: MentorReview[];
}

export interface BookingFilters {
    searchTerm: string;
    statusFilter: string;
    sessionTypeFilter: string;
    dateFrom: string;
    dateTo: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
}

export interface NotificationState {
    type: 'success' | 'error' | 'warning';
    message: string;
}

export interface CSVExportField {
    key: string;
    label: string;
    enabled: boolean;
    category?: 'booking' | 'user' | 'mentor' | 'review';
}

export interface CSVExportOptions {
    exportAll: boolean;
    limit: number;
    applyFilters: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SessionType = 'online' | 'offline' | 'hybrid';
export type TabType = 'bookings' | 'events';