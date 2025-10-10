// Post Types
export interface Tag {
    id: string;
    name: string;
    description?: string;
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
    };
    tags?: Tag[];
}

export interface CreatePostData {
    title: string;
    description?: string;
    type: 'activity' | 'blog';
    content: any;
    thumbnail?: string;
    published: boolean;
}

export interface UpdatePostData {
    id: string;
    title?: string;
    description?: string;
    type?: 'activity' | 'blog';
    content?: any;
    thumbnail?: string;
    published?: boolean;
    published_at?: string | null;
}

// Comment Types
export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    parent_comment_id: string | null;
    content: string;
    published: boolean;
    deleted: boolean;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
    replies?: Comment[]; // Nested unlimited levels
}

export interface CreateCommentData {
    post_id: string;
    author_id: string;
    parent_comment_id?: string | null;
    content: string;
}

export interface UpdateCommentData {
    id: string;
    content?: string;
    published?: boolean;
    deleted?: boolean;
}