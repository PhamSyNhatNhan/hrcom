// src/component/admin/post/PostsTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Post, PostComment } from '@/types/post_admin';
import {
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    MessageSquare,
    Tag,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Save,
    ChevronDown,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import Image from 'next/image';

interface PostsTabProps {
    searchTerm: string;
    filterType: 'all' | 'activity' | 'blog';
    filterPublished: 'all' | 'published' | 'draft';
    filterTag: string;
    onEditPost: (post: Post) => void;
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

    // Comments modal state
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editPublished, setEditPublished] = useState(true);
    const [savingComment, setSavingComment] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    // Load posts using RPC
    const loadPosts = async (page: number = 1) => {
        try {
            setLoading(true);

            const { data, error } = await supabase.rpc('posts_admin_get_posts', {
                page_number: page,
                page_size: pageSize,
                filter_type: filterType,
                filter_published: filterPublished,
                filter_tag: filterTag,
                search_term: searchTerm
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const totalCount = data[0].total_count || 0;
                setTotalCount(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Transform data
                const transformedPosts = data.map((row: any) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    thumbnail: row.thumbnail,
                    content: row.content,
                    author_id: row.author_id,
                    type: row.type,
                    published: row.published,
                    published_at: row.published_at,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    profiles: {
                        full_name: row.author_name,
                        image_url: row.author_avatar,
                        id: row.author_profile_id
                    },
                    tags: row.tags || [],
                    comment_count: Number(row.comment_count) || 0
                }));

                setPosts(transformedPosts);
            } else {
                setPosts([]);
                setTotalCount(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            showNotification('error', 'Không thể tải bài viết: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Toggle publish status
    const togglePublishStatus = async (post: Post) => {
        try {
            const { data, error } = await supabase.rpc('posts_admin_toggle_publish', {
                p_post_id: post.id
            });

            if (error) throw error;

            showNotification('success', data ? 'Đã xuất bản bài viết' : 'Đã chuyển thành bản nháp');
            loadPosts(currentPage);
        } catch (error) {
            console.error('Error updating publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + getErrorMessage(error));
        }
    };

    // Delete post
    const deletePost = async (post: Post) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            const { error } = await supabase.rpc('posts_admin_delete_post', {
                p_post_id: post.id
            });

            if (error) throw error;

            showNotification('success', 'Xóa bài viết thành công');

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

    // View comments
    const handleViewComments = async (post: Post) => {
        setSelectedPost(post);
        setShowCommentsModal(true);
        await loadComments(post.id);
    };

    // Load comments for a post
    const loadComments = async (postId: string) => {
        try {
            setLoadingComments(true);

            const { data, error } = await supabase.rpc('posts_admin_get_comments', {
                p_post_id: postId,
                include_deleted: true
            });

            if (error) throw error;

            setComments(data || []);
        } catch (error) {
            console.error('Error loading comments:', error);
            showNotification('error', 'Không thể tải bình luận: ' + getErrorMessage(error));
        } finally {
            setLoadingComments(false);
        }
    };

    // Load replies for a comment
    const loadReplies = async (commentId: string) => {
        try {
            const { data, error } = await supabase.rpc('posts_admin_get_comment_replies', {
                p_parent_comment_id: commentId,
                include_deleted: true
            });

            if (error) throw error;

            setComments(prev => prev.map(comment =>
                comment.id === commentId
                    ? { ...comment, replies: data || [] }
                    : comment
            ));
        } catch (error) {
            console.error('Error loading replies:', error);
            showNotification('error', 'Không thể tải phản hồi: ' + getErrorMessage(error));
        }
    };

    // Toggle expand replies
    const toggleReplies = async (commentId: string) => {
        const newExpanded = new Set(expandedComments);

        if (expandedComments.has(commentId)) {
            newExpanded.delete(commentId);
            setExpandedComments(newExpanded);
        } else {
            newExpanded.add(commentId);
            setExpandedComments(newExpanded);

            const comment = comments.find(c => c.id === commentId);
            if (comment && !comment.replies) {
                await loadReplies(commentId);
            }
        }
    };

    // Toggle comment visibility
    const toggleCommentVisibility = async (commentId: string) => {
        try {
            const { data, error } = await supabase.rpc('posts_admin_toggle_comment_visibility', {
                p_comment_id: commentId
            });

            if (error) throw error;

            showNotification('success', data ? 'Đã hiện bình luận' : 'Đã ẩn bình luận');
            if (selectedPost) {
                await loadComments(selectedPost.id);
            }
        } catch (error) {
            console.error('Error toggling visibility:', error);
            showNotification('error', 'Lỗi khi thay đổi trạng thái: ' + getErrorMessage(error));
        }
    };

    // Delete comment
    const deleteComment = async (commentId: string) => {
        if (!confirm('Xóa bình luận này? (Có thể khôi phục bằng cách edit)')) {
            return;
        }

        try {
            const { error } = await supabase.rpc('posts_admin_delete_comment', {
                p_comment_id: commentId,
                soft_delete: true
            });

            if (error) throw error;

            showNotification('success', 'Đã xóa bình luận');
            if (selectedPost) {
                await loadComments(selectedPost.id);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            showNotification('error', 'Lỗi khi xóa bình luận: ' + getErrorMessage(error));
        }
    };

    // Start editing comment
    const startEditComment = (comment: PostComment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
        setEditPublished(comment.published);
    };

    // Save comment edit
    const saveCommentEdit = async (commentId: string) => {
        if (!editContent.trim()) {
            showNotification('error', 'Nội dung không được để trống');
            return;
        }

        try {
            setSavingComment(true);

            const { error } = await supabase.rpc('posts_admin_update_comment', {
                p_comment_id: commentId,
                p_content: editContent.trim(),
                p_published: editPublished
            });

            if (error) throw error;

            showNotification('success', 'Cập nhật bình luận thành công');
            setEditingComment(null);
            if (selectedPost) {
                await loadComments(selectedPost.id);
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            showNotification('error', 'Lỗi khi cập nhật: ' + getErrorMessage(error));
        } finally {
            setSavingComment(false);
        }
    };

    // Render single comment
    const renderComment = (comment: PostComment, isReply: boolean = false) => {
        const isEditing = editingComment === comment.id;

        return (
            <div
                key={comment.id}
                className={`${isReply ? 'ml-12 border-l-2 border-gray-200 pl-4' : ''} mb-4`}
            >
                <div className={`bg-white border rounded-lg p-4 ${
                    comment.deleted ? 'border-red-200 bg-red-50' :
                        !comment.published ? 'border-yellow-200 bg-yellow-50' :
                            'border-gray-200'
                }`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {comment.author_avatar ? (
                                <Image
                                    src={comment.author_avatar}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                            )}
                            <div>
                                <div className="font-medium text-sm text-gray-900">{comment.author_name}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center gap-2">
                            {comment.deleted && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                                    Đã xóa
                                </span>
                            )}
                            {!comment.published && !comment.deleted && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                    Đã ẩn
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {isEditing ? (
                        <div className="space-y-3 mb-3">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập nội dung bình luận..."
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={`published-${comment.id}`}
                                    checked={editPublished}
                                    onChange={(e) => setEditPublished(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`published-${comment.id}`} className="text-sm text-gray-700">
                                    Hiển thị công khai
                                </label>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">{comment.content}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            {!isReply && comment.reply_count !== undefined && comment.reply_count > 0 && (
                                <button
                                    onClick={() => toggleReplies(comment.id)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    {expandedComments.has(comment.id) ? (
                                        <ChevronDown className="w-3 h-3" />
                                    ) : (
                                        <ChevronRightIcon className="w-3 h-3" />
                                    )}
                                    {comment.reply_count} phản hồi
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setEditingComment(null)}
                                        className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
                                        disabled={savingComment}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => saveCommentEdit(comment.id)}
                                        disabled={savingComment}
                                        className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {savingComment ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                Lưu
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => toggleCommentVisibility(comment.id)}
                                        className="text-xs text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                                        title={comment.published ? 'Ẩn bình luận' : 'Hiện bình luận'}
                                    >
                                        {comment.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => startEditComment(comment)}
                                        className="text-xs text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    {!comment.deleted && (
                                        <button
                                            onClick={() => deleteComment(comment.id)}
                                            className="text-xs text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {!isReply && expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            loadPosts(newPage);
        }
    };

    // Expose reload function
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
                            Bình luận
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
                                        post.tags.slice(0, 2).map((tag: any) => (
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
                                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                        post.published
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    }`}
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
                                <button
                                    onClick={() => handleViewComments(post)}
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {post.comment_count || 0}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEditPost(post)}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deletePost(post)}
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4" />
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

            {/* Comments Modal */}
            {showCommentsModal && selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowCommentsModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        Bình luận bài viết
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{selectedPost.title}</p>
                                </div>
                                <button
                                    onClick={() => setShowCommentsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                            {loadingComments ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                                    <p className="text-gray-600">Đang tải bình luận...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-600">Chưa có bình luận nào</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map(comment => renderComment(comment))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Tổng số: <span className="font-medium">{comments.length}</span> bình luận
                                </p>
                                <button
                                    onClick={() => setShowCommentsModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

PostsTab.displayName = 'PostsTab';

export default PostsTab;