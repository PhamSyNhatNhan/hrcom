// src/types/mentor_booking_admin.ts

// =====================================================
// MENTOR TYPES
// =====================================================
export interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    email: string;
}

// =====================================================
// PROFILE TYPES
// =====================================================
export interface Profile {
    id: string;
    full_name: string;
    image_url?: string;
}

// =====================================================
// MENTOR BOOKING TYPES
// =====================================================
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SessionType = 'online' | 'offline' | 'hybrid';

export interface MentorBooking {
    id: string;
    user_id: string;
    mentor_id: string;
    scheduled_date?: string;
    duration: number;
    session_type: SessionType;
    contact_email: string;
    contact_phone?: string;
    user_notes?: string;
    mentor_notes?: string;
    admin_notes?: string;
    status: BookingStatus;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    profiles?: Profile;
    mentors?: Mentor;
}

// =====================================================
// MENTOR REVIEW TYPES
// =====================================================
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

// =====================================================
// EVENT TYPES
// =====================================================
export type EventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type EventType = 'online' | 'offline' | 'hybrid';

export interface Event {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    event_date: string;
    end_date?: string;
    location?: string;
    event_type: EventType;
    max_participants?: number;
    registration_deadline?: string;
    require_approval: boolean;
    check_in_enabled: boolean;
    post_id?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    contact_email: string;
    contact_phone?: string;
    status: EventStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    admin_notes?: string;
    registered_at: string;
    created_at: string;
    updated_at: string;
    profiles?: Profile;
    events?: Event;
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

export type CheckInMethod = 'pass_code' | 'manual' | 'qr_code';

export interface EventAttendance {
    id: string;
    registration_id: string;
    event_id: string;
    user_id: string;
    check_in_code_id?: string;
    checked_in_at: string;
    check_in_method: CheckInMethod;
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

// =====================================================
// COMBINED TYPES FOR DISPLAY
// =====================================================
export interface BookingWithReview extends MentorBooking {
    mentor_reviews?: MentorReview;
}

export interface EventRegistrationWithDetails extends EventRegistration {
    event_attendances?: EventAttendance;
    event_reviews?: EventReview;
}

// =====================================================
// FILTER TYPES
// =====================================================
export interface BookingFilters {
    searchTerm: string;
    statusFilter: string;
    sessionTypeFilter: string;
}

export interface EventFilters {
    searchTerm: string;
    statusFilter: string;
    eventTypeFilter: string;
}

// =====================================================
// PAGINATION TYPES
// =====================================================
export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================
export type NotificationType = 'success' | 'error' | 'warning';

export interface Notification {
    type: NotificationType;
    message: string;
}

// =====================================================
// RPC RESPONSE TYPES
// =====================================================
export interface BookingListResponse {
    data: BookingWithReview[];
    total_count: number;
}

export interface EventListResponse {
    data: EventRegistrationWithDetails[];
    total_count: number;
}

// =====================================================
// FORM DATA TYPES
// =====================================================
export interface BookingFormData {
    status?: BookingStatus;
    scheduled_date?: string;
    mentor_notes?: string;
    admin_notes?: string;
}

export interface ReviewFormData {
    rating?: number;
    comment?: string;
    is_published?: boolean;
}

export interface EventFormData {
    status?: EventStatus;
    admin_notes?: string;
}

export interface EventCodeFormData {
    code: string;
    valid_from: string;
    valid_until: string;
    notes?: string;
}

// =====================================================
// STATS TYPES
// =====================================================
export interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
}

export interface EventStats {
    total: number;
    pending: number;
    confirmed: number;
    attended: number;
    reviewed: number;
}