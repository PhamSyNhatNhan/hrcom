'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import {
    Edit,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    Tag,
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface Tag {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface Post {
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
    profiles: {
        full_name: string;
        image_url?: string;
        id: string; // Add this to get user role info
    };
    tags?: Tag[];
    // Fields for mentor posts that went through submission process
    from_submission?: boolean;
    submission_status?: 'approved' | 'rejected' | 'pending';
}

interface PostsTabProps {
    searchTerm: string;
    filterType: 'all' | 'activity' | 'blog';
    filterPublished: 'all' | 'published' | 'draft';
    filterTag: string;
    onEditPost: (post: Post) => void;
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

// Helper functions
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

const PostsTab = React.forwardRef<{ reload: () => void }, PostsTabProps>(({
                                                                              searchTerm,
                                                                              filterType,
                                                                              filterPublished,
                                                                              filterTag,
                                                                              onEditPost,
                                                                              showNotification
                                                                          }, ref) => {
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20;

    // Load posts with filters to exclude unapproved mentor posts
    // Load posts with filters to exclude unapproved mentor posts
    const loadPosts = async (page: number = 1) => {
        try {
            setLoading(true);

            // Get posts with author profiles and role information
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profiles!posts_author_id_fkey (
                        id,
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
                `, { count: 'exact' });

            // Apply filters
            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            if (filterPublished === 'published') {
                query = query.eq('published', true);
            } else if (filterPublished === 'draft') {
                query = query.eq('published', false);
            }

            if (searchTerm.trim()) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            // Order first, then get all matching records for filtering
            query = query.order('created_at', { ascending: false });

            const { data: allPosts, error, count } = await query;

            if (error) throw error;

            if (!allPosts || allPosts.length === 0) {
                setPosts([]);
                setTotalCount(0);
                setTotalPages(0);
                return;
            }

            // Get user roles to identify admin/superadmin vs mentor posts
            const authorIds = [...new Set(allPosts.map(post => post.author_id))];
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

            // Create a map of user_id -> role
            const userRoles: { [key: string]: string } = {};
            if (!authError && authUsers?.users) {
                authUsers.users.forEach(authUser => {
                    const role = authUser.user_metadata?.role || authUser.app_metadata?.role || 'user';
                    userRoles[authUser.id] = role;
                });
            }

            // Get submission status for mentor posts
            const { data: submissions, error: submissionError } = await supabase
                .from('post_submissions')
                .select('post_id, status')
                .in('post_id', allPosts.map(post => post.id));

            const submissionMap: { [key: string]: string } = {};
            if (!submissionError && submissions) {
                submissions.forEach(sub => {
                    submissionMap[sub.post_id] = sub.status;
                });
            }

            // Filter posts based on author role and submission status
            const filteredPosts = allPosts.filter(post => {
                const authorRole = userRoles[post.author_id] || 'user';

                // Admin and superadmin posts are always shown
                if (authorRole === 'admin' || authorRole === 'superadmin') {
                    return true;
                }

                // For mentor posts, only show approved ones
                const submissionStatus = submissionMap[post.id];
                if (submissionStatus) {
                    return submissionStatus === 'approved';
                }

                // If no submission record exists but it's published,
                // it might be an old post or created by admin, so show it
                return post.published;
            });

            // Transform the data to include tags array and submission info
            const postsWithTags = filteredPosts.map(post => ({
                ...post,
                tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
                from_submission: !!submissionMap[post.id],
                submission_status: submissionMap[post.id] as 'approved' | 'rejected' | 'pending'
            }));

            // Client-side filter by tag
            let finalPosts = postsWithTags;
            if (filterTag !== 'all') {
                finalPosts = postsWithTags.filter(post =>
                    post.tags && post.tags.some((tag: Tag) => tag.id === filterTag)
                );
            }

            // Apply pagination to filtered results
            const totalFilteredCount = finalPosts.length;
            const totalPages = Math.ceil(totalFilteredCount / pageSize);

            // Calculate pagination range
            const from = (page - 1) * pageSize;
            const to = from + pageSize;
            const paginatedPosts = finalPosts.slice(from, to);

            setPosts(paginatedPosts);
            setTotalCount(totalFilteredCount);
            setTotalPages(totalPages);

        } catch (error) {
            console.error('Error loading posts:', error);
            showNotification('error', 'Không thể tải bài viết: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Toggle publish status - only allow for admin/superadmin posts or approved submissions
    const togglePublishStatus = async (post: Post) => {
        try {
            // Check if user can edit this post
            if (!canEditPost(post)) {
                showNotification('warning', 'Bạn không có quyền chỉnh sửa bài viết này');
                return;
            }

            const { error } = await supabase
                .from('posts')
                .update({
                    published: !post.published,
                    published_at: !post.published ? new Date().toISOString() : null
                })
                .eq('id', post.id);

            if (error) throw error;

            showNotification('success', 'Cập nhật trạng thái thành công');
            loadPosts(currentPage);
        } catch (error) {
            console.error('Error updating publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + getErrorMessage(error));
        }
    };

    // Delete post - only allow for admin/superadmin posts
    const deletePost = async (post: Post) => {
        if (!canDeletePost(post)) {
            showNotification('warning', 'Bạn không có quyền xóa bài viết này');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

            if (error) throw error;

            showNotification('success', 'Xóa bài viết thành công');

            // If current page becomes empty, go to previous page
            if (posts.length === 1 && currentPage > 1) {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                loadPosts(newPage);
            } else {
                loadPosts(currentPage);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showNotification('error', 'Lỗi khi xóa bài viết: ' + getErrorMessage(error));
        }
    };

    // Check if current user can edit a post
    const canEditPost = (post: Post): boolean => {
        if (!user) return false;

        // Admin and superadmin can edit any post
        if (user.role === 'admin' || user.role === 'superadmin') {
            return true;
        }

        // Authors can edit their own posts (but mentor posts will go through submission process)
        return post.author_id === user.id;
    };

    // Check if current user can delete a post
    const canDeletePost = (post: Post): boolean => {
        if (!user) return false;

        // Only admin and superadmin can delete posts
        if (user.role === 'admin' || user.role === 'superadmin') {
            return true;
        }

        // Authors can delete their own unpublished posts if they're not from submissions
        return post.author_id === user.id && !post.published && !post.from_submission;
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            loadPosts(newPage);
        }
    };

    // Expose reload function for parent component
    React.useImperativeHandle(ref, () => ({
        reload: () => loadPosts(currentPage)
    }));

    // Effects
    useEffect(() => {
        setCurrentPage(1);
        loadPosts(1);
    }, [searchTerm, filterType, filterPublished, filterTag]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Không có bài viết nào.</p>
            </div>
        );
    }

    return (
        <>
            {/* Posts Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bài viết
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tác giả
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nguồn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    {post.thumbnail && (
                                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                                            <Image
                                                src={post.thumbnail}
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {post.title}
                                        </div>
                                        {post.description && (
                                            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                                                {post.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    post.type === 'activity'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {post.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {post.tags && post.tags.length > 0 ? (
                                        post.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800"
                                            >
                                                <Tag className="w-3 h-3 mr-1" />
                                                {tag.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">Chưa có tag</span>
                                    )}
                                    {post.tags && post.tags.length > 2 && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
                                            +{post.tags.length - 2}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {post.profiles?.full_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => togglePublishStatus(post)}
                                    disabled={!canEditPost(post)}
                                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                        post.published
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    } ${!canEditPost(post) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {post.published ? (
                                        <>
                                            <Eye className="w-3 h-3 mr-1" />
                                            Đã xuất bản
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="w-3 h-3 mr-1" />
                                            Bản nháp
                                        </>
                                    )}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {post.from_submission ? (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Mentor (Đã duyệt)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                        Admin
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    {canEditPost(post) && (
                                        <button
                                            onClick={() => onEditPost(post)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDeletePost(post) && (
                                        <button
                                            onClick={() => deletePost(post)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {!canEditPost(post) && !canDeletePost(post) && (
                                        <span className="text-xs text-gray-400">Không có quyền</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} bài viết
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trước
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 7) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, index, array) => {
                                        const prevPage = array[index - 1];
                                        const shouldShowEllipsis = prevPage && page - prevPage > 1;

                                        return (
                                            <React.Fragment key={page}>
                                                {shouldShowEllipsis && (
                                                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                                                )}
                                                <button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                        currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

PostsTab.displayName = 'PostsTab';

export default PostsTab;