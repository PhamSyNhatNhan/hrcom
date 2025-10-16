// src/types/post_admin.ts

export interface Tag {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    post_count?: number;
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
    profiles?: {
        full_name: string;
        image_url?: string;
        id: string;
    };
    tags?: Tag[];
    from_submission?: boolean;
    submission_status?: 'approved' | 'rejected' | 'pending';
    comment_count?: number;
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
    posts: Post | null;
    profiles: {
        full_name: string;
        image_url?: string;
    };
    reviewed_by_profile?: {
        full_name: string;
    };
}

export interface PostFormData {
    title: string;
    description: string;
    type: 'activity' | 'blog';
    content: string;
    thumbnail: File | null;
    published: boolean;
    selectedTags: string[];
}

export interface PostComment {
    id: string;
    post_id: string;
    author_id: string;
    parent_comment_id: string | null;
    content: string;
    published: boolean;
    deleted: boolean;
    created_at: string;
    updated_at: string;
    author_name: string;
    author_avatar: string | null;
    reply_count?: number;
    replies?: PostComment[];
}

export interface CommentFormData {
    content: string;
    published: boolean;
}

export type TabType = 'posts' | 'submissions' | 'tags';

export type ErrorResponse = {
    message: string;
    code?: string;
};