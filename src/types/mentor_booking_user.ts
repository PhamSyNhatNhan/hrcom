// src/types/mentor_booking_user.ts

export interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    description?: string;
    phone_number?: string;
    email: string;
}

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

export interface MentorSkillRelation {
    skill_id: string;
    mentor_skills: MentorSkill;
}

export interface MentorReview {
    id?: string;
    booking_id: string;
    user_id: string;
    mentor_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface MentorBooking {
    id?: string;
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
    created_at?: string;
    updated_at?: string;
    completed_at?: string;
    mentors?: Mentor;
    mentor_reviews?: MentorReview[];
    has_review?: boolean;
}

export interface BookingFormData {
    mentor_id: string;
    selectedSkills: string[];
    otherSkills: string;
    session_type: 'online' | 'offline' | 'hybrid';
    scheduled_date: string;
    duration: number;
    contact_email: string;
    contact_phone: string;
    user_notes: string;
}

export interface ReviewFormData {
    rating: number;
    comment: string;
    is_published: boolean;
}

export type NotificationType = 'success' | 'error' | 'warning';

export interface Notification {
    type: NotificationType;
    message: string;
}