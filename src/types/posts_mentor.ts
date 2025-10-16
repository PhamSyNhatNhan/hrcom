// src/types/posts_mentor.ts

export interface Tag {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    title: string;
    description?: string;
    thumbnail: string | null;
    content: any;
    author_id: string;
    type: 'activity' | 'blog';
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    tags?: Tag[];
}

export interface PostSubmission {
    id: string;
    post_id: string;
    author_id: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    admin_notes: string | null;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    reviewed_by_profile?: {
        full_name: string;
    };
}

export interface PostWithSubmission extends Post {
    latest_submission?: PostSubmission;
    submission_history?: PostSubmission[];
}

export interface PostFormData {
    title: string;
    description: string;
    type: 'activity' | 'blog';
    content: string;
    thumbnail: File | null;
    selectedTags: string[];
}

export type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';