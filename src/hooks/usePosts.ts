'use client';
import { useState, useEffect, useCallback } from 'react';
import { Post, postService } from '@/lib/posts';

interface UsePostsOptions {
    type?: 'activity' | 'blog' | 'all';
    published?: boolean | 'all';
    search?: string;
    authorId?: string;
    page?: number;
    limit?: number;
    autoLoad?: boolean;
}

interface UsePostsReturn {
    posts: Post[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    totalPages: number;
    currentPage: number;
    loadPosts: () => Promise<void>;
    refreshPosts: () => Promise<void>;
    createPost: (postData: any) => Promise<void>;
    updatePost: (postData: any) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    togglePublishStatus: (postId: string) => Promise<void>;
}

export const usePosts = (options: UsePostsOptions = {}): UsePostsReturn => {
    const {
        type = 'all',
        published = 'all',
        search = '',
        authorId,
        page = 1,
        limit = 10,
        autoLoad = true
    } = options;

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(page);

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await postService.getPosts({
                type,
                published,
                search,
                authorId,
                page: currentPage,
                limit
            });

            setPosts(result.posts);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);

        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }, [type, published, search, authorId, currentPage, limit]);

    const refreshPosts = useCallback(async () => {
        await loadPosts();
    }, [loadPosts]);

    const createPost = useCallback(async (postData: any) => {
        try {
            setLoading(true);
            await postService.createPost(postData, postData.author_id);
            await loadPosts();
        } catch (err) {
            console.error('Error creating post:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadPosts]);

    const updatePost = useCallback(async (postData: any) => {
        try {
            setLoading(true);
            await postService.updatePost(postData);
            await loadPosts();
        } catch (err) {
            console.error('Error updating post:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadPosts]);

    const deletePost = useCallback(async (postId: string) => {
        try {
            setLoading(true);
            await postService.deletePost(postId);
            await loadPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadPosts]);

    const togglePublishStatus = useCallback(async (postId: string) => {
        try {
            await postService.togglePublishStatus(postId);
            await loadPosts();
        } catch (err) {
            console.error('Error toggling publish status:', err);
            throw err;
        }
    }, [loadPosts]);

    useEffect(() => {
        if (autoLoad) {
            loadPosts();
        }
    }, [loadPosts, autoLoad]);

    useEffect(() => {
        setCurrentPage(page);
    }, [page]);

    return {
        posts,
        loading,
        error,
        totalCount,
        totalPages,
        currentPage,
        loadPosts,
        refreshPosts,
        createPost,
        updatePost,
        deletePost,
        togglePublishStatus
    };
};

// Hook for published posts (public facing)
export const usePublishedPosts = (options: {
    type?: 'activity' | 'blog' | 'all';
    limit?: number;
    offset?: number;
} = {}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await postService.getPublishedPosts(options);
            setPosts(result);

        } catch (err) {
            console.error('Error loading published posts:', err);
            setError('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }, [options.type, options.limit, options.offset]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    return {
        posts,
        loading,
        error,
        refreshPosts: loadPosts
    };
};

// Hook for single post
export const usePost = (postId: string) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPost = useCallback(async () => {
        if (!postId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await postService.getPost(postId);
            setPost(result);

        } catch (err) {
            console.error('Error loading post:', err);
            setError('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    return {
        post,
        loading,
        error,
        refreshPost: loadPost
    };
};