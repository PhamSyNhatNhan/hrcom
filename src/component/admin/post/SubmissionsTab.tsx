'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import {
    Eye,
    MessageSquare,
    User,
    Clock,
    XCircle,
    CheckCircle,
    Loader2,
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
    };
    tags?: Tag[];
}

interface PostSubmission {
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
    posts: Post;
    profiles: {
        full_name: string;
        image_url?: string;
    };
    reviewed_by_profile?: {
        full_name: string;
    };
}

interface SubmissionsTabProps {
    searchTerm: string;
    filterType: 'all' | 'activity' | 'blog';
    filterStatus: 'all' | 'pending' | 'approved' | 'rejected';
    filterTag: string;
    onReviewSubmission: (submission: PostSubmission) => void;
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

const SubmissionsTab = React.forwardRef<{ reload: () => void }, SubmissionsTabProps>(({
                                                                                          searchTerm,
                                                                                          filterType,
                                                                                          filterStatus,
                                                                                          filterTag,
                                                                                          onReviewSubmission,
                                                                                          showNotification
                                                                                      }, ref) => {
    const [submissions, setSubmissions] = useState<PostSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20;

    // Load post submissions with pagination and filters
    const loadSubmissions = async (page: number = 1) => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('post_submissions')
                .select(`
                    *,
                    posts (
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
                    ),
                    profiles!post_submissions_author_id_fkey (
                        full_name,
                        image_url
                    ),
                    reviewed_by_profile:profiles!post_submissions_reviewed_by_fkey (
                        full_name
                    )
                `, { count: 'exact' });

            // Apply filters
            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            if (filterType !== 'all') {
                query = query.eq('posts.type', filterType);
            }

            if (searchTerm.trim()) {
                query = query.or(`posts.title.ilike.%${searchTerm}%,posts.description.ilike.%${searchTerm}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query
                .range(from, to)
                .order('submitted_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform the data to include tags array
            let submissionsWithTags = (data || []).map(submission => ({
                ...submission,
                posts: submission.posts ? {
                    ...submission.posts,
                    tags: submission.posts.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
                } : null
            }));

            // Client-side filter by tag (since Supabase doesn't support nested filtering easily)
            if (filterTag !== 'all') {
                submissionsWithTags = submissionsWithTags.filter(submission =>
                    submission.posts?.tags && submission.posts.tags.some((tag: Tag) => tag.id === filterTag)
                );
            }

            setSubmissions(submissionsWithTags);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / pageSize));

        } catch (error) {
            console.error('Error loading submissions:', error);
            showNotification('error', 'Không thể tải danh sách duyệt bài: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        loadSubmissions(newPage);
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ duyệt
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Từ chối
                    </span>
                );
            default:
                return null;
        }
    };

    // Expose reload function for parent component
    React.useImperativeHandle(ref, () => ({
        reload: () => loadSubmissions(currentPage)
    }));

    // Effects
    useEffect(() => {
        setCurrentPage(1);
        loadSubmissions(1);
    }, [searchTerm, filterType, filterStatus, filterTag]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Không có bài viết nào cần duyệt.</p>
            </div>
        );
    }

    return (
        <>
            {/* Submissions Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bài viết
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mentor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày gửi
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    {submission.posts?.thumbnail && (
                                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                                            <Image
                                                src={submission.posts.thumbnail}
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {submission.posts?.title}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {submission.profiles?.image_url ? (
                                        <Image
                                            src={submission.profiles.image_url}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full mr-2"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                            <User className="w-3 h-3" />
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-900">
                                            {submission.profiles?.full_name}
                                        </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        submission.posts?.type === 'activity'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {submission.posts?.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(submission.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(submission.submitted_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    {submission.status === 'pending' && (
                                        <button
                                            onClick={() => onReviewSubmission(submission)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Duyệt bài viết"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.open(`/posts/${submission.posts?.id}`, '_blank')}
                                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                        title="Xem bài viết"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
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

SubmissionsTab.displayName = 'SubmissionsTab';

export default SubmissionsTab;