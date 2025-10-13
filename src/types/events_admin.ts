// src/types/events_admin.ts

export interface Event {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    event_date: string;
    end_date?: string;
    location?: string;
    event_type?: 'online' | 'offline' | 'hybrid';
    max_participants?: number;
    registration_deadline?: string;
    require_approval: boolean;
    check_in_enabled: boolean;
    post_id?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
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

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    contact_email: string;
    contact_phone?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
    reviewed_by?: string;
    reviewed_at?: string;
    admin_notes?: string;
    registered_at: string;
    created_at: string;
    updated_at: string;
    profiles?: Profile;
    events?: Event;
    event_attendances?: EventAttendance[];
    event_reviews?: EventReview[];
}

export interface EventAttendance {
    id: string;
    registration_id: string;
    event_id: string;
    user_id: string;
    check_in_code_id?: string;
    checked_in_at: string;
    check_in_method: 'pass_code' | 'manual' | 'qr_code';
    checked_in_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface EventReview {
    id: string;
    attendance_id: string;
    event_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface EventCheckInCode {
    id: string;
    event_id: string;
    code: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    created_by: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface EventFilters {
    searchTerm: string;
    statusFilter: string;
    eventTypeFilter: string;
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
    category?: 'registration' | 'event' | 'user' | 'attendance' | 'review';
}

export interface CSVExportOptions {
    exportAll: boolean;
    limit: number;
    applyFilters: boolean;
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';
export type EventType = 'online' | 'offline' | 'hybrid';
export type CheckInMethod = 'pass_code' | 'manual' | 'qr_code';