// src/types/events_user.ts

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
    published: boolean;
    created_at: string;
    updated_at: string;
    participant_count?: number;
    is_registered?: boolean;
    user_registration_status?: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
    is_full?: boolean;
    is_past?: boolean;
    can_register?: boolean;
    is_checked_in?: boolean;
}

export interface EventDetail extends Event {
    post_id?: string;
    user_registration_id?: string;
    reviews?: EventReview[];
    average_rating?: number;
    total_reviews?: number;
    is_checked_in?: boolean;
}

export interface UserRegistration {
    id: string;
    event_id: string;
    user_id: string;
    contact_email: string;
    contact_phone?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
    admin_notes?: string;
    registered_at: string;
    event?: Event;
    has_attended?: boolean;
    has_reviewed?: boolean;
}

export interface EventReview {
    id: string;
    event_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    user_name?: string;
    user_avatar?: string;
}

export interface RegistrationFormData {
    contact_email: string;
    contact_phone?: string;
}

export interface EventFilters {
    searchTerm: string;
    eventTypeFilter: string;
    statusFilter: string; // 'upcoming' | 'past' | 'all' | 'my_events'
    dateFrom: string;
    dateTo: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
}

export type EventType = 'online' | 'offline' | 'hybrid';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';