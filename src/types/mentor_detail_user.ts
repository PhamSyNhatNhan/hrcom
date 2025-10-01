// src/types/mentor_detail_user.ts

export interface MentorWorkExperience {
    id: string;
    avatar?: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorEducation {
    id: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorActivity {
    id: string;
    avatar?: string;
    organization: string;
    role: string;
    activity_name: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
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

export interface MentorDetailData {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    skills: MentorSkill[];
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    total_reviews: number;
    reviews?: MentorReview[];
}

// RPC Response Type - Single comprehensive response
export interface RPCMentorCompleteData {
    // Basic Info
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    published: boolean;
    created_at: string;
    updated_at: string;

    // Statistics
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    total_reviews: number;

    // Related Data (as JSON)
    skills: string; // JSON array
    work_experiences: string; // JSON array
    educations: string; // JSON array
    activities: string; // JSON array
    reviews: string; // JSON array
}