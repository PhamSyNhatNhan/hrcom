'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/component/Button';
import {
    Plus,
    Search,
    Edit,
    Upload,
    X,
    Save,
    XCircle,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    Eye,
    EyeOff,
    Tag,
    Calendar,
    Clock,
    AlertTriangle,
    Send,
    Edit3,
    Trash2,
    MessageSquare,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { Editor } from '@tinymce/tinymce-react';

// Types
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
    reviewed_by_profile?: {
        full_name: string;
    };
}

interface PostWithSubmission extends Post {
    latest_submission?: PostSubmission;
    submission_history?: PostSubmission[];
}

interface PostFormData {
    title: string;
    description: string;
    type: 'activity' | 'blog';
    content: string;
    thumbnail: File | null;
    selectedTags: string[];
}

type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';

// Helper functions
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

const PostMentorPage: React.FC = () => {
    const { user } = useAuthStore();
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const liveEditorRef = useRef<any>(null);

    // State management
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState<PostWithSubmission[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState<PostWithSubmission | null>(null);
    const [showSubmissionHistory, setShowSubmissionHistory] = useState(false);
    const [selectedPostHistory, setSelectedPostHistory] = useState<PostWithSubmission | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 12;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'activity' | 'blog'>('all');
    const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
    const [filterTag, setFilterTag] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        description: '',
        type: 'activity',
        content: '',
        thumbnail: null,
        selectedTags: []
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    // Preview states
    const [showPreview, setShowPreview] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [livePreviewContent, setLivePreviewContent] = useState('');
    const [isLivePreviewClosing, setIsLivePreviewClosing] = useState(false);
    const [pendingLiveContent, setPendingLiveContent] = useState('');

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Get post status
    const getPostStatus = (post: PostWithSubmission): StatusFilter => {
        if (!post.latest_submission) {
            return 'draft';
        }

        if (post.latest_submission.status === 'approved' && !post.published) {
            return 'hidden';
        }

        return post.latest_submission.status as StatusFilter;
    };

    // Get status badge
    const getStatusBadge = (post: PostWithSubmission) => {
        const status = getPostStatus(post);

        switch (status) {
            case 'draft':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        <Edit3 className="w-3 h-3 mr-1" />
                        Bản nháp
                    </span>
                );
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
            case 'hidden':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Đã ẩn
                    </span>
                );
            default:
                return null;
        }
    };

    // Check if can edit post
    const canEditPost = (post: PostWithSubmission): boolean => {
        if (!post.latest_submission) return true; // Draft

        return ['rejected', 'approved'].includes(post.latest_submission.status);
    };

    // Check if can delete post
    const canDeletePost = (post: PostWithSubmission): boolean => {
        if (!post.latest_submission) return true; // Draft

        return post.latest_submission.status !== 'approved' || !post.published;
    };

    // Preview handlers
    const handlePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setShowPreview(true);
    };

    const handleLivePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setLivePreviewContent(content);
        setPendingLiveContent(content);
        setShowLivePreview(true);
    };

    const handleCloseLivePreview = async () => {
        setIsLivePreviewClosing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            let finalContent = '';

            if (liveEditorRef.current) {
                try {
                    finalContent = liveEditorRef.current.getContent();
                } catch (error) {
                    console.warn('Could not get content from live editor:', error);
                }
            }

            if (!finalContent) {
                finalContent = pendingLiveContent || livePreviewContent || '';
            }

            if (finalContent && editorRef.current) {
                try {
                    editorRef.current.setContent(finalContent);
                    editorRef.current.fire('change');
                    editorRef.current.fire('input');
                    setFormData(prev => ({ ...prev, content: finalContent }));
                } catch (error) {
                    console.error('Error syncing content to main editor:', error);
                }
            }

        } catch (error) {
            console.error('Error during live preview close:', error);
        } finally {
            setShowLivePreview(false);
            setPreviewContent('');
            setIsLivePreviewClosing(false);
            setLivePreviewContent('');
            setPendingLiveContent('');
        }
    };

    const updateLivePreview = () => {
        if (showLivePreview && liveEditorRef.current && !isLivePreviewClosing) {
            const content = liveEditorRef.current.getContent();
            setPreviewContent(content);
            setPendingLiveContent(content);

            if (editorRef.current) {
                editorRef.current.setContent(content);
            }
        }
    };

    // Load posts with pagination
    const loadPosts = async (page: number = 1) => {
        if (!user) return;

        try {
            setLoading(true);

            // Build query with filters
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    post_tags (
                        tags (
                            id,
                            name,
                            description
                        )
                    )
                `, { count: 'exact' })
                .eq('author_id', user.id);

            // Apply filters
            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            if (searchTerm.trim()) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query
                .range(from, to)
                .order('updated_at', { ascending: false });

            const { data: postsData, error: postsError, count } = await query;

            if (postsError) throw postsError;

            // Load submissions for each post
            const postIds = postsData?.map(p => p.id) || [];
            let submissionsData: any[] = [];

            if (postIds.length > 0) {
                const { data, error: submissionsError } = await supabase
                    .from('post_submissions')
                    .select(`
                        *,
                        reviewed_by_profile:profiles!post_submissions_reviewed_by_fkey (
                            full_name
                        )
                    `)
                    .in('post_id', postIds)
                    .order('submitted_at', { ascending: false });

                if (submissionsError) throw submissionsError;
                submissionsData = data || [];
            }

            // Combine posts with submissions and apply status filter
            let postsWithSubmissions: PostWithSubmission[] = (postsData || []).map(post => {
                const postSubmissions = submissionsData.filter(s => s.post_id === post.id);

                return {
                    ...post,
                    tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
                    latest_submission: postSubmissions[0] || null,
                    submission_history: postSubmissions
                };
            });

            // Client-side filters
            if (filterStatus !== 'all') {
                postsWithSubmissions = postsWithSubmissions.filter(post =>
                    getPostStatus(post) === filterStatus
                );
            }

            if (filterTag !== 'all') {
                postsWithSubmissions = postsWithSubmissions.filter(post =>
                    post.tags && post.tags.some(tag => tag.id === filterTag)
                );
            }

            setPosts(postsWithSubmissions);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / pageSize));

        } catch (error) {
            console.error('Error loading posts:', error);
            showNotification('error', 'Không thể tải bài viết: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        loadPosts(newPage);
    };

    // Load tags
    const loadTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTags(data || []);
        } catch (error) {
            console.error('Error loading tags:', error);
            showNotification('error', 'Không thể tải danh sách tag: ' + getErrorMessage(error));
        }
    };

    // Upload image
    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    // Handle thumbnail change
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, thumbnail: file }));

            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Toggle tag
    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagId)
                ? prev.selectedTags.filter(id => id !== tagId)
                : [...prev.selectedTags, tagId]
        }));
    };

    // Save post (creates new submission when editing approved post)
    // Save post (fixed logic - no auto submission for rejected posts)
    const savePost = async () => {
        if (!user) return;

        try {
            setUploading(true);

            let thumbnailUrl = editingPost?.thumbnail || '';
            if (formData.thumbnail) {
                thumbnailUrl = await uploadImage(formData.thumbnail);
            }

            const content = editorRef.current?.getContent() || formData.content || '';

            const postData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                content: content,
                thumbnail: thumbnailUrl || null,
                published: false, // Always false for mentor posts
                author_id: user.id
            };

            let postId;
            let needsReApproval = false;

            if (editingPost) {
                // Check if post was approved before editing (only approved posts need re-approval)
                needsReApproval = editingPost.latest_submission?.status === 'approved';

                // Update existing post
                const { error } = await supabase
                    .from('posts')
                    .update(postData)
                    .eq('id', editingPost.id);

                if (error) throw error;
                postId = editingPost.id;

                // Only create new submission for approved posts that are being edited
                if (needsReApproval) {
                    const { error: submissionError } = await supabase
                        .from('post_submissions')
                        .insert([{
                            post_id: postId,
                            author_id: user.id,
                            status: 'pending'
                        }]);

                    if (submissionError) throw submissionError;
                    showNotification('warning', 'Bài viết đã được chỉnh sửa và cần admin duyệt lại');
                }
            } else {
                // Create new post
                const { data, error } = await supabase
                    .from('posts')
                    .insert([postData])
                    .select('id')
                    .single();

                if (error) throw error;
                postId = data.id;
            }

            // Handle tags
            if (postId) {
                // Remove existing tags
                await supabase
                    .from('post_tags')
                    .delete()
                    .eq('post_id', postId);

                // Add new tags
                if (formData.selectedTags.length > 0) {
                    const tagInserts = formData.selectedTags.map(tagId => ({
                        post_id: postId,
                        tag_id: tagId
                    }));

                    const { error: tagError } = await supabase
                        .from('post_tags')
                        .insert(tagInserts);

                    if (tagError) throw tagError;
                }
            }

            // Show appropriate success message
            if (!needsReApproval) {
                if (editingPost) {
                    const status = editingPost.latest_submission?.status;
                    if (status === 'rejected') {
                        showNotification('success', 'Đã cập nhật bài viết bị từ chối. Bạn có thể gửi duyệt lại khi sẵn sàng.');
                    } else {
                        showNotification('success', 'Cập nhật bài viết thành công');
                    }
                } else {
                    showNotification('success', 'Tạo bản nháp thành công');
                }
            }

            resetForm();
            loadPosts(currentPage);

        } catch (error) {
            console.error('Error saving post:', error);
            showNotification('error', 'Lỗi khi lưu bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Submit for approval
    const submitForApproval = async (postId: string) => {
        if (!user) return;

        try {
            setUploading(true);

            const { error } = await supabase
                .from('post_submissions')
                .insert([{
                    post_id: postId,
                    author_id: user.id,
                    status: 'pending'
                }]);

            if (error) throw error;

            showNotification('success', 'Đã gửi bài viết để duyệt');
            loadPosts(currentPage);
        } catch (error) {
            console.error('Error submitting post:', error);
            showNotification('error', 'Lỗi khi gửi duyệt: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Toggle publish status (only for approved posts)
    const togglePublishStatus = async (post: PostWithSubmission) => {
        if (post.latest_submission?.status !== 'approved') return;

        try {
            setUploading(true);

            const { error } = await supabase
                .from('posts')
                .update({ published: !post.published })
                .eq('id', post.id);

            if (error) throw error;

            showNotification('success', post.published ? 'Đã ẩn bài viết' : 'Đã hiển thị bài viết');
            loadPosts(currentPage);
        } catch (error) {
            console.error('Error toggling publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Delete post
    const deletePost = async (post: PostWithSubmission) => {
        if (!canDeletePost(post)) return;

        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            setUploading(true);

            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

            if (error) throw error;

            showNotification('success', 'Xóa bài viết thành công');

            // If current page becomes empty, go to previous page
            if (posts.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
                loadPosts(currentPage - 1);
            } else {
                loadPosts(currentPage);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showNotification('error', 'Lỗi khi xóa bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Handle edit post
    const handleEditPost = (post: PostWithSubmission) => {
        if (!canEditPost(post)) return;

        setEditingPost(post);
        setFormData({
            title: post.title,
            description: post.description || '',
            type: post.type,
            content: post.content || '',
            thumbnail: null,
            selectedTags: post.tags?.map(tag => tag.id) || []
        });

        if (post.thumbnail) {
            setThumbnailPreview(post.thumbnail);
        }

        setShowForm(true);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingPost(null);
        setFormData({
            title: '',
            description: '',
            type: 'activity',
            content: '',
            thumbnail: null,
            selectedTags: []
        });
        setThumbnailPreview('');
        setTagSearch('');
        setShowTagDropdown(false);
        setPreviewContent('');
        setLivePreviewContent('');
        setPendingLiveContent('');
        if (editorRef.current) {
            editorRef.current.setContent('');
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

    // Effects
    useEffect(() => {
        if (user) {
            loadTags();
        }
    }, [user]);

    useEffect(() => {
        setCurrentPage(1);
        loadPosts(1);
    }, [searchTerm, filterType, filterStatus, filterTag]);

    useEffect(() => {
        if (showForm) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [showForm]);

    useEffect(() => {
        return () => {
            if (showLivePreview && !isLivePreviewClosing) {
                handleCloseLivePreview();
            }
        };
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
                    <p className="text-gray-600">Bạn cần đăng nhập để quản lý bài viết.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm w-full ${
                        notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : notification.type === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                >
                    <div className="flex items-center">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        <span className="flex-1">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ BÀI VIẾT"
                    subtitle="Tạo và quản lý các bài viết của bạn. Bài viết sẽ được admin duyệt trước khi xuất bản."
                />

                {/* Main Controls */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài viết..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-4">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả loại</option>
                                    <option value="activity">Hoạt động</option>
                                    <option value="blog">Blog</option>
                                </select>

                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="draft">Bản nháp</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="approved">Đã duyệt</option>
                                    <option value="rejected">Từ chối</option>
                                    <option value="hidden">Đã ẩn</option>
                                </select>

                                <select
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả tag</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => loadPosts(currentPage)}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Tải lại
                                </Button>

                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Bài viết mới
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Edit className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Chưa có bài viết nào
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Bạn chưa có bài viết nào. Hãy tạo bài viết đầu tiên để chia sẻ kiến thức và kinh nghiệm của mình!
                                </p>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-2 mx-auto"
                                >
                                    <Plus className="w-5 h-5" />
                                    Tạo bài viết mới
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Posts Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {posts.map((post) => (
                                        <div
                                            key={post.id}
                                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                        >
                                            {/* Post Thumbnail */}
                                            <div className="aspect-video bg-gray-100 relative">
                                                {post.thumbnail ? (
                                                    <Image
                                                        src={post.thumbnail}
                                                        alt={post.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Edit className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}

                                                {/* Type Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        post.type === 'activity'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {post.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                                    </span>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-3 right-3">
                                                    {getStatusBadge(post)}
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {post.title}
                                                </h3>

                                                {post.description && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {post.description}
                                                    </p>
                                                )}

                                                {/* Tags */}
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {post.tags.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag.id}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800"
                                                            >
                                                                <Tag className="w-3 h-3 mr-1" />
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                        {post.tags.length > 3 && (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
                                                                +{post.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Admin Notes */}
                                                {post.latest_submission?.admin_notes && (
                                                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                        <p className="text-xs text-red-800">
                                                            <strong>Ghi chú từ admin:</strong> {post.latest_submission.admin_notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Meta Info */}
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(post.updated_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(post.updated_at).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2">
                                                    {/* Submit for approval - Draft posts */}
                                                    {getPostStatus(post) === 'draft' && (
                                                        <button
                                                            onClick={() => submitForApproval(post.id)}
                                                            disabled={uploading}
                                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                                                            title="Gửi duyệt"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            Gửi duyệt
                                                        </button>
                                                    )}

                                                    {/* Submit for approval again - Rejected posts */}
                                                    {getPostStatus(post) === 'rejected' && (
                                                        <button
                                                            onClick={() => submitForApproval(post.id)}
                                                            disabled={uploading}
                                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
                                                            title="Gửi duyệt lại"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            Gửi lại
                                                        </button>
                                                    )}

                                                    {/* Edit post */}
                                                    {canEditPost(post) && (
                                                        <button
                                                            onClick={() => handleEditPost(post)}
                                                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg ${
                                                                getPostStatus(post) === 'rejected'
                                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                            }`}
                                                            title={post.latest_submission?.status === 'approved' ? 'Chỉnh sửa (cần duyệt lại)' : 'Chỉnh sửa'}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Sửa
                                                        </button>
                                                    )}

                                                    {/* Toggle visibility for approved posts */}
                                                    {post.latest_submission?.status === 'approved' && (
                                                        <button
                                                            onClick={() => togglePublishStatus(post)}
                                                            disabled={uploading}
                                                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg"
                                                            title={post.published ? 'Ẩn bài viết' : 'Hiển thị bài viết'}
                                                        >
                                                            {post.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        </button>
                                                    )}

                                                    {/* View submission history */}
                                                    {post.submission_history && post.submission_history.length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPostHistory(post);
                                                                setShowSubmissionHistory(true);
                                                            }}
                                                            className="px-3 py-2 text-xs font-medium text-purple-600 hover:text-purple-900 border border-purple-300 hover:border-purple-400 rounded-lg"
                                                            title="Lịch sử duyệt"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                        </button>
                                                    )}

                                                    {/* Delete post */}
                                                    {canDeletePost(post) && (
                                                        <button
                                                            onClick={() => deletePost(post)}
                                                            disabled={uploading}
                                                            className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-900 border border-red-300 hover:border-red-400 rounded-lg"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                    )}
                </div>

                {/* Guidelines Section - Similar to Admin Mentor Manager */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Hướng dẫn đăng bài
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Edit3 className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Tạo bài viết</h4>
                                <p className="text-sm text-gray-600">
                                    Bài viết mới sẽ được lưu dưới dạng bản nháp. Bạn có thể chỉnh sửa trước khi gửi duyệt.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Quy trình duyệt</h4>
                                <p className="text-sm text-gray-600">
                                    Sau khi gửi duyệt, admin sẽ xem xét và phản hồi trong vòng 1-3 ngày làm việc.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Sau khi duyệt</h4>
                                <p className="text-sm text-gray-600">
                                    Bài viết đã duyệt có thể được ẩn/hiện. Chỉnh sửa sẽ cần duyệt lại.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Bài viết bị từ chối</h4>
                                <p className="text-sm text-gray-600">
                                    Xem ghi chú của admin để hiểu lý do và chỉnh sửa lại bài viết.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-purple-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Lịch sử duyệt</h4>
                                <p className="text-sm text-gray-600">
                                    Xem tất cả các lần gửi duyệt và phản hồi của admin cho từng bài viết.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-indigo-600" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Sử dụng Tags</h4>
                                <p className="text-sm text-gray-600">
                                    Gắn tags phù hợp để người đọc dễ tìm kiếm và phân loại bài viết.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Post Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={resetForm}
                        />

                        <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Warning message */}
                                {editingPost?.latest_submission?.status === 'approved' && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                            <span className="text-yellow-800 font-medium text-sm">
                                                Lưu ý: Bài viết này đã được duyệt. Khi chỉnh sửa, bài viết sẽ bị ẩn và cần admin duyệt lại.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Info message for rejected posts */}
                                {editingPost?.latest_submission?.status === 'rejected' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center">
                                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="text-blue-800 font-medium text-sm">
                                                Bài viết này đã bị từ chối. Bạn có thể chỉnh sửa và gửi duyệt lại khi sẵn sàng.
                                            </span>
                                        </div>
                                        {editingPost.latest_submission.admin_notes && (
                                            <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-400">
                                                <p className="text-sm text-gray-700">
                                                    <strong>Lý do từ chối:</strong> {editingPost.latest_submission.admin_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề bài viết *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tiêu đề bài viết..."
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả bài viết
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập mô tả ngắn về bài viết..."
                                    />
                                </div>

                                {/* Post Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại bài viết
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'activity' | 'blog' }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="activity">Hoạt động</option>
                                        <option value="blog">Blog</option>
                                    </select>
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ảnh đại diện
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <Upload className="w-5 h-5" />
                                            Chọn ảnh
                                        </button>
                                        {thumbnailPreview && (
                                            <div className="relative w-20 h-20">
                                                <Image
                                                    src={thumbnailPreview}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </label>

                                    {/* Selected Tags */}
                                    {formData.selectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {formData.selectedTags.map(tagId => {
                                                const tag = tags.find(t => t.id === tagId);
                                                return tag ? (
                                                    <span
                                                        key={tagId}
                                                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800"
                                                    >
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {tag.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleTag(tagId)}
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}

                                    {/* Tag Search & Dropdown */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={tagSearch}
                                            onChange={(e) => setTagSearch(e.target.value)}
                                            onFocus={() => setShowTagDropdown(true)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tìm kiếm và chọn tags..."
                                        />

                                        {showTagDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowTagDropdown(false)}
                                                />
                                                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredTags.length > 0 ? (
                                                        filteredTags.map(tag => (
                                                            <button
                                                                key={tag.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    toggleTag(tag.id);
                                                                    setTagSearch('');
                                                                    setShowTagDropdown(false);
                                                                }}
                                                                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                                                                    formData.selectedTags.includes(tag.id) ? 'bg-blue-50 text-blue-800' : ''
                                                                }`}
                                                            >
                                                                <Tag className="w-3 h-3" />
                                                                <span className="font-medium">{tag.name}</span>
                                                                {tag.description && (
                                                                    <span className="text-xs text-gray-500 ml-auto">
                                                                        {tag.description}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500 text-sm">
                                                            Không tìm thấy tag nào
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content Editor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung bài viết *
                                    </label>

                                    {/* Preview Controls */}
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={handlePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleLivePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Live Preview
                                        </button>
                                    </div>

                                    <Editor
                                        key={editingPost ? editingPost.id : 'new'}
                                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                                        onInit={(evt, editor) => {
                                            editorRef.current = editor;
                                            if (editingPost?.content) {
                                                setTimeout(() => editor.setContent(editingPost.content), 100);
                                            }
                                        }}
                                        licenseKey="gpl"
                                        initialValue={editingPost?.content || ''}
                                        init={{
                                            base_url: '/tinymce',
                                            suffix: '.min',
                                            height: 560,
                                            menubar: 'file edit view insert format tools table help',
                                            plugins: [
                                                'advlist', 'anchor', 'autolink', 'autosave', 'charmap', 'code', 'codesample',
                                                'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'importcss',
                                                'insertdatetime', 'link', 'lists', 'media', 'nonbreaking', 'pagebreak',
                                                'preview', 'quickbars', 'searchreplace', 'table', 'visualblocks',
                                                'visualchars', 'wordcount'
                                            ],
                                            toolbar: [
                                                'undo redo | restoredraft',
                                                'blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor removeformat',
                                                'alignleft aligncenter alignright alignjustify | lineheight | ltr rtl',
                                                'bullist numlist outdent indent',
                                                'link anchor | image media | table codesample charmap emoticons pagebreak nonbreaking insertdatetime',
                                                'searchreplace visualblocks visualchars code help'
                                            ].join(' | '),
                                            font_family_formats: 'Inter=Inter,sans-serif;Arial=arial,helvetica,sans-serif;Georgia=georgia,serif;Courier New=courier new,courier,monospace',
                                            fontsize_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
                                            line_height_formats: '1 1.15 1.33 1.5 1.75 2',
                                            quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | link | h2 h3 blockquote | bullist numlist',
                                            quickbars_insert_toolbar: 'image media table | hr pagebreak',
                                            quickbars_image_toolbar: 'wrapleft wrapright wrapcenter | clearwrap',
                                            image_advtab: true,
                                            image_dimensions: false,
                                            image_title: true,
                                            file_picker_types: 'image media',
                                            content_css: [
                                                'data:text/css;charset=UTF-8,' + encodeURIComponent(`
                                                    body {
                                                        font-family: Inter, Arial, sans-serif;
                                                        font-size: 14px;
                                                        line-height: 1.7;
                                                        padding: 1rem;
                                                    }
                                                    
                                                    img {
                                                        border-radius: 8px;
                                                        height: auto;
                                                    }
                    
                                                    .wrap-left {
                                                        float: left !important;
                                                        margin: 0 2rem 1rem 0 !important;
                                                        clear: none !important;
                                                    }
                    
                                                    .wrap-right {
                                                        float: right !important;
                                                        margin: 0 0 1rem 2rem !important;
                                                        clear: none !important;
                                                    }
                    
                                                    .wrap-center {
                                                        display: block !important;
                                                        float: none !important;
                                                        margin: 2rem auto !important;
                                                        clear: both !important;
                                                    }
                    
                                                    p {
                                                        margin-bottom: 1rem;
                                                        overflow: visible !important;
                                                    }
                    
                                                    p:has(.wrap-left),
                                                    p:has(.wrap-right) {
                                                        overflow: visible !important;
                                                        min-height: 50px !important;
                                                    }
                    
                                                    .clear-wrap {
                                                        clear: both !important;
                                                        height: 0 !important;
                                                        margin: 1rem 0 !important;
                                                        font-size: 0 !important;
                                                        line-height: 0 !important;
                                                    }
                    
                                                    table {
                                                        border-collapse: collapse;
                                                        width: 100%;
                                                    }
                                                    
                                                    table td, table th {
                                                        border: 1px solid #e5e7eb;
                                                        padding: .5rem;
                                                    }
                    
                                                    @media (max-width: 768px) {
                                                        .wrap-left,
                                                        .wrap-right {
                                                            float: none !important;
                                                            display: block !important;
                                                            margin: 1rem auto !important;
                                                        }
                                                    }
                                                `)
                                            ],
                                            setup: function (editor) {
                                                // Text wrapping commands
                                                const fireWrapChange = (img: HTMLElement) => {
                                                    editor.fire('ObjectResized', { target: img } as any);
                                                };

                                                editor.addCommand('WrapImageLeft', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-left');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('WrapImageRight', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-right');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('WrapImageCenter', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-center');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.textAlign = 'center';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('ClearImageWrap', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        const hasWrap = img.classList.contains('wrap-left') || img.classList.contains('wrap-right') || img.classList.contains('wrap-center');
                                                        if (hasWrap) {
                                                            img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                            const parent = img.parentNode as HTMLElement;
                                                            if (parent && parent.tagName === 'P') parent.removeAttribute('style');
                                                        }
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                // Register buttons
                                                editor.ui.registry.addButton('wrapleft', {
                                                    icon: 'align-left',
                                                    tooltip: 'Text wrap bên phải ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-left')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageLeft');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('wrapright', {
                                                    icon: 'align-right',
                                                    tooltip: 'Text wrap bên trái ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-right')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageRight');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('wrapcenter', {
                                                    icon: 'align-center',
                                                    tooltip: 'Căn giữa ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-center')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageCenter');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('clearwrap', {
                                                    icon: 'remove',
                                                    tooltip: 'Xóa text wrap',
                                                    onAction: function () {
                                                        editor.execCommand('ClearImageWrap');
                                                    }
                                                });

                                                editor.on('NodeChange', function () {
                                                    const wrappedImages = editor.dom.select('img.wrap-left, img.wrap-right');
                                                    wrappedImages.forEach((imgEl) => {
                                                        const parent = imgEl.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                    });
                                                });
                                            },
                                            images_upload_handler: async (blobInfo: any) => {
                                                try {
                                                    const file = blobInfo.blob() as File;
                                                    const url = await uploadImage(file);
                                                    return url;
                                                } catch (err) {
                                                    throw 'Lỗi upload ảnh: ' + err;
                                                }
                                            },
                                            file_picker_callback: (cb: any, value: any, meta: any) => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = meta.filetype === 'media' ? 'video/*,audio/*' : 'image/*';
                                                input.onchange = async () => {
                                                    const f = (input as HTMLInputElement).files?.[0];
                                                    if (!f) return;
                                                    try {
                                                        const url = await uploadImage(f);
                                                        cb(url, { title: f.name });
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                };
                                                input.click();
                                            },
                                            media_live_embeds: true,
                                            media_url_resolver: (data: any, resolve: any) => {
                                                const url = data.url;
                                                const yt = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)/.exec(url);
                                                if (yt) {
                                                    resolve({
                                                        html: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen></iframe>`
                                                    });
                                                    return;
                                                }
                                                resolve({ url });
                                            },
                                            table_header_type: 'sectionCells',
                                            table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | cellprops',
                                            table_resize_bars: true,
                                            autosave_ask_before_unload: true,
                                            autosave_interval: '20s',
                                            autosave_retention: '30m',
                                            link_default_target: '_blank',
                                            link_assume_external_targets: true,
                                            branding: false,
                                            promotion: false,
                                            statusbar: true,
                                            elementpath: false,
                                            toolbar_mode: 'sliding',
                                            extended_valid_elements: 'div[class|style],img[class|src|alt|title|width|height]',
                                            keep_styles: false,
                                            contextmenu: 'link image table spellchecker'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={savePost}
                                    disabled={uploading || !formData.title.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingPost ? 'Cập nhật' : 'Lưu bản nháp'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Preview Modal */}
                        {showPreview && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                                <div
                                    className="absolute inset-0 bg-gray-900/50"
                                    onClick={() => setShowPreview(false)}
                                />

                                <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold">Preview Bài Viết</h3>
                                            <button
                                                onClick={() => setShowPreview(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                        <div className="mb-8 pb-6 border-b border-gray-200">
                                            <div className="mb-3">
                                                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                                                    {formData.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION'}
                                                </span>
                                            </div>

                                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                                {formData.title || 'Tiêu đề bài viết'}
                                            </h1>

                                            {formData.description && (
                                                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                                    {formData.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-5 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-5 h-5" />
                                                    <span>{new Date().toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <span className="hidden sm:inline text-gray-300">•</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5" />
                                                    <span>5 phút đọc</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="preview-content tinymce-content prose prose-lg max-w-none"
                                            dangerouslySetInnerHTML={{ __html: previewContent }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Preview Modal */}
                        {showLivePreview && (
                            <div
                                className="fixed inset-0 z-[60] bg-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        handleCloseLivePreview();
                                    }
                                }}
                                tabIndex={-1}
                            >
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                        <h3 className="text-lg font-bold">Live Preview - {formData.title || 'Bài viết mới'}</h3>
                                        <button
                                            onClick={handleCloseLivePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                            Thoát
                                        </button>
                                    </div>

                                    <div className="flex-1 flex overflow-hidden">
                                        <div className="w-1/2 border-r border-gray-200 flex flex-col">
                                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                                <h4 className="font-semibold text-gray-700">Editor</h4>
                                            </div>
                                            <div className="flex-1">
                                                <Editor
                                                    key={`live-editor-${editingPost?.id || 'new'}`}
                                                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                                                    onInit={(evt, editor) => {
                                                        liveEditorRef.current = editor;
                                                        const currentContent = livePreviewContent || editorRef.current?.getContent() || editingPost?.content || '';
                                                        if (currentContent) {
                                                            setTimeout(() => {
                                                                editor.setContent(currentContent);
                                                                setPreviewContent(currentContent);
                                                                setLivePreviewContent(currentContent);
                                                                setPendingLiveContent(currentContent);
                                                            }, 100);
                                                        }
                                                    }}
                                                    licenseKey="gpl"
                                                    init={{
                                                        base_url: '/tinymce',
                                                        suffix: '.min',
                                                        height: 'calc(100vh - 140px)',
                                                        menubar: 'file edit view insert format tools table help',
                                                        branding: false,
                                                        promotion: false,
                                                        statusbar: false,
                                                        plugins: [
                                                            'advlist', 'anchor', 'autolink', 'autosave', 'charmap', 'code', 'codesample',
                                                            'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'importcss',
                                                            'insertdatetime', 'link', 'lists', 'media', 'nonbreaking', 'pagebreak',
                                                            'preview', 'quickbars', 'searchreplace', 'table', 'visualblocks',
                                                            'visualchars', 'wordcount'
                                                        ],
                                                        toolbar: [
                                                            'undo redo | restoredraft',
                                                            'blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor removeformat',
                                                            'alignleft aligncenter alignright alignjustify | lineheight | ltr rtl',
                                                            'bullist numlist outdent indent',
                                                            'link anchor | image media | table codesample charmap emoticons pagebreak nonbreaking insertdatetime',
                                                            'searchreplace visualblocks visualchars code help'
                                                        ].join(' | '),
                                                        font_family_formats: 'Inter=Inter,sans-serif;Arial=arial,helvetica,sans-serif;Georgia=georgia,serif;Courier New=courier new,courier,monospace',
                                                        fontsize_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
                                                        line_height_formats: '1 1.15 1.33 1.5 1.75 2',
                                                        quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | link | h2 h3 blockquote | bullist numlist',
                                                        quickbars_insert_toolbar: 'image media table | hr pagebreak',
                                                        quickbars_image_toolbar: 'wrapleft wrapright wrapcenter | clearwrap',
                                                        image_advtab: true,
                                                        image_dimensions: false,
                                                        image_title: true,
                                                        file_picker_types: 'image media',
                                                        content_css: [
                                                            'data:text/css;charset=UTF-8,' + encodeURIComponent(`
                                                                body {
                                                                    font-family: Inter, Arial, sans-serif;
                                                                    font-size: 14px;
                                                                    line-height: 1.7;
                                                                    padding: 1rem;
                                                                }
                                                                
                                                                img {
                                                                    border-radius: 8px;
                                                                    height: auto;
                                                                }
                                
                                                                .wrap-left {
                                                                    float: left !important;
                                                                    margin: 0 2rem 1rem 0 !important;
                                                                    clear: none !important;
                                                                }
                                
                                                                .wrap-right {
                                                                    float: right !important;
                                                                    margin: 0 0 1rem 2rem !important;
                                                                    clear: none !important;
                                                                }
                                
                                                                .wrap-center {
                                                                    display: block !important;
                                                                    float: none !important;
                                                                    margin: 2rem auto !important;
                                                                    clear: both !important;
                                                                }
                                
                                                                p {
                                                                    margin-bottom: 1rem;
                                                                    overflow: visible !important;
                                                                }
                                
                                                                p:has(.wrap-left),
                                                                p:has(.wrap-right) {
                                                                    overflow: visible !important;
                                                                    min-height: 50px !important;
                                                                }
                                
                                                                .clear-wrap {
                                                                    clear: both !important;
                                                                    height: 0 !important;
                                                                    margin: 1rem 0 !important;
                                                                    font-size: 0 !important;
                                                                    line-height: 0 !important;
                                                                }
                                
                                                                table {
                                                                    border-collapse: collapse;
                                                                    width: 100%;
                                                                }
                                                                
                                                                table td, table th {
                                                                    border: 1px solid #e5e7eb;
                                                                    padding: .5rem;
                                                                }
                                
                                                                @media (max-width: 768px) {
                                                                    .wrap-left,
                                                                    .wrap-right {
                                                                        float: none !important;
                                                                        display: block !important;
                                                                        margin: 1rem auto !important;
                                                                    }
                                                                }
                                                            `)
                                                        ],
                                                        setup: function(editor) {
                                                            // Same setup as main editor (wrapping commands and buttons)
                                                            const fireWrapChange = (img: HTMLElement) => {
                                                                editor.fire('ObjectResized', { target: img } as any);
                                                            };

                                                            editor.addCommand('WrapImageLeft', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-left');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('WrapImageRight', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-right');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('WrapImageCenter', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-center');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') parent.style.textAlign = 'center';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('ClearImageWrap', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    const hasWrap = img.classList.contains('wrap-left') || img.classList.contains('wrap-right') || img.classList.contains('wrap-center');
                                                                    if (hasWrap) {
                                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                        const parent = img.parentNode as HTMLElement;
                                                                        if (parent && parent.tagName === 'P') parent.removeAttribute('style');
                                                                    }
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            // Register buttons
                                                            editor.ui.registry.addButton('wrapleft', {
                                                                icon: 'align-left',
                                                                tooltip: 'Text wrap bên phải ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-left')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageLeft');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('wrapright', {
                                                                icon: 'align-right',
                                                                tooltip: 'Text wrap bên trái ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-right')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageRight');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('wrapcenter', {
                                                                icon: 'align-center',
                                                                tooltip: 'Căn giữa ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-center')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageCenter');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('clearwrap', {
                                                                icon: 'remove',
                                                                tooltip: 'Xóa text wrap',
                                                                onAction: function () {
                                                                    editor.execCommand('ClearImageWrap');
                                                                }
                                                            });

                                                            // Content sync system
                                                            let syncTimeout: NodeJS.Timeout;
                                                            let lastSyncTime = 0;

                                                            const performSync = () => {
                                                                const now = Date.now();
                                                                if (now - lastSyncTime < 100) return;

                                                                lastSyncTime = now;
                                                                const content = editor.getContent();

                                                                setPreviewContent(content);
                                                                setPendingLiveContent(content);

                                                                clearTimeout(syncTimeout);
                                                                syncTimeout = setTimeout(() => {
                                                                    if (editorRef.current && !isLivePreviewClosing) {
                                                                        try {
                                                                            editorRef.current.setContent(content);
                                                                            setFormData(prev => ({ ...prev, content }));
                                                                        } catch (error) {
                                                                            console.warn('Sync to main editor failed:', error);
                                                                        }
                                                                    }
                                                                }, 300);
                                                            };

                                                            editor.on('KeyUp Change Input NodeChange', performSync);
                                                            editor.on('Paste Undo Redo ExecCommand', () => {
                                                                setTimeout(performSync, 50);
                                                            });

                                                            const intervalSync = setInterval(() => {
                                                                if (!isLivePreviewClosing) {
                                                                    performSync();
                                                                } else {
                                                                    clearInterval(intervalSync);
                                                                }
                                                            }, 2000);

                                                            editor.on('blur', () => {
                                                                setTimeout(performSync, 100);
                                                            });

                                                            editor.on('remove', () => {
                                                                clearTimeout(syncTimeout);
                                                                clearInterval(intervalSync);
                                                            });
                                                        },
                                                        images_upload_handler: async (blobInfo: any) => {
                                                            try {
                                                                const file = blobInfo.blob() as File;
                                                                const url = await uploadImage(file);
                                                                return url;
                                                            } catch (err) {
                                                                throw 'Lỗi upload ảnh: ' + err;
                                                            }
                                                        },
                                                        file_picker_callback: (cb: any, value: any, meta: any) => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = meta.filetype === 'media' ? 'video/*,audio/*' : 'image/*';
                                                            input.onchange = async () => {
                                                                const f = (input as HTMLInputElement).files?.[0];
                                                                if (!f) return;
                                                                try {
                                                                    const url = await uploadImage(f);
                                                                    cb(url, { title: f.name });
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            };
                                                            input.click();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Preview Side */}
                                        <div className="w-1/2 flex flex-col">
                                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                                <h4 className="font-semibold text-gray-700">Preview</h4>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
                                                <div className="mb-8 pb-6 border-b border-gray-200">
                                                    <div className="mb-3">
                                                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                                                            {formData.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION'}
                                                        </span>
                                                    </div>

                                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                                        {formData.title || 'Tiêu đề bài viết'}
                                                    </h1>

                                                    {formData.description && (
                                                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                                            {formData.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-5 text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-5 h-5" />
                                                            <span>{new Date().toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <span className="hidden sm:inline text-gray-300">•</span>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-5 h-5" />
                                                            <span>5 phút đọc</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="live-preview-content tinymce-content prose prose-lg max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: previewContent }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Submission History Modal */}
                {showSubmissionHistory && selectedPostHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => setShowSubmissionHistory(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        Lịch sử duyệt bài
                                    </h3>
                                    <button
                                        onClick={() => setShowSubmissionHistory(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        {selectedPostHistory.title}
                                    </h4>
                                    <div className="text-sm text-gray-600">
                                        Loại: {selectedPostHistory.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedPostHistory.submission_history?.map((submission, index) => (
                                        <div
                                            key={submission.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Lần {selectedPostHistory.submission_history!.length - index}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                            Mới nhất
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    {submission.status === 'pending' && (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Chờ duyệt
                                                        </span>
                                                    )}
                                                    {submission.status === 'approved' && (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Đã duyệt
                                                        </span>
                                                    )}
                                                    {submission.status === 'rejected' && (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Từ chối
                                                        </span>
                                                    )}
                                                </div>

                                                {submission.reviewed_by_profile && (
                                                    <div className="text-sm text-gray-600">
                                                        Duyệt bởi: {submission.reviewed_by_profile.full_name}
                                                    </div>
                                                )}
                                            </div>

                                            {submission.admin_notes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                        Ghi chú của admin:
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {submission.admin_notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSubmissionHistory(false)}
                                    className="w-full"
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostMentorPage;