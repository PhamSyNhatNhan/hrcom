import { supabase } from '@/utils/supabase/client';
import {
    Post,
    CreatePostData,
    UpdatePostData,
    Comment,
    CreateCommentData,
    UpdateCommentData,
    Tag
} from '@/types/posts_user';

export class PostService {
    // ==================== POST METHODS (using RPC) ====================

    /**
     * Get published posts for public display
     */
    async getPublishedPosts(options: {
        type?: 'activity' | 'blog' | 'all';
        limit?: number;
        offset?: number;
    } = {}): Promise<Post[]> {
        const { type = 'all', limit = 10, offset = 0 } = options;

        try {
            const { data, error } = await supabase.rpc('posts_user_get_published_posts', {
                p_type: type,
                p_limit: limit,
                p_offset: offset
            });

            if (error) throw new Error(`Failed to fetch published posts: ${error.message}`);

            return (data || []).map(this.transformPostFromRPC);
        } catch (error) {
            console.error('PostService.getPublishedPosts error:', error);
            throw error;
        }
    }

    /**
     * Get single post by ID
     */
    async getPost(id: string): Promise<Post> {
        try {
            const { data, error } = await supabase.rpc('posts_user_get_post', {
                p_post_id: id
            });

            if (error) throw new Error(`Failed to fetch post: ${error.message}`);
            if (!data || data.length === 0) throw new Error('Post not found');

            return this.transformPostFromRPC(data[0]);
        } catch (error) {
            console.error('PostService.getPost error:', error);
            throw error;
        }
    }

    /**
     * Get paginated published posts with search
     */
    async getPaginatedPublishedPosts(options: {
        type?: 'activity' | 'blog' | 'all';
        page?: number;
        limit?: number;
        search?: string;
    } = {}): Promise<{
        posts: Post[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
    }> {
        const { type = 'all', page = 1, limit = 6, search = '' } = options;

        try {
            const { data, error } = await supabase.rpc('posts_user_get_paginated_posts', {
                p_type: type,
                p_page: page,
                p_limit: limit,
                p_search: search
            });

            if (error) throw new Error(`Failed to fetch posts: ${error.message}`);

            const posts = (data || []).map(this.transformPostFromRPC);
            const totalCount = data && data.length > 0 ? parseInt(data[0].total_count) : 0;

            return {
                posts,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        } catch (error) {
            console.error('PostService.getPaginatedPublishedPosts error:', error);
            throw error;
        }
    }

    /**
     * Transform RPC result to Post type
     */
    private transformPostFromRPC(data: any): Post {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail,
            content: data.content,
            author_id: data.author_id,
            type: data.type,
            published: data.published,
            published_at: data.published_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            profiles: data.author_name ? {
                full_name: data.author_name,
                image_url: data.author_image
            } : undefined,
            tags: Array.isArray(data.tags) ? data.tags : []
        };
    }

    // ==================== COMMENT METHODS (using RPC) ====================

    /**
     * Get all comments for a post with unlimited nested structure
     */
    async getComments(postId: string): Promise<Comment[]> {
        try {
            const { data, error } = await supabase.rpc('posts_user_get_comments', {
                p_post_id: postId
            });

            if (error) throw new Error(`Failed to fetch comments: ${error.message}`);

            const comments = (data || []).map(this.transformCommentFromRPC);
            return this.buildCommentTree(comments);
        } catch (error) {
            console.error('PostService.getComments error:', error);
            throw error;
        }
    }

    /**
     * Build unlimited nested comment tree structure
     */
    private buildCommentTree(comments: Comment[]): Comment[] {
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // Initialize all comments with empty replies array
        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Build the tree structure
        comments.forEach(comment => {
            const commentWithReplies = commentMap.get(comment.id)!;

            if (comment.parent_comment_id) {
                const parent = commentMap.get(comment.parent_comment_id);
                if (parent) {
                    parent.replies = parent.replies || [];
                    parent.replies.push(commentWithReplies);
                } else {
                    // Parent not found, add as root
                    rootComments.push(commentWithReplies);
                }
            } else {
                rootComments.push(commentWithReplies);
            }
        });

        return rootComments;
    }

    /**
     * Create a new comment or reply
     */
    async createComment(data: CreateCommentData): Promise<Comment> {
        try {
            const { data: result, error } = await supabase.rpc('posts_user_create_comment', {
                p_post_id: data.post_id,
                p_author_id: data.author_id,
                p_content: data.content,
                p_parent_comment_id: data.parent_comment_id || null
            });

            if (error) throw new Error(`Failed to create comment: ${error.message}`);
            if (!result || result.length === 0) throw new Error('No data returned after creating comment');

            return this.transformCommentFromRPC(result[0]);
        } catch (error) {
            console.error('PostService.createComment error:', error);
            throw error;
        }
    }

    /**
     * Update comment content
     */
    async updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
        try {
            const { data, error } = await supabase.rpc('posts_user_update_comment', {
                p_comment_id: commentId,
                p_user_id: userId,
                p_content: content
            });

            if (error) throw new Error(`Failed to update comment: ${error.message}`);
            if (!data || data.length === 0) throw new Error('No data returned after updating comment');

            return this.transformCommentFromRPC(data[0]);
        } catch (error) {
            console.error('PostService.updateComment error:', error);
            throw error;
        }
    }

    /**
     * Soft delete comment (user delete)
     */
    async deleteComment(commentId: string, userId: string): Promise<void> {
        try {
            const { data, error } = await supabase.rpc('posts_user_delete_comment', {
                p_comment_id: commentId,
                p_user_id: userId
            });

            if (error) throw new Error(`Failed to delete comment: ${error.message}`);
        } catch (error) {
            console.error('PostService.deleteComment error:', error);
            throw error;
        }
    }

    /**
     * Count total comments for a post
     */
    async countComments(postId: string): Promise<number> {
        try {
            const { data, error } = await supabase.rpc('posts_user_count_comments', {
                p_post_id: postId
            });

            if (error) throw new Error(`Failed to count comments: ${error.message}`);

            return data || 0;
        } catch (error) {
            console.error('PostService.countComments error:', error);
            throw error;
        }
    }

    /**
     * Transform RPC result to Comment type
     */
    private transformCommentFromRPC(data: any): Comment {
        return {
            id: data.id,
            post_id: data.post_id,
            author_id: data.author_id,
            parent_comment_id: data.parent_comment_id,
            content: data.content,
            published: data.published,
            deleted: data.deleted,
            created_at: data.created_at,
            updated_at: data.updated_at,
            profiles: data.author_name ? {
                full_name: data.author_name,
                image_url: data.author_image
            } : undefined,
            replies: []
        };
    }

    // ==================== ADMIN METHODS (Direct queries - for admin panel) ====================

    /**
     * Get all posts with pagination and filters (for admin)
     */
    async getPosts(options: {
        page?: number;
        limit?: number;
        type?: 'activity' | 'blog' | 'all';
        published?: boolean | 'all';
        search?: string;
        authorId?: string;
    } = {}) {
        const {
            page = 1,
            limit = 10,
            type = 'all',
            published = 'all',
            search,
            authorId
        } = options;

        try {
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    ),
                    post_tags (
                        tags (
                            id,
                            name,
                            description
                        )
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false });

            if (type !== 'all') query = query.eq('type', type);
            if (published !== 'all') query = query.eq('published', published);
            if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            if (authorId) query = query.eq('author_id', authorId);

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw new Error(`Failed to fetch posts: ${error.message}`);

            const postsWithTags = (data || []).map(post => ({
                ...post,
                tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
            }));

            return {
                posts: postsWithTags,
                totalCount: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
                currentPage: page
            };
        } catch (error) {
            console.error('PostService.getPosts error:', error);
            throw error;
        }
    }

    /**
     * Create new post (admin)
     */
    async createPost(postData: CreatePostData, authorId: string): Promise<Post> {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([{
                    title: postData.title,
                    description: postData.description || null,
                    type: postData.type,
                    content: postData.content,
                    thumbnail: postData.thumbnail || null,
                    published: postData.published,
                    published_at: postData.published ? new Date().toISOString() : null,
                    author_id: authorId
                }])
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `)
                .single();

            if (error) throw new Error(`Failed to create post: ${error.message}`);
            if (!data) throw new Error('No data returned after creating post');

            return { ...data, tags: [] };
        } catch (error) {
            console.error('PostService.createPost error:', error);
            throw error;
        }
    }

    /**
     * Update post (admin)
     */
    async updatePost(postData: UpdatePostData): Promise<Post> {
        try {
            const { id, ...updateData } = postData;

            if (updateData.published && !updateData.published_at) {
                updateData.published_at = new Date().toISOString();
            }
            if (updateData.published === false) {
                updateData.published_at = null;
            }

            const { data, error } = await supabase
                .from('posts')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    ),
                    post_tags (
                        tags (
                            id,
                            name,
                            description
                        )
                    )
                `)
                .single();

            if (error) throw new Error(`Failed to update post: ${error.message}`);
            if (!data) throw new Error('No data returned after updating post');

            const postWithTags = {
                ...data,
                tags: data.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
            };

            return postWithTags;
        } catch (error) {
            console.error('PostService.updatePost error:', error);
            throw error;
        }
    }

    /**
     * Delete post (admin)
     */
    async deletePost(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) throw new Error(`Failed to delete post: ${error.message}`);
        } catch (error) {
            console.error('PostService.deletePost error:', error);
            throw error;
        }
    }

    /**
     * Toggle publish status (admin)
     */
    async togglePublishStatus(id: string): Promise<Post> {
        try {
            const { data: currentPost, error: fetchError } = await supabase
                .from('posts')
                .select('published, published_at')
                .eq('id', id)
                .single();

            if (fetchError) throw new Error(`Failed to fetch current post status: ${fetchError.message}`);
            if (!currentPost) throw new Error('Post not found');

            const newPublished = !currentPost.published;
            const updateData: { published: boolean; published_at: string | null } = {
                published: newPublished,
                published_at: newPublished ? new Date().toISOString() : null
            };

            const { data, error } = await supabase
                .from('posts')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    ),
                    post_tags (
                        tags (
                            id,
                            name,
                            description
                        )
                    )
                `)
                .single();

            if (error) throw new Error(`Failed to toggle publish status: ${error.message}`);
            if (!data) throw new Error('No data returned after toggling publish status');

            const postWithTags = {
                ...data,
                tags: data.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
            };

            return postWithTags;
        } catch (error) {
            console.error('PostService.togglePublishStatus error:', error);
            throw error;
        }
    }

    /**
     * Upload image to Supabase Storage
     */
    async uploadImage(file: File, folder: string = 'posts'): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw new Error(`Failed to upload image: ${error.message}`);

            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('PostService.uploadImage error:', error);
            throw error;
        }
    }

    /**
     * Delete image from Supabase Storage
     */
    async deleteImage(url: string): Promise<void> {
        try {
            const urlParts = url.split('/storage/v1/object/public/images/');
            if (urlParts.length < 2) {
                console.warn('Invalid image URL format:', url);
                return;
            }

            const filePath = urlParts[1];

            const { error } = await supabase.storage
                .from('images')
                .remove([filePath]);

            if (error) {
                console.error('Error deleting image:', error);
                console.warn('Failed to delete image, continuing anyway');
            }
        } catch (error) {
            console.error('PostService.deleteImage error:', error);
        }
    }
}

// Export singleton instance
export const postService = new PostService();

// Utility functions
export const extractTextFromContent = (content: any): string => {
    if (!content || !content.blocks) return '';
    return content.blocks
        .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
        .map((block: any) => block.data?.text || '')
        .join(' ')
        .replace(/<[^>]*>/g, '')
        .substring(0, 200);
};

export const extractFirstImage = (content: any): string | null => {
    if (!content || !content.blocks) return null;
    const imageBlock = content.blocks.find((block: any) => block.type === 'image');
    return imageBlock?.data?.file?.url || null;
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getPostTypeLabel = (type: string): string => {
    switch (type) {
        case 'activity':
            return 'Hoạt động';
        case 'blog':
            return 'Blog';
        default:
            return 'Khác';
    }
};

export const getPostStatusLabel = (published: boolean): string => {
    return published ? 'Đã xuất bản' : 'Bản nháp';
};