// Mentor User Types

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

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

export interface MentorStats {
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    total_reviews: number;
}

export interface Mentor extends MentorStats {
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
    skill?: string[]; // Legacy field for backward compatibility
}

export interface MentorDetailData extends Mentor {
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
    reviews?: MentorReview[];
}

// Filter and Sort Types
export type MentorSortOption = 'name' | 'newest' | 'oldest' | 'rating' | 'popular';

export interface MentorFilters {
    searchTerm: string;
    selectedSkills: string[];
    sortBy: MentorSortOption;
}

// RPC Response Types
export interface MentorListRPCResponse {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    headline?: string;
    description?: string;
    published: boolean;
    created_at: string;
    skills: MentorSkill[];
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    total_reviews: number;
}

export interface MentorDetailRPCResponse extends MentorListRPCResponse {
    phone_number?: string;
    updated_at: string;
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
    reviews: MentorReview[];
}