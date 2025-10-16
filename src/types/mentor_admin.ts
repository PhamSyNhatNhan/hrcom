// src/types/mentor_admin.ts

// ============================================
// SHARED TYPES
// ============================================

export type AdminMentorTabType = 'mentors' | 'registrations' | 'skills';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ============================================
// MENTOR TYPES
// ============================================

export interface MentorEducation {
    id?: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date?: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorWorkExperience {
    id?: string;
    avatar?: string;
    company: string;
    position: string;
    start_date?: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorActivity {
    id?: string;
    avatar?: string;
    organization: string;
    role: string;
    activity_name: string;
    start_date?: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
    published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProfileInfo {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    created_at: string;
    auth_email?: string;
}

export interface MentorProfileConnection {
    id: string;
    profile_id: string;
    mentor_id: string;
    created_at: string;
    profiles: ProfileInfo;
}

export interface MentorReview {
    id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

export interface Mentor {
    id: string;
    email: string;
    full_name: string;
    avatar?: string;
    headline?: string;
    description?: string;
    phone_number?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    mentor_work_experiences?: MentorWorkExperience[];
    mentor_educations?: MentorEducation[];
    mentor_activities?: MentorActivity[];
    skills?: MentorSkill[];
    profile_connection?: MentorProfileConnection;
    // Statistics
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    reviews: MentorReview[];
}

export interface MentorFormData {
    email: string;
    full_name: string;
    avatar?: string;
    headline: string;
    description: string;
    phone_number: string;
    selected_skills: string[];
    published: boolean;
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
    connected_profile_id?: string;
}

// ============================================
// REGISTRATION TYPES
// ============================================

export interface MentorRegistration {
    id: string;
    user_id: string;
    email: string;
    phone?: string;
    notes?: string;
    admin_notes?: string;
    status: RegistrationStatus;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

// ============================================
// RPC FUNCTION PARAMETERS
// ============================================

export interface MentorAdminGetMentorsParams {
    include_unpublished?: boolean;
}

export interface MentorAdminGetMentorDetailsParams {
    mentor_id: string;
}

export interface MentorAdminCreateMentorParams {
    p_email: string;
    p_full_name: string;
    p_avatar?: string;
    p_headline?: string;
    p_description?: string;
    p_phone_number?: string;
    p_published: boolean;
}

export interface MentorAdminUpdateMentorParams {
    p_mentor_id: string;
    p_email?: string;
    p_full_name?: string;
    p_avatar?: string;
    p_headline?: string;
    p_description?: string;
    p_phone_number?: string;
    p_published?: boolean;
}

export interface MentorAdminDeleteMentorParams {
    p_mentor_id: string;
}

export interface MentorAdminSaveMentorSkillsParams {
    p_mentor_id: string;
    p_skill_ids: string[];
}

export interface MentorAdminSaveMentorExperiencesParams {
    p_mentor_id: string;
    p_experiences: Array<{
        avatar?: string | null;
        company: string;
        position: string;
        start_date?: string | null;
        end_date?: string | null;
        description: string[];
        published: boolean;
    }>;
}

export interface MentorAdminSaveMentorEducationsParams {
    p_mentor_id: string;
    p_educations: Array<{
        avatar?: string | null;
        school: string;
        degree: string;
        start_date?: string | null;
        end_date?: string | null;
        description: string[];
        published: boolean;
    }>;
}

export interface MentorAdminSaveMentorActivitiesParams {
    p_mentor_id: string;
    p_activities: Array<{
        avatar?: string | null;
        organization: string;
        role: string;
        activity_name: string;
        start_date?: string | null;
        end_date?: string | null;
        description: string[];
        published: boolean;
    }>;
}

export interface MentorAdminLinkProfileParams {
    p_mentor_id: string;
    p_profile_id: string;
}

export interface MentorAdminUnlinkProfileParams {
    p_mentor_id: string;
}

export interface MentorAdminGetRegistrationsParams {
    status_filter?: RegistrationStatus;
}

export interface MentorAdminUpdateRegistrationStatusParams {
    p_registration_id: string;
    p_status: RegistrationStatus;
    p_admin_notes?: string;
}

export interface MentorAdminApproveRegistrationParams {
    p_registration_id: string;
    p_admin_notes?: string;
}

export interface MentorAdminGetSkillsParams {
    published_only?: boolean;
}

export interface MentorAdminCreateSkillParams {
    p_name: string;
    p_description?: string;
    p_published: boolean;
}

export interface MentorAdminUpdateSkillParams {
    p_skill_id: string;
    p_name?: string;
    p_description?: string;
    p_published?: boolean;
}

export interface MentorAdminDeleteSkillParams {
    p_skill_id: string;
}

export interface MentorAdminSearchUserProfilesParams {
    search_term: string;
    page_number?: number;
    page_size?: number;
}

// ============================================
// RPC FUNCTION RETURN TYPES
// ============================================

export interface MentorAdminGetMentorsResult extends Mentor {}

export interface MentorAdminSearchUserProfilesResult {
    results: ProfileInfo[];
    total_count: number;
}

export interface MentorAdminGetSkillsResult extends MentorSkill {}

export interface MentorAdminGetRegistrationsResult extends MentorRegistration {}