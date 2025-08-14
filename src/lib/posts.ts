import { supabase } from '@/utils/supabase/client';

export interface Post {
    id: string;
    title: string;
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
}

export interface CreatePostData {
    title: string;
    type: 'activity' | 'blog';
    content: any;
    thumbnail?: string;
    published: boolean;
}

export interface UpdatePostData {
    id: string;
    title?: string;
    type?: 'activity' | 'blog';
    content?: any;
    thumbnail?: string;
    published?: boolean;
    published_at?: string | null;
}

export class PostService {
    // Get all posts with pagination and filters (for admin)
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
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false });

            // Apply filters
            if (type !== 'all') {
                query = query.eq('type', type);
            }

            if (published !== 'all') {
                query = query.eq('published', published);
            }

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            if (authorId) {
                query = query.eq('author_id', authorId);
            }

            // Apply pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                console.error('Error fetching posts:', error);
                throw new Error(`Failed to fetch posts: ${error.message}`);
            }

            return {
                posts: data || [],
                totalCount: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
                currentPage: page
            };
        } catch (error) {
            console.error('PostService.getPosts error:', error);
            throw error;
        }
    }

    // Get single post by ID
    async getPost(id: string): Promise<Post> {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching post:', error);
                throw new Error(`Failed to fetch post: ${error.message}`);
            }

            if (!data) {
                throw new Error('Post not found');
            }

            return data;
        } catch (error) {
            console.error('PostService.getPost error:', error);
            throw error;
        }
    }

    // Get published posts for public display
    async getPublishedPosts(options: {
        type?: 'activity' | 'blog' | 'all';
        limit?: number;
        offset?: number;
    } = {}): Promise<Post[]> {
        const { type = 'all', limit = 10, offset = 0 } = options;

        try {
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `)
                .eq('published', true)
                .order('published_at', { ascending: false });

            if (type !== 'all') {
                query = query.eq('type', type);
            }

            if (limit > 0) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching published posts:', error);
                throw new Error(`Failed to fetch published posts: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('PostService.getPublishedPosts error:', error);
            throw error;
        }
    }

    // Create new post
    async createPost(postData: CreatePostData, authorId: string): Promise<Post> {
        try {
            console.log('Creating post with data:', { ...postData, author_id: authorId });

            const { data, error } = await supabase
                .from('posts')
                .insert([{
                    title: postData.title,
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

            if (error) {
                console.error('Error creating post:', error);
                throw new Error(`Failed to create post: ${error.message}`);
            }

            if (!data) {
                throw new Error('No data returned after creating post');
            }

            console.log('Post created successfully:', data);
            return data;
        } catch (error) {
            console.error('PostService.createPost error:', error);
            throw error;
        }
    }

    // Update post
    async updatePost(postData: UpdatePostData): Promise<Post> {
        try {
            const { id, ...updateData } = postData;

            // If publishing for the first time, set published_at
            if (updateData.published && !updateData.published_at) {
                updateData.published_at = new Date().toISOString();
            }

            // If unpublishing, clear published_at
            if (updateData.published === false) {
                updateData.published_at = null;
            }

            console.log('Updating post with data:', { id, updateData });

            const { data, error } = await supabase
                .from('posts')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `)
                .single();

            if (error) {
                console.error('Error updating post:', error);
                throw new Error(`Failed to update post: ${error.message}`);
            }

            if (!data) {
                throw new Error('No data returned after updating post');
            }

            console.log('Post updated successfully:', data);
            return data;
        } catch (error) {
            console.error('PostService.updatePost error:', error);
            throw error;
        }
    }

    // Delete post
    async deletePost(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting post:', error);
                throw new Error(`Failed to delete post: ${error.message}`);
            }

            console.log('Post deleted successfully:', id);
        } catch (error) {
            console.error('PostService.deletePost error:', error);
            throw error;
        }
    }

    // Toggle publish status
    async togglePublishStatus(id: string): Promise<Post> {
        try {
            // First get current status
            const { data: currentPost, error: fetchError } = await supabase
                .from('posts')
                .select('published, published_at')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('Error fetching current post status:', fetchError);
                throw new Error(`Failed to fetch current post status: ${fetchError.message}`);
            }

            if (!currentPost) {
                throw new Error('Post not found');
            }

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
                    )
                `)
                .single();

            if (error) {
                console.error('Error toggling publish status:', error);
                throw new Error(`Failed to toggle publish status: ${error.message}`);
            }

            if (!data) {
                throw new Error('No data returned after toggling publish status');
            }

            console.log('Post publish status toggled successfully:', data);
            return data;
        } catch (error) {
            console.error('PostService.togglePublishStatus error:', error);
            throw error;
        }
    }

    // Upload image to Supabase Storage
    async uploadImage(file: File, folder: string = 'posts'): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            console.log('Uploading image:', { fileName, filePath, fileSize: file.size });

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading image:', error);
                throw new Error(`Failed to upload image: ${error.message}`);
            }

            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            console.log('Image uploaded successfully:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            console.error('PostService.uploadImage error:', error);
            throw error;
        }
    }

    // Delete image from Supabase Storage
    async deleteImage(url: string): Promise<void> {
        try {
            // Extract file path from URL
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
                // Don't throw error for image deletion failures
                console.warn('Failed to delete image, continuing anyway');
            } else {
                console.log('Image deleted successfully:', filePath);
            }
        } catch (error) {
            console.error('PostService.deleteImage error:', error);
            // Don't throw error for image deletion failures
        }
    }

    // Test connection method for debugging
    async testConnection(): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('Connection test failed:', error);
                return false;
            }

            console.log('Connection test successful');
            return true;
        } catch (error) {
            console.error('PostService.testConnection error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const postService = new PostService();

// Utility functions for content processing
export const extractTextFromContent = (content: any): string => {
    if (!content || !content.blocks) return '';

    return content.blocks
        .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
        .map((block: any) => block.data?.text || '')
        .join(' ')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
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