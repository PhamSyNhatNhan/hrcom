// src/component/admin/post/SubmissionsTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { PostSubmission } from '@/types/post_admin';
import {
    Eye,
    MessageSquare,
    User,
    Clock,
    XCircle,
    CheckCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    Calendar,
    Tag
} from 'lucide-react';
import Image from 'next/image';

interface SubmissionsTabProps {
    searchTerm: string;
    filterType: 'all' | 'activity' | 'blog';
    filterStatus: 'all' | 'pending' | 'approved' | 'rejected';
    filterTag: string;
    onReviewSubmission: (submission: PostSubmission) => void;
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

const renderPreviewContent = (content: string) => {
    if (!content) return <p className="text-gray-500 italic">Nội dung đang được cập nhật...</p>;

    let htmlContent = '';
    if (typeof content === 'string') {
        htmlContent = content;
    } else if (content && typeof content === 'object') {
        const maybeHtml = (content as { html?: unknown }).html;
        htmlContent = typeof maybeHtml === 'string' ? maybeHtml : JSON.stringify(content);
    } else {
        htmlContent = String(content ?? '');
    }

    return (
        <div
            className="tinymce-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

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

    const [showPreview, setShowPreview] = useState(false);
    const [previewSubmission, setPreviewSubmission] = useState<PostSubmission | null>(null);

    const loadSubmissions = async (page: number = 1) => {
        try {
            setLoading(true);

            const { data, error } = await supabase.rpc('posts_admin_get_submissions', {
                page_number: page,
                page_size: pageSize,
                filter_type: filterType,
                filter_status: filterStatus,
                filter_tag: filterTag,
                search_term: searchTerm
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const totalCount = data[0].total_count || 0;
                setTotalCount(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                const transformedSubmissions = data.map((row: any) => {
                    const postData = row.post_data || {};
                    return {
                        id: row.id,
                        post_id: row.post_id,
                        author_id: row.author_id,
                        status: row.status,
                        reviewed_by: row.reviewed_by,
                        reviewed_at: row.reviewed_at,
                        admin_notes: row.admin_notes,
                        submitted_at: row.submitted_at,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        posts: postData.id ? {
                            id: postData.id,
                            title: postData.title,
                            description: postData.description,
                            thumbnail: postData.thumbnail,
                            content: postData.content,
                            type: postData.type,
                            published: postData.published,
                            tags: postData.tags || [],
                            author_id: row.author_id,
                            published_at: null,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        } : null,
                        profiles: {
                            full_name: row.author_name,
                            image_url: row.author_avatar
                        },
                        reviewed_by_profile: row.reviewer_name ? {
                            full_name: row.reviewer_name
                        } : undefined
                    };
                });

                setSubmissions(transformedSubmissions);
            } else {
                setSubmissions([]);
                setTotalCount(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            showNotification('error', 'Không thể tải danh sách duyệt bài: ' + getErrorMessage(error));
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        loadSubmissions(newPage);
    };

    const handlePreview = (submission: PostSubmission) => {
        setPreviewSubmission(submission);
        setShowPreview(true);
    };

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

    React.useImperativeHandle(ref, () => ({
        reload: () => loadSubmissions(currentPage)
    }));

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
                <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {filterStatus === 'pending' ? 'Không có bài viết chờ duyệt' : 'Không có bài viết nào'}
                    </h3>
                    <p className="text-gray-600">
                        {filterStatus === 'pending'
                            ? 'Tất cả bài viết đã được xử lý hoặc chưa có mentor nào gửi bài mới.'
                            : 'Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
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
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {submission.posts?.title || 'Không có tiêu đề'}
                                        </div>
                                        {submission.posts?.description && (
                                            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                                                {submission.posts.description}
                                            </div>
                                        )}
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
                                            <User className="w-3 h-3 text-gray-500" />
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-900">
                                        {submission.profiles?.full_name || 'Không rõ tên'}
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
                                    <button
                                        onClick={() => handlePreview(submission)}
                                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                        title="Xem trước bài viết"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    {submission.status === 'pending' && (
                                        <button
                                            onClick={() => onReviewSubmission(submission)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                            title="Duyệt bài viết"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

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
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPreview && previewSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowPreview(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Preview Bài Viết</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span>Tác giả: {previewSubmission.profiles?.full_name || 'Không rõ tên'}</span>
                                        <span>•</span>
                                        <span>Gửi lúc: {new Date(previewSubmission.submitted_at).toLocaleString('vi-VN')}</span>
                                        <span>•</span>
                                        {getStatusBadge(previewSubmission.status)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
                            <div className="p-6">
                                <div className="mb-8 pb-6 border-b border-gray-200">
                                    <div className="mb-3">
                                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                                            {previewSubmission.posts?.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION'}
                                        </span>
                                    </div>

                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                        {previewSubmission.posts?.title || 'Không có tiêu đề'}
                                    </h1>

                                    {previewSubmission.posts?.description && (
                                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                            {previewSubmission.posts.description}
                                        </p>
                                    )}

                                    {previewSubmission.posts?.tags && previewSubmission.posts.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {previewSubmission.posts.tags.map((tag: any) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800"
                                                >
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-5 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>{new Date(previewSubmission.posts?.created_at || previewSubmission.submitted_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <span className="hidden sm:inline text-gray-300">•</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <span>5 phút đọc</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="preview-content">
                                    {renderPreviewContent(previewSubmission.posts?.content || '')}
                                </div>

                                {previewSubmission.admin_notes && (
                                    <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h4 className="font-medium text-red-900 mb-2">Ghi chú từ Admin:</h4>
                                        <p className="text-red-800">{previewSubmission.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end bg-gray-50">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Đóng
                            </button>
                            {previewSubmission.status === 'pending' && (
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        onReviewSubmission(previewSubmission);
                                    }}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Duyệt bài viết
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

SubmissionsTab.displayName = 'SubmissionsTab';

export default SubmissionsTab;